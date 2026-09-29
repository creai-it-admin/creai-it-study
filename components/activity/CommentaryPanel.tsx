'use client';
import {useCallback,useEffect,useState} from 'react';
import type {CaseRef,CommentaryView,PracticeEvent} from '@/lib/practice/types';
import {activityAction} from './useActivity';
import {PracticeLog} from './PracticeLog';
const time=(iso:string)=>new Date(iso).toLocaleTimeString('ko-KR',{hour:'2-digit',minute:'2-digit'});
export function CommentaryPanel({id}:{id:string}){
 const [view,setView]=useState<CommentaryView|null>(null),[busy,setBusy]=useState(false),[message,setMessage]=useState('');
 const [log,setLog]=useState<{userId:string;events:PracticeEvent[];focus?:number}|null>(null),[picked,setPicked]=useState<number[]>([]);
 const load=useCallback(async()=>{try{const r=await fetch(`/api/admin/session/${id}/commentary`,{cache:'no-store',signal:AbortSignal.timeout(10000)});const body=await r.json();if(!r.ok)throw Error(body.error);setView(body)}catch(e){setMessage(e instanceof Error?e.message:'해설 정보를 불러오지 못했습니다.')}},[id]);
 useEffect(()=>{void load();const timer=setInterval(()=>{if(!document.hidden)void load()},10000);return()=>clearInterval(timer)},[load]);
 // Align to the start: a long AI answer can be taller than the log box, and centering would hide its header.
 useEffect(()=>{if(log?.focus)document.getElementById(`log-${log.focus}`)?.scrollIntoView({behavior:'smooth',block:'start'})},[log]);
 if(!view?.enabled)return null;
 const name=(userId:string)=>view.people.find(p=>p.id===userId)?.name??'참가자';
 async function prepare(){setBusy(true);setMessage('');try{const r=await fetch(`/api/admin/session/${id}/commentary`,{method:'POST'});const body=await r.json();if(!r.ok)throw Error(body.error);setView(body);if(body.failed)setMessage(`${body.failed}명의 요약을 갱신하지 못해 이전 요약으로 비교했습니다.`)}catch(e){setMessage(e instanceof Error?e.message:'해설을 준비하지 못했습니다.')}finally{setBusy(false)}}
 async function openLog(userId:string,focus?:number){setMessage('');try{const r=await fetch(`/api/activities/${id}/practice?user=${encodeURIComponent(userId)}`,{cache:'no-store',signal:AbortSignal.timeout(10000)});const body=await r.json();if(!r.ok)throw Error(body.error);setLog({userId,events:body.events,focus});setPicked(focus?[focus]:[])}catch(e){setMessage(e instanceof Error?e.message:'기록을 불러오지 못했습니다.')}}
 async function spotlight(clear=false){setMessage('');try{await activityAction(id,clear||!log?{action:'spotlight',clear:true}:{action:'spotlight',userId:log.userId,from:Math.min(...picked),to:Math.max(...picked)});await load()}catch(e){setMessage(e instanceof Error?e.message:'띄우지 못했습니다.')}}
 const cases=(list:CaseRef[])=><ul className="mt-2 space-y-1">{list.map(c=><li key={`${c.userId}-${c.seq}`} className="text-sm"><button className="text-accent-strong underline underline-offset-4" onClick={()=>void openLog(c.userId,c.seq)}>{name(c.userId)} #{c.seq}</button> <span className="text-ink-2">{c.note}</span></li>)}</ul>;
 const c=view.commentary?.data;
 const groups:[string,{text:string;cases:CaseRef[]}[]][]=c?[['공통으로 막힌 부분',c.commonBlockers],['서로 다른 접근',c.contrasts],['결과를 다시 확인한 사례',c.verification]]:[];
 return <section className="card p-5 sm:p-6" aria-labelledby="commentary-title">
  <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 id="commentary-title" className="text-lg font-semibold">AI 실습 해설</h2><p className="mt-1 text-sm text-ink-2">참가자별 작업 기록으로 개인 요약과 공통 해설거리를 만듭니다.</p></div>
   <button className="btn btn-primary" disabled={busy||!view.people.some(p=>p.turns>0)} onClick={()=>void prepare()}>{busy?'기록을 읽는 중…':c?'해설 갱신':'현재까지 기록으로 해설 준비'}</button></div>
  {busy&&<p role="status" className="mt-3 text-sm text-ink-2">새 기록이 있는 참가자를 요약한 뒤 비교합니다. 1~2분 걸릴 수 있습니다.</p>}
  {view.commentary&&<p className="mt-3 text-xs text-ink-2">{time(view.commentary.generatedAt)} 기록 기준 · {view.commentary.stale?'이후 새 기록이 있습니다':'최신'}</p>}
  {view.spotlight&&<div className="inset mt-4 flex flex-wrap items-center justify-between gap-2 p-3 text-sm"><span>지금 띄운 사례 · {name(view.spotlight.userId)} #{view.spotlight.from}{view.spotlight.to>view.spotlight.from?`–#${view.spotlight.to}`:''}</span><button className="btn" onClick={()=>void spotlight(true)}>띄우기 해제</button></div>}
  {message&&<p role="status" className="mt-3 text-sm text-warn">{message}</p>}
  {c&&<div className="mt-5 space-y-5">
   {groups.map(([title,items])=><div key={title}><h3 className="text-sm font-semibold">{title}</h3>{items.length?<ul className="mt-2 space-y-3">{items.map((item,i)=><li key={i}><p className="text-sm leading-6">{item.text}</p>{cases(item.cases)}</li>)}</ul>:<p className="mt-1 text-sm text-ink-3">기록에서 찾지 못했습니다.</p>}</div>)}
   <div><h3 className="text-sm font-semibold">함께 던질 질문</h3>{c.discussion.length?<ul className="mt-2 space-y-3">{c.discussion.map((d,i)=><li key={i}><p className="text-sm font-medium leading-6">{d.question}</p><p className="text-sm text-ink-2">{d.why}</p>{cases(d.cases)}</li>)}</ul>:<p className="mt-1 text-sm text-ink-3">기록에서 찾지 못했습니다.</p>}</div>
  </div>}
  <div className="mt-6 border-t border-line pt-4"><h3 className="text-sm font-semibold">개인별 요약</h3>
   {!view.people.length&&<p className="mt-2 text-sm text-ink-2">아직 AI 실습 기록이 없습니다.</p>}
   {view.people.map(p=>{const s=p.summary,behind=s?p.latestSeq-s.throughSeq:0;return <details key={p.id} className="border-b border-line py-3 last:border-0">
    <summary className="flex cursor-pointer flex-wrap items-center justify-between gap-2 text-sm"><strong>{p.name}</strong><span className="text-ink-2">AI 요청 {p.turns}회 · {!s?'요약 전':behind>0?`요약 후 새 기록 ${behind}개`:'최신 요약'}</span></summary>
    {s?<dl className="mt-3 space-y-3 text-sm leading-6">
     <div><dt className="text-xs text-ink-2">목표</dt><dd>{s.data.goal}</dd></div>
     <div><dt className="text-xs text-ink-2">접근</dt><dd>{s.data.approach}</dd></div>
     {s.data.turningPoints.length>0&&<div><dt className="text-xs text-ink-2">전환점</dt><dd><ul className="mt-1 space-y-2">{s.data.turningPoints.map(t=><li key={t.seq}><button className="text-accent-strong underline underline-offset-4" onClick={()=>void openLog(p.id,t.seq)}>#{t.seq}</button> {t.observed}<blockquote className="mt-1 border-l-2 border-line pl-3 text-ink-2">{t.quote}</blockquote></li>)}</ul></dd></div>}
     <div><dt className="text-xs text-ink-2">결과 상태</dt><dd>{s.data.resultState}</dd></div>
     <div><dt className="text-xs text-ink-2">해설 포인트 · 해석</dt><dd>{s.data.interpretation}</dd></div>
     {s.data.askParticipant.length>0&&<div><dt className="text-xs text-ink-2">직접 물어볼 질문</dt><dd><ul className="list-disc pl-5">{s.data.askParticipant.map(q=><li key={q}>{q}</li>)}</ul></dd></div>}
    </dl>:<p className="mt-3 text-sm text-ink-2">해설 준비를 누르면 요약합니다.</p>}
    <button className="btn mt-3" onClick={()=>void openLog(p.id)}>전체 기록 보기</button>
   </details>})}
  </div>
  {log&&<div className="mt-6 border-t border-line pt-4">
   <div className="mb-3 flex flex-wrap items-center justify-between gap-2"><h3 className="text-sm font-semibold">{name(log.userId)}의 작업 기록</h3><button className="btn" onClick={()=>setLog(null)}>닫기</button></div>
   <div className="max-h-[32rem] overflow-y-auto pr-2"><PracticeLog events={log.events} anchor="log" focus={log.focus} actions={e=><label className="mt-2 flex items-center gap-2 text-xs text-ink-2"><input type="checkbox" checked={picked.includes(e.seq)} onChange={ev=>setPicked(ev.target.checked?[...picked,e.seq]:picked.filter(s=>s!==e.seq))}/>수업에 띄울 기록으로 선택</label>}/></div>
   <div className="mt-3 flex flex-wrap items-center gap-2"><button className="btn btn-primary" disabled={!picked.length} onClick={()=>void spotlight()}>선택한 기록 띄우기{picked.length?` · #${Math.min(...picked)}${picked.length>1?`–#${Math.max(...picked)}`:''}`:''}</button><span className="text-xs text-ink-2">참가자 화면에는 이 범위만 표시됩니다.</span></div>
  </div>}
 </section>;
}
