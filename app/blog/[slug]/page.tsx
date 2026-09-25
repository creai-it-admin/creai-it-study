import type {Metadata} from 'next';
import {notFound} from 'next/navigation';
import {getPublishedPost} from '@/lib/blog/posts';
import {SITE_URL} from '@/lib/blog/content';
import {BlogShell} from '@/components/blog/BlogShell';
import {BlogArticle} from '@/components/blog/BlogArticle';
export const dynamic='force-dynamic';
type Props={params:Promise<{slug:string}>};
export async function generateMetadata({params}:Props):Promise<Metadata>{
 const post=await getPublishedPost((await params).slug);if(!post)return {title:'글을 찾을 수 없습니다',robots:{index:false}};
 const c=post.content,url=`${SITE_URL}/blog/${post.slug}`;
 return {title:`${c.title} — CREAI+IT Journal`,description:c.excerpt,alternates:{canonical:url},openGraph:{title:c.title,description:c.excerpt,type:'article',url,publishedTime:post.publishedAt!.toISOString(),modifiedTime:post.publishedUpdatedAt?.toISOString(),authors:[c.author],...(c.coverUrl?{images:[{url:new URL(c.coverUrl,SITE_URL).href,alt:c.coverAlt}]}:{})},twitter:{card:c.coverUrl?'summary_large_image':'summary',title:c.title,description:c.excerpt}};
}
export default async function Post({params}:Props){
 const post=await getPublishedPost((await params).slug);if(!post)notFound();const c=post.content;
 const data={'@context':'https://schema.org','@type':'BlogPosting',headline:c.title,description:c.excerpt,datePublished:post.publishedAt?.toISOString(),dateModified:post.publishedUpdatedAt?.toISOString(),author:{'@type':'Person',name:c.author},publisher:{'@type':'Organization',name:'CREAI+IT Edu'},mainEntityOfPage:`${SITE_URL}/blog/${post.slug}`,...(c.coverUrl?{image:new URL(c.coverUrl,SITE_URL).href}:{})};
 return <BlogShell><main><script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(data).replace(/</g,'\\u003c')}}/><BlogArticle content={c} date={post.publishedAt}/></main></BlogShell>
}
