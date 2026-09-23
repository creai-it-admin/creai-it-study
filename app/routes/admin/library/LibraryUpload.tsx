'use client';
import {useRef,useState} from 'react';
import {useRouter} from 'next/navigation';
type Asset={id:string;title:string;weekNo:number};
export function LibraryUpload({asset}:{asset?:Asset}){
 const router=useRouter();
 const [open,setOpen]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState('');
 // Preserve successful uploads when only the final save failed.
 const pending=useRef<{file:File;assetId:string;versionId:string;uploaded:boolean}|null>(null);
 async function submit(e:React.FormEvent<HTMLFormElement>){
  e.preventDefault();const form=new FormData(e.currentTarget),file=form.get('file') as File;
  setBusy(true);setError('');
  try{
   if(!pending.current||pending.current.file.name!==file.name||pending.current.file.lastModified!==file.lastModified||pending.current.file.size!==file.size)pending.current={file,assetId:asset?.id??crypto.randomUUID(),versionId:crypto.randomUUID(),uploaded:false};
   const p=pending.current;
   if(!p.uploaded){
    const sign=await fetch('/api/admin/library/sign',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({assetId:p.assetId,versionId:p.versionId,name:file.name,size:file.size})});const signed=await sign.json();if(!sign.ok)throw Error(signed.error);
    const put=await fetch(signed.signedUrl,{method:'PUT',headers:{'Content-Type':'text/html'},body:file});if(!put.ok)throw Error('파일 업로드를 다시 시도해 주세요.');p.uploaded=true;
   }
   const response=await fetch('/api/admin/library',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({assetId:p.assetId,versionId:p.versionId,title:asset?.title??form.get('title'),weekNo:asset?.weekNo??Number(form.get('weekNo')),note:form.get('note')??''})});
   const result=await response.json();if(!response.ok)throw Error(result.error);
   pending.current=null;setOpen(false);router.push(`/routes/admin/library/${result.id}?version=${result.versionId}`);router.refresh();
  }catch(e){setError(e instanceof Error?e.message:'저장하지 못했습니다.');}finally{setBusy(false);}
 }
 return <div>{!open?<button className="btn btn-primary" onClick={()=>setOpen(true)}>{asset?'새 버전 올리기':'자료 등록'}</button>:<form onSubmit={submit} className="card space-y-4 p-5" aria-label={asset?'새 버전 등록':'공통 자료 등록'}>
  <h2 className="font-semibold">{asset?`${asset.title} · 새 버전`:'공통 자료 등록'}</h2>
  {!asset&&<div className="grid gap-4 sm:grid-cols-[1fr_150px]"><label className="text-sm">자료 이름<input name="title" required maxLength={100} className="field mt-1" placeholder="Foundation OT" disabled={busy}/></label><label className="text-sm">자료 구분<select name="weekNo" className="field mt-1" disabled={busy}>{[0,1,2,3,4].map(n=><option key={n} value={n}>{n===0?'OT':`${n}주차`}</option>)}</select></label></div>}
  <label className="block text-sm">HTML 파일<input name="file" required type="file" accept=".html,.htm,text/html" disabled={busy} className="mt-2 block w-full" onChange={()=>{pending.current=null;}}/></label>
  <p className="text-xs text-ink-2">폰트·이미지·스타일이 포함된 단일 HTML · 최대 20MB</p>
  <label className="block text-sm">버전 설명 <span className="text-ink-2">(선택)</span><input name="note" maxLength={500} disabled={busy} className="field mt-1" placeholder="이번 버전에서 바뀐 내용을 짧게 남겨 주세요."/></label>
  {asset&&<p className="text-sm text-ink-2">새 버전을 올려도 기존 버전과 기수에 적용한 자료는 유지됩니다.</p>}
  {error&&<p role="alert" className="text-sm text-danger">{error}</p>}
  <div className="flex gap-2"><button className="btn btn-primary" disabled={busy}>{busy?'저장 중…':'등록'}</button><button type="button" className="btn" disabled={busy} onClick={()=>setOpen(false)}>취소</button></div>
 </form>}</div>;
}
