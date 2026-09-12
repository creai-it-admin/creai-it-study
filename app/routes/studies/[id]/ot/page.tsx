import Link from 'next/link';
import {notFound,redirect} from 'next/navigation';
import {requireUser} from '@/lib/auth';
import {prisma} from '@/lib/prisma';
import {studyAccessWhere} from '@/lib/study-access';
import {Header} from '@/components/Header';
import {DeckViewer} from '@/app/routes/deck/DeckViewer';
export const dynamic='force-dynamic';
export default async function OrientationPage({params}:{params:Promise<{id:string}>}){
 const user=await requireUser();if(!user)redirect('/routes/login');
 const {id}=await params;
 const study=await prisma.study.findFirst({where:{id,...studyAccessWhere(user)},select:{id:true,name:true,otPath:true}});
 if(!study)notFound();
 return <>{await Header()}<main className="mx-auto max-w-7xl px-5 py-6">
  <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><div><h1 className="text-lg font-semibold">{study.name} · 오리엔테이션</h1><p className="mt-1 text-sm text-ink-2">우리가 함께하는 이유와 스터디 진행 안내</p></div><Link className="btn" href={user.roles.includes('admin')?`/routes/admin/studies/${id}`:'/routes/home'}>스터디로 돌아가기</Link></div>
  {study.otPath?<DeckViewer src={`/api/studies/${id}/ot`} title={`${study.name} OT`}/>:<p className="card p-8 text-center text-sm text-ink-2">아직 OT 자료가 등록되지 않았습니다.</p>}
 </main></>;
}
