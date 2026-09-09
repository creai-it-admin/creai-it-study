"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

export type LiveState = {
  serverTime: string;
  sessionId: string | null;
  weekNo: number | null;
  segment: "part1" | "part2" | "break_" | "part3" | null;
  segmentLabel: string | null;
  startedAt: string | null;
  plannedMin: number | null;
  showTimer: boolean;
  sharingOpen: boolean;
  route: string;
};

/**
 * 3초 폴링. FR-303을 지킨다.
 * 구간이 바뀌는 순간에만 한 번 옮기고, 그 뒤 참가자가 스스로 옮긴 경로는
 * 다음 구간이 바뀔 때까지 건드리지 않는다.
 * 폴링이 실패하면 조용히 다시 시도한다. 화면을 초기화하지 않는다.
 */
export function useLiveState(opts?: { navigate?: boolean; enterRunning?: boolean }) {
  const navigate = opts?.navigate ?? true;
  const enterRunning = opts?.enterRunning ?? false;
  const router = useRouter();
  const [state, setState] = useState<LiveState | null>(null);
  const [offsetMs, setOffsetMs] = useState(0);
  const lastKeyRef = useRef<string | null>(null);
  const firstRef = useRef(true);

  useEffect(() => {
    let alive = true;
    let busy = false;

    async function tick() {
      if (busy) return;
      busy = true;
      try {
        const res = await fetch("/api/state", { cache: "no-store", signal: AbortSignal.timeout(10000) });
        if (!res.ok) return;
        const next: LiveState = await res.json();
        if (!alive) return;

        // 서버 시각과의 시차를 처음 한 번 잰다.
        if (firstRef.current) {
          setOffsetMs(new Date(next.serverTime).getTime() - Date.now());
          firstRef.current = false;
        }
        setState(next);

        // 구간이 바뀌는 순간에만 옮긴다.
        const key = `${next.sessionId ?? "none"}:${next.segment ?? "none"}:${next.sharingOpen}`;
        if (lastKeyRef.current === null) {
          lastKeyRef.current = key;
          if (navigate && enterRunning && next.sessionId) router.replace(next.route);
        } else if (lastKeyRef.current !== key) {
          lastKeyRef.current = key;
          if (navigate) router.push(next.route);
        }
      } catch {
        // 조용히 다시 시도한다.
      } finally {
        busy = false;
      }
    }

    tick();
    const id = setInterval(tick, 3000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [navigate, enterRunning, router]);

  return { state, offsetMs };
}
