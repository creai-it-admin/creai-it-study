import {notFound,redirect} from 'next/navigation';
import {requireUser} from '@/lib/auth';
import {prisma} from '@/lib/prisma';
import {sessionAccessWhere} from '@/lib/study-access';
import {Header} from '@/components/Header';
import {ActivityWorkspace} from '@/components/activity/ActivityWorkspace';
export const dynamic='force-dynamic';
export default async function ActivityPage({params,searchParams}:{params:Promise<{id:string}>;searchParams:Promise<{review?:string}>}){const user=await requireUser();if(!user)redirect('/routes/login');const{id}=await params;const {review}=await searchParams;const s=await prisma.studySession.findFirst({where:{id,...sessionAccessWhere(user)},select:{id:true}});if(!s)notFound();return <>{await Header()}<main className="mx-auto max-w-4xl px-5 py-8"><ActivityWorkspace key={id} id={id} reviewUser={typeof review==='string'?review:undefined}/></main></>}
