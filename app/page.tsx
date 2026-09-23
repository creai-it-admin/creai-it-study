import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { StudyGuide } from '@/components/landing/StudyGuide';
import { ProjectExamples } from '@/components/landing/ProjectExamples';
import { LearningExchange, UnderstandingArt } from '@/components/landing/LearningExchange';
import './landing.css';

export const metadata: Metadata = {
  title: 'CREAI+IT Edu — AI 시대를 이끄는 사람들.',
  description: 'AI의 변화를 읽는 지식과 최신 AI를 활용하는 경험. 4주 교육으로 기반을 만들고, 소규모 커뮤니티에서 서로 배우며 계속 발전합니다.',
};

const curriculum = [
  { week: '01', title: '지금의 AI, 그리고 내가 쓸 수 있는 도구', question: '지금 무엇이 가능하고, 어디서 시작할까?', body: '현재 AI의 수준과 가능성을 짚고, Claude Code·Codex 같은 코딩 에이전트의 기본 사용과 주요 기능을 이해합니다.', detail: '파일과 실행 도구, 서브에이전트, 지침과 스킬, 외부 서비스 연결. 각 기능이 어떤 일을 가능하게 하는지 실제 예시로 살펴봅니다.' },
  { week: '02', title: 'AI와 함께 일하는 구조', question: '어떻게 내 업무를 맡기고, 함께 완성할까?', body: 'PRD로 목표와 완료 기준을 정하고, 사람과 AI의 역할·작업 순서·검토 지점을 설계합니다.', detail: '방향을 던지고, 함께 조정하고, 구체화해 맡긴 뒤 결과를 보며 수정합니다. 실제 작업 과정을 통해 이 루프가 어떻게 움직이는지 배웁니다.' },
  { week: '03', title: '더 어려운 일을 맡기며 배우는 법', question: '모델이 발전할 때, 나도 함께 발전하려면?', body: '도전적인 일을 맡긴 경험에서 가능성과 한계를 확인하고, 시행착오를 더 나은 활용 방식으로 바꿉니다.', detail: '어디서 실패했는지, 맥락이나 일의 구조를 어떻게 바꿔야 하는지 살펴봅니다. 새 모델과 기능을 만날 때 기존의 한계를 다시 확인하고, 얻은 교훈을 쌓아갑니다.' },
  { week: '04', title: 'AI 기술과 산업을 읽는 관점', question: '가치는 어디에서 생기고, 누가 영향력을 갖는가?', body: 'AI 밸류체인과 참여자별 협상력, 핵심 기술 개념을 이해하고 앞선 활용 경험을 더 넓은 맥락에 연결합니다.', detail: '반도체·인프라·모델·애플리케이션의 관계를 살펴봅니다. 기술의 특성이 비용과 경쟁에 어떻게 연결되는지 이해하며, 새로운 소식을 해석할 기준을 만듭니다.' },
];

function Brand() {
  return <><span className="brand-symbol" aria-hidden="true"><img src="/landing/creaiit-symbol.png" alt="" width="250" height="354" /></span>CREAI<span>+</span>IT<small>EDU</small></>;
}

