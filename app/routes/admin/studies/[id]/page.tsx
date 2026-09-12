import {materialSelect} from '@/lib/materials';
import Link from 'next/link';
import {notFound,redirect} from 'next/navigation';
import {requireAdmin} from '@/lib/auth';
import {prisma} from '@/lib/prisma';
import {OrientationManager} from '../../OrientationManager';
import {SessionRow} from '../../SessionRow';
export const dynamic='force-dynamic';
export default async function StudyPage({params}:{params:Promise<{id:string}>}){
 if(!await requireAdmin())redirect('/routes/login');
 const {id}=await params;
 const study=await prisma.study.findUnique({where:{id},include:{sessions:{orderBy:{weekNo:'asc'},include:{materials:{select:materialSelect,orderBy:{createdAt:'asc'}},formDef:{include:{_count:{select:{fields:true}}}}}}}});
 if(!study)notFound();
 const row=(session:typeof study.sessions[number])=><SessionRow key={session.id} id={session.id} weekNo={session.weekNo} date={session.date.toISOString()} status={session.status} deckPath={session.deckPath} materials={session.materials} fieldCount={session.formDef?._count.fields??0}/>;
 return <main className="mx-auto max-w-4xl px-5 py-8">
  <Link className="text-sm text-accent-strong" href="/routes/admin">← 스터디 목록</Link>
  <div className="mb-6 mt-4 flex flex-wrap items-center justify-between gap-4"><h1 className="text-xl font-semibold">{study.name}</h1><Link className="btn" href={`/routes/admin/data?study=${study.id}`}>이 스터디 회차 결과</Link></div>
  <OrientationManager studyId={id} hasOt={!!study.otPath}/>
  <div className="flex flex-col gap-3">{study.sessions.filter(s=>s.weekNo>0).map(row)}</div>
  {study.sessions.some(s=>s.weekNo===0)&&<details className="mt-6"><summary className="mb-3 cursor-pointer text-sm font-medium text-ink-2">리허설</summary>{study.sessions.filter(s=>s.weekNo===0).map(row)}</details>}
 </main>;
}
