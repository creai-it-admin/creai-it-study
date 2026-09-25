import {cache} from 'react';
import {prisma} from '@/lib/prisma';
import type {BlogContent} from './content';
export const getPublishedPost=cache(async(slug:string)=>{
 const post=await prisma.blogPost.findUnique({where:{slug}});
 if(!post?.publishedAt||!post.published)return null;
 return {...post,content:post.published as unknown as BlogContent};
});
// 랜딩 히어로의 저널 진입점용. DB 장애가 랜딩 렌더링을 막지 않도록 실패 시 null.
export async function getLatestPost(){
 try{
  const post=await prisma.blogPost.findFirst({where:{publishedAt:{not:null}},orderBy:[{publishedAt:'desc'},{id:'desc'}],select:{slug:true,published:true}});
  const title=(post?.published as unknown as BlogContent|null)?.title;
  return post&&title?{slug:post.slug,title}:null;
 }catch{return null;}
}
