"use client";
import Link from 'next/link';
import {MaterialManager} from './MaterialManager';
import type {MaterialItem} from '@/lib/materials';
export function SessionRow({id,weekNo,date,status,deckPath,materials,fieldCount}:{id:string;weekNo:number;date:string;status:string;deckPath:string|null;materials:MaterialItem[];fieldCount:number}){
 return <section className="card flex flex-col gap-3 p-5">
  <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="font-semibold">{weekNo===0?'리허설':`${weekNo}주차`} <span className="ml-2 text-sm font-normal text-ink-2">{new Date(date).toLocaleDateString('ko-KR',{month:'long',day:'numeric',timeZone:'Asia/Seoul'})} · {status==='running'?'진행 중':status==='closed'?'종료':'예정'}</span></h2>
   <Link className="btn btn-primary" href={status==='closed'?`/routes/sessions/${id}`:`/routes/admin/run/${id}`}>{status==='closed'?'세션 리포트 보기':status==='running'?'세션 진행':'세션 준비'}</Link></div>
  <div className="flex flex-wrap items-center gap-3 text-sm text-ink-2">
   <span>질문 {fieldCount}개</span><Link className="btn" href={`/routes/admin/session/${id}`}>주제·폼 {status==='scheduled'?'편집':'보기'}</Link>
  </div>
  <MaterialManager sessionId={id} materials={materials} deckPath={deckPath}/>

 </section>;
}
