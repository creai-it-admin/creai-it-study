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
      <div className={styles.intro}><p className={styles.eyebrow}>YOUR NEXT CHAPTER</p><h1>다음 코호트에<br/>함께하세요.</h1><p>AI 시대를 이끄는 힘,<br/>그 기반을 다지는 4주에 초대합니다.</p><section className={styles.education} aria-labelledby="education-summary"><span className={styles.educationLabel}>FOUNDATION EDUCATION</span><h2 id="education-summary">4주 교육,<br/>마지막 2주는 내 프로젝트와 함께.</h2><p>배운 내용을 자신의 프로젝트에 적용하고, 튜터의 피드백을 받으며 실제 결과물로 연결합니다.</p><details className={styles.educationDetails}><summary>무엇을 배우고 만들어보나요?<span aria-hidden="true">＋</span></summary><div className={styles.educationContent}><h3>4주의 흐름</h3><ol className={styles.weekList}>{[
        ['1주', '도구 이해', '지금 AI가 할 수 있는 일과 Codex·Claude Code의 주요 기능을 익힙니다.'],
        ['2주', '업무 설계', '목표·완료 기준·검토 지점을 정하고, 큰 일을 AI와 함께 수행하는 구조를 배웁니다.'],
        ['3주', '활용 범위 확장', '어려운 일을 맡기고 실패에서 배우며, 새로운 가능성을 발견합니다.'],
        ['4주', '기술·산업 이해', '핵심 개념과 밸류체인·협상력을 통해 AI의 변화를 해석합니다.'],
      ].map(([week,title,body]) => <li key={week}><span>{week}</span><div><strong>{title}</strong><p>{body}</p></div></li>)}</ol><div className={styles.projectDetail}><h3>3–4주차 · 나만의 프로젝트</h3><p>직접 쓸 서비스, 반복 업무를 줄이는 도구, 리서치를 돕는 시스템 등 자신에게 필요한 프로젝트를 진행합니다.</p><p><strong>주제·범위 정하기 → 만들며 피드백 받기 → 결과와 배운 점 공유하기</strong></p><p>튜터는 과업의 범위를 조정하고, 막힌 원인을 함께 살피며, 다음 지시와 검토 방법을 구체화하도록 돕습니다.</p><small>4주 교육 중 병행합니다. 신청할 때 프로젝트 주제를 정할 필요는 없습니다.</small></div></div></details></section><div className={styles.guide}><strong>가능한 일정부터 알려 주세요.</strong><p>매주 토요일 또는 일요일, 정해진 요일과 시간에 2시간씩 진행합니다. 시작 가능일과 시간대가 맞는 분들을 모아 코호트를 구성합니다.</p><ol><li>참가 신청</li><li>일정·참가비 개별 안내</li><li>참여 확정</li></ol><small>신청만으로 결제나 참여가 확정되지 않습니다.<br/>남겨 주신 전화번호로 연락드릴 예정입니다.</small></div></div>
      <ApplicationForm />
    </main>
  </div>;
}
