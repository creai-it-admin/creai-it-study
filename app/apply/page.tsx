import type { Metadata } from 'next';
import Link from 'next/link';
import ApplicationForm from './ApplicationForm';
import styles from './apply.module.css';
export const metadata: Metadata = { title: '참가 신청 · CREAI+IT EDU', description: '시작 가능한 일정과 토요일·일요일 시간대를 알려 주세요. CREAI+IT EDU의 다음 코호트를 함께 구성합니다.' };
export const dynamic = 'force-dynamic';
export default function ApplyPage() {
  return <div className={styles.page}>
    <header className={styles.header}><Link href="/" className={styles.brand}>CREAI<span>+</span>IT <small>EDU</small></Link><Link href="/">교육 소개로 돌아가기 ↗</Link></header>
    <main className={styles.layout}>
      <div className={styles.intro}><p className={styles.eyebrow}>YOUR NEXT CHAPTER</p><h1>다음 코호트에<br/>함께하세요.</h1><p>AI 시대를 이끄는 힘,<br/>그 기반을 다지는 4주에 초대합니다.</p><div className={styles.guide}><strong>가능한 일정부터 알려 주세요.</strong><p>매주 토요일 또는 일요일, 정해진 요일과 시간에 2시간씩 진행합니다. 시작 가능일과 시간대가 맞는 분들을 모아 코호트를 구성합니다.</p><ol><li>참가 신청</li><li>일정·참가비 개별 안내</li><li>참여 확정</li></ol><small>신청만으로 결제나 참여가 확정되지 않습니다.<br/>남겨 주신 전화번호로 연락드릴 예정입니다.</small></div></div>
      <ApplicationForm />
    </main>
  </div>;
}
