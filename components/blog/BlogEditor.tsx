'use client';
import {useEffect,useState} from 'react';
import Link from 'next/link';
import type {BlogContent} from '@/lib/blog/content';
type Post={id:string;slug:string;draft:BlogContent;updatedAt:string;publishedAt:string|null;publishedUpdatedAt:string|null};
export function BlogEditor({initial}:{initial?:Post}){
 const [post,setPost]=useState(initial),[slug,setSlug]=useState(initial?.slug||'');
 const [content,setContent]=useState<BlogContent>(initial?.draft||{title:'',excerpt:'',html:'',author:'CREAI+IT',category:'인사이트',coverUrl:'',coverAlt:''});
 const [busy,setBusy]=useState(false),[message,setMessage]=useState(''),[failed,setFailed]=useState(false),[dirty,setDirty]=useState(false);
 useEffect(()=>{if(!dirty)return;const warn=(event:BeforeUnloadEvent)=>{event.preventDefault();};window.addEventListener('beforeunload',warn);return()=>window.removeEventListener('beforeunload',warn);},[dirty]);
 function change(key:keyof BlogContent,value:string){setContent(c=>({...c,[key]:value}));setDirty(true);}
 async function save(action:'save'|'publish'|'unpublish'){
  setBusy(true);setMessage('');setFailed(false);
  try{const response=await fetch('/api/admin/blog',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({action,id:post?.id,updatedAt:post?.updatedAt,slug,content})});const data=await response.json();if(!response.ok)throw Error(data.error||'저장하지 못했습니다.');
   setPost({...data,slug,draft:content});setDirty(false);setMessage(action==='publish'?'발행했습니다. 공개 글에서 확인하세요.':action==='unpublish'?'비공개로 전환했습니다.':'초안을 저장했습니다. 미리보기로 확인해 주세요.');
   if(!post)window.history.replaceState(null,'',`/routes/admin/blog/${data.id}`);
  }catch(e){setFailed(true);setMessage(e instanceof Error?e.message:'저장하지 못했습니다.');}finally{setBusy(false);}
 }
 async function importHtml(file?:File){if(!file)return;if(file.size>200000){setFailed(true);setMessage('HTML 파일은 200KB 이하로 올려 주세요.');return;}try{change('html',await file.text());setFailed(false);setMessage('HTML을 가져왔습니다. 저장 후 미리보기를 확인하세요.');}catch{setFailed(true);setMessage('파일을 읽지 못했습니다.');}}
 return <main className="mx-auto max-w-5xl px-5 py-8">
  <Link href="/routes/admin/blog" className="text-sm text-accent-strong">← 블로그 관리</Link>
  <div className="my-6"><p className="text-sm text-ink-2">{post?.publishedAt?'공개 중 · 수정 내용은 다시 발행할 때 반영됩니다.':'비공개 초안'}{dirty?' · 저장되지 않은 변경 있음':''}</p><h1 className="mt-2 text-2xl font-semibold">{initial?'글 편집':'새 글 작성'}</h1></div>
  <form onSubmit={e=>{e.preventDefault();save('save');}} className="space-y-5">
   <fieldset disabled={busy} className="grid gap-5 sm:grid-cols-2 disabled:opacity-60">
    <label className="sm:col-span-2">제목<input required maxLength={120} className="mt-2 w-full rounded-lg border bg-white p-3" value={content.title} onChange={e=>change('title',e.target.value)}/></label>
    <label className="sm:col-span-2">글 주소 <span className="text-sm text-ink-2">/blog/</span><input required pattern="[a-z0-9]+(-[a-z0-9]+)*" maxLength={100} disabled={!!post?.publishedUpdatedAt} placeholder="working-with-ai" className="mt-2 w-full rounded-lg border bg-white p-3 disabled:bg-gray-100" value={slug} onChange={e=>{setSlug(e.target.value);setDirty(true);}}/><span className="mt-1 block text-xs text-ink-2">영문 소문자·숫자·하이픈. 첫 발행 이후에는 주소가 고정됩니다.</span></label>
    <label className="sm:col-span-2">요약<textarea maxLength={300} rows={3} className="mt-2 w-full rounded-lg border bg-white p-3" value={content.excerpt} onChange={e=>change('excerpt',e.target.value)}/></label>
    <label>작성자<input maxLength={60} className="mt-2 w-full rounded-lg border bg-white p-3" value={content.author} onChange={e=>change('author',e.target.value)}/></label>
    <label>분류<input maxLength={30} className="mt-2 w-full rounded-lg border bg-white p-3" value={content.category} onChange={e=>change('category',e.target.value)}/></label>
    <label>표지 이미지 주소 <small>(선택)</small><input placeholder="https://…" maxLength={2048} className="mt-2 w-full rounded-lg border bg-white p-3" value={content.coverUrl} onChange={e=>change('coverUrl',e.target.value)}/></label>
    <label>표지 이미지 설명<input maxLength={200} className="mt-2 w-full rounded-lg border bg-white p-3" value={content.coverAlt} onChange={e=>change('coverAlt',e.target.value)}/></label>
    <div className="sm:col-span-2"><div className="flex flex-wrap items-center justify-between gap-3"><label htmlFor="blog-html">HTML 본문</label><label className="cursor-pointer rounded-lg border bg-white px-4 py-2 text-sm">HTML 파일 가져오기<input aria-label="HTML 파일 가져오기" type="file" accept=".html,.htm,text/html" className="sr-only" onChange={e=>importHtml(e.target.files?.[0])}/></label></div><p className="my-3 text-sm text-ink-2">소제목(h2·h3), 문단, 목록, 이미지, 인용, 표, 코드 블록을 지원합니다. 글꼴·간격은 저널 디자인을 따르며 스크립트와 개별 CSS는 제거됩니다. 이미지는 HTTPS 주소를 사용하세요.</p><textarea id="blog-html" spellCheck={false} maxLength={200000} rows={18} className="w-full rounded-lg border bg-white p-4 font-mono text-sm leading-7" placeholder={'<p>이야기를 시작하세요.</p>\n<h2>첫 번째 소제목</h2>\n<p>본문을 작성하세요.</p>'} value={content.html} onChange={e=>change('html',e.target.value)}/></div>
   </fieldset>
   <div className="sticky bottom-0 flex flex-wrap items-center gap-3 border-t bg-white p-4 shadow-sm"><button disabled={busy} className="btn btn-primary" type="submit">{busy?'처리 중…':'초안 저장'}</button>{post&&!dirty&&<a target="_blank" rel="noreferrer" className="btn" href={`/routes/admin/blog/${post.id}/preview`}>미리보기 ↗</a>}<button disabled={busy} type="button" className="btn" onClick={()=>save('publish')}>{post?.publishedAt?'수정본 발행':'발행하기'}</button>{post?.publishedAt&&<><a className="btn" href={`/blog/${post.slug}`} target="_blank" rel="noreferrer">공개 글 ↗</a><button disabled={busy} type="button" className="text-sm text-ink-2 underline" onClick={()=>save('unpublish')}>비공개로 전환</button></>}</div>
   <p role={failed?'alert':'status'} aria-live="polite" className={failed?'text-red-700':'text-accent-strong'}>{message}</p>
  </form>
 </main>
}
