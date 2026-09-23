"use client";
import {useCallback,useEffect,useState} from 'react';
import Link from 'next/link';
import {ActivityManager} from '@/components/activity/ActivityManager';
import {SessionRecorder} from '@/components/SessionRecorder';
type State={session:{id:string;studyId:string;studyName:string;weekNo:number;status:string;sharingOpen:boolean;recordingState:string;hasOwner:boolean;hasDeck:boolean};topic:string|null;people:{key:string;name:string;attendance:string;submissionStatus:string;filled:number;total:number;answers:{fieldId:string;question:string;text:string}[]}[]};
export function RunConsole({id}:{id:string}){
 const [state,setState]=useState<State|null>(null),[error,setError]=useState('');
 const load=useCallback(async()=>{
  try{const res=await fetch(`/api/admin/state?id=${id}&summary=1`,{cache:'no-store',signal:AbortSignal.timeout(10000)});if(!res.ok)throw Error('세션을 불러오지 못했습니다.');setState(await res.json());setError('');}
  catch(e){setError(e instanceof Error?e.message:'연결을 확인해 주세요.');}
 },[id]);
 useEffect(()=>{void load();const timer=setInterval(()=>{if(!document.hidden)void load()},5000);return()=>clearInterval(timer);},[load]);
 if(!state)return <p className="card p-8" role="status">{error||'세션을 불러오는 중…'}</p>;
 return <div className="flex flex-col gap-5">
  <div className="flex flex-wrap items-center justify-between gap-3"><h1 className="text-xl font-semibold">{state.session.studyName} · {state.session.weekNo===0?'리허설':`${state.session.weekNo}주차`}</h1><Link href={`/routes/admin/studies/${state.session.studyId}`} className="btn">회차 목록</Link></div>
  <ActivityManager id={id}/>
  <SessionRecorder id={id} status={state.session.status} recordingState={state.session.recordingState} hasOwner={state.session.hasOwner} onChange={()=>void load()}/>
  <div className="flex flex-wrap gap-2">{state.session.hasDeck&&<a className="btn" href={`/routes/deck?session=${id}`} target="_blank" rel="noreferrer">HTML 장표 보기</a>}
   <Link className="btn" href={`/routes/sessions/${id}`}>세션 리포트</Link></div>
  {error&&<p role="alert" className="text-sm text-danger">{error}</p>}

 </div>;
}
