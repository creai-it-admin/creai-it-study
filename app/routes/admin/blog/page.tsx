import Link from 'next/link';
import {prisma} from '@/lib/prisma';
import type {BlogContent} from '@/lib/blog/content';
export default async function AdminBlog({searchParams}:{searchParams:Promise<{page?:string}>}){
 const page=Math.max(1,Math.min(10000,Math.floor(Number((await searchParams).page)||1)));
 const posts=await prisma.blogPost.findMany({orderBy:[{updatedAt:'desc'},{id:'desc'}],skip:(page-1)*20,take:21});
 return <main className="mx-auto max-w-4xl px-5 py-8"><Link className="text-sm text-accent-strong" href="/routes/admin">← 운영실</Link><div className="my-6 flex flex-wrap items-center justify-between gap-4"><div><h1 className="text-2xl font-semibold">블로그 관리</h1><p className="mt-2 text-sm text-ink-2">초안에서 시작해, 미리보고 발행하세요.</p></div><div className="flex gap-3"><Link className="btn" href="/blog">공개 저널 ↗</Link><Link className="btn btn-primary" href="/routes/admin/blog/new">새 글 작성</Link></div></div>
 {!posts.length?<div className="card p-10"><h2 className="text-xl font-medium">아직 작성된 글이 없습니다.</h2><p className="mt-3 text-ink-2">첫 글을 저장하면 이곳에서 초안과 발행 상태를 관리할 수 있습니다.</p></div>:<div className="space-y-3">{posts.slice(0,20).map(post=><Link className="card block p-5 hover:border-accent" key={post.id} href={`/routes/admin/blog/${post.id}`}><span className="text-xs text-accent-strong">{post.publishedAt?'공개':'비공개 초안'}</span><h2 className="my-2 text-lg font-semibold">{(post.draft as unknown as BlogContent).title}</h2><span className="text-sm text-ink-2">/blog/{post.slug} · 수정 {post.updatedAt.toLocaleString('ko-KR',{timeZone:'Asia/Seoul'})}</span></Link>)}</div>}
 <nav className="mt-8 flex gap-6" aria-label="관리 목록 페이지">{page>1&&<Link href={`?page=${page-1}`}>← 이전</Link>}{posts.length>20&&<Link href={`?page=${page+1}`}>다음 →</Link>}</nav></main>
}
