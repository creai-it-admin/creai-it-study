import {requireUser} from '@/lib/auth';
import {prisma} from '@/lib/prisma';
import {studyAccessWhere} from '@/lib/study-access';
import {downloadMedia,DECK_CSP,validOtPath} from '@/lib/storage';
export async function GET(_req:Request,ctx:{params:Promise<{id:string}>}){
 const user=await requireUser();if(!user)return new Response('로그인이 필요합니다.',{status:401});
 const {id}=await ctx.params;
 const study=await prisma.study.findFirst({where:{id,...studyAccessWhere(user)},select:{otPath:true}});
 if(!study?.otPath||!validOtPath(study.otPath,id))return new Response('OT 자료가 없습니다.',{status:404});
 try{
  const html=await downloadMedia(study.otPath);
  return new Response(html.stream(),{headers:{'Content-Type':'text/html; charset=utf-8','Content-Security-Policy':DECK_CSP,'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','Permissions-Policy':'camera=(), microphone=(), geolocation=()'}});
 }catch{return new Response('OT 자료를 불러오지 못했습니다.',{status:502});}
}
