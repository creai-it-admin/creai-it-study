import Link from 'next/link';
import {redirect} from 'next/navigation';
import {requireAdmin} from '@/lib/auth';
import {prisma} from '@/lib/prisma';
export const dynamic='force-dynamic';
export default async function AdminHome(){
 if(!await requireAdmin())redirect('/routes/login');
 const studies=await prisma.study.findMany({orderBy:{createdAt:'desc'},include:{sessions:{orderBy:{weekNo:'asc'},select:{weekNo:true,date:true,status:true}}}});
 return <main className="mx-auto max-w-4xl px-5 py-8">
  <div className="mb-6 flex flex-wrap items-center justify-between gap-4"><div><h1 className="text-xl font-semibold">스터디 관리</h1><p className="mt-2 text-sm text-ink-2">스터디를 선택해 주차별 자료와 세션을 관리하세요.</p></div><Link className="btn btn-primary" href="/routes/admin/studies/new">새 스터디 만들기</Link></div>
  <div className="grid gap-4 sm:grid-cols-2">{studies.map(study=>{
   const weeks=study.sessions.filter(s=>s.weekNo>0),closed=weeks.filter(s=>s.status==='closed').length;
   const running=study.sessions.find(s=>s.status==='running');
   const date=(value:Date)=>value.toLocaleDateString('ko-KR',{year:'numeric',month:'numeric',day:'numeric',timeZone:'Asia/Seoul'});
   return <Link className="card flex flex-col gap-4 p-6 hover:border-accent" href={`/routes/admin/studies/${study.id}`} key={study.id}>
    <div className="flex items-start justify-between gap-3"><h2 className="text-lg font-semibold">{study.name}</h2><span className="shrink-0 text-xs text-ink-2">{running?'진행 중':weeks.length&&closed===weeks.length?'종료':'준비 중'}</span></div>
    {weeks.length>0&&<p className="text-sm text-ink-2">{date(weeks[0].date)} – {date(weeks[weeks.length-1].date)}</p>}
    <p className="text-sm text-ink-2">총 {weeks.length}회 · {closed}회 완료{running?` · ${running.weekNo===0?'리허설':`${running.weekNo}주차`} 진행 중`:''}</p>
    <span className="text-sm font-medium text-accent-strong">회차 관리 →</span>
   </Link>;
  })}</div>
 </main>;
}
