"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type State = {
  serverTime: string;
  session: { id: string; weekNo: number; status: string; sharingOpen: boolean; deckUrl: string | null };
  segment: { kind: string; label: string; startedAt: string | null; plannedMin: number } | null;
  nextSegment: { kind: string; label: string } | null;
  topic: string | null;
  people: {
    key: string;
    userId: string | null;
    name: string;
    attendance: string;
    firstSeenAt: string | null;
    submissionStatus: string;
    filled: number;
    total: number;
    answers: { fieldId: string; order: number; question: string; text: string }[];
  }[];
};

function mmss(sec: number) {
  const s = Math.max(0, Math.floor(sec));
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

/** 진행 콘솔. 3초마다 출석과 제출 현황을 다시 받는다. FR-507. */
export function RunConsole({ id }: { id: string }) {
  const router = useRouter();
  const [state, setState] = useState<State | null>(null);
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const offsetRef = useRef<number | null>(null);

  useEffect(() => {
    let alive = true;
    async function tick() {
      try {
        const res = await fetch(`/api/admin/state?id=${id}`, { cache: "no-store" });
        if (!res.ok) return;
        const data: State = await res.json();
        if (!alive) return;
        if (offsetRef.current === null) {
          offsetRef.current = new Date(data.serverTime).getTime() - Date.now();
        }
        setState(data);
      } catch {
        /* 조용히 다시 시도한다 */
      }
    }
    tick();
    const poll = setInterval(tick, 3000);
    const clock = setInterval(() => setNow(Date.now()), 1000);
    return () => {
      alive = false;
      clearInterval(poll);
      clearInterval(clock);
    };
  }, [id]);

  async function control(action: string) {
    setBusy(true);
    try {
      await fetch(`/api/admin/session/${id}/control`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (action === "close" || action === "reset") router.push("/admin");
    } finally {
      setBusy(false);
    }
  }

  if (!state) return <div className="card p-10 text-center text-[13px] text-ink-3">불러오는 중</div>;

  const offset = offsetRef.current ?? 0;
  const elapsed =
    state.segment?.startedAt != null
      ? (now + offset - new Date(state.segment.startedAt).getTime()) / 1000
      : 0;

  const title = state.session.weekNo === 0 ? "리허설" : `${state.session.weekNo}주차`;
  const submittedCount = state.people.filter((p) => p.submissionStatus === "submitted").length;
  const presentCount = state.people.filter((p) => p.attendance === "present").length;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h1 className="text-[20px] font-semibold tracking-tight">{title} 진행</h1>
        <span className="text-[13px] text-ink-2">{state.session.status === "running" ? "진행 중" : "끝남"}</span>
      </div>

      <div className="card flex flex-wrap items-center justify-between gap-4 p-5">
        <div className="flex items-baseline gap-4">
          <span className="text-[16px] font-semibold">{state.segment?.label ?? "시작 전"}</span>
          {state.segment?.startedAt ? (
            <span className="font-en text-[14px] tabular-nums text-ink-2">
              {mmss(elapsed)} / {mmss(state.segment.plannedMin * 60)}
            </span>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {state.nextSegment ? (
            <span className="text-[12.5px] text-ink-3">다음은 {state.nextSegment.label}</span>
          ) : null}
          <button className="btn btn-primary" disabled={busy || !state.nextSegment} onClick={() => control("next")}>
            다음 구간으로
          </button>
          <button
            className="btn"
            disabled={busy}
            onClick={() => control(state.session.sharingOpen ? "closeSharing" : "openSharing")}
          >
            {state.session.sharingOpen ? "공유 닫기" : "공유 열기"}
          </button>
          <button className="btn" disabled={busy} onClick={() => control("close")}>
            세션 닫기
          </button>
          {state.session.deckUrl ? (
            <a className="btn" href="/deck?pin=1" target="_blank" rel="noreferrer">
              장표 보기
            </a>
          ) : null}
        </div>
      </div>

      <div className="card p-5">
        {state.topic ? (
          <p className="mb-4 border-b border-line pb-3 text-[13.5px] leading-relaxed text-ink-2">
            {state.topic}
          </p>
        ) : null}
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="text-[14px] font-semibold">참가자</h2>
          <span className="font-en text-[13px] tabular-nums text-ink-2">
            출석 {presentCount}명 · 제출 {submittedCount}명
          </span>
        </div>
        <div className="flex flex-col">
          {state.people.length === 0 ? (
            <p className="text-[13px] text-ink-3">아직 아무도 안 들어왔습니다</p>
          ) : (
            state.people.map((p) => {
              const isOpen = open === p.key;
              return (
                <div key={p.key} className="border-b border-line last:border-b-0">
                  <button
                    className="flex w-full items-center justify-between py-2 text-left text-[13.5px]"
                    onClick={() => setOpen(isOpen ? null : p.key)}
                  >
                    <span>{p.name}</span>
                    <span className="flex items-center gap-4">
                      <span
                        className={
                          p.attendance === "present"
                            ? "text-[color:var(--ok)]"
                            : p.attendance === "absent"
                              ? "text-[color:var(--warn)]"
                              : "text-ink-3"
                        }
                      >
                        {p.attendance === "present" ? "출석" : p.attendance === "absent" ? "결석" : "미접속"}
                      </span>
                      <span
                        className={
                          p.submissionStatus === "submitted" ? "text-[color:var(--ok)]" : "text-ink-3"
                        }
                      >
                        {p.submissionStatus === "submitted"
                          ? "제출함"
                          : p.submissionStatus === "none"
                            ? "안 씀"
                            : `${p.filled} / ${p.total} 칸`}
                      </span>
                      <span className="text-[12px] text-ink-3">{isOpen ? "접기" : "펴기"}</span>
                    </span>
                  </button>
                  {isOpen ? (
                    <div className="flex flex-col gap-3 pb-4 pl-1">
                      {p.answers.length === 0 ? (
                        <p className="text-[13px] text-ink-3">이번 회차 폼이 없습니다</p>
                      ) : (
                        p.answers.map((a) => (
                          <div key={a.fieldId}>
                            <p className="mb-1 text-[12.5px] text-ink-3">
                              <span className="font-en mr-2">{a.order}</span>
                              {a.question}
                            </p>
                            <p className="whitespace-pre-wrap text-[13.5px] leading-relaxed">
                              {a.text.trim() || <span className="text-ink-3">아직 비어 있음</span>}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  ) : null}
                </div>
              );
            })
          )}
        </div>
      </div>

      {state.session.weekNo === 0 ? (
        <button className="btn self-start" disabled={busy} onClick={() => control("reset")}>
          리허설 초기화
        </button>
      ) : null}
    </div>
  );
}