export default function Landing() {
  return <div className="landing landing-renewed">
    <a href="#main" className="landing-skip">본문으로 바로가기</a>
    <header className="landing-nav">
      <Link href="/" className="landing-logo" aria-label="CREAI+IT Edu 홈"><Brand /></Link>
      <nav aria-label="주요 메뉴"><a href="#vision">우리가 지향하는 사람</a><a href="#curriculum">4주 교육</a><a href="#community">이후 커뮤니티</a></nav>
      <Link href="/routes" className="nav-enter">멤버 로그인 <span>↗</span></Link>
    </header>
    <main id="main">
      <section className="track-hero" aria-labelledby="hero-title">
        <div className="horizon-art" aria-hidden="true">
          <Image src="/landing/horizon.png" alt="" fill sizes="100vw" preload />
        </div>
        <div className="track-hero-inner landing-wrap">
          <div className="track-hero-copy">
            <p className="eyebrow">CREAI+IT EDU / LEARN. APPLY. EVOLVE.</p>
            <h1 id="hero-title">AI 시대를<br/><em>이끄는 사람들.</em></h1>
            <p className="track-hero-description">기술의 변화를 읽고, 최전선의 지능을 자신의 역량으로.<br/>함께 배우고 도전하며, 새로운 가능성을 만드는<br/>사람들로 성장합니다.</p>
            <Link href="/apply" className="landing-button accent">참가 신청하러 가기 <span>↗</span></Link>
            <p className="track-hero-caption">4주간의 교육, 그리고 계속 배우는 커뮤니티.</p>
          </div>
        </div>
        <div className="track-hero-bottom landing-wrap"><span>가능성을 넓히는 배움의 시작.</span><a href="#vision">SCROLL TO EXPLORE ↓</a></div>
      </section>

      <div className="journey-index landing-wrap" aria-label="스터디의 두 과정">
        <a href="#curriculum"><span>01 / FOUNDATION</span><strong>4주, 기반을 만들다.</strong><b aria-hidden="true">↘</b></a>
        <a href="#community"><span>02 / COMMUNITY</span><strong>그 이후, 함께 넓히다.</strong><b aria-hidden="true">↗</b></a>
      </div>

      <section id="vision" className="landing-wrap vision-section">
        <div className="section-heading"><div><span className="eyebrow">THE PERSON WE WANT TO BECOME</span><h2>깊이 이해하고.<br/><em>담대하게 활용하고.</em></h2></div><p>AI가 무엇을 바꾸는지 이해하고,<br/>그 힘으로 자신의 일과 조직에 변화를 만드는 사람.<br/>우리가 함께 성장해 나갈 방향입니다.</p></div>
        <UnderstandingArt />
        <div className="understanding-grid">
          <article><span className="understanding-number">01</span><h3>변화를 읽는 지식적 이해</h3><p>AI는 어떻게 작동하고, 산업은 어떻게 바뀌는가.<br/>새로운 소식의 의미를 해석하고 스스로 판단할 수 있는 지식의 기반을 만듭니다.</p><div className="understanding-topics">기술의 원리와 한계 · 밸류체인 · 협상력</div></article>
          <article><span className="understanding-number">02</span><h3>가능성을 넓히는 활용에 대한 이해</h3><p>계속 진화하는 최신 AI, frontier intelligence.<br/>그 힘을 내 일에 연결하는 도구와 방법을 배우고, 실제 경험을 통해 활용 범위를 넓힙니다.</p><div className="understanding-topics">도구의 이해 · 업무 설계 · 위임과 검토</div></article>
        </div>
        <p className="vision-connection"><span aria-hidden="true">+</span> 지식으로 활용을 판단하고, 경험으로 지식을 갱신합니다.</p>
      </section>

      <section id="curriculum" className="curriculum-section">
        <div className="landing-wrap curriculum-layout">
          <div className="curriculum-intro"><span className="eyebrow">01 / FOUNDATION EDUCATION</span><h2>AI 시대,<br/><em>압도적인 인재로.</em></h2><p className="foundation-ambition">그 도약의 기반을 다지는 4주.</p><p>기술의 변화를 읽는 깊이와 최전선의 AI를 자기 일에 연결하는 힘. 두 기반을 함께 세워, AI가 발전할수록 더 큰 일을 해내는 사람으로 성장하고자 합니다.</p><p className="foundation-bridge">AI를 이해하고, 더 큰 일을 맡기는 방법을 배웁니다. 마지막 2주에는 나만의 프로젝트를 진행하며, 튜터의 피드백을 받아 배운 방법을 실제 결과물로 연결합니다.</p><div className="curriculum-facts">4주 · 주 1회 · 회당 2시간 · 소규모 교육</div>
            <div className="curriculum-rhythm"><div><span><b>1–3주</b> 활용 중심</span><i aria-hidden="true"/><small>지식 20% · 활용 80%</small></div><div><span><b>4주</b> 기술·산업 이해 중심</span><i aria-hidden="true"/><small>지식 80% · 활용 20%</small></div></div>
          </div>
          <div className="curriculum-list">{curriculum.map(item => <article className="curriculum-row" key={item.week}>
            <div className="curriculum-week">W<span>{item.week}</span></div>
            <div><p className="curriculum-question">{item.question}</p><h3>{item.title}</h3><p className="curriculum-body">{item.body}</p><details><summary>다루는 내용 <span aria-hidden="true">＋</span></summary><p>{item.detail}</p></details></div>
          </article>)}</div>
        </div>
        <section className="landing-wrap foundation-project" aria-labelledby="project-title">
          <div className="project-heading"><div><span className="eyebrow">YOUR OWN PROJECT / WEEK 03–04</span><h3 id="project-title">혼자서는 엄두가 나지 않았던 일,<br/><em>이번에는 AI와 함께.</em></h3></div><p>직접 쓰고 싶은 서비스, 반복 업무를 줄이는 도구, 리서치를 돕는 시스템.<br/>각자의 목표에 맞춰 범위를 정하고, 튜터의 피드백으로 막힌 지점을 풀며 완성해갑니다.</p></div>
          <div className="project-timeline" aria-label="1주 도구 이해, 2주 업무 설계, 3주 활용 범위 확장, 4주 기술·산업 이해. 개인 프로젝트와 튜터링은 3–4주차에 병행합니다.">
            <ol>{['도구 이해', '업무 설계', '활용 범위 확장', '기술·산업 이해'].map((title, i) => <li key={title}><span>0{i+1} WEEK</span><strong>{title}</strong></li>)}</ol>
            <div className="project-span"><span>3–4주차 병행</span><strong>나만의 프로젝트 · 튜터링</strong></div>
          </div>
          <ol className="project-steps">
            <li><span>01</span><div><h4>주제와 범위 정하기</h4><p>내게 필요한 결과물과 완료 기준을 정하고, 2주 안에 시도할 범위로 조정합니다.</p></div></li>
            <li><span>02</span><div><h4>만들며 피드백 받기</h4><p>AI에게 맡겨보고, 막힌 결과와 지시를 함께 살피며 다음 시도를 바꿉니다.</p></div></li>
            <li><span>03</span><div><h4>결과와 배운 점 공유하기</h4><p>만든 것을 보여주고, 어디까지 맡겼고 어디서 직접 판단했는지 나눕니다.</p></div></li>
          </ol>
          <ProjectExamples />
          <div className="project-foot"><p>4주 교육 안에서 진행합니다. 주제는 배운 뒤 함께 구체화합니다.</p><Link href="/apply" className="text-link">내 프로젝트로 시작하기 ↗</Link></div>
        </section>
        <div className="landing-wrap foundation-result"><span>압도적인 성장의 출발점</span><p>변화를 읽는 지식.<br/>AI와 일을 완성하는 활용력.<br/><strong>스스로 한계를 넓혀가는 학습의 기준.</strong></p><a href="#community" aria-label="교육 이후의 커뮤니티 보기">↓</a></div>
      </section>

      <section id="community" className="community-section">
        <div className="landing-wrap">
          <div className="section-heading"><div><span className="eyebrow">02 / COMMUNITY</span><h2>나의 시도가,<br/><em>우리의 다음이 되다.</em></h2></div><p>교육이 끝나면, 서로의 경험으로 더 멀리.<br/>변화와 시행착오를 함께 해석하며<br/>배움을 이어가는 월 구독 커뮤니티.</p></div>
          <LearningExchange />
          <div className="community-format"><strong>주 1회 온라인 콜</strong><span>약 1시간</span><span>5–6인 소규모</span><span>진행자 1인</span></div>
          <div className="community-records"><span>배움이 이어지도록</span><p>주중의 경험 공유와 피드백, 중요한 변화를 짚는 브리핑,<br/>대화에서 얻은 판단과 질문을 남기는 기록으로 연결합니다.</p></div>
          <div className="contribution"><span aria-hidden="true">↗</span><div><h3>배우는 사람이, 누군가의 배움을 돕는 사람으로.</h3><p>먼저 익힌 방법과 시행착오를 나누고, 다른 구성원의 질문에 관점을 더합니다. 스터디에서 성장한 사람이 다시 스터디에 기여하며, 함께 배울 수 있는 경험이 쌓입니다.</p></div></div>
          <p className="community-planning">커뮤니티는 교육 이후의 운영 방향입니다. 시작 일정과 세부 참여 조건은 별도로 안내합니다.</p>
        </div>
      </section>

      <section id="join" className="landing-wrap track-join">
        <span className="eyebrow">YOUR NEXT STEP</span><h2>새로운 시대의 가능성,<br/>그 시작에 함께 서다.</h2>
        <p>4주 교육으로 시작하고, 커뮤니티에서 배움을 이어갑니다.<br/>참여 가능한 일정을 남겨 주세요. 일정이 맞는 분들과 코호트를 구성합니다.<br/>정확한 일정과 참가비 안내 후 참여를 확정합니다.</p>
        <div className="track-join-actions"><Link href="/apply" className="landing-button ink">참가 신청하러 가기 <span>↗</span></Link><Link href="/routes" className="text-link">이미 참여 중이라면, 내 스터디로 ↗</Link></div>
      </section>
    </main>
    <footer className="landing-footer landing-wrap"><a href="#main" className="landing-logo"><Brand /></a><p>Learn. Apply. Evolve. Together.</p><a href="#main">BACK TO TOP ↑</a></footer>
    <StudyGuide />
  </div>;
}
