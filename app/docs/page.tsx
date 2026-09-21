import type { Metadata } from "next";
import Link from "next/link";
import styles from "./docs.module.css";

export const metadata: Metadata = {
  title: "Docsboard · CREAI+IT Study",
  description: "AI에 대한 지식적 이해와 활용에 대한 이해를 통해, AI 시대를 선도할 차별화된 인재로 성장할 기반을 만드는 4주 교육의 결정 기록",
  robots: { index: false, follow: false },
};

const weeks = [
  {
    number: "01", title: "현재 AI와 코딩 에이전트의 이해",
    question: "지금 AI는 어디까지 와 있고, 어떤 도구로 무엇을 할 수 있는가?",
    intent: "현재 AI의 가능성과 한계를 핵심 위주로 파악하고, 코딩 에이전트의 주요 기능을 알아 활용을 시작할 수 있는 기반을 갖춘다.",
    content: "AI가 바꾸고 있는 일의 범위와 기본 작동 원리. Claude Code·Codex 같은 도구가 무엇인지, 대화형 AI와 어떤 차이가 있는지, 작업을 시작하고 결과를 확인하는 기본 사용 흐름을 다룬다.",
    capabilities: [
      "파일·실행 도구: 자료와 작업 폴더를 읽고 수정하며, 명령 실행과 결과 확인으로 이어지는 작업 구조.",
      "서브에이전트: 작업 일부를 별도 에이전트에 나누어 맡기는 개념과 역할. 조사·구현·검토의 분담과 병렬 작업을 이해한다.",
      "지침·스킬: 반복해서 사용할 작업 방식과 기준을 전달하는 개념. 매번 하는 요청과 재사용할 절차의 차이를 이해한다.",
      "외부 연결과 권한: MCP·커넥터 등으로 자료와 서비스에 접근하는 개념, 도구가 볼 수 있는 범위와 실행 권한의 의미.",
    ],
    emphasis: "기능 이름을 아는 데서 그치지 않고 각 기능이 어떤 일을 가능하게 하는지 짧은 예시로 연결한다. 첫 주에는 기능의 역할과 기본 사용을 이해하고, 이를 업무 구조로 조합하는 방법은 2주차에서 다룬다.",
    outcome: "코딩 에이전트를 단순한 채팅창으로 보지 않고, 어떤 기능을 활용해 일을 맡길 수 있는지 설명할 수 있다.",
  },
  {
    number: "02", title: "AI와 일하는 업무 구조 설계",
    question: "도구의 기능을 어떻게 조합해 내 업무를 맡길 것인가?",
    intent: "단발성 질문에서 벗어나, AI가 목표를 향해 일하고 사람이 필요한 지점에서 판단하는 업무 운영 구조를 이해한다.",
    content: "PRD로 목표·요구사항·완료 기준을 구체화하는 방법. 작업 단위와 순서, 맥락과 자료, 사람과 에이전트의 역할, 검토·개입 지점을 설계하는 방법을 다룬다.",
    emphasis: "방향 제시 → 함께 논의·조정 → 구체화 → 실행 위임 → 결과 검토·조정의 루프를 실제 사례로 설명한다. PRD 자체를 정교하게 쓰는 것보다, 에이전트가 일할 구조와 좋은 결과의 기준을 만드는 데 초점을 둔다.",
    outcome: "자기 업무에서 무엇을 어떤 순서로 맡기고, 어떤 기준으로 결과를 확인하며, 언제 개입할지 설명할 수 있다.",
  },
  {
    number: "03", title: "도전적인 위임과 지속적인 학습",
    question: "모델이 발전할 때, 나의 활용 방식도 어떻게 함께 발전시킬 것인가?",
    intent: "현재 익숙한 사용법에 머무르지 않고, 어려운 일을 맡긴 경험으로 활용 범위와 판단 기준을 계속 넓히는 학습 방식을 갖춘다.",
    content: "더 어렵고 범위가 큰 일을 맡기며 현재 가능한 수준을 확인하는 방식. 실패한 지점에서 모델의 한계, 부족한 맥락, 업무 구조와 검토 방식의 문제를 구분하고 다음 시도에 반영하는 과정을 다룬다.",
    emphasis: "시켜보기 → 결과와 실패 지점 관찰 → 원인과 개입 방식 조정 → 다시 위임하기의 학습 루프가 중심이다. 한 번의 실패를 고정된 한계로 단정하지 않고, 새 모델과 기능이 나오면 기존 판단을 다시 확인한다. 얻은 교훈은 지침·스킬에 반영해 축적한다.",
    outcome: "‘AI는 여기까지’라는 과거의 가정을 재검토하고, 시행착오를 자신의 위임 기준과 더 나은 활용 방식으로 바꿀 수 있다.",
  },
  {
    number: "04", title: "AI 기술과 산업의 구조 이해",
    question: "AI 산업에서 가치는 어디서 만들어지고, 누가 왜 협상력을 갖는가?",
    intent: "개별 도구를 사용하는 시야를 넘어, 기술과 산업의 변화를 스스로 해석할 지식적 기반을 갖춘다.",
    content: "반도체·컴퓨팅 인프라·모델·애플리케이션으로 이어지는 밸류체인, 참여자들의 상호 의존과 협상력, 가치가 형성되고 이동하는 이유를 다룬다. 학습과 추론, 모델과 에이전트 등 산업 구조를 이해하는 데 중요한 기술 개념도 본질적으로 설명한다.",
    emphasis: "지식적 이해에 80%를 두고, 용어 나열보다 기술적 특성이 비용·경쟁·협상력에 어떻게 연결되는지 설명한다. 나머지 20%에서는 앞선 3주의 활용 경험을 정리하고, 산업과 기술의 변화가 자신의 선택에 주는 의미를 연결한다.",
    outcome: "AI 관련 소식을 접했을 때 밸류체인 어디의 변화인지, 누구에게 어떤 의미가 있는지, 자신의 판단을 왜 바꿔야 하는지 설명할 수 있다.",
  },
];

