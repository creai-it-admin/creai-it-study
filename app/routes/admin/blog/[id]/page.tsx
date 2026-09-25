import {notFound} from 'next/navigation';
import {prisma} from '@/lib/prisma';
import {BlogEditor} from '@/components/blog/BlogEditor';
import type {BlogContent} from '@/lib/blog/content';
export default async function EditBlog({params}:{params:Promise<{id:string}>}){
 const post=await prisma.blogPost.findUnique({where:{id:(await params).id}});if(!post)notFound();
 return <BlogEditor initial={{id:post.id,slug:post.slug,draft:post.draft as unknown as BlogContent,updatedAt:post.updatedAt.toISOString(),publishedAt:post.publishedAt?.toISOString()||null,publishedUpdatedAt:post.publishedUpdatedAt?.toISOString()||null}}/>;
}
