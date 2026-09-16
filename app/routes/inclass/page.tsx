import {requireUser} from '@/lib/auth';
import {redirect} from 'next/navigation';
import {getRunningSession} from '@/lib/session-state';
export const dynamic='force-dynamic';
export default async function InclassPage(){const user=await requireUser();if(!user)redirect('/routes/login');const s=await getRunningSession(user);redirect(s?`/routes/sessions/${s.id}/activity`:'/routes/home')}
