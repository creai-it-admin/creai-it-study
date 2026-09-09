import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { duration, elapsedSeconds, formatDate, getClosedSessionResults, sessionTitle } from "@/lib/history";
import { SEGMENT_LABEL, SEGMENT_ORDER } from "@/lib/session-state";

export const dynamic = "force-dynamic";
export default async function SessionResultsPage() {
  if (!await requireAdmin()) redirect("/admin");
  const sessions = await getClosedSessionResults();
  return <main className="mx-auto max-w-5xl px-5 py-8">
    <Link href="/admin" className="text-[13px] text-accent-strong">회차 목록</Link>
    <h1 className="mt-4 text-[20px] font-semibold">종료된 회차 결과</h1>
    <p className="mt-2 mb-6 text-[14px] text-ink-2">출석·제출 기록과 구간별 실제 소요 시간을 확인합니다. 시각은 한국 시간입니다.</p>
    {!sessions.length ? <div className="card p-8 text-[14px] text-ink-2">아직 종료된 회차가 없습니다.</div> : null}
    <div className="flex flex-col gap-6">{sessions.map((session) => {
      const subs = session.formDef?.submissions ?? [];
      const attendance = new Map(session.attendances.map((a) => [a.userId, a]));
      const submissions = new Map(subs.map((s) => [s.userId, s]));
      const people = new Map([...session.attendances.map((a) => [a.userId, a.user] as const), ...subs.map((s) => [s.userId, s.user] as const)]);
      const ordered = [...people.values()].sort((a, b) =>
        (attendance.get(a.id)?.firstSeenAt?.getTime() ?? Infinity) - (attendance.get(b.id)?.firstSeenAt?.getTime() ?? Infinity) || a.id.localeCompare(b.id));
      return <section key={session.id} id={session.id} className="card scroll-mt-5 p-5">
        <h2 className="text-[18px] font-semibold">{sessionTitle(session.weekNo)}</h2>
        <p className="mt-2 mb-5 text-[14px] text-ink-2">출석 {session.attendances.filter((a) => a.state === "present").length}명 · 제출 {subs.filter((s) => s.status === "submitted").length}명 · 접속·작성자 중 미제출 {ordered.filter((p) => submissions.get(p.id)?.status !== "submitted").length}명</p>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-[13px]">
            <caption className="mb-2 text-left font-medium">구간별 시간</caption>
            <thead><tr className="border-b border-line"><th className="p-2">구간</th><th className="p-2">시작</th><th className="p-2">종료</th><th className="p-2">계획</th><th className="p-2">실제</th></tr></thead>
            <tbody>{SEGMENT_ORDER.map((kind) => {
              const segment = session.segments.find((s) => s.kind === kind);
              const seconds = elapsedSeconds(segment?.startedAt ?? null, segment?.endedAt ?? null);
              return <tr key={kind} className="border-b border-line last:border-0">
                <th className="whitespace-nowrap p-2 font-normal">{SEGMENT_LABEL[kind]}</th>
                <td className="whitespace-nowrap p-2">{formatDate(segment?.startedAt ?? null)}</td>
                <td className="whitespace-nowrap p-2">{formatDate(segment?.endedAt ?? null)}</td>
                <td className="whitespace-nowrap p-2">{segment ? `${segment.plannedMin}분` : "—"}</td>
                <td className="whitespace-nowrap p-2">{seconds !== null ? duration(seconds) : segment?.startedAt ? "종료 기록 확인 필요" : "진행하지 않음"}</td>
              </tr>;
            })}</tbody>
          </table>
        </div>
        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-[13px]">
            <caption className="mb-2 text-left font-medium">접속·작성자별 기록</caption>
            <thead><tr className="border-b border-line"><th className="p-2">이름</th><th className="p-2">출석</th><th className="p-2">첫 접속</th><th className="p-2">제출 상태</th><th className="p-2">제출 시각</th></tr></thead>
            <tbody>{ordered.map((person) => {
              const a = attendance.get(person.id); const sub = submissions.get(person.id);
              return <tr key={person.id} className="border-b border-line last:border-0">
                <th className="p-2 font-normal">{person.name ?? person.email}</th>
                <td className="p-2">{a?.state === "present" ? "출석" : "출석 기록 없음"}</td>
                <td className="whitespace-nowrap p-2">{formatDate(a?.firstSeenAt ?? null)}</td>
                <td className="p-2">{sub?.status === "submitted" ? "제출함" : sub ? "미제출 · 초안" : "미제출 · 작성 전"}</td>
                <td className="whitespace-nowrap p-2">{formatDate(sub?.submittedAt ?? null)}</td>
              </tr>;
            })}</tbody>
          </table>
          {!ordered.length ? <p className="py-3 text-[13px] text-ink-2">접속·작성 기록이 없습니다.</p> : null}
        </div>
        <p className="mt-4 text-[12px] text-ink-2">명단이 없으므로 접속·작성 기록이 있는 사람만 표시합니다. 접속하지 않은 사람의 결석은 자동 판정하지 않습니다.</p>
      </section>;
    })}</div>
  </main>;
}
