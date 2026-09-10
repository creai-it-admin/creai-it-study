import {sessionAccessWhere} from '@/lib/study-access';
import {requireUser} from '@/lib/auth';
import {redirect} from 'next/navigation';
import {Header} from '@/components/Header';
import {getRunningSession} from '@/lib/session-state';
import {prisma} from '@/lib/prisma';
import {DeckViewer} from './DeckViewer';
import {DeckFrame} from './DeckFrame';
export const dynamic='force-dynamic';
export default async function DeckPage({searchParams}:{searchParams:Promise<{session?:string}>}){
 const user=await requireUser();if(!user)redirect('/login');
 const {session:id}=await searchParams;
 const session=id?await prisma.studySession.findFirst({where:{id,...sessionAccessWhere(user)}}):await getRunningSession(user);
 return <>{await Header()}<main className="mx-auto max-w-7xl px-5 py-6"><DeckFrame>
  {session?.deckPath?<DeckViewer sessionId={session.id}/>:<div className="card p-10 text-center text-sm text-ink-2">{session?.deckUrl?'이 회차에는 기존 PDF가 있습니다. 운영진이 HTML 장표를 업로드하면 여기에서 볼 수 있습니다.':'올라온 HTML 장표가 없습니다.'}</div>}
 </DeckFrame></main></>;
}
