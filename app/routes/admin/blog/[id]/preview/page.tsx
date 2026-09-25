import type {Metadata} from 'next';
import {notFound} from 'next/navigation';
import {prisma} from '@/lib/prisma';
import type {BlogContent} from '@/lib/blog/content';
import {BlogShell} from '@/components/blog/BlogShell';
import {BlogArticle} from '@/components/blog/BlogArticle';
import styles from '@/components/blog/blog.module.css';
export const metadata:Metadata={title:'초안 미리보기',robots:{index:false,follow:false}};
export default async function Preview({params}:{params:Promise<{id:string}>}){
 const post=await prisma.blogPost.findUnique({where:{id:(await params).id}});if(!post)notFound();
 return <><div className={styles.preview}>운영진 미리보기 · 저장된 초안이며 공개 글에는 반영되지 않습니다.</div><BlogShell><main><BlogArticle content={post.draft as unknown as BlogContent}/></main></BlogShell></>;
}
