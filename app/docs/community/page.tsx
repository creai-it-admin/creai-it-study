import type { Metadata } from "next";
import Link from "next/link";
import styles from "../docs.module.css";

export const metadata: Metadata = {
  title: "커뮤니티 운영안 · CREAI+IT Docsboard",
  description: "4주 교육 이후 지식적 이해와 활용에 대한 이해를 계속 갱신하는 월 구독 커뮤니티 운영 초안",
  robots: { index: false, follow: false },
};

export default function CommunityDocument() {
  return (
    <div className={styles.board}>
      <a href="#purpose" className={styles.skip}>본문으로 이동</a>
      <header className={`chrome ${styles.header}`}>
        <Link href="/docs" className={styles.brand}>CREAI<span>+</span>IT <small>Docsboard</small></Link>
        <Link href="/docs#community">상위 문서로 돌아가기 ↗</Link>
      </header>
      <div className={styles.layout}>
        <aside className={styles.sidebar}>
          <p className={styles.eyebrow}>COMMUNITY / OPERATING DRAFT</p>
          <nav aria-label="문서 목차">
            <a href="#purpose">01 · 목적과 운영 원리</a>
            <a href="#weekly">02 · 주간 운영</a>
            <a href="#records">03 · 기록과 월간 회고</a>
            <a href="#open">04 · 남은 결정</a>
          </nav>
          <div className={styles.documentMeta}><strong>커뮤니티 운영안 v0.1</strong><br/>작성일 · 2026.09.20<br/>상태 · 세부 운영 논의 초안</div>
        </aside>
        <main className={styles.main}>
          <section id="purpose" className={styles.section}>
            <div className={styles.meta}><span className={styles.draft}>논의 초안</span><span>COMMUNITY 001</span></div>
            <h1>매주 경험을 나누고,<br/>이해와 활용을 계속 갱신한다.</h1>
            <p className={styles.lead}>4주 교육에서 만든 기반을 실제 일과 새로운 변화 속에서 발전시킨다. 매달 참여할 이유는 자신의 판단과 AI 활용이 계속 달라지는 경험에 있다.</p>
            <div className={styles.communityGrid}>
              <div><h2>지식적 이해의 갱신</h2><p>새 기술·모델·산업 변화 중 무엇이 중요하고, 기존 생각을 어떻게 바꿔야 하는지 함께 해석한다.</p></div>
              <div><h2>활용에 대한 이해의 갱신</h2><p>서로의 실제 경험을 통해 무엇을 더 맡길 수 있고, 어떻게 일하며 어디서 개입해야 하는지 배운다.</p></div>
            </div>
            <ol className={styles.loop}>
              <li><strong>가능성을 접한다</strong><span>새 변화와 다른 사람의 활용 경험을 본다.</span></li>
              <li><strong>자기 일에서 시도한다</strong><span>자신에게 의미 있는 일을 맡겨본다.</span></li>
              <li><strong>함께 해석한다</strong><span>결과와 개입 과정을 구체적으로 검토한다.</span></li>
              <li><strong>다음 시도를 바꾼다</strong><span>배운 것을 판단과 활용 방식에 반영한다.</span></li>
            </ol>
            <p className={styles.note}>월 단위 유료 운영과 주 1회·약 1시간 온라인 콜이 운영 골격이다. 콜은 5–6인 소규모로 진행하며, 진행자는 1인이다. 아래의 시간 배분, 공유 방식과 회고 형식은 확정 전 운영안이다.</p>
          </section>

          <section id="weekly" className={styles.section}>
            <p className={styles.eyebrow}>01 / WEEKLY RHYTHM</p>
            <h2>주중의 경험이, 주간 논의의 재료가 된다.</h2>
            <article className={styles.material}><span>주중 · 커뮤니티 채널</span><h3>시도한 일과 막힌 지점을 짧게 공유한다.</h3><p>구성원이 자신의 일에서 얻은 결과와 질문을 남기고, 서로 댓글을 달며 경험을 연결한다. 모든 사람에게 같은 과업을 요구하기보다 각자의 적용 맥락을 살린다.</p></article>
            <article className={`card ${styles.week}`}>
              <h3>주 1회 온라인 콜 · 60분 기본안</h3>
              <p><strong>5–6인 소규모 콜 · 진행자 1인</strong></p>
              <dl>
                <div><dt>15분</dt><dd><strong>변화 해설.</strong> 중요한 기술·산업 변화 하나를 골라, 무엇이 달라졌고 왜 중요한지 해석한다.</dd></div>
                <div><dt>30분</dt><dd><strong>실제 사례 논의.</strong> 구성원 사례 1~2개의 목표, 결과, 실패와 개입 지점을 깊게 살펴본다.</dd></div>
                <div><dt>15분</dt><dd><strong>적용 방향 정리.</strong> 각자의 판단에서 바뀐 점과 다음에 시도할 방향을 정리한다.</dd></div>
              </dl>
              <p className={styles.note}>시간 배분은 기본안이다. 의미 있는 새 소식이 적은 주에는 사례 논의에 더 시간을 쓴다.</p>
            </article>
            <div className={styles.flow}><strong>사례 논의의 핵심 질문</strong><p>무엇을 맡겼고, 어디까지 됐고, 어디서 내가 개입했는가?<br/>이 경험 때문에 다음에는 무엇을 다르게 할 것인가?</p><span>결과물과 함께 그 과정의 판단을 다룬다. 잘된 경험과 실패한 경험 모두 다음 활용을 바꿀 수 있는 학습 재료다.</span></div>
          </section>

          <section id="records" className={styles.section}>
            <p className={styles.eyebrow}>02 / RECORDS & REFLECTION</p>
            <h2>논의가 다음 시도로 이어지도록 남긴다.</h2>
            <div className={styles.communityGrid}>
              <div><h3>콜 전 · 짧은 브리핑</h3><p>운영진이 주간 콜을 준비하며 고른 변화와 그 의미를 뉴스레터로 전달한다. 무엇을 다음에 시험해볼 만한지 연결한다.</p></div>
              <div><h3>콜 후 · 학습 기록</h3><p>녹화·요약과 함께 이번에 달라진 판단, 유효했던 방법, 아직 풀리지 않은 질문을 남긴다. 다음 논의와 시도에서 다시 참고한다.</p></div>
            </div>
            <p>뉴스레터, 콜, 기록을 하나의 흐름으로 운영해 같은 준비와 논의가 여러 번 활용되게 한다. 별도의 신규 교육 콘텐츠를 매주 제작하는 부담을 줄인다.</p>
            <div className={styles.decision}>
              <h2>월말에 확인할 세 가지</h2>
              <ul><li>이번 달에 <strong>새롭게 맡기게 된 일</strong></li><li>새 정보나 경험 때문에 <strong>바뀐 판단</strong></li><li><strong>아직 막혀 있고 다음에 확인할 지점</strong></li></ul>
            </div>
            <p>월말 회고는 월말 주간 콜 안에서 짧게 다루는 안으로 검토한다. 동일 업무의 전후 비교를 강제하지 않고, 각자 무엇을 얻었고 다음에 무엇을 이어갈지 확인한다.</p>
          </section>

          <section id="open" className={styles.section}>
            <p className={styles.eyebrow}>03 / OPEN DECISIONS</p>
            <h2>참여 부담과 사례의 구체성을 함께 설계한다.</h2>
            <p>가장 먼저 정할 것은 구성원이 자기 사례를 부담 없이 가져오면서도, 다른 사람이 배울 수 있을 만큼 구체적인 내용을 남기는 방식이다.</p>
            <div className={styles.discussion}><h3>다음에 구체화할 항목</h3><p>사례 공유의 최소 형식과 콜에서 다룰 사례의 선정 방식, 운영진 피드백의 범위. 커뮤니티 이름·채널·구독료, 뉴스레터 발행 주기, 녹화 동의와 열람 범위도 별도 결정한다.</p></div>
            <p className={styles.note}>현재는 운영 구조를 기록한 단계다. 개별 과제, 제출 의무, 응답 기한이나 서비스 제공 수준은 정하지 않았다.</p>
          </section>
          <footer className={styles.footer}><Link href="/docs">← 교육 운영 방향</Link><a href="#purpose">위로 ↑</a></footer>
        </main>
      </div>
    </div>
  );
}
