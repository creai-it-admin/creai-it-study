import Link from 'next/link';
import type {Metadata} from 'next';
import {prisma} from '@/lib/prisma';
import {SITE_URL,type BlogContent} from '@/lib/blog/content';
import {BlogShell} from '@/components/blog/BlogShell';
import styles from '@/components/blog/blog.module.css';
export const dynamic='force-dynamic';
export const metadata:Metadata={title:'Journal — CREAI+IT Edu',description:'AI의 변화를 이해하는 관점과 실제로 활용하며 얻은 경험. CREAI+IT의 기록을 읽어보세요.',alternates:{canonical:`${SITE_URL}/blog`},openGraph:{title:'CREAI+IT Journal',description:'AI를 이해하고, 활용하고, 함께 배우는 기록.',url:`${SITE_URL}/blog`,type:'website'}};
export default async function Blog({searchParams}:{searchParams:Promise<{page?:string}>}){
 const query=await searchParams;const requested=Math.max(1,Math.min(10000,Math.floor(Number(query.page)||1)));
 const where={publishedAt:{not:null}};
 const total=await prisma.blogPost.count({where}),pages=Math.max(1,Math.ceil(total/12)),page=Math.min(requested,pages);
 const posts=await prisma.blogPost.findMany({where,orderBy:[{publishedAt:'desc'},{id:'desc'}],skip:(page-1)*12,take:12,select:{id:true,slug:true,published:true,publishedAt:true}});
 return <BlogShell><main><section className={styles.hero}><span className={styles.eyebrow}>CREAI+IT / IDEAS & EXPERIENCE</span><h1>The Journal<span style={{color:'#098bb5'}}>.</span></h1><p>AI가 바꾸는 일과 삶.<br/>그 변화를 이해하고, 직접 써보며 배운 것들을 기록합니다.</p></section>
 <div className={styles.sectionTop}><span>모든 글</span><span>{total.toString().padStart(2,'0')} ARTICLES</span></div>
 {!posts.length?<div className={styles.empty}><h2>더 깊이 이해하고,<br/>더 멀리 활용하기 위해.</h2><p>CREAI+IT의 첫 번째 이야기를 준비하고 있습니다.<br/>기술을 바라보는 관점부터 실제로 일하는 방법까지,<br/>함께 나눌 기록들을 이곳에 쌓아갑니다.</p></div>:<div className={styles.grid}>{posts.map(post=>{const c=post.published as unknown as BlogContent;return <Link className={styles.card} href={`/blog/${post.slug}`} key={post.id}><div className={styles.art}>{c.coverUrl?<img src={c.coverUrl} alt={c.coverAlt} loading="lazy"/>:<div className={styles.fallback}><span>CREAI+IT<br/>Journal.</span><span aria-hidden="true">↗</span></div>}</div><div className={styles.meta}><span>{c.category}</span><time dateTime={post.publishedAt!.toISOString()}>{post.publishedAt!.toLocaleDateString('ko-KR',{timeZone:'Asia/Seoul'})}</time></div><h2>{c.title}</h2><p>{c.excerpt}</p></Link>})}</div>}
 {pages>1&&<nav className={styles.pagination} aria-label="글 목록 페이지">{page>1&&<Link href={`/blog?page=${page-1}`}>← 이전</Link>}<span>{page} / {pages}</span>{page<pages&&<Link href={`/blog?page=${page+1}`}>다음 →</Link>}</nav>}
 </main></BlogShell>
}
