import type {ReactNode} from 'react';
import type {PracticeEvent} from '@/lib/practice/types';
import {ResultText} from './ResultText';
const label=(e:PracticeEvent)=>e.kind==='request'?'요청':e.kind==='response'?'AI 응답':e.target==='revised'?'마무리 결과 제출':'첫 결과 공유';
const time=(iso:string)=>new Date(iso).toLocaleTimeString('ko-KR',{hour:'2-digit',minute:'2-digit'});
export function PracticeLog({events,anchor,focus,actions}:{events:PracticeEvent[];anchor?:string;focus?:number;actions?:(e:PracticeEvent)=>ReactNode}){
 return <ol className="space-y-4">{events.map(e=><li key={e.seq} id={anchor?`${anchor}-${e.seq}`:undefined} className={`${e.kind==='result'?'inset p-4':`border-l-2 pl-4 ${e.kind==='request'?'border-accent':'border-line'}`}${focus===e.seq?' rounded bg-accent-soft':''}`}>
  <p className="mb-1 text-xs text-ink-2">#{e.seq} · {label(e)} · {time(e.createdAt)}</p>
  <ResultText text={e.text}/>
  {e.searches&&<p className="mt-2 text-xs text-ink-2">검색: {e.searches.join(' · ')}</p>}
  {e.sources&&<ul className="mt-2 space-y-1 text-xs">{e.sources.map(s=><li key={s.url}><a className="break-all text-accent-strong underline underline-offset-4" href={s.url} target="_blank" rel="noopener noreferrer">{s.title}</a></li>)}</ul>}
  {actions?.(e)}
 </li>)}</ol>;
}
