import Link from 'next/link';
import {sessionAccessWhere} from '@/lib/study-access';
import {requireUser} from '@/lib/auth';
import {redirect,notFound} from 'next/navigation';
import {Header} from '@/components/Header';
import {getRunningSession} from '@/lib/session-state';
import {prisma} from '@/lib/prisma';
import {materialSelect,materialLabels,materialHref} from '@/lib/materials';
import {DeckViewer} from './DeckViewer';
import {DeckFrame} from './DeckFrame';
export const dynamic='force-dynamic';
export default async function DeckPage({searchParams}:{searchParams:Promise<{session?:string;material?:string}>}){
 const user=await requireUser();if(!user)redirect('/routes/login');
 const {session:requestedId,material:materialId}=await searchParams;
 const id=requestedId??(await getRunningSession(user))?.id;
 const session=id?await prisma.studySession.findFirst({where:{id,...sessionAccessWhere(user)},include:{study:true,materials:{select:materialSelect,orderBy:[{kind:'asc'},{createdAt:'asc'},{id:'asc'}]}}}):null;
 if(requestedId&&!session)notFound();
 const selected=materialId?session?.materials.find(m=>m.id===materialId):session?.materials[0];
 if(materialId&&!selected)notFound();
 return <>{await Header()}<main className="mx-auto max-w-7xl px-5 py-6"><DeckFrame>
  {session&&<div className="mb-4 flex flex-wrap items-center justify-between gap-3"><h1 className="text-lg font-semibold">{session.study.name} · {session.weekNo===0?'리허설':`${session.weekNo}주차`} 자료</h1><Link className="btn" href={user.roles.includes('admin')?`/routes/admin/studies/${session.studyId}`:'/routes/home'}>회차 목록</Link></div>}
  {!!session?.materials.length&&<nav aria-label="회차 자료 선택" className="mb-4 grid gap-3 sm:grid-cols-2">{(['education','presentation'] as const).map(kind=>{
   const items=session.materials.filter(m=>m.kind===kind);if(!items.length)return null;
   return <div key={kind} className="rounded-lg border border-line p-3"><p className="mb-2 text-xs font-semibold text-ink-2">{materialLabels[kind]}</p><div className="flex flex-wrap gap-2">{items.map(m=><Link key={m.id} aria-current={selected?.id===m.id?'page':undefined} className={`btn text-sm ${selected?.id===m.id?'btn-primary':''}`} href={materialHref(session.id,m.id)}>{m.title}</Link>)}</div></div>;
  })}</nav>}
  {session&&(selected||session.deckPath)?<DeckViewer key={selected?.id??session.id} sessionId={session.id} materialId={selected?.id} title={selected?.title??'교육 장표'}/>:<div className="card p-10 text-center text-sm text-ink-2">올라온 HTML 자료가 없습니다.</div>}
 </DeckFrame></main></>;
}
