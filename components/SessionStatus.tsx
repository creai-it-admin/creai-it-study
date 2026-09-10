"use client";
import type {LiveState} from './useLiveState';
export function SessionStatus({state}:{state:LiveState|null}){
 if(!state)return null;
 return <p className="text-sm text-ink-2">{state.sessionId?`${state.weekNo===0?'리허설':`${state.weekNo}주차`} 진행 중${state.recordingState==='recording'?' · 녹음 중':state.recordingState==='paused'?' · 녹음 일시정지':''}`:'현재 진행 중인 세션이 없습니다. 작성한 내용은 보관됩니다.'}</p>;
}
