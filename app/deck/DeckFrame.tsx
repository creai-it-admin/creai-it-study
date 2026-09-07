"use client";

import { useLiveState } from "@/components/useLiveState";
import { SegmentBar } from "@/components/SegmentBar";

/**
 * 장표 화면의 폴링과 타이머를 담당한다.
 * 뷰어 안에 두면 장표가 없을 때 폴링이 통째로 멈춰서 구간이 바뀌어도 안 옮겨진다.
 */
export function DeckFrame({ children }: { children: React.ReactNode }) {
  const { state, offsetMs } = useLiveState();
  return (
    <div className="flex flex-col gap-4">
      <SegmentBar state={state} offsetMs={offsetMs} />
      {children}
    </div>
  );
}
