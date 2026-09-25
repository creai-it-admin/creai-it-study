import Link from 'next/link';
import styles from './blog.module.css';
export function BlogShell({children}:{children:React.ReactNode}){return <div className={styles.shell}><div className={styles.wrap}>
 <header className={styles.nav}><Link className={styles.brand} href="/">CREAI<span>+</span>IT <small>EDU</small></Link><nav className={styles.navLinks} aria-label="저널 메뉴"><Link href="/blog">저널</Link><Link href="/#curriculum">4주 교육</Link><Link href="/apply">참가 신청 ↗</Link></nav></header>
 {children}<footer className={styles.footer}><Link href="/blog">CREAI+IT JOURNAL</Link><span>Learn. Apply. Evolve.</span><Link href="/">CREAI+IT Edu ↗</Link></footer>
 </div></div>}
