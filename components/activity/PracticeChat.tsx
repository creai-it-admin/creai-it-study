'use client';
import {useCallback,useEffect,useState} from 'react';
import type {PracticeEvent} from '@/lib/practice/types';
import {PracticeLog} from './PracticeLog';
import {ResultText} from './ResultText';
type Line={t:'delta';v:string}|{t:'status';v:string}|{t:'done';request:PracticeEvent;response:PracticeEvent}|{t:'error';message:string};
export function PracticeChat({id,open,milestone,onAdopt}:{id:string;open:boolean;milestone:string;onAdopt:(text:string)=>void}){
 const [events,setEvents]=useState<PracticeEvent[]|null>(null),[remaining,setRemaining]=useState<number|null>(null),[text,setText]=useState(''),[error,setError]=useState('');
 const [live,setLive]=useState<{request:string;reply:string;searching:boolean}|null>(null);
 const load=useCallback(async()=>{try{const r=await fetch(`/api/activities/${id}/practice`,{cache:'no-store',signal:AbortSignal.timeout(10000)});const body=await r.json();if(!r.ok)throw Error(body.error);setEvents(body.events);setRemaining(body.remaining)}catch(e){setError(e instanceof Error?e.message:'기록을 불러오지 못했습니다.')}},[id]);
 // Shared and submitted results are appended server-side, so reload when those milestones change.
 useEffect(()=>{void load()},[load,milestone]);
 useEffect(()=>{if(!live)return;const warn=(e:BeforeUnloadEvent)=>{e.preventDefault();e.returnValue=''};window.addEventListener('beforeunload',warn);return()=>window.removeEventListener('beforeunload',warn)},[live]);
 async function send(){
  const message=text.trim();if(!message||live)return;
  setLive({request:message,reply:'',searching:false});setText('');setError('');
  try{
   const res=await fetch(`/api/activities/${id}/practice`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({text:message})});
   if(!res.ok||!res.body){const body=await res.json().catch(()=>null);throw Error(body?.error??'요청을 보내지 못했습니다.')}
   const reader=res.body.pipeThrough(new TextDecoderStream()).getReader();let buffer='',finished=false;
   for(let chunk=await reader.read();!chunk.done;chunk=await reader.read()){
    buffer+=chunk.value;let i:number;
    while((i=buffer.indexOf('\n'))>=0){
     const line=JSON.parse(buffer.slice(0,i)) as Line;buffer=buffer.slice(i+1);
     if(line.t==='delta')setLive(l=>l&&{...l,reply:l.reply+line.v,searching:false});
     else if(line.t==='status')setLive(l=>l&&{...l,searching:true});
     else if(line.t==='done'){finished=true;setEvents(list=>[...(list??[]),line.request,line.response]);setRemaining(r=>r===null?r:r-1)}
     else throw Error(line.message);
    }
   }
   if(!finished)throw Error('응답이 중간에 끊겼습니다. 기록을 확인한 뒤 다시 보내 주세요.');
  }catch(e){setText(message);setError(e instanceof Error?e.message:'요청을 보내지 못했습니다.');void load()}finally{setLive(null)}
 }
 return <section className="card p-5 sm:p-7" aria-labelledby="practice-title">
  <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2"><h2 id="practice-title" className="text-lg font-semibold">AI와 실습</h2>{remaining!==null&&remaining<=10&&<span className="text-xs text-ink-2">남은 요청 {remaining}회</span>}</div>
  <p className="mb-5 text-xs text-ink-2">요청, AI 응답, 공유한 결과가 순서대로 기록됩니다. 강사가 수업 해설에 활용하며, 동료에게는 강사가 고른 부분만 보입니다.</p>
  {events===null?<p className="text-sm text-ink-2" role="status">{error||'기록을 불러오는 중…'}</p>:<>
   {!events.length&&!live&&<p className="text-sm text-ink-2">목표와 기준을 설명하고 오늘의 과제를 맡겨 보세요. 마음에 드는 응답은 결과로 가져올 수 있습니다.</p>}
   <PracticeLog events={events} actions={e=>open&&e.kind==='response'?<button className="btn mt-3" onClick={()=>onAdopt(e.text)}>결과로 가져오기</button>:null}/>
   {live&&<div className="mt-4 space-y-4" aria-live="polite"><div className="border-l-2 border-accent pl-4"><p className="mb-1 text-xs text-ink-2">요청</p><ResultText text={live.request}/></div><div className="border-l-2 border-line pl-4"><p className="mb-1 text-xs text-ink-2">AI 응답 · {live.searching?'웹 검색 중…':live.reply?'작성 중…':'생각하는 중…'}</p>{live.reply&&<ResultText text={live.reply}/>}</div></div>}
  </>}
  {open?<div className="mt-6 border-t border-line pt-5">
   <label htmlFor="practice-input" className="sr-only">AI에게 보낼 요청</label>
   <textarea id="practice-input" className="field min-h-24 resize-y" maxLength={8000} value={text} disabled={!!live||remaining===0} onChange={e=>setText(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&(e.metaKey||e.ctrlKey)&&!e.nativeEvent.isComposing){e.preventDefault();void send()}}} placeholder="무엇을 맡길지, 어떤 기준으로 확인할지 적어 주세요."/>
   <div className="mt-3 flex flex-wrap items-center gap-3"><button className="btn btn-primary" disabled={!text.trim()||!!live||remaining===0} onClick={()=>void send()}>{live?'응답을 기다리는 중…':'보내기'}</button><span className="text-xs text-ink-3">⌘/Ctrl + Enter로 보내기</span></div>
  </div>:<p className="mt-6 text-sm text-ink-2">활동이 열려 있을 때 AI와 작업할 수 있습니다.</p>}
  {error&&events!==null&&<p role="alert" className="mt-3 text-sm text-danger">{error}</p>}
 </section>;
}
