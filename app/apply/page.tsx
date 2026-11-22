import type { Metadata } from 'next';
import Link from 'next/link';
import { ProjectExamples } from '@/components/landing/ProjectExamples';
import { EnrollmentOffer } from '@/components/landing/EnrollmentOffer';
import ApplicationForm from './ApplicationForm';
import ApplyIntroFilm from './ApplyIntroFilm';
import styles from './apply.module.css';
// 링크 미리보기 카드. 원본은 docs/education/referral/og-apply.html, render_og.py로 다시 만든다.
// og 태그가 없으면 카카오톡 같은 스크래퍼가 본문 첫 이미지(프로젝트 예시의 유튜브 화면)를 집어 간다.
const shareTitle = '여울 · CREAI+IT AI 스터디 2기 모집';
const shareDescription = 'AI 시대에 필요한 기초를 4주 동안 함께 쌓습니다. 한 반 8명 이내로 꾸리니, 가능한 날짜와 시간대를 남겨 주세요.';
const shareImage = { url: '/og/yeoul-apply.png', width: 1200, height: 630, alt: '여울 CREAI+IT AI 스터디 2기 참가자 모집 안내' };
export const metadata: Metadata = {
  metadataBase: new URL('https://study.creai-it.com'),
  title: '참가 신청 · CREAI+IT EDU',
  description: '시작 가능한 일정과 토요일·일요일 시간대를 알려 주세요. CREAI+IT EDU의 다음 코호트를 함께 구성합니다.',
  openGraph: { type: 'website', url: '/apply', siteName: 'CREAI+IT EDU', locale: 'ko_KR', title: shareTitle, description: shareDescription, images: [shareImage] },
  twitter: { card: 'summary_large_image', title: shareTitle, description: shareDescription, images: [shareImage] },
};
export const dynamic = 'force-dynamic';

const weeks = [
  ['1주', 'AI와 함께 일을 설계하기', '모든 일을 AI 에이전트와 함께 한다는 전제로 일을 짭니다. 첫 주부터 사이트 만들기 같은 일을 직접 해 봅니다.'],
  ['2주', '큰 일을 믿고 맡기기', '내가 매번 지시하지 않아도 큰 일이 기준에 맞게 이어지도록 반복 구조와 스킬을 만듭니다.'],
  ['3주', '할 수 있는 일의 범위 넓히기', '해 보지 않은 어려운 일을 맡겨 보며 영상·3D처럼 새로운 결과물까지 시도합니다.'],
  ['4주', '달라지는 세상 읽기', 'AI로 사람들의 행동과 산업이 어떻게 바뀌는지 사례로 살피고, 당연하던 전제를 다시 묻습니다.'],
] as const;

export default function ApplyPage() {
  return <div className={styles.page}>
    <header className={styles.header}><Link href="/" className={styles.brand}>CREAI<span>+</span>IT <small>EDU</small></Link><Link href="/">교육 소개로 돌아가기 ↗</Link></header>
    <main className={styles.layout}>
      <div className={styles.intro}>
        <p className={styles.eyebrow}>YOUR NEXT CHAPTER</p>
        <h1>다음 코호트에<br/>함께하세요.</h1>
        <p>AI 시대를 이끄는 힘,<br/>그 기반을 다지는 4주에 초대합니다.</p>
        <EnrollmentOffer />
        <dl className={styles.facts}>
          <div><dt>일정</dt><dd>4주 · 주 1회 2시간<br/>토요일 또는 일요일</dd></div>
          <div><dt>인원</dt><dd>한 반 8명 이내</dd></div>
          <div><dt>장소</dt><dd>일정과 함께 안내</dd></div>
          <div><dt>수료 후</dt><dd>CREAI+IT 커뮤니티 멤버로<br/>모임·행사·프로젝트 참여</dd></div>
        </dl>
        <div className={styles.guide}>
          <strong>가능한 일정부터 알려 주세요.</strong>
          <p>시작 가능일과 시간대가 맞는 분들을 모아 코호트를 구성합니다.</p>
          <ol><li>참가 신청</li><li>일정·장소·결제 방법 안내</li><li>참여 확정</li></ol>
          <small>신청만으로 결제나 참여가 확정되지 않습니다.<br/>남겨 주신 전화번호로 연락드릴 예정입니다.</small>
        </div>
      </div>
      <ApplicationForm />
      <div className={styles.more}>
        <ApplyIntroFilm />
        <a className={styles.otLink} href="/apply/ot" target="_blank" rel="noopener noreferrer"><span><strong>OT 자료 보기 <span aria-hidden="true">↗</span></strong><small>교육 방향 · 4주 커리큘럼 · 개인 프로젝트</small></span><span className={styles.otMeta}>8장 · 새 탭</span></a>
        <section className={styles.education} aria-labelledby="education-summary">
          <span className={styles.educationLabel}>FOUNDATION EDUCATION</span>
          <h2 id="education-summary">4주 교육,<br/>마지막 2주는 내 프로젝트와 함께.</h2>
          <p>매 회차 1부에서는 그날의 개념과 산업 지식을 배우고, 2부에서는 실제 작업 시연을 본 뒤 직접 해 봅니다.</p>
          <details className={styles.educationDetails}>
            <summary>무엇을 배우고 만들어보나요?<span aria-hidden="true">＋</span></summary>
            <div className={styles.educationContent}>
              <h3>4주의 흐름</h3>
              <ol className={styles.weekList}>{weeks.map(([week, title, body]) => <li key={week}><span>{week}</span><div><strong>{title}</strong><p>{body}</p></div></li>)}</ol>
              <div className={styles.projectDetail}>
                <h3>3–4주차 · 나만의 프로젝트</h3>
                <p>수업과 함께 개인 프로젝트 하나를 2주 동안 진행합니다. 결과물은 실제로 작동하는 서비스나 도구이고, 포트폴리오로 쓸 수 있는 수준을 목표로 합니다.</p>
                <p><strong>3주차에 주제를 정하고 완성도를 높이기 → 4주차에 공개하고 반응 받기</strong></p>
                <p>과제마다 튜터의 피드백을 받고, 1:1 멘토링이 필요하면 따로 신청할 수 있습니다.</p>
                <small>신청할 때 프로젝트 주제를 정할 필요는 없습니다.</small>
              </div>
              <ProjectExamples compact />
            </div>
          </details>
        </section>
      </div>
    </main>
  </div>;
}
