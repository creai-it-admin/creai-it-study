import Link from 'next/link';
import {redirect} from 'next/navigation';
import {requireAdmin} from '@/lib/auth';
import {prisma} from '@/lib/prisma';
import {librarySlot} from '@/lib/library';
import {LibraryUpload} from './LibraryUpload';
export const dynamic='force-dynamic';
export default async function LibraryPage({searchParams}:{searchParams:Promise<{week?:string;page?:string}>}){
 if(!await requireAdmin())redirect('/routes/login');
 const q=await searchParams,week=q.week!==undefined&&/^[0-4]$/.test(q.week)?Number(q.week):undefined;
 const page=Math.max(1,Math.min(10000,Math.floor(Number(q.page))||1));
 const assets=await prisma.libraryAsset.findMany({where:{weekNo:week},orderBy:[{createdAt:'desc'},{id:'desc'}],skip:(page-1)*24,take:25,include:{versions:{orderBy:{number:'desc'},take:1}}});
 const href=(p:number)=>`/routes/admin/library?${week===undefined?'':`week=${week}&`}page=${p}`;
 return <main className="mx-auto max-w-5xl px-5 py-8"><Link className="text-sm text-accent-strong" href="/routes/admin">← 스터디 관리</Link><h1 className="mt-4 text-2xl font-semibold">공통 자료실</h1><p className="mb-6 mt-2 text-sm text-ink-2">Foundation 교육의 공통 원본을 보관하고, 필요한 버전을 각 기수에 적용하세요.</p><LibraryUpload/>
  <nav aria-label="자료 구분" className="my-6 flex flex-wrap gap-2">{[undefined,0,1,2,3,4].map(n=><Link key={n??'all'} className={`btn ${week===n?'btn-primary':''}`} aria-current={week===n?'page':undefined} href={`/routes/admin/library${n===undefined?'':`?week=${n}`}`}>{n===undefined?'전체':librarySlot(n)}</Link>)}</nav>
  <div className="card divide-y divide-line overflow-hidden">{assets.slice(0,24).map(a=><Link key={a.id} href={`/routes/admin/library/${a.id}`} className="flex items-center justify-between gap-4 p-5 hover:bg-accent-soft"><div className="min-w-0"><span className="text-xs font-medium text-accent-strong">FOUNDATION · {librarySlot(a.weekNo)}</span><h2 className="mt-1 break-words font-semibold">{a.title}</h2><p className="mt-2 text-sm text-ink-2">{a.versions[0]?.note||'공통 교육 자료'}</p></div><span className="shrink-0 text-sm text-ink-2">v{a.versionCount} →</span></Link>)}{!assets.length&&<p className="p-8 text-center text-sm text-ink-2">등록된 자료가 없습니다. 완성된 HTML 자료를 올려 주세요.</p>}</div>
  <div className="mt-5 flex gap-3">{page>1&&<Link className="btn" href={href(page-1)}>이전</Link>}{assets.length>24&&<Link className="btn" href={href(page+1)}>다음</Link>}</div>
 </main>;
}
