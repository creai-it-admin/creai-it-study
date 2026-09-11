"use client";
import {useCallback,useEffect,useState} from 'react';
import Link from 'next/link';
import {SessionRecorder} from '@/components/SessionRecorder';
type State={session:{id:string;studyId:string;studyName:string;weekNo:number;status:string;sharingOpen:boolean;recordingState:string;hasOwner:boolean;hasDeck:boolean};topic:string|null;people:{key:string;name:string;attendance:string;submissionStatus:string;filled:number;total:number;answers:{fieldId:string;question:string;text:string}[]}[]};
export function RunConsole({id}:{id:string}){
 const [state,setState]=useState<State|null>(null),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 const load=useCallback(async()=>{
  try{const res=await fetch(`/api/admin/state?id=${id}`,{cache:'no-store',signal:AbortSignal.timeout(10000)});if(!res.ok)throw Error('세션을 불러오지 못했습니다.');setState(await res.json());}
  catch(e){setError(e instanceof Error?e.message:'연결을 확인해 주세요.');}
 },[id]);
 useEffect(()=>{void load();const timer=setInterval(()=>void load(),5000);return()=>clearInterval(timer);},[load]);
 async function sharing(){if(!state)return;setBusy(true);setError('');try{
  const res=await fetch(`/api/admin/session/${id}/control`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:state.session.sharingOpen?'closeSharing':'openSharing'})});
  if(!res.ok)throw Error((await res.json()).error);await load();
 }catch(e){setError(e instanceof Error?e.message:'공유를 변경하지 못했습니다.');}finally{setBusy(false);}}
 if(!state)return <p className="card p-8" role="status">{error||'세션을 불러오는 중…'}</p>;
 return <div className="flex flex-col gap-5">
  <div className="flex flex-wrap items-center justify-between gap-3"><h1 className="text-xl font-semibold">{state.session.studyName} · {state.session.weekNo===0?'리허설':`${state.session.weekNo}주차`}</h1><Link href={`/routes/admin/studies/${state.session.studyId}`} className="btn">회차 목록</Link></div>
  <SessionRecorder id={id} status={state.session.status} recordingState={state.session.recordingState} hasOwner={state.session.hasOwner} onChange={()=>void load()}/>
  <div className="flex flex-wrap gap-2">{state.session.hasDeck&&<a className="btn" href={`/routes/deck?session=${id}`} target="_blank" rel="noreferrer">HTML 장표 보기</a>}<a className="btn" href={state.session.status==='running'?'/routes/inclass':`/routes/admin/session/${id}`} target="_blank" rel="noreferrer">{state.session.status==='running'?'인클래스 참여':'인클래스 주제·질문'}</a><a className="btn" href="/routes/inclass/shared" target="_blank" rel="noreferrer">제출물 보기</a>
   <button className="btn" disabled={busy||state.session.status!=='running'} onClick={()=>void sharing()}>{state.session.sharingOpen?'제출물 공유 닫기':'제출물 공유 열기'}</button><Link className="btn" href={`/routes/sessions/${id}`}>세션 리포트</Link></div>
  {error&&<p role="alert" className="text-sm text-red-700">{error}</p>}
  <section className="card p-5"><h2 className="font-semibold">참가자 · 출석 {state.people.filter(p=>p.attendance==='present').length}명 · 제출 {state.people.filter(p=>p.submissionStatus==='submitted').length}명</h2>
   {state.topic&&<p className="my-4 text-sm text-ink-2">{state.topic}</p>}
   {!state.people.length&&<p className="mt-3 text-sm text-ink-2">아직 접속·작성 기록이 없습니다.</p>}
   {state.people.map(person=><details key={person.key} className="border-b border-line py-3"><summary className="cursor-pointer text-sm">{person.name} · {person.attendance==='present'?'출석':'출석 기록 없음'} · {person.submissionStatus==='submitted'?'제출함':`${person.filled}/${person.total}칸 작성`}</summary>
    <div className="mt-4 flex flex-col gap-4">{person.answers.map(answer=><div key={answer.fieldId}><p className="text-xs text-ink-2">{answer.question}</p><p className="mt-1 whitespace-pre-wrap text-sm">{answer.text||'아직 비어 있습니다.'}</p></div>)}</div></details>)}
  </section>
 </div>;
}
