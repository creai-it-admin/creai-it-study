import {MaterialLinks} from '@/components/MaterialLinks';
import {materialSelect} from '@/lib/materials';
import {sessionAccessWhere} from '@/lib/study-access';
import {redirect,notFound} from 'next/navigation';
import Link from 'next/link';
import {requireUser} from '@/lib/auth';
import {Header} from '@/components/Header';
import {prisma} from '@/lib/prisma';
import {RecordingResults} from './RecordingResults';
export const dynamic='force-dynamic';
export default async function SessionRecord({params}:{params:Promise<{id:string}>}){
 const user=await requireUser();if(!user)redirect('/routes/login');
 const {id}=await params;
 const session=await prisma.studySession.findFirst({where:{id,...sessionAccessWhere(user)},include:{materials:{select:materialSelect,orderBy:{createdAt:'asc'}},study:true,recordingParts:{where:{uploadedAt:{not:null}},orderBy:[{recordedAt:'asc'},{id:'asc'}]}}});
 if(!session)notFound();
 const transcript=session.recordingParts.map((part,i)=>part.transcript?`[녹음 ${i+1}]\n${part.transcript}`:'').filter(Boolean).join('\n\n');
 return <>{await Header()}<main className="mx-auto flex max-w-6xl flex-col gap-5 px-5 py-8"><div className="flex flex-wrap items-center justify-between gap-3"><h1 className="text-xl font-semibold">{session.study.name} · {session.weekNo===0?'리허설':`${session.weekNo}주차`} 세션 리포트</h1><Link href="/routes/home" className="btn">스터디 홈</Link></div>
  <RecordingResults id={id} parts={session.recordingParts.map(p=>({id:p.id,durationMs:p.durationMs}))} transcribed={session.recordingParts.filter(p=>p.transcript!==null).length} status={session.status} processingState={session.processingState} processingError={session.processingError} summary={session.summary} transcript={transcript} admin={user.roles.includes('admin')} processingAttempts={session.processingAttempts} hasReport={!!session.reportPath&&session.processingState==='ready'}/>
  <div className="flex flex-wrap gap-3"><MaterialLinks sessionId={id} materials={session.materials} deckPath={session.deckPath}/></div>
 </main></>;
}
