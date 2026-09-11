import {MaterialLinks} from '@/components/MaterialLinks';
import {materialSelect} from '@/lib/materials';
import {studyAccessWhere,sessionVisibilityWhere} from '@/lib/study-access';
import Link from 'next/link';
import {requireUser} from '@/lib/auth';
import {redirect} from 'next/navigation';
import {Header} from '@/components/Header';
import {HomeWatcher} from './HomeWatcher';
import {LogoutButton} from '@/components/LogoutButton';
import {prisma} from '@/lib/prisma';
export const dynamic='force-dynamic';
export default async function HomePage(){
 const user=await requireUser();if(!user)redirect('/routes/login');
 const studies=await prisma.study.findMany({where:studyAccessWhere(user),orderBy:{createdAt:'desc'},include:{sessions:{where:sessionVisibilityWhere(user),orderBy:{weekNo:'asc'},select:{id:true,weekNo:true,status:true,date:true,deckPath:true,materials:{select:materialSelect,orderBy:{createdAt:'asc'}}}}}});
 return <>{await Header({right:<LogoutButton/>})}<main className="mx-auto flex max-w-5xl flex-col gap-6 px-5 py-8"><HomeWatcher/>
  <div className="flex flex-wrap gap-3"><Link className="btn" href="/routes/mine">지난 내 제출물</Link></div>
  {!studies.length&&<p className="card p-5 text-sm text-ink-2">아직 배정된 스터디가 없습니다. 운영진에게 배정을 요청해 주세요.</p>}
  {studies.map(study=><section className="card p-5" key={study.id}><h2 className="mb-4 font-semibold">{study.name}</h2><div className="flex flex-col">{study.sessions.map(s=><div className="flex flex-wrap items-center gap-3 border-b border-line py-3 last:border-0" key={s.id}><span className="text-sm font-medium">{s.weekNo===0?'리허설':`${s.weekNo}주차`} · {s.date.toLocaleDateString('ko-KR',{month:'numeric',day:'numeric',timeZone:'Asia/Seoul'})}</span><span className="text-xs text-ink-2">{s.status==='running'?'진행 중':s.status==='closed'?'종료':'예정'}</span><MaterialLinks sessionId={s.id} materials={s.materials} deckPath={s.deckPath}/>{s.status==='running'&&<Link className="btn" href="/routes/inclass">인클래스 작성</Link>}{s.status==='closed'&&<Link className="btn" href={`/routes/sessions/${s.id}`}>세션 리포트</Link>}</div>)}</div></section>)}
 </main></>;
}
