"use client";

import { useSearchParams } from "next/navigation";
import { useLiveState } from "@/components/useLiveState";
import { SegmentBar } from "@/components/SegmentBar";

/**
 * 장표 화면의 폴링과 타이머를 담당한다.
 * 뷰어 안에 두면 장표가 없을 때 폴링이 통째로 멈춰서 구간이 바뀌어도 안 옮겨진다.
 */
export function DeckFrame({ children }: { children: React.ReactNode }) {
  // ?pin=1이면 구간이 바뀌어도 이 탭을 안 옮긴다.
  // 진행자가 콘솔에서 장표를 열어 놓고 설명하는 용도라 2부로 넘어가도 남아 있어야 한다.
  const pinned = useSearchParams().get("pin") === "1";
  const { state, offsetMs } = useLiveState({ navigate: !pinned });
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <SegmentBar state={state} offsetMs={offsetMs} />
        {pinned ? <span className="text-[12.5px] text-ink-3">이 탭은 구간이 바뀌어도 그대로 있습니다</span> : null}
      </div>
      {children}
    </div>
  );
}
