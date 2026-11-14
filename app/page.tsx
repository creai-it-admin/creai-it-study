import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { StudyGuide } from '@/components/landing/StudyGuide';
import { ProjectExamples } from '@/components/landing/ProjectExamples';
import { EnrollmentOffer } from '@/components/landing/EnrollmentOffer';
import { IntroFilm } from '@/components/landing/IntroFilm';
import { LearningExchange, UnderstandingArt } from '@/components/landing/LearningExchange';
import { getLatestPost } from '@/lib/blog/posts';
import './landing.css';

// 히어로의 최신 저널 글. 발행·비공개 전환 시 API가 즉시 갱신하고, 이 값은 안전망이다.
export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'CREAI+IT Edu — AI 시대를 이끄는 사람들.',
  description: 'AI의 변화를 읽는 지식과 최신 AI를 활용하는 경험. 4주 교육으로 기반을 만들고, 수료생 커뮤니티에서 서로 배우며 계속 발전합니다.',
};

const curriculum = [
  { week: '01', title: 'AI와 함께 일을 설계하기', question: '모든 일을 AI와 함께 한다면, 일은 어떻게 달라질까?', body: '모든 일을 AI 에이전트와 함께 한다는 전제로 일을 짭니다. Codex·Claude Code가 일하는 원리를 이해하고, 첫 주에 사이트를 직접 만들어 배포합니다.', detail: '맥락을 주는 법, 계산을 실행기에 맡기는 법, 외부 도구를 쓰게 하는 법을 개념으로 익힙니다. 기획·비교·세부 결정은 AI에게 맡기고, 사람은 중요한 방향을 판단합니다.' },
  { week: '02', title: '큰 일을 믿고 맡기기', question: '내가 계속 지시하지 않아도, 큰 일이 기준대로 굴러가려면?', body: '해야 할 일과 품질 기준을 먼저 정하고, 큰 일을 오래 맡겨도 결과가 흔들리지 않는 구조를 만듭니다.', detail: 'AI와 대화로 작업 구조를 합의하고, 첫 결과를 보며 조정한 뒤 반복 실행합니다. 다시 쓸 구조는 스킬로 만들어 다음 일에 그대로 씁니다.' },
  { week: '03', title: '할 수 있는 일의 범위 넓히기', question: '아직 시켜 보지 않은 어려운 일, 정말 안 될까?', body: '해 보지 않은 어려운 일을 담대하게 맡기고, 맥락 파악부터 AI에게 넘겨 봅니다. 영상·3D처럼 새로운 결과물에도 도전합니다.', detail: '모델이 무엇을 기준으로 좋아지는지 이해하고, 실패한 지점에서 맥락과 일의 구조를 어떻게 바꿀지 찾습니다. 새 모델이 나올 때마다 기존의 한계를 다시 확인합니다.' },
  { week: '04', title: '달라지는 세상 읽기', question: 'AI가 더 좋아지면, 사람들은 무엇을 다르게 할까?', body: '검색, 앱, 보험 같은 실제 사례로 사람들의 행동과 산업이 어떻게 바뀌는지 살피고, 당연하던 전제를 다시 묻습니다.', detail: '모델·인프라·서비스로 이어지는 밸류체인과 그 안의 협상력을 짚고, 쏟아지는 AI 소식 중 의미 있는 변화를 골라내는 기준을 만듭니다. 마지막에는 각자의 분야에 적용해 봅니다.' },
];

function Brand() {
  return <><span className="brand-symbol" aria-hidden="true"><img src="/landing/creaiit-symbol.png" alt="" width="250" height="354" /></span>CREAI<span>+</span>IT<small>EDU</small></>;
}

