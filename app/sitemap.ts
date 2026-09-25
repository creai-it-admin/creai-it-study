import type {MetadataRoute} from 'next';
import {prisma} from '@/lib/prisma';
import {SITE_URL} from '@/lib/blog/content';
export const dynamic='force-dynamic';
export default async function sitemap():Promise<MetadataRoute.Sitemap>{
 const posts=await prisma.blogPost.findMany({where:{publishedAt:{not:null}},select:{slug:true,publishedUpdatedAt:true}});
 return [{url:SITE_URL},{url:`${SITE_URL}/apply`},{url:`${SITE_URL}/blog`},...posts.map(p=>({url:`${SITE_URL}/blog/${p.slug}`,lastModified:p.publishedUpdatedAt||undefined}))];
}
