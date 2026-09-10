"use client";
import Link from 'next/link';
import {useLiveState} from '@/components/useLiveState';
import {SessionStatus} from '@/components/SessionStatus';
export function HomeWatcher(){
 const {state}=useLiveState();
 return <div className="card flex flex-col gap-5 p-6"><SessionStatus state={state}/>
  {state?.sessionId?<><h1 className="text-xl font-semibold">{state.studyName} · {state.weekNo===0?"리허설":`${state.weekNo}주차`}</h1><div className="flex flex-wrap gap-3"><Link className="btn btn-primary" href="/deck">장표 보기</Link><Link className="btn" href="/inclass">인클래스 작성</Link><Link className="btn" href="/inclass/shared">제출물 공유</Link></div></>:<p className="text-sm text-ink-2">세션이 시작되면 장표와 인클래스를 여기에서 열 수 있습니다.</p>}
 </div>;
}
