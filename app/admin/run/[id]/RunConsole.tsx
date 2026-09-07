"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type State = {
  serverTime: string;
  session: { id: string; weekNo: number; status: string; sharingOpen: boolean; deckUrl: string | null };
  segment: { kind: string; label: string; startedAt: string | null; plannedMin: number } | null;
  nextSegment: { kind: string; label: string } | null;
  attendance: { userId: string; name: string; state: string; firstSeenAt: string }[];
  submissions: { userId: string; name: string; status: string; filled: number; total: number }[];
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
  const submittedCount = state.submissions.filter((s) => s.status === "submitted").length;
  const presentCount = state.attendance.filter((a) => a.state === "present").length;

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
          <button className="btn btn-primary" disabled={busy || !state.nextSegment} onClick={() => control("next")}>
            {state.nextSegment ? `다음 구간으로 · ${state.nextSegment.label}` : "마지막 구간"}
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
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="card p-5">
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="text-[14px] font-semibold">제출 현황</h2>
            <span className="font-en text-[13px] tabular-nums text-ink-2">{submittedCount} / 6</span>
          </div>
          <div className="flex flex-col gap-2">
            {state.submissions.length === 0 ? (
              <p className="text-[13px] text-ink-3">아직 아무도 쓰지 않았습니다</p>
            ) : (
              state.submissions.map((s) => (
                <div key={s.userId} className="flex items-center justify-between text-[13.5px]">
                  <span>{s.name}</span>
                  <span className={s.status === "submitted" ? "text-[color:var(--ok)]" : "text-ink-3"}>
                    {s.status === "submitted" ? "제출함" : `${s.filled} / ${s.total} 칸`}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="card p-5">
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="text-[14px] font-semibold">출석</h2>
            <span className="font-en text-[13px] tabular-nums text-ink-2">{presentCount} / 6</span>
          </div>
          <div className="flex flex-col gap-2">
            {state.attendance.length === 0 ? (
              <p className="text-[13px] text-ink-3">아직 아무도 안 들어왔습니다</p>
            ) : (
              state.attendance.map((a) => (
                <div key={a.userId} className="flex items-center justify-between text-[13.5px]">
                  <span>{a.name}</span>
                  <span className="font-en tabular-nums text-ink-3">
                    {new Date(a.firstSeenAt).toLocaleTimeString("ko-KR", {
                      hour: "2-digit",
                      minute: "2-digit",
                      timeZone: "Asia/Seoul",
                    })}
                  </span>
                </div>
              ))
            )}
          </div>
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
