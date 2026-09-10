import {requireUser} from '@/lib/auth';
import {sessionAccessWhere} from '@/lib/study-access';
import {prisma} from '@/lib/prisma';
import {downloadMedia,reportStoragePath} from '@/lib/storage';
export async function GET(_req:Request,ctx:{params:Promise<{id:string}>}){
 const user=await requireUser();if(!user)return new Response('로그인이 필요합니다.',{status:401});
 const {id}=await ctx.params;
 const session=await prisma.studySession.findFirst({where:{id,status:'closed',processingState:'ready',...sessionAccessWhere(user)},select:{reportPath:true}});
 if(!session?.reportPath||session.reportPath!==reportStoragePath(id))return new Response('리포트가 없습니다.',{status:404});
 try{
  const html=await downloadMedia(session.reportPath);
  return new Response(html.stream(),{headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'private, no-store','Content-Security-Policy':"default-src 'none'; style-src 'unsafe-inline'; frame-ancestors 'self'; base-uri 'none'; form-action 'none'; sandbox",'X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'}});
 }catch{return new Response('리포트를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.',{status:502});}
}
