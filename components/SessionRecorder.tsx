"use client";
import {useEffect,useRef,useState} from 'react';
import {useRouter} from 'next/navigation';
import {AudioCapture} from '@/lib/audio-capture';
import {listTakes,recorderKey,saveTake,sendTake} from '@/lib/recording-queue';

export function SessionRecorder({id,status,recordingState,hasOwner,onChange}:{id:string;status:string;recordingState:string;hasOwner:boolean;onChange:()=>void}){
 const router=useRouter();
 const [mode,setMode]=useState<'idle'|'recording'|'paused'>('idle');
 const [busy,setBusy]=useState(false),[pending,setPending]=useState(0),[error,setError]=useState('');
 const [confirmEnd,setConfirmEnd]=useState(false);
 const capture=useRef<AudioCapture|null>(null),key=useRef(''),upload=useRef<Promise<void>|null>(null),release=useRef<(()=>void)|null>(null),mounted=useRef(true);
 const active=useRef(false),pendingRef=useRef(0),busyRef=useRef(false);
 async function count(){const n=(await listTakes(id)).length;pendingRef.current=n;if(mounted.current)setPending(n);}
 async function flush(){
  if(upload.current)return upload.current;
  upload.current=(async()=>{try{
   for(const take of await listTakes(id)){if(take.complete)await sendTake(take);}
  }finally{await count();upload.current=null;}})();
  return upload.current;
 }
 async function claim(){
  if(release.current)return;
  if(!navigator.locks)throw Error('이 브라우저에서는 녹음 기기를 잠글 수 없습니다. 최신 Chrome 또는 Safari를 사용해 주세요.');
  await new Promise<void>((resolve,reject)=>{
   void navigator.locks.request(`creai-recording:${id}`,{ifAvailable:true},async lock=>{
    if(!lock){reject(Error('다른 탭에서 녹음 중입니다. 녹음을 시작한 탭을 사용해 주세요.'));return;}
    await new Promise<void>(done=>{release.current=done;resolve();});
   }).catch(reject);
  });
 }
 async function control(action:string){
  const res=await fetch(`/api/admin/session/${id}/control`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,recorderKey:key.current}),signal:AbortSignal.timeout(15000)});
  const data=await res.json();if(!res.ok)throw Error(data.error??'녹음 상태를 변경하지 못했습니다.');onChange();
 }
 useEffect(()=>{
  mounted.current=true;
  try{key.current=recorderKey(id);void count().catch(()=>setError('이 브라우저에 녹음을 보관할 수 없습니다. 저장 공간을 확인해 주세요.'));}catch{setError('브라우저 저장소를 사용할 수 없습니다.');}
  const timer=setInterval(()=>{void flush().catch(e=>{if(mounted.current)setError(e.message);});},15000);
  const unload=(event:BeforeUnloadEvent)=>{if(active.current||pendingRef.current||busyRef.current){event.preventDefault();event.returnValue='';}};
  const navigate=(event:MouseEvent)=>{
   if(!(active.current||pendingRef.current||busyRef.current)||event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;
   const link=(event.target as Element)?.closest?.('a[href]');
   if(!link||link.getAttribute('target')==='_blank'||link.getAttribute('href')?.startsWith('#'))return;
   event.preventDefault();event.stopPropagation();
   setError('녹음 탭을 열어 두세요. 먼저 녹음을 일시정지하고 저장을 마치거나, 자료를 새 탭에서 열어 주세요.');
  };
  window.addEventListener('beforeunload',unload);
  document.addEventListener('click',navigate,true);
  return()=>{mounted.current=false;clearInterval(timer);window.removeEventListener('beforeunload',unload);document.removeEventListener('click',navigate,true);void capture.current?.stop().catch(()=>{});release.current?.();release.current=null;};
  // These resources belong to this mounted recorder, not to polling props.
  // eslint-disable-next-line react-hooks/exhaustive-deps
 },[id]);
 async function run(operation:()=>Promise<void>){
  if(busyRef.current)return;busyRef.current=true;setBusy(true);setError('');
  try{await operation();}catch(e){setError(e instanceof Error?e.message:'녹음을 처리하지 못했습니다.');}
  finally{busyRef.current=false;setBusy(false);await count().catch(()=>{});}
 }
 async function start(){
  AudioCapture.supportedMime();
  await capture.current?.retryPersistence();
  await claim();
  if(!key.current)throw Error('브라우저 저장소를 사용할 수 없습니다.');
  // Only the tab holding the recording lock may recover interrupted partial takes.
  for(const take of await listTakes(id))if(!take.complete)await saveTake({...take,complete:true});
  if(!navigator.mediaDevices?.getUserMedia)throw Error('이 브라우저에서 마이크를 사용할 수 없습니다. Chrome 또는 Safari로 열어 주세요.');
  const stream=await navigator.mediaDevices.getUserMedia({audio:true});
  try{
   await control(hasOwner?'resume':'start');
   capture.current=new AudioCapture(id,key.current,{
    saved:()=>{void flush().catch(e=>{if(mounted.current)setError(e.message);});},
    error:message=>{active.current=false;setMode('paused');setError(message);},
   });
   stream.getAudioTracks().forEach(track=>{track.onended=()=>{void pause().catch(e=>setError(e.message));};});
   await capture.current.start(stream);active.current=true;setMode('recording');
  }catch(e){stream.getTracks().forEach(t=>t.stop());throw e;}
 }
 async function pause(){
  active.current=false;await capture.current?.stop();setMode('paused');
  await control('pause');await flush();
 }
 async function end(){
  await claim();
  active.current=false;await capture.current?.stop();setMode('paused');
  for(const take of await listTakes(id))if(!take.complete)await saveTake({...take,complete:true});
  await flush();
  if((await listTakes(id)).length)throw Error('아직 저장 중인 녹음이 있습니다. 저장 재시도 후 종료해 주세요.');
  await control('end');release.current?.();release.current=null;
  router.push(`/routes/sessions/${id}`);
 }
 async function retry(){await capture.current?.retryPersistence();await flush();}
 function download(){const blob=capture.current?.lastBlob;if(!blob)return;const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`recording-recovery-${Date.now()}.${blob.type==='audio/mp4'?'mp4':'webm'}`;a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);}
 return <section className="card flex flex-col gap-4 p-5">
  <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="font-semibold">세션 녹음</h2><span role="status" className="text-sm text-ink-2">{mode==='recording'?'● 이 기기에서 녹음 중':status==='closed'?'녹음 종료':hasOwner?'녹음이 시작된 세션':'녹음 시작 전'}</span></div>
  <p className="text-sm text-ink-2">한 기기에서 이 녹음 탭을 열어 두세요. 장표와 인클래스는 새 탭에서 사용할 수 있고, 일시정지 중에도 계속 열람할 수 있습니다.</p>
  {status!=='closed'&&<div className="flex flex-wrap gap-2">
   {mode==='recording'?<button className="btn" disabled={busy} onClick={()=>void run(pause)}>녹음 일시정지</button>:<button className="btn btn-primary" disabled={busy} onClick={()=>void run(start)}>{hasOwner?'녹음 재개':'녹음 시작'}</button>}
   {(hasOwner||status==='running')&&<button className="btn" disabled={busy||confirmEnd} onClick={()=>setConfirmEnd(true)}>녹음 종료 · 세션 마치기</button>}
  </div>}
  {confirmEnd&&status!=='closed'&&<div role="group" aria-label="세션 종료 확인" className="rounded-xl border border-ink/15 p-4">
   <p className="text-sm">녹음을 저장하고 세션을 종료할까요? 종료한 세션은 다시 녹음하지 않습니다.</p>
   <div className="mt-3 flex gap-2">
    <button className="btn btn-primary" disabled={busy} onClick={()=>{setConfirmEnd(false);void run(end);}}>저장하고 세션 종료</button>
    <button className="btn" disabled={busy} onClick={()=>setConfirmEnd(false)}>계속 진행</button>
   </div>
  </div>}
  <p className="text-xs text-ink-2">{busy?'처리 중…':pending?`이 기기에 보관 중인 녹음 ${pending}개 · 저장 완료 전 창을 닫지 마세요.`:mode==='recording'?'녹음은 주기적으로 이 기기에 보관하고 서버에 저장합니다.':'보관된 녹음은 저장 재시도로 복구할 수 있습니다.'}</p>
  {mode!=='recording'&&hasOwner&&status!=='closed'&&<p className="text-xs text-ink-2">{recordingState==='recording'?'서버에는 녹음 중으로 기록되어 있습니다. 다른 기기의 녹음을 먼저 확인하세요.':'녹음이 일시정지되어 있습니다.'} 새로고침·기기 종료 직전의 아직 저장되지 않은 음성은 복구되지 않을 수 있습니다.</p>}
  {(pending>0||error)&&<button className="btn self-start" disabled={busy} onClick={()=>void run(retry)}>저장 재시도</button>}
  {error&&<p role="alert" className="text-sm text-red-700">{error}</p>}
  {error&&capture.current?.lastBlob&&<button className="btn self-start" onClick={download}>마지막 녹음 내려받기</button>}
 </section>;
}
