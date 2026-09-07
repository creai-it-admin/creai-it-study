// 지금 굴러가는 회차와 구간을 계산한다. 날짜를 보지 않는다. status=running인 회차 하나만 본다.
import { prisma } from "@/lib/prisma";
import type { SegmentKind } from "@prisma/client";

export const SEGMENT_ORDER: SegmentKind[] = ["part1", "part2", "break_", "part3"];

export const SEGMENT_LABEL: Record<SegmentKind, string> = {
  part1: "1부 교육",
  part2: "2부 인클래스",
  break_: "휴식",
  part3: "3부 발제",
};

export const SEGMENT_PLANNED: Record<SegmentKind, number> = {
  part1: 40,
  part2: 40,
  break_: 10,
  part3: 30,
};

// FR-304. 1부에는 시간을 보여주지 않는다.
export const SEGMENT_SHOWS_TIMER: Record<SegmentKind, boolean> = {
  part1: false,
  part2: true,
  break_: true,
  part3: true,
};

export type LiveState = {
  serverTime: string;
  sessionId: string | null;
  weekNo: number | null;
  segment: SegmentKind | null;
  segmentLabel: string | null;
  startedAt: string | null;
  plannedMin: number | null;
  showTimer: boolean;
  sharingOpen: boolean;
  route: string;
};

// 라우팅 규칙. 위에서부터 판정한다.
export function routeFor(segment: SegmentKind | null, sharingOpen: boolean): string {
  if (!segment) return "/home";
  if (segment === "part1") return "/deck";
  if (segment === "part2" && !sharingOpen) return "/inclass";
  return "/inclass/shared";
}

export async function getRunningSession() {
  return prisma.studySession.findFirst({
    where: { status: "running" },
    include: { segments: true },
    orderBy: { date: "asc" },
  });
}

/** 시작됐고 아직 안 끝난 구간이 현재 구간이다. */
export function currentSegment(
  segments: { kind: SegmentKind; startedAt: Date | null; endedAt: Date | null; plannedMin: number }[]
) {
  const open = segments.filter((s) => s.startedAt && !s.endedAt);
  if (open.length > 0) {
    // 순서상 가장 뒤에 있는 것을 현재로 본다.
    return open.sort((a, b) => SEGMENT_ORDER.indexOf(b.kind) - SEGMENT_ORDER.indexOf(a.kind))[0];
  }
  // 세션이 running인데 열린 구간이 없을 수 있다(마지막 구간을 닫고 세션은 안 닫은 경우).
  // 이때 참가자를 /home으로 튕기지 않고 마지막으로 시작된 구간에 머무르게 한다.
  const started = segments.filter((s) => s.startedAt);
  if (started.length === 0) return null;
  return started.sort((a, b) => SEGMENT_ORDER.indexOf(b.kind) - SEGMENT_ORDER.indexOf(a.kind))[0];
}

export async function getLiveState(): Promise<LiveState> {
  const now = new Date();
  const session = await getRunningSession();
  if (!session) {
    return {
      serverTime: now.toISOString(),
      sessionId: null,
      weekNo: null,
      segment: null,
      segmentLabel: null,
      startedAt: null,
      plannedMin: null,
      showTimer: false,
      sharingOpen: false,
      route: "/home",
    };
  }
  const seg = currentSegment(session.segments);
  return {
    serverTime: now.toISOString(),
    sessionId: session.id,
    weekNo: session.weekNo,
    segment: seg?.kind ?? null,
    segmentLabel: seg ? SEGMENT_LABEL[seg.kind] : null,
    startedAt: seg?.startedAt?.toISOString() ?? null,
    plannedMin: seg?.plannedMin ?? null,
    showTimer: seg ? SEGMENT_SHOWS_TIMER[seg.kind] : false,
    sharingOpen: session.sharingOpen,
    route: routeFor(seg?.kind ?? null, session.sharingOpen),
  };
}
