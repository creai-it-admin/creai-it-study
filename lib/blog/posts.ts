import {cache} from 'react';
import {prisma} from '@/lib/prisma';
import type {BlogContent} from './content';
export const getPublishedPost=cache(async(slug:string)=>{
 const post=await prisma.blogPost.findUnique({where:{slug}});
 if(!post?.publishedAt||!post.published)return null;
 return {...post,content:post.published as unknown as BlogContent};
});
