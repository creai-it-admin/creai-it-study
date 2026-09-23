import {requireAdmin} from '@/lib/auth';
import {prisma} from '@/lib/prisma';
import {DECK_CSP,downloadMedia,validDeckPath} from '@/lib/storage';
export async function GET(_req:Request,{params}:{params:Promise<{id:string}>}){
 if(!await requireAdmin())return new Response('forbidden',{status:403});
 const {id}=await params;
 const v=await prisma.libraryVersion.findUnique({where:{id}});
 if(!v||!validDeckPath(v.path,`library/${v.assetId}`))return new Response('not found',{status:404});
 try{const html=await downloadMedia(v.path);return new Response(html.stream(),{headers:{'Content-Type':'text/html; charset=utf-8','Content-Security-Policy':DECK_CSP,'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'}});}catch{return new Response('자료를 읽지 못했습니다.',{status:502});}
}
