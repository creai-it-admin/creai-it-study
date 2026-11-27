import Link from 'next/link';
import {redirect} from 'next/navigation';
import {requireAdmin} from '@/lib/auth';
import {prisma} from '@/lib/prisma';
import {librarySlot} from '@/lib/library';
import {LibraryUpload} from './LibraryUpload';

export const dynamic='force-dynamic';
const foundationOtId='211cc024-1c22-4e1d-9c55-a9bd55f662a1';

function libraryHref(cohort:number,week?:number,page=1) {
 const params=new URLSearchParams({cohort:String(cohort)});
 if(week!==undefined)params.set('week',String(week));
 if(page>1)params.set('page',String(page));
 return `/routes/admin/library?${params}`;
}

export default async function LibraryPage({searchParams}:{searchParams:Promise<{cohort?:string;week?:string;page?:string}>}){
 if(!await requireAdmin())redirect('/routes/login');
 const q=await searchParams;
 const week=q.week!==undefined&&/^[0-4]$/.test(q.week)?Number(q.week):undefined;
 const page=Math.max(1,Math.min(10000,Math.floor(Number(q.page))||1));
 const groups=await prisma.libraryAsset.groupBy({by:['cohortNo'],orderBy:{cohortNo:'desc'}});
 const latest=Math.max(2,...groups.map(g=>g.cohortNo));
 const cohort=q.cohort && /^\d+$/.test(q.cohort) && Number(q.cohort)<=2147483647
  ? Number(q.cohort) : (week!==undefined?1:latest);
 const cohorts=[...new Set([1,2,...groups.map(g=>g.cohortNo),cohort])].sort((a,b)=>b-a);
 const assets=await prisma.libraryAsset.findMany({
  where:{cohortNo:cohort,weekNo:week},orderBy:[{weekNo:'asc'},{createdAt:'desc'},{id:'desc'}],
  skip:(page-1)*24,take:25,include:{versions:{orderBy:{number:'desc'},take:1}},
 });
 return <main className="mx-auto max-w-5xl px-5 py-8">
  <Link className="text-sm text-accent-strong" href="/routes/admin">← 스터디 관리</Link>
  <h1 className="mt-4 text-2xl font-semibold">공통 자료실</h1>
  <nav aria-label="기수 선택" className="my-5 flex flex-wrap gap-2">
   {cohorts.map(n=><Link key={n} className={`btn ${cohort===n?'btn-primary':''}`} aria-current={cohort===n?'page':undefined} href={libraryHref(n,week)}>여울 {n}기</Link>)}
   {latest<2147483647 && !cohorts.includes(latest+1) && <Link className="btn" href={libraryHref(latest+1)}>+ {latest+1}기 열기</Link>}
  </nav>
  <section aria-label={`여울 ${cohort}기 자료`}>
   <h2 className="mb-3 text-xl font-semibold">여울 {cohort}기 자료</h2>
   <LibraryUpload key={`${cohort}-${week??'all'}`} cohortNo={cohort} weekNo={week}/>
   <nav aria-label="자료 구분" className="my-5 flex flex-wrap gap-2">
    {[undefined,0,1,2,3,4].map(n=><Link key={n??'all'} className={`btn ${week===n?'btn-primary':''}`} aria-current={week===n?'page':undefined} href={libraryHref(cohort,n)}>{n===undefined?'전체':librarySlot(n)}</Link>)}
   </nav>
   <div className="card divide-y divide-line overflow-hidden">
    {assets.slice(0,24).map(a=><div className="flex items-center justify-between gap-3 p-5" key={a.id}>
     <Link className="min-w-0 flex-1 hover:text-accent-strong" href={`/routes/admin/library/${a.id}`}>
      <span className="text-xs font-medium text-accent-strong">{librarySlot(a.weekNo)} · v{a.versionCount}</span>
      <h3 className="mt-1 break-words font-semibold">{a.title}</h3>
      {a.versions[0]?.note&&<p className="mt-2 text-sm text-ink-2">{a.versions[0].note}</p>}
     </Link>
     {a.id===foundationOtId&&<a className="btn" href="https://ai-study-1gi-guide.vercel.app/#1">1기 가이드 ↗</a>}
    </div>)}
    {!assets.length&&<p className="p-8 text-center text-sm text-ink-2">등록된 자료가 없습니다.</p>}
   </div>
   <div className="mt-5 flex gap-3">{page>1&&<Link className="btn" href={libraryHref(cohort,week,page-1)}>이전</Link>}{assets.length>24&&<Link className="btn" href={libraryHref(cohort,week,page+1)}>다음</Link>}</div>
  </section>
 </main>;
}
