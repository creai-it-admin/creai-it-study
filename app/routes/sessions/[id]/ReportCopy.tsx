"use client";
import {useState} from 'react';
import {copyReportHtml} from '@/lib/report-copy';

export function ReportCopy({id}:{id:string}){
 const [state,setState]=useState<'idle'|'copying'|'copied'|'manual'|'error'>('idle');
 const [html,setHtml]=useState(''),[error,setError]=useState('');
 async function copy(){
  setState('copying');setError('');setHtml('');
  try{
   const result=await copyReportHtml(`/routes/sessions/${id}/report`);
   if(result.copied)setState('copied');
   else{setHtml(result.html);setState('manual');}
  }catch(e){setError(e instanceof Error?e.message:'복사하지 못했습니다. 다시 시도해 주세요.');setState('error');}
 }
 return <div className="flex flex-col gap-2">
  <div className="flex flex-wrap items-center justify-between gap-3">
   <p className="text-xs text-ink-2">HTML 전체를 복사해 ChatGPT 등에 붙여넣고, 세션 내용을 되짚거나 질문해 보세요.</p>
   <button className="btn shrink-0" disabled={state==='copying'} onClick={()=>void copy()}>{state==='copying'?'복사 중…':state==='copied'?'✓ HTML 복사 완료':'HTML 복사'}</button>
  </div>
  <p role="status" className="text-xs text-ink-2">{state==='copied'?'리포트 전체가 복사됐습니다. 원하는 곳에 붙여넣으세요.':state==='copying'?'리포트를 불러오고 있습니다.':''}</p>
  {state==='error'&&<p role="alert" className="text-sm text-red-700">{error}</p>}
  {state==='manual'&&<div className="rounded-lg border border-line p-3">
   <p role="status" className="mb-2 text-sm">브라우저가 자동 복사를 허용하지 않았습니다. 아래 내용을 선택한 뒤 ⌘C 또는 Ctrl+C로 복사해 주세요.</p>
   <label className="text-xs text-ink-2">복사할 HTML 원문<textarea readOnly value={html} onFocus={event=>event.currentTarget.select()} className="field mt-2 h-40 w-full font-mono text-xs"/></label>
  </div>}
 </div>;
}
