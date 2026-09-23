'use client';
import Link from 'next/link';
import {useState} from 'react';
import {useActivity,activityAction} from './useActivity';
import {FIRST_RESULT,REVISED_RESULT} from '@/lib/activity/types';
import {ResultText} from './ResultText';
export function ActivityManager({id}:{id:string}){
 const {data,error,refresh}=useActivity(id),[busy,setBusy]=useState(false),[message,setMessage]=useState(''),[closing,setClosing]=useState(false);
 async function act(action:string,open?:boolean){setBusy(true);setMessage('');try{await activityAction(id,{action,open});setClosing(false);await refresh()}catch(e){setMessage(e instanceof Error?e.message:'변경하지 못했습니다.')}finally{setBusy(false)}}
 if(!data)return <section className="card p-5">{error||'활동 현황을 불러오는 중…'}</section>;
 const ready=!!data.form?.fields.some(f=>f.stage==='before'),active=data.session.activityStatus==='open';
 const complete=data.people.filter(p=>p.progress==='수정 완료').length,first=data.people.filter(p=>['첫 결과 공유','수정 완료'].includes(p.progress)).length;
 return <section className="card p-5 sm:p-6"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-lg font-semibold">인클래스 운영</h2><p className="mt-1 text-sm text-ink-2">녹음과 별개로 활동을 열고 마감합니다.</p></div><span className="pill text-sm">{active?'활동 진행 중':data.session.activityStatus==='closed'?'활동 마감':'시작 전'}</span></div>
  <div className="mt-5 flex flex-wrap gap-2">{active?<button className="btn" disabled={busy} onClick={()=>setClosing(true)}>활동 마감</button>:<button className="btn btn-primary" disabled={!ready||busy} onClick={()=>void act(data.session.activityStatus==='closed'?'reopen':'open')}>{data.session.activityStatus==='closed'?'활동 다시 열기':'활동 열기'}</button>}<Link href={`/routes/sessions/${id}/activity`} target="_blank" className="btn">참가자 화면 ↗</Link><Link href={`/routes/admin/session/${id}`} className="btn">주제·질문 편집</Link><button className="btn" disabled={!ready||busy} onClick={()=>void act('sharing',!data.session.sharingOpen)}>{data.session.sharingOpen?'동료 공유 닫기':'동료 공유 열기'}</button></div>
  {!ready?<p className="mt-4 text-sm text-warn">활동 질문이 없습니다. 주제·질문을 등록한 뒤 시작해 주세요.</p>:!active&&data.session.activityStatus==='locked'?<p className="mt-3 text-xs text-ink-2">활동을 열면 작성할 수 있고, 첫 결과를 공유한 참가자의 자료를 서로 볼 수 있습니다.</p>:null}
  {closing&&<div className="notice-warn mt-4 p-4"><p className="text-sm">{data.people.length-complete}명이 아직 수정 완료 상태가 아닙니다. 마감하면 작성은 멈추고 초안과 피드백은 보존됩니다.</p><div className="mt-3 flex gap-2"><button className="btn" disabled={busy} onClick={()=>void act('close')}>마감하기</button><button className="btn" onClick={()=>setClosing(false)}>계속 진행</button></div></div>}
  {(message||error)&&<p role="alert" className="mt-3 text-sm text-danger">{message||error}</p>}
  <div className="my-5 flex flex-wrap gap-5 border-y border-line py-4 text-sm"><span>전체 <b>{data.people.length}</b>명</span><span>첫 결과 공유 <b>{first}</b>명</span><span>수정 완료 <b>{complete}</b>명</span></div>
  {data.people.map(p=><details key={p.id} className="border-b border-line py-4 last:border-0"><summary className="flex cursor-pointer flex-wrap items-center justify-between gap-2 text-sm"><span><strong>{p.name}</strong><span className="ml-2 text-xs text-ink-2">{p.attendance==='present'?'출석':p.attendance==='absent'?'결석':p.attendance}</span></span><span className={p.progress==='수정 완료'?'text-accent-strong':'text-ink-2'}>{p.progress} · {p.filled}/{p.total}문항</span></summary><div className="mt-5 space-y-5">{data.form?.fields.map(f=><div key={f.id}><p className="mb-1 text-xs text-ink-2">{f.stage==='after'?'피드백 후':'피드백 전'} · {f.question}</p><ResultText text={p.answers[f.id]??''}/></div>)}{[[FIRST_RESULT,'첫 결과'],[REVISED_RESULT,'수정 결과']].map(([key,label])=><div key={key}><p className="mb-1 text-xs text-ink-2">{label}</p><ResultText text={p.answers[key]??''}/></div>)}{p.feedback.length>0&&<div className="border-t border-line pt-4"><p className="mb-2 text-sm font-semibold">받은 피드백</p>{p.feedback.map(f=><div className="mb-3" key={f.id}><p className="text-xs text-ink-2">{f.name}</p><ResultText text={f.text}/></div>)}</div>}{p.firstSnapshot&&data.session.sharingOpen&&<Link className="btn" href={`/routes/sessions/${id}/activity?review=${p.id}`} target="_blank">{active?"결과 검토·피드백 ↗":"공유 결과 보기 ↗"}</Link>}</div></details>)}
  {!data.people.length&&<p className="text-sm text-ink-2">스터디에 참가자를 배정하면 명단이 표시됩니다.</p>}
 </section>;
}
