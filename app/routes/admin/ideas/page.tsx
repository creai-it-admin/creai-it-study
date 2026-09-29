import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/auth';

export const metadata: Metadata = {
  title: '교육 운영 구상 · CREAI+IT',
  robots: { index: false, follow: false },
};

export default async function EducationIdeasPage() {
  if (!await requireAdmin()) redirect('/routes/login');

  return (
    <main className="mx-auto max-w-4xl px-5 py-8 sm:py-12">
      <Link className="text-sm text-accent-strong" href="/routes/admin">← 스터디 관리</Link>
      <header className="mb-8 mt-6">
        <p className="text-sm font-medium text-accent-strong">운영진 논의 문서</p>
        <h1 className="mt-2 text-2xl font-semibold sm:text-3xl">교육 운영 구상</h1>
        <p className="mt-3 text-sm leading-relaxed text-ink-2">스터디에 추가할 교육 경험과 운영 방식을 정리합니다. 실제 도입 일정과 세부 조건은 확정 전입니다.</p>
      </header>

      <article className="card p-5 sm:p-8" aria-labelledby="mentoring-title">
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <span className="pill px-3 py-1 font-medium">도입 검토 중</span>
          <span className="text-ink-2">프로젝트 기간 · 3–4주차</span>
        </div>
        <h2 id="mentoring-title" className="mt-4 text-xl font-semibold sm:text-2xl">프로젝트 기간 1on1 멘토링</h2>
        <p className="mt-4 leading-relaxed">함께 배우는 수업에 더해, 각자의 목표와 상황을 이해하는 담당 멘토가 프로젝트 진행과 AI 활용을 함께 봅니다.</p>
        <p className="mt-3 text-sm leading-relaxed text-ink-2">프로젝트 결과물을 만드는 과정에서 무엇을 AI에 맡길지, 어떤 도구를 쓸지, 어디서 개입하고 결과를 어떻게 확인할지 조언합니다. 평소 AI를 사용하며 생긴 질문도 자신의 상황에 맞춰 함께 다룹니다.</p>

        <section className="mt-8 border-t border-line pt-6" aria-labelledby="mentor-roles">
          <h3 id="mentor-roles" className="text-lg font-semibold">멘토의 역할</h3>
          <dl className="mt-4 grid gap-6 sm:grid-cols-2">
            <div>
              <dt className="font-semibold">세션 멘토</dt>
              <dd className="mt-2 text-sm leading-relaxed text-ink-2">주차별 교육과 공통 실습을 진행합니다. 함께 이해할 개념과 활용 방법을 짚고, 수업 중 질문과 토론을 이끕니다.</dd>
            </div>
            <div>
              <dt className="font-semibold">1on1 멘토</dt>
              <dd className="mt-2 text-sm leading-relaxed text-ink-2">담당 참가자의 목표와 작업 맥락을 이어서 파악합니다. 프로젝트의 막힌 지점을 함께 살피고, 이전 조언을 적용한 결과를 바탕으로 다음 시도를 구체화합니다.</dd>
            </div>
          </dl>
          <p className="mt-4 text-sm text-ink-2">초기에는 한 사람이 두 역할을 겸할 수 있습니다.</p>
        </section>

        <section className="mt-8 border-t border-line pt-6" aria-labelledby="mentoring-flow">
          <h3 id="mentoring-flow" className="text-lg font-semibold">프로젝트를 따라 이어지는 조언</h3>
          <ol className="mt-4 space-y-5">
            <li><h4 className="font-medium">1. 시작할 때 · 목표와 현재 활용 방식 파악</h4><p className="mt-1 text-sm leading-relaxed text-ink-2">무엇을 만들고 싶은지, 어디까지 해봤는지, AI를 어떻게 쓰고 있는지 함께 보고 프로젝트 범위를 정합니다.</p></li>
            <li><h4 className="font-medium">2. 진행 중 · 실제 작업을 보며 1on1 조언</h4><p className="mt-1 text-sm leading-relaxed text-ink-2">참가자의 요청과 AI의 결과, 막힌 지점을 함께 살펴봅니다. 더 맡길 수 있는 부분, 적합한 도구, 개입과 검토 방법을 구체적으로 짚고 다음 시도를 정합니다.</p></li>
            <li><h4 className="font-medium">3. 마무리할 때 · 다음 일에도 적용할 기준 정리</h4><p className="mt-1 text-sm leading-relaxed text-ink-2">결과물과 함께 달라진 활용 방식을 돌아봅니다. 자신에게 효과가 있었던 방법과 앞으로 시도할 일을 남깁니다.</p></li>
          </ol>
        </section>

        <section className="inset mt-8 p-5" aria-labelledby="open-decisions">
          <h3 id="open-decisions" className="font-semibold">운영 전에 정할 것</h3>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-ink-2">
            <li>멘토 배정 기준과 멘토 한 명이 담당할 참가자 수</li>
            <li>1on1 횟수·시간·진행 채널과 일정 조율 방식</li>
            <li>수업 외 질문을 받을 범위와 응답 기준</li>
          </ul>
        </section>
      </article>

      <article className="card mt-8 p-5 sm:p-8" aria-labelledby="ai-inclass-title">
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <span className="pill px-3 py-1 font-medium">도입 검토 중</span>
          <span className="text-ink-2">인클래스 실습 · 세션 해설</span>
        </div>
        <h2 id="ai-inclass-title" className="mt-4 text-xl font-semibold sm:text-2xl">AI와 함께하는 인클래스 · 작업 기록 기반 동적 해설</h2>
        <p className="mt-4 leading-relaxed">준비된 AI 에이전트와 참가자가 함께 실습하고, 각자의 작업 과정을 그날의 해설 자료로 활용합니다. 강사는 실제 시도를 바탕으로 질문과 피드백을 이어갑니다.</p>

        <section className="mt-8 border-t border-line pt-6" aria-labelledby="inclass-agent-roles">
          <h3 id="inclass-agent-roles" className="text-lg font-semibold">두 에이전트의 역할</h3>
          <dl className="mt-4 grid gap-6 sm:grid-cols-2">
            <div>
              <dt className="font-semibold">실습 에이전트</dt>
              <dd className="mt-2 text-sm leading-relaxed text-ink-2">그날의 과제·자료·도구를 준비해 참가자와 작업합니다. 참가자의 요청, AI의 실행과 결과, 방향을 바꾼 과정을 기록합니다. 목표와 결과물의 기준 등 참가자가 직접 결정할 부분을 남깁니다.</dd>
            </div>
            <div>
              <dt className="font-semibold">해설 에이전트</dt>
              <dd className="mt-2 text-sm leading-relaxed text-ink-2">개인별 목표·요청 방식·결과·수정 과정을 요약하고, 해설에서 짚을 지점을 실제 대화와 결과에 연결합니다. 여러 참가자의 기록에서 공통으로 막힌 부분이나 서로 다른 접근도 찾아줍니다.</dd>
            </div>
          </dl>
        </section>

        <section className="mt-8 border-t border-line pt-6" aria-labelledby="inclass-agent-flow">
          <h3 id="inclass-agent-flow" className="text-lg font-semibold">수업에서 사용하는 흐름</h3>
          <ol className="mt-4 space-y-5">
            <li><h4 className="font-medium">1. 참가자가 AI와 함께 실습</h4><p className="mt-1 text-sm leading-relaxed text-ink-2">목표를 설명하고 일을 맡긴 뒤, 결과를 확인하고 요청을 수정합니다. 최종 결과와 함께 그 과정이 남습니다.</p></li>
            <li><h4 className="font-medium">2. 현재까지의 기록으로 해설 준비</h4><p className="mt-1 text-sm leading-relaxed text-ink-2">강사가 필요할 때 개인별 요약과 공통 해설거리를 생성·갱신합니다. 요약에서 근거가 되는 원문과 결과를 바로 확인할 수 있도록 합니다.</p></li>
            <li><h4 className="font-medium">3. 실제 사례를 보며 함께 해설</h4><p className="mt-1 text-sm leading-relaxed text-ink-2">강사가 공유할 사례를 골라 띄우고, 참가자에게 판단의 이유를 물으며 토론합니다. 서로의 AI 활용 과정을 보고 배운 점은 기존 동료 피드백과 활동 마무리 기록으로 이어갑니다.</p></li>
          </ol>
          <div className="inset mt-5 p-5">
            <p className="text-sm font-semibold">해설 중 에이전트에 요청할 질문 예시</p>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-ink-2">
              <li>지금까지 작업에서 공통으로 막힌 부분을 찾아줘.</li>
              <li>서로 다른 방식으로 접근한 사례 두 개를 보여줘.</li>
              <li>AI의 결과를 다시 확인한 사례와 해당 기록을 보여줘.</li>
            </ul>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-ink-2">요약은 기록에서 확인한 행동과 해석을 구분합니다. 기록에 드러나지 않은 판단의 이유는 참가자에게 직접 묻습니다.</p>
        </section>

        <section className="mt-8 border-t border-line pt-6" aria-labelledby="inclass-open-decisions">
          <h3 id="inclass-open-decisions" className="font-semibold">운영 전에 정할 것</h3>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-ink-2">
            <li>주차별 실습 에이전트의 도구와 역할, 참가자가 직접 결정할 부분</li>
            <li>작업 기록의 저장 범위와 참가자 안내, 강사·동료에게 공유할 범위</li>
            <li>해설 요약을 생성·갱신하는 시점과 수업 중 결과를 기다리는 방식</li>
          </ul>
        </section>
      </article>
    </main>
  );
}
