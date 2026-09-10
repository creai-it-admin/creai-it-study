import {sessionAccessWhere} from '@/lib/study-access';
import {requireUser} from '@/lib/auth';
import {prisma} from '@/lib/prisma';
import {downloadMedia,DECK_CSP,validDeckPath} from '@/lib/storage';
export async function GET(_req:Request,ctx:{params:Promise<{id:string}>}){
 const user=await requireUser();if(!user)return new Response('로그인이 필요합니다.',{status:401});
 const {id}=await ctx.params;
 const session=await prisma.studySession.findFirst({where:{id,...sessionAccessWhere(user)},select:{deckPath:true}});
 if(!session?.deckPath||!validDeckPath(session.deckPath,id))return new Response('HTML 장표가 없습니다.',{status:404});
 try{
  const html=await downloadMedia(session.deckPath);
  return new Response(html.stream(),{headers:{'Content-Type':'text/html; charset=utf-8','Content-Security-Policy':DECK_CSP,'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','Permissions-Policy':'camera=(), microphone=(), geolocation=()'}});
 }catch{return new Response('장표를 불러오지 못했습니다.',{status:502});}
}
