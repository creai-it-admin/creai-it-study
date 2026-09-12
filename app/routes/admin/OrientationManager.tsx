"use client";
import Link from 'next/link';
import {useRouter} from 'next/navigation';
import {useState} from 'react';
export function OrientationManager({studyId,hasOt}:{studyId:string;hasOt:boolean}){
 const router=useRouter();
 const [editing,setEditing]=useState(false),[file,setFile]=useState<File|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState(''),[message,setMessage]=useState('');
 async function upload(e:React.FormEvent){
  e.preventDefault();if(!file)return;
  setBusy(true);setError('');setMessage('');
  try{
   const response=await fetch(`/api/admin/studies/${studyId}/ot/sign`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({size:file.size,name:file.name})});
   const sign=await response.json();if(!response.ok)throw Error(sign.error);
   const put=await fetch(sign.signedUrl,{method:'PUT',headers:{'Content-Type':'text/html'},body:file});
   if(!put.ok)throw Error('파일 업로드를 다시 시도해 주세요.');
   const saved=await fetch(`/api/admin/studies/${studyId}/ot`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({path:sign.path})});
   const result=await saved.json();if(!saved.ok)throw Error(result.error);
   setEditing(false);setFile(null);setMessage('OT 자료가 저장되었습니다.');router.refresh();
  }catch(e){setError(e instanceof Error?e.message:'OT 자료를 저장하지 못했습니다.');}finally{setBusy(false);}
 }
 return <section className="card mb-5 border-accent/30 p-5" aria-label="스터디 오리엔테이션">
  <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-semibold">오리엔테이션</h2><p className="mt-1 text-sm text-ink-2">이 스터디의 방향과 진행 안내를 담은 공통 자료</p></div><div className="flex flex-wrap gap-2">{hasOt&&<Link className="btn btn-primary" href={`/routes/studies/${studyId}/ot`}>OT 자료 보기</Link>}<button className="btn" disabled={busy} onClick={()=>{setEditing(!editing);setFile(null);setError('');}}>{hasOt?'OT 자료 교체':'OT HTML 올리기'}</button></div></div>
  {editing&&<form className="mt-4 space-y-3" onSubmit={upload} aria-label="OT 자료 업로드"><label className="block text-sm">OT HTML 파일<input className="mt-2 block w-full" type="file" accept=".html,.htm,text/html" required disabled={busy} onChange={e=>setFile(e.target.files?.[0]??null)}/></label><p className="text-xs text-ink-2">이미지·스타일을 포함한 단일 HTML 파일 · 최대 20MB</p><div className="flex gap-2"><button className="btn btn-primary" disabled={busy||!file}>{busy?'업로드 중…':'저장'}</button><button type="button" className="btn" disabled={busy} onClick={()=>{setEditing(false);setFile(null);setError('');}}>취소</button></div></form>}
  {error&&<p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}<p role="status" className="mt-2 text-sm text-accent-strong">{message}</p>
 </section>;
}