export default function Docsboard() {
  return (
    <div className={styles.board}>
      <a href="#decision" className={styles.skip}>본문으로 이동</a>
      <header className={styles.header}>
        <Link href="/" className={styles.brand}>CREAI<span>+</span>IT <small>Docsboard</small></Link>
        <Link href="/routes">스터디로 돌아가기 ↗</Link>
      </header>
      <div className={styles.layout}>
        <aside className={styles.sidebar}>
          <p className={styles.eyebrow}>STUDY PLAYBOOK</p>
          <nav aria-label="문서 목차">
            <a href="#decision">01 · 결정 사항</a>
            <a href="#curriculum">02 · 4주 커리큘럼</a>
            <a href="#community">03 · 이후 커뮤니티</a>
          </nav>
          <div className={styles.documentMeta}><strong>교육 운영 방향 v1.2</strong><br/>결정일 · 2026.09.20<br/>적용 · 향후 정규 교육 설계</div>
        </aside>
        <main className={styles.main}>
          <section id="decision" className={styles.section}>
            <div className={styles.meta}><span className={styles.confirmed}>결정 완료</span><span>DECISION 001</span></div>
            <h1>AI를 깊이 이해하고 활용하며,<br/>압도적인 인재로 성장할 기반을 만든다.</h1>
            <p className={styles.lead}>한 달 교육의 본질적인 목표는 AI에 대한 지식적 이해와 활용에 대한 이해를 함께 쌓는 것이다. 이 두 가지를 연결해, AI 시대를 선도할 진정으로 차별화된 인재로 성장할 기반을 만든다.</p>
            <p>우리가 지향하는 사람은 “일도 잘하고 AI도 잘 쓴다”는 평가를 받는 사람이다. 4주 교육은 그 지향점에 도달하기 위한 이해와 판단의 기반을 만들고, 이후 실제 경험과 지속적인 학습으로 역량을 발전시켜 나간다.</p>
            <div className={styles.communityGrid}>
              <div><h2>AI에 대한 지식적 이해</h2><p>AI의 작동 원리와 능력·한계, 산업의 밸류체인과 참여자별 협상력을 이해한다. 새로운 변화가 왜 중요하고, 무엇을 바꾸는지 해석할 수 있는 기반을 갖춘다.</p></div>
              <div><h2>AI 활용에 대한 이해</h2><p>AI 도구와 에이전트가 일하는 구조를 이해하고, 다양한 실제 사례와 자신의 시도를 통해 무엇을 맡기고 어떻게 협업할지 배운다. 위임 범위·맥락 전달·검토와 개입의 기준을 세운다.</p></div>
            </div>
            <p><strong>지식적 이해는 활용의 가능성과 한계를 판단하는 근거가 되고, 활용 경험은 그 이해를 검증하고 갱신하는 근거가 된다.</strong> 두 가지를 함께 기르는 것이 이번 교육의 중심이다.</p>
            <div className={styles.decision}>
              <h2>이번에 고정한 구조</h2>
              <ul>
                <li><strong>1–3주차:</strong> 지식적 이해 20% · 활용에 대한 이해와 적용 80%.</li>
                <li><strong>4주차:</strong> 지식적 이해 80% · 활용 경험의 정리와 연결 20%.</li>
                <li><strong>교육 이후:</strong> 월 단위 유료 커뮤니티. 주 1회·약 1시간, 5–6인 소규모 온라인 콜(진행자 1인)을 중심으로 적용 경험과 새 정보를 나눈다.</li>
              </ul>
            </div>
            <p>첫 3주에는 활용에 필요한 원리를 배우면서 실제로 AI와 일하는 방식을 이해한다. 마지막 주에는 산업·기술의 구조와 변화의 의미를 집중해서 다루고, 앞선 활용 경험을 더 넓은 관점에서 해석한다. 두 가지 이해를 4주 전체에 걸쳐 연결한다.</p>
            <p className={styles.note}>이 문서는 앞으로 구체화할 교육의 기준이다. 기존 기수의 장표·일정·과제가 변경되었다는 뜻은 아니다. 교육비와 커뮤니티 구독료는 별도로 결정한다.</p>
          </section>

          <section id="curriculum" className={styles.section}>
            <p className={styles.eyebrow}>01 / CURRICULUM</p><h2>두 가지 이해를 연결하는 4주.</h2>
            <p>4주 · 주 1회 · 회당 2시간. 1주차에 현재 AI와 도구의 가능성을 파악하고, 2주차에 AI와 일하는 업무 구조를 배운다. 3주차에는 도전적인 위임과 시행착오를 통해 계속 발전하는 방법을 익히고, 4주차에는 기술·산업 전체를 해석하는 관점을 갖춘다.</p>
            <p><strong>2주차는 지금 일을 잘 맡기는 방법, 3주차는 앞으로도 계속 더 잘 쓰게 되는 학습 방법이다.</strong></p>
            <div className={styles.legend}><span><i className={styles.knowledgeKey}/>지식적 이해</span><span><i className={styles.practiceKey}/>활용 이해·적용</span></div>
            <div className={styles.weeks}>
              {weeks.map((week, index) => (
                <article key={week.number} className={styles.week}>
                  <div className={styles.weekHeading}><span className={styles.weekNumber}>W{week.number}</span><div><h3>{week.title}</h3><p>{week.question}</p></div></div>
                  <div className={styles.ratio} aria-label={index === 3 ? "지식적 이해 80%, 활용 이해와 적용 20%" : "지식적 이해 20%, 활용 이해와 적용 80%"}>
                    <span style={{ flex: index === 3 ? 4 : 1 }}>지식 {index === 3 ? 80 : 20}%</span><span style={{ flex: index === 3 ? 1 : 4 }}>활용 {index === 3 ? 20 : 80}%</span>
                  </div>
                  <dl>
                    <div><dt>교육 의도</dt><dd>{week.intent}</dd></div>
                    <div><dt>핵심 내용</dt><dd>{week.content}</dd></div>
                    {week.capabilities ? <div><dt>이해할 기능</dt><dd><ul className={styles.capabilities}>{week.capabilities.map((capability) => <li key={capability}>{capability}</li>)}</ul></dd></div> : null}
                    <div><dt>설명의 초점</dt><dd>{week.emphasis}</dd></div>
                    <div className={styles.outcome}><dt>갖출 이해</dt><dd>{week.outcome}</dd></div>
                  </dl>
                </article>
              ))}
            </div>
            <div className={styles.decision}>
              <h2>4주 교육을 마쳤을 때의 기반</h2>
              <ul>
                <li><strong>변화를 이해한다:</strong> AI의 가능성·한계와 산업 변화의 의미를 근거와 함께 설명할 수 있다.</li>
                <li><strong>활용을 설계한다:</strong> 자기 일에서 무엇을 맡길지, 어떻게 협업하고 결과를 확인할지 정하고 그 이유를 설명할 수 있다.</li>
                <li><strong>둘을 연결한다:</strong> 새 기술과 활용 경험을 접했을 때 기존 생각과 일하는 방식에서 무엇을 바꿀지 판단할 수 있다.</li>
              </ul>
            </div>
            <div className={styles.flow}><strong>교육 설계의 기준</strong><p>주차별 교육 의도 → 핵심 내용 → 참가자가 갖출 이해</p><span>각 주차의 본질적인 목표를 먼저 고정한다. 인클래스·과제·학습 자료는 그 목표를 기준으로 이후에 설계한다.</span></div>
            <p className={styles.note}>20:80은 교육 내용의 비중이다. 2시간을 약 25분·95분으로 볼 수 있지만 휴식·진행 시간을 포함한 분 단위 시간표는 별도로 설계한다. 실제 실행과 성과 축적은 참가자 개인의 영역이며 교육은 그 판단과 설계를 돕는다.</p>
          </section>

          <section id="community" className={styles.section}>
            <p className={styles.eyebrow}>02 / CONTINUOUS LEARNING</p><h2>배운 뒤에도, 내 활용이 바뀌도록.</h2>
            <p>교육에서 쌓은 지식적 이해와 활용에 대한 이해를 각자의 일에서 계속 발전시킨다. 새로운 기술·산업 정보와 실제 경험을 함께 해석하고, 판단과 일하는 방식을 갱신하며 차별화된 역량으로 축적한다.</p>
            <ol className={styles.loop}>
              <li><strong>적용한다</strong><span>자기 업무에서 한 가지를 시험한다.</span></li>
              <li><strong>남긴다</strong><span>결과와 막힌 지점을 채널에 기록한다.</span></li>
              <li><strong>함께 검토한다</strong><span>댓글과 주간 콜에서 경험을 비교한다.</span></li>
              <li><strong>갱신한다</strong><span>판단을 수정하고 다음 시도를 정한다.</span></li>
            </ol>
            <div className={styles.communityGrid}>
              <div><h3>확정한 운영 골격</h3><p>월 단위 결제와 주 1회·약 1시간 온라인 콜. 5–6인 소규모로 진행하며 진행자는 1인이다. 교육 이후에도 경험 공유와 학습을 이어간다.</p></div>
              <div><h3>구체화할 운영 장치</h3><p>채널 과제와 상호 피드백, 의미를 해설하는 뉴스레터, 콜의 녹화·요약 기록. 빈도와 범위는 운영 부담을 검토해 정한다.</p></div>
            </div>
            <p className={styles.note}>커뮤니티 이름, 채널, 구독료, 과제 주기, 피드백 제공 범위는 미확정이다. 기업 연계 프로젝트 역시 도입을 결정하지 않았다.</p>
            <Link href="/docs/community" className="btn">커뮤니티 세부 운영안 읽기 ↗</Link>
          </section>

          <footer className={styles.footer}>CREAI+IT Study · 교육의 의도와 핵심 내용을 기준으로 구체화합니다.<a href="#decision">위로 ↑</a></footer>
        </main>
      </div>
    </div>
  );
}
