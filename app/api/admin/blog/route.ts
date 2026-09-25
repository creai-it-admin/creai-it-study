import {NextResponse} from 'next/server';
import {revalidatePath} from 'next/cache';
import {Prisma} from '@prisma/client';
import {requireAdmin} from '@/lib/auth';
import {prisma} from '@/lib/prisma';
import {parseContent,parseSlug,validatePublication} from '@/lib/blog/content';
export async function POST(request:Request){
 if(!await requireAdmin())return NextResponse.json({error:'운영진만 이용할 수 있습니다.'},{status:403});
 if(request.headers.get('origin')!==new URL(request.url).origin||!request.headers.get('content-type')?.startsWith('application/json'))return NextResponse.json({error:'허용되지 않는 요청입니다.'},{status:403});
 try{
  const raw=await request.text();
  if(Buffer.byteLength(raw)>300000)return NextResponse.json({error:'글 크기는 300KB 이하로 올려 주세요.'},{status:413});
  const input=JSON.parse(raw);
  if(!['save','publish','unpublish'].includes(input.action))throw Error('요청을 확인해 주세요.');
  const slug=parseSlug(input.slug),content=parseContent(input.content);
  if(input.action==='publish')validatePublication(content);
  const post=await prisma.$transaction(async tx=>{
   const old=input.id?await tx.blogPost.findUnique({where:{id:String(input.id)}}):null;
   if(input.id&&!old)throw Error('글을 찾을 수 없습니다.');
   if(old?.publishedUpdatedAt&&old.slug!==slug)throw Error('한 번 발행한 글의 주소는 변경할 수 없습니다.');
   const now=new Date();
   const data={slug,draft:content as unknown as Prisma.InputJsonValue,
    ...(input.action==='publish'?{published:content as unknown as Prisma.InputJsonValue,publishedAt:old?.publishedAt||now,publishedUpdatedAt:now}:{}),
    ...(input.action==='unpublish'?{publishedAt:null,published:Prisma.DbNull}:{}),updatedAt:now};
   if(!old)return tx.blogPost.create({data});
   const result=await tx.blogPost.updateMany({where:{id:old.id,updatedAt:new Date(input.updatedAt)},data});
   if(!result.count)throw Error('다른 창에서 수정된 글입니다. 새로고침 후 다시 확인해 주세요.');
   return tx.blogPost.findUniqueOrThrow({where:{id:old.id}});
  });
  if(input.action!=='save')revalidatePath('/'); // 랜딩 히어로의 최신 글
  return NextResponse.json({id:post.id,updatedAt:post.updatedAt,publishedAt:post.publishedAt,publishedUpdatedAt:post.publishedUpdatedAt});
 }catch(error){
  if(error instanceof Prisma.PrismaClientKnownRequestError&&error.code==='P2002')return NextResponse.json({error:'이미 사용 중인 글 주소입니다.'},{status:409});
  if(error instanceof Prisma.PrismaClientKnownRequestError||error instanceof Prisma.PrismaClientValidationError){console.error('Blog save failed',error.name);return NextResponse.json({error:'저장하지 못했습니다. 다시 시도해 주세요.'},{status:500});}
  return NextResponse.json({error:error instanceof Error?error.message:'입력 내용을 확인해 주세요.'},{status:400});
 }
}
