"use client";
import {useEffect,useRef,useState} from 'react';
import {useRouter} from 'next/navigation';
export function RecordingResults({id,parts,transcribed,status,processingState,processingError,processingAttempts,summary,transcript,admin,hasReport}:{id:string;parts:{id:string;durationMs:number}[];transcribed:number;status:string;processingState:string;processingError:string|null;processingAttempts:number;summary:string|null;transcript:string;admin:boolean;hasReport:boolean}){
 const router=useRouter();const [busy,setBusy]=useState(false),[error,setError]=useState(''),[selected,setSelected]=useState(0);
 const audio=useRef<HTMLAudioElement>(null),continuePlaying=useRef(false);
 async function retry(){
  setBusy(true);setError('');
  try{
   const res=await fetch(`/api/admin/session/${id}/process`,{method:'POST'});const data=await res.json();
   if(!res.ok)throw Error(data.error??'리포트를 다시 요청하지 못했습니다.');
   router.refresh();
  }catch(e){setError(e instanceof Error?e.message:'연결을 확인하고 다시 시도해 주세요.');}finally{setBusy(false);}
 }
 useEffect(()=>{if(status==='closed'&&parts.length&&!hasReport){const timer=setInterval(()=>router.refresh(),5000);return()=>clearInterval(timer);}},[status,parts.length,hasReport,router]);
 const part=parts[selected];
 return <>
  <section className="card flex flex-col gap-4 p-5"><div className="flex flex-wrap items-center justify-between gap-3"><h2 className="font-semibold">세션 리포트</h2>
   {hasReport&&<a className="btn" href={`/sessions/${id}/report`} target="_blank" rel="noopener">리포트 크게 보기 ↗</a>}
   {!hasReport&&admin&&parts.length>0&&status==='closed'&&((processingState==='error'&&processingAttempts>=3)||processingState==='ready')&&<button className="btn btn-primary" disabled={busy} onClick={()=>void retry()}>{busy?'요청 중…':'리포트 생성 / 재시도'}</button>}</div>
   {hasReport?<><p className="text-xs text-ink-2">전사본을 바탕으로 자동 생성했습니다. 크게 보기에서 브라우저 인쇄로 PDF를 저장할 수 있습니다.</p><iframe title="세션 리포트" src={`/sessions/${id}/report`} sandbox="" className="h-[80vh] min-h-[560px] w-full rounded border border-line bg-white"/></>:
    <><p role="status" className="text-sm text-ink-2">{status!=='closed'?'세션을 종료하면 리포트가 자동으로 생성됩니다.':!parts.length?'저장된 녹음이 없어 리포트를 만들 수 없습니다.':processingState==='error'&&processingAttempts>=3?'리포트 처리가 중단되었습니다. 운영진이 다시 진행할 수 있습니다.':processingState==='ready'?'이전 요약 기록입니다. 운영진이 HTML 리포트를 생성할 수 있습니다.':transcribed<parts.length?`녹음을 전사하고 있습니다 (${transcribed}/${parts.length}). 화면을 닫아도 계속 진행됩니다.`:'전사 완료 · 요약과 리포트를 만들고 있습니다. 화면을 닫아도 계속 진행됩니다.'}</p>
    {summary&&<details><summary className="cursor-pointer text-sm">저장된 요약 보기</summary><p className="mt-3 whitespace-pre-wrap text-sm leading-7">{summary}</p></details>}</>}
   {admin&&(error||processingError)&&<p role="alert" className="text-sm text-red-700">{error||processingError}</p>}
  </section>
  <section className="card flex flex-col gap-4 p-5"><h2 className="font-semibold">녹음 다시 듣기</h2>
   {part?<><label className="text-sm">재생 위치<select className="field mt-2" value={selected} onChange={e=>{continuePlaying.current=false;setSelected(Number(e.target.value));}}>{parts.map((p,i)=><option value={i} key={p.id}>녹음 {i+1} · {Math.round(p.durationMs/1000)}초</option>)}</select></label>
   <audio ref={audio} className="w-full" controls preload="none" src={`/api/sessions/${id}/audio/${part.id}`} onLoadedMetadata={()=>{if(continuePlaying.current)void audio.current?.play().catch(()=>{});}} onEnded={()=>{if(selected+1<parts.length){continuePlaying.current=true;setSelected(n=>n+1);}}}/><p className="text-xs text-ink-2">다음 녹음으로 이어서 재생합니다.</p></>:<p className="text-sm text-ink-2">저장된 녹음이 없습니다.</p>}
  </section>
  <details className="card p-5"><summary className="cursor-pointer font-semibold">전사본 보기 ({transcribed}/{parts.length})</summary><div className="mt-4 whitespace-pre-wrap text-sm leading-7">{transcript||'아직 전사된 내용이 없습니다.'}</div></details>
 </>;
}
