"use client";
import Link from 'next/link';
import {useRouter} from 'next/navigation';
import {useState} from 'react';
import {materialHref,materialLabels,type MaterialItem,type MaterialKind} from '@/lib/materials';

export function MaterialManager({sessionId,materials,deckPath}:{sessionId:string;materials:MaterialItem[];deckPath:string|null}){
 const router=useRouter();
 const [editing,setEditing]=useState<{kind:MaterialKind;id?:string}|null>(null);
 const [title,setTitle]=useState(''),[file,setFile]=useState<File|null>(null);
 const [busy,setBusy]=useState(false),[message,setMessage]=useState(''),[error,setError]=useState('');
 function open(kind:MaterialKind,material?:MaterialItem){setEditing({kind,id:material?.id});setTitle(material?.title??'');setFile(null);setError('');setMessage('');}
 async function upload(event:React.FormEvent){
  event.preventDefault();if(!file||!editing)return;
  setBusy(true);setError('');setMessage('');
  try{
   const signed=await fetch(`/api/admin/session/${sessionId}/deck/sign`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({size:file.size,name:file.name})});
   const sign=await signed.json();if(!signed.ok)throw Error(sign.error);
   const put=await fetch(sign.signedUrl,{method:'PUT',headers:{'Content-Type':'text/html'},body:file});
   if(!put.ok)throw Error('파일을 업로드하지 못했습니다. 다시 시도해 주세요.');
   const res=await fetch(`/api/admin/session/${sessionId}/deck`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({path:sign.path,kind:editing.kind,title:title.trim(),materialId:editing.id})});
   const saved=await res.json();if(!res.ok)throw Error(saved.error);
   setMessage(`${materialLabels[editing.kind]}가 저장되었습니다.`);setEditing(null);setFile(null);router.refresh();
  }catch(e){setError(e instanceof Error?e.message:'자료를 저장하지 못했습니다.');}finally{setBusy(false);}
 }
 return <div className="mt-1 border-t border-line pt-4">
  <div className="grid gap-4 sm:grid-cols-2">{(['education','presentation'] as const).map(kind=><div key={kind} className="min-w-0 rounded-lg border border-line p-4">
   <div className="mb-3 flex items-center justify-between gap-2"><h3 className="text-sm font-semibold">{materialLabels[kind]}</h3><button type="button" className="text-sm font-medium text-accent-strong disabled:opacity-50" disabled={busy} onClick={()=>open(kind)}>+ 자료 추가</button></div>
   <p className="mb-3 text-xs text-ink-2">{kind==='education'?'교육과 인클래스에 사용하는 장표':'3부에서 함께 나누는 구성원의 경험과 고민'}</p>
   <ul className="space-y-3">{materials.filter(m=>m.kind===kind).map(m=><li key={m.id} className="flex items-start justify-between gap-3">
    <Link className="min-w-0 break-words text-sm font-medium text-accent-strong underline underline-offset-4" href={materialHref(sessionId,m.id)}>{m.title} ↗</Link>
    <button type="button" className="shrink-0 text-xs text-ink-2 underline disabled:opacity-50" disabled={busy} aria-label={`${m.title} 교체`} onClick={()=>open(kind,m)}>교체</button>
   </li>)}</ul>
   {!materials.some(m=>m.kind===kind)&&(kind==='education'&&deckPath?<Link className="text-sm text-accent-strong" href={materialHref(sessionId)}>교육 장표 보기</Link>:<p className="text-sm text-ink-2">아직 등록된 자료가 없습니다.</p>)}
  </div>)}</div>
  {editing&&<form onSubmit={upload} className="mt-4 space-y-3 rounded-lg bg-accent-soft p-4" aria-label={`${materialLabels[editing.kind]} ${editing.id?'교체':'추가'}`}>
   <h3 className="text-sm font-semibold">{materialLabels[editing.kind]} {editing.id?'교체':'추가'}</h3>
   <label className="block text-sm">자료 제목<input className="mt-1 block w-full rounded-md border border-line bg-white p-2" required maxLength={120} value={title} disabled={busy} placeholder={editing.kind==='presentation'?'예: 재원 · AI 업무보고를 만들며 막혔던 지점':'예: 1주차 · 좋은 AI 활용'} onChange={e=>setTitle(e.target.value)}/></label>
   <label className="block text-sm">HTML 파일<input key={`${editing.kind}-${editing.id??'new'}`} className="mt-2 block w-full text-sm" type="file" required disabled={busy} accept=".html,.htm,text/html" onChange={e=>{const selected=e.target.files?.[0]??null;setFile(selected);if(selected&&!title.trim())setTitle(selected.name.replace(/\.html?$/i,'').slice(0,120));}}/></label>
   <p className="text-xs text-ink-2">이미지·스타일·스크립트를 포함한 단일 HTML 파일 · 최대 20MB</p>
   <div className="flex gap-2"><button type="submit" disabled={busy||!file||!title.trim()} className="btn btn-primary">{busy?'업로드 중…':'저장'}</button><button type="button" disabled={busy} className="btn" onClick={()=>{setEditing(null);setError('');}}>취소</button></div>
  </form>}
  {error&&<p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}
  <p role="status" className="mt-2 text-sm text-accent-strong">{message}</p>
 </div>;
}
