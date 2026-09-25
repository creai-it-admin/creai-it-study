import Link from 'next/link';
import {cleanHtml,type BlogContent} from '@/lib/blog/content';
import styles from './blog.module.css';
export function BlogArticle({content,date}:{content:BlogContent;date?:Date|null}){return <article className={styles.article}>
 <header className={styles.articleHead}><Link href="/blog" className={styles.eyebrow}>← JOURNAL / {content.category}</Link><h1>{content.title}</h1><p className={styles.dek}>{content.excerpt}</p><div className={styles.meta}><span>{content.author}</span>{date&&<time dateTime={date.toISOString()}>{date.toLocaleDateString('ko-KR',{timeZone:'Asia/Seoul'})}</time>}</div></header>
 {content.coverUrl&&<img className={styles.cover} src={content.coverUrl} alt={content.coverAlt}/>}
 <div className={styles.body} dangerouslySetInnerHTML={{__html:cleanHtml(content.html)}}/>
 <aside className={styles.cta} aria-label="Foundation Education 안내"><div><span className={styles.ctaEyebrow}>CREAI+IT EDU · FOUNDATION</span><strong>읽은 것을, 나의 역량으로.</strong><p>AI를 이해하고 활용하는 기반을 만드는 4주간의 Foundation Education. 주{' '}1회{' '}2시간, 마지막 2주는 나만의 프로젝트와 튜터링을 병행합니다.</p></div><div className={styles.ctaActions}><Link className={styles.ctaPrimary} href="/apply">참가 신청하기 →</Link><Link className={styles.ctaSecondary} href="/#curriculum">4주 커리큘럼 보기</Link></div></aside>
 </article>}
