import {requireAdmin} from '@/lib/auth';
import {prisma} from '@/lib/prisma';
import {confirmDeck,validOtPath} from '@/lib/storage';
export async function POST(req:Request,ctx:{params:Promise<{id:string}>}){
 if(!await requireAdmin())return Response.json({error:'forbidden'},{status:403});
 const {id}=await ctx.params;
 const {path}=(await req.json().catch(()=>null))??{};
 if(!validOtPath(path,id))return Response.json({error:'이 스터디의 OT 파일을 선택해 주세요.'},{status:400});
 if(!await prisma.study.findUnique({where:{id},select:{id:true}}))return Response.json({error:'스터디를 찾을 수 없습니다.'},{status:404});
 try{await confirmDeck(path);}catch(e){return Response.json({error:(e as Error).message},{status:400});}
 await prisma.study.update({where:{id},data:{otPath:path}});
 return Response.json({ok:true});
}
