"use client";
import Link from 'next/link';
import {useRouter} from 'next/navigation';
import {useRef,useState} from 'react';
export function SessionRow({id,weekNo,date,status,deckPath,fieldCount}:{id:string;weekNo:number;date:string;status:string;deckPath:string|null;fieldCount:number}){
 const router=useRouter(),fileRef=useRef<HTMLInputElement>(null);
 const [busy,setBusy]=useState(false),[error,setError]=useState('');
 async function upload(file:File){
  setBusy(true);setError('');
  try{
   const signRes=await fetch(`/api/admin/session/${id}/deck/sign`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({size:file.size,name:file.name})});
   const sign=await signRes.json();if(!signRes.ok)throw Error(sign.error);
   const put=await fetch(sign.signedUrl,{method:'PUT',headers:{'Content-Type':'text/html'},body:file});
   if(!put.ok)throw Error('장표를 업로드하지 못했습니다.');
   const res=await fetch(`/api/admin/session/${id}/deck`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({path:sign.path})});
   const saved=await res.json();if(!res.ok)throw Error(saved.error);router.refresh();
  }catch(e){setError(e instanceof Error?e.message:'장표를 저장하지 못했습니다.');}finally{setBusy(false);}
 }
 return <section className="card flex flex-col gap-3 p-5">
  <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="font-semibold">{weekNo===0?'리허설':`${weekNo}주차`} <span className="ml-2 text-sm font-normal text-ink-2">{new Date(date).toLocaleDateString('ko-KR',{month:'long',day:'numeric',timeZone:'Asia/Seoul'})} · {status==='running'?'진행 중':status==='closed'?'종료':'예정'}</span></h2>
   <Link className="btn btn-primary" href={status==='closed'?`/sessions/${id}`:`/admin/run/${id}`}>{status==='closed'?'세션 리포트 보기':status==='running'?'세션 진행':'세션 준비'}</Link></div>
  <div className="flex flex-wrap items-center gap-3 text-sm text-ink-2">
   <span>질문 {fieldCount}개</span><Link className="btn" href={`/admin/session/${id}`}>주제·폼 {status==='scheduled'?'편집':'보기'}</Link>
   {deckPath&&<Link className="btn" href={`/deck?session=${id}`}>HTML 장표 보기</Link>}
   <input ref={fileRef} type="file" accept=".html,.htm,text/html" className="hidden" onChange={e=>{const file=e.target.files?.[0];if(file)void upload(file);e.target.value='';}}/>
   <button className="btn" disabled={busy} onClick={()=>fileRef.current?.click()}>{busy?'업로드 중…':deckPath?'HTML 장표 바꾸기':'HTML 장표 올리기'}</button>
  </div><p className="text-xs text-ink-2">이미지·스타일·스크립트를 포함한 단일 HTML 파일 · 최대 20MB</p>
  {error&&<p role="alert" className="text-sm text-red-700">{error}</p>}
 </section>;
}