export default async function Landing() {
  const latest = await getLatestPost();
  return <div className="landing landing-renewed">
    <a href="#main" className="landing-skip">본문으로 바로가기</a>
    <header className="landing-nav">
      <Link href="/" className="landing-logo" aria-label="CREAI+IT Edu 홈"><Brand /></Link>
      <nav aria-label="주요 메뉴"><a href="#vision">우리가 지향하는 사람</a><a href="#curriculum">4주 교육</a><a href="#community">이후 커뮤니티</a><Link href="/blog">저널</Link></nav>
      <Link href="/routes" className="nav-enter">멤버 로그인 <span>↗</span></Link>
    </header>
    <main id="main">
      <section className="track-hero" aria-labelledby="hero-title">
        <div className="horizon-art" aria-hidden="true">
          <Image src="/landing/horizon.png" alt="" fill sizes="100vw" preload />
        </div>
        <div className="track-hero-inner landing-wrap">
          <div className="track-hero-copy">
            <Link href={latest ? `/blog/${latest.slug}` : '/blog'} className="hero-journal"><span className="hero-journal-tag">JOURNAL</span><span className="hero-journal-title">{latest?.title ?? 'CREAI+IT 저널 읽기'}</span><span className="hero-journal-arrow" aria-hidden="true">→</span></Link>
            <h1 id="hero-title">AI 시대를<br/><em>이끄는 사람들.</em></h1>
            <p className="track-hero-description">기술의 변화를 읽고, 최전선의 지능을 자신의 역량으로.<br/>함께 배우고 도전하며, 새로운 가능성을 만드는<br/>사람들로 성장합니다.</p>
            <EnrollmentOffer dark />
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

      <section id="film" className="landing-wrap film-section" aria-labelledby="film-title">
        <div className="section-heading"><div><span className="eyebrow">FOUNDATION FILM</span><h2 id="film-title">우리가 가는 길을,<br/><em>1분 안에.</em></h2></div><p>AI 시대를 이끄는 사람이 되기 위한 기반, 4주 Foundation 교육을 한 편에 담았습니다. 소리를 켜면 내레이션과 함께 볼 수 있어요.</p></div>
        <IntroFilm />
      </section>

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
          <div className="curriculum-intro"><span className="eyebrow">01 / FOUNDATION EDUCATION</span><h2>AI 시대,<br/><em>압도적인 인재로.</em></h2><p className="foundation-ambition">그 도약의 기반을 다지는 4주.</p><p>기술의 변화를 읽는 깊이와 최전선의 AI를 자기 일에 연결하는 힘. 두 기반을 함께 세워, AI가 발전할수록 더 큰 일을 해내는 사람으로 성장하고자 합니다.</p><p className="foundation-bridge">매 회차 1부에서는 그날의 개념과 산업 지식을 배우고, 2부에서는 실제 작업 시연을 본 뒤 직접 해 봅니다. 마지막 2주에는 나만의 프로젝트로 배운 방법을 실제 결과물로 연결합니다.</p><div className="curriculum-facts">4주 · 주 1회 · 회당 2시간 · 한 반 8명 이내</div>
            <div className="curriculum-rhythm"><div><span><b>1–3주</b> 활용 중심</span><i aria-hidden="true"/><small>지식 20% · 활용 80%</small></div><div><span><b>4주</b> 기술·산업 이해 중심</span><i aria-hidden="true"/><small>지식 80% · 활용 20%</small></div></div>
          </div>
          <div className="curriculum-list">{curriculum.map(item => <article className="curriculum-row" key={item.week}>
            <div className="curriculum-week">W<span>{item.week}</span></div>
            <div><p className="curriculum-question">{item.question}</p><h3>{item.title}</h3><p className="curriculum-body">{item.body}</p><details><summary>다루는 내용 <span aria-hidden="true">＋</span></summary><p>{item.detail}</p></details></div>
          </article>)}</div>
        </div>
        <section className="landing-wrap foundation-project" aria-labelledby="project-title">
          <div className="project-heading"><div><span className="eyebrow">YOUR OWN PROJECT / WEEK 03–04</span><h3 id="project-title">혼자서는 엄두가 나지 않았던 일,<br/><em>이번에는 AI와 함께.</em></h3></div><p>직접 쓰고 싶은 서비스, 반복 업무를 줄이는 도구, 리서치를 돕는 시스템.<br/>실제로 작동하고 포트폴리오로 쓸 수 있는 결과물을 목표로, 튜터의 피드백을 받으며 완성합니다.</p></div>
          <div className="project-timeline" aria-label="1주 AI와 함께 일을 설계하기, 2주 큰 일을 믿고 맡기기, 3주 할 수 있는 일의 범위 넓히기, 4주 달라지는 세상 읽기. 개인 프로젝트와 튜터링은 3–4주차에 수업과 함께 진행합니다.">
            <ol>{['일을 설계하기', '믿고 맡기기', '범위 넓히기', '세상 읽기'].map((title, i) => <li key={title}><span>0{i+1} WEEK</span><strong>{title}</strong></li>)}</ol>
            <div className="project-span"><span>3–4주차 수업과 함께</span><strong>나만의 프로젝트 · 튜터링</strong></div>
          </div>
          <ol className="project-steps">
            <li><span>01</span><div><h4>주제와 범위 정하기</h4><p>3주차까지 내게 필요한 결과물을 정하고, 2주 안에 끝낼 수 있는 범위로 줄입니다.</p></div></li>
            <li><span>02</span><div><h4>완성도 높이기</h4><p>작동하는 첫 버전을 만들고, 튜터의 피드백으로 막힌 지점을 풀며 다듬습니다. 1:1 멘토링이 필요하면 따로 신청할 수 있습니다.</p></div></li>
            <li><span>03</span><div><h4>공개하고 반응 받기</h4><p>4주차에는 만든 것을 실제로 알리고 사람들의 반응을 받아 봅니다. 해 본 적 없는 시도를 두 가지 이상 해 봅니다.</p></div></li>
          </ol>
          <ProjectExamples />
          <div className="project-foot"><p>4주 교육 안에서 진행합니다. 신청할 때 주제를 정할 필요는 없습니다.</p><Link href="/apply" className="text-link">내 프로젝트로 시작하기 ↗</Link></div>
        </section>
        <div className="landing-wrap foundation-result"><span>압도적인 성장의 출발점</span><p>변화를 읽는 지식.<br/>AI와 일을 완성하는 활용력.<br/><strong>스스로 한계를 넓혀가는 학습의 기준.</strong></p><a href="#community" aria-label="교육 이후의 커뮤니티 보기">↓</a></div>
      </section>

      <section id="community" className="community-section">
        <div className="landing-wrap">
          <div className="section-heading"><div><span className="eyebrow">02 / COMMUNITY</span><h2>나의 시도가,<br/><em>우리의 다음이 되다.</em></h2></div><p>교육이 끝나면, 서로의 경험으로 더 멀리.<br/>변화와 시행착오를 함께 해석하며<br/>배움을 이어가는 수료생 커뮤니티.</p></div>
          <LearningExchange />
          <div className="community-format"><strong>수료생 대화방</strong><span>별도 비용 없음</span><span>AI 소식·자료 공유</span><span>모임·행사</span></div>
          <div className="community-records"><span>배움이 이어지도록</span><p>수료하면 기수와 상관없이 같은 대화방에서 만납니다.<br/>의미 있는 AI 소식은 자료로 정리해 나누고, 수료생이 늘어나면 강의와 밋업을 엽니다.</p></div>
          <div className="contribution"><span aria-hidden="true">↗</span><div><h3>배우는 사람이, 누군가의 배움을 돕는 사람으로.</h3><p>먼저 익힌 방법과 시행착오를 나누고, 다른 구성원의 질문에 관점을 더합니다. 스터디에서 성장한 사람이 다시 스터디에 기여하며, 함께 배울 수 있는 경험이 쌓입니다.</p></div></div>
          <p className="community-planning">모임과 행사의 구체적인 일정은 대화방에서 안내합니다.</p>
        </div>
      </section>

      <section id="join" className="landing-wrap track-join">
        <span className="eyebrow">YOUR NEXT STEP</span><h2>새로운 시대의 가능성,<br/>그 시작에 함께 서다.</h2>
        <p>4주 교육으로 시작하고, 커뮤니티에서 배움을 이어갑니다.<br/>참여 가능한 일정을 남겨 주세요. 일정이 맞는 분들과 코호트를 구성합니다.<br/>정확한 일정과 장소 안내 후 참여를 확정합니다.</p>
        <div className="track-join-actions"><Link href="/apply" className="landing-button ink">참가 신청하러 가기 <span>↗</span></Link><Link href="/routes" className="text-link">이미 참여 중이라면, 내 스터디로 ↗</Link></div>
      </section>
    </main>
    <footer className="landing-footer landing-wrap"><a href="#main" className="landing-logo"><Brand /></a><p>Learn. Apply. Evolve. Together.</p><Link href="/blog">저널 읽기 ↗</Link><a href="#main">BACK TO TOP ↑</a></footer>
    <StudyGuide />
  </div>;
}
