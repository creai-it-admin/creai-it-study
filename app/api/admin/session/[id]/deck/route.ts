import {NextResponse} from 'next/server';
import {requireAdmin} from '@/lib/auth';
import {prisma} from '@/lib/prisma';
import {confirmDeck,validDeckPath} from '@/lib/storage';
export const dynamic='force-dynamic';
export async function POST(req:Request,ctx:{params:Promise<{id:string}>}){
 if(!await requireAdmin())return NextResponse.json({error:'forbidden'},{status:403});
 const {id}=await ctx.params;
 const body=await req.json().catch(()=>null);
 const {path,kind='education',title='교육 장표',materialId}=body??{};
 if(!validDeckPath(path,id)||!['education','presentation'].includes(kind)||typeof title!=='string'||!title.trim()||title.trim().length>120||(materialId!==undefined&&typeof materialId!=='string'))return NextResponse.json({error:'자료 종류, 제목과 파일을 확인해 주세요.'},{status:400});
 const session=await prisma.studySession.findUnique({where:{id},select:{deckPath:true}});
 if(!session)return NextResponse.json({error:'회차를 찾을 수 없습니다.'},{status:404});
 const existing=materialId?await prisma.sessionMaterial.findFirst({where:{id:materialId,sessionId:id,kind}}):null;
 if(materialId&&!existing)return NextResponse.json({error:'교체할 자료를 찾을 수 없습니다.'},{status:404});
 try{await confirmDeck(path);}catch(e){return NextResponse.json({error:(e as Error).message},{status:400});}
 try{
  const material=await prisma.$transaction(async tx=>{
   const saved=existing?await tx.sessionMaterial.update({where:{id:existing.id},data:{path,title:title.trim()}}):await tx.sessionMaterial.upsert({where:{path},create:{sessionId:id,kind,title:title.trim(),path},update:{}});
   // Keep legacy education links working during rolling deployments.
   if(kind==='education'&&(!session.deckPath||existing?.path===session.deckPath))await tx.studySession.update({where:{id},data:{deckPath:path,deckUrl:null}});
   return saved;
  });
  return NextResponse.json({ok:true,material:{id:material.id,kind:material.kind,title:material.title}});
 }catch{return NextResponse.json({error:'자료를 저장하지 못했습니다. 다시 시도해 주세요.'},{status:500});}
}
