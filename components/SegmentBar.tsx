"use client";

import { useEffect, useState } from "react";
import type { LiveState } from "./useLiveState";

function mmss(totalSec: number) {
  const s = Math.max(0, Math.floor(totalSec));
  const m = Math.floor(s / 60);
  return `${String(m).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

/** FR-304. 경과 / 전체를 서버 시각 기준으로 보여준다. 1부에는 안 뜬다. */
export function SegmentBar({ state, offsetMs }: { state: LiveState | null; offsetMs: number }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  if (!state?.segment) return null;

  const showTimer = state.showTimer && state.startedAt && state.plannedMin != null;
  const elapsed = showTimer ? (now + offsetMs - new Date(state.startedAt!).getTime()) / 1000 : 0;

  return (
    <div className="flex items-center gap-3 text-[13px]">
      <span className="rounded-md bg-accent-soft px-2 py-1 font-medium text-accent-strong">
        {state.segmentLabel}
      </span>
      {showTimer ? (
        <span className="font-en tabular-nums text-ink-2">
          {mmss(elapsed)} / {mmss(state.plannedMin! * 60)}
        </span>
      ) : null}
    </div>
  );
}
