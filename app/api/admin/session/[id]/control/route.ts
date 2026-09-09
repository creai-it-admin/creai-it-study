// FR-301, FR-302, FR-305, FR-506. 세션 시작 · 구간 넘기기 · 공유 열기 · 세션 닫기.
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { currentSegment, SEGMENT_ORDER } from "@/lib/session-state";

export const dynamic = "force-dynamic";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const { id } = await ctx.params;
  const body = await req.json().catch(() => null);
  if (!body || typeof body.action !== "string") {
    return NextResponse.json({ error: "잘못된 요청입니다" }, { status: 400 });
  }
  const { action, expectedSegment, expectedStartedAt } = body;

  return prisma.$transaction(async (tx) => {
    // All session transitions are atomic, even across two operator tabs.
    await tx.$queryRaw`SELECT 1 AS locked FROM pg_advisory_xact_lock(731204)`;

    const s = await tx.studySession.findUnique({ where: { id }, include: { segments: true } });
    if (!s) return NextResponse.json({ error: "not found" }, { status: 404 });

    const now = new Date();

    if (action === "start") {
      // 진행 중인 회차에 start가 다시 들어오면 아래 updateMany가 그 회차 구간 시각을 전부 지운다.
      // 화면에는 이 경로가 없지만 낡은 탭과 API 직접 호출이 남아 있다.
      if (s.status === "running") {
        return NextResponse.json({ error: "이미 진행 중인 회차입니다" }, { status: 400 });
      }
      // 화면에서만 막으면 API를 직접 부르는 것을 못 막는다.
      if (!s.deckUrl) {
        return NextResponse.json({ error: "장표를 올려야 시작할 수 있습니다" }, { status: 400 });
      }
      const fieldCount = await tx.formField.count({
        where: { formDef: { sessionId: id } },
      });
      if (fieldCount === 0) {
        return NextResponse.json({ error: "폼 칸이 있어야 시작할 수 있습니다" }, { status: 400 });
      }

      // 한 번에 하나만 running이다. 닫으면서 열린 구간도 같이 닫는다.
      // 안 닫으면 그 회차 마지막 구간의 ended_at이 영영 비어 구간 소요 시간이 한 칸 빈다.
      const others = await tx.studySession.findMany({
        where: { status: "running", id: { not: id } },
        include: { segments: true },
      });
      for (const o of others) {
        const open = o.segments.filter((x) => x.startedAt && !x.endedAt);
        for (const x of open) await tx.segment.update({ where: { id: x.id }, data: { endedAt: now } });
        await tx.studySession.update({ where: { id: o.id }, data: { status: "closed", sharingOpen: false } });
      }
      // 다시 시작이면 1부만 덮어 쓸 수 없다. 2부와 3부의 옛 시각이 남아 1부보다 앞선 회차가 된다.
      // 넷을 다 비우고 1부부터 새로 잰다. 이전 회차의 소요 시간은 남지 않는다.
      await Promise.all([
        tx.studySession.update({ where: { id }, data: { status: "running", sharingOpen: false } }),
        tx.segment.updateMany({
          where: { sessionId: id },
          data: { startedAt: null, endedAt: null },
        }),
        tx.segment.update({
          where: { sessionId_kind: { sessionId: id, kind: "part1" } },
          data: { startedAt: now, endedAt: null },
        }),
      ]);
      return NextResponse.json({ ok: true });
    }

    if (["next", "openSharing", "closeSharing", "close"].includes(action) && s.status !== "running") {
      return NextResponse.json({ error: "진행 중인 회차에서만 사용할 수 있습니다" }, { status: 409 });
    }

    if (action === "next") {
      const seg = currentSegment(s.segments);
      if (seg?.kind !== expectedSegment || seg?.startedAt?.toISOString() !== expectedStartedAt) {
        return NextResponse.json({ error: "구간이 이미 변경되었습니다. 현재 구간을 확인해 주세요." }, { status: 409 });
      }
      if (!seg) return NextResponse.json({ error: "no current segment" }, { status: 400 });
      const nextKind = SEGMENT_ORDER[SEGMENT_ORDER.indexOf(seg.kind) + 1];
      if (!nextKind) return NextResponse.json({ error: "last segment" }, { status: 400 });

      await Promise.all([
        tx.segment.update({
          where: { sessionId_kind: { sessionId: id, kind: seg.kind } },
          data: { endedAt: now },
        }),
        tx.segment.update({
          where: { sessionId_kind: { sessionId: id, kind: nextKind } },
          data: { startedAt: now, endedAt: null },
        }),
      ]);
      return NextResponse.json({ ok: true });
    }

    if (action === "openSharing" || action === "closeSharing") {
      await tx.studySession.update({
        where: { id },
        data: { sharingOpen: action === "openSharing" },
      });
      return NextResponse.json({ ok: true });
    }

    if (action === "close") {
      const seg = currentSegment(s.segments);
      await Promise.all([
        ...(seg
          ? [
              tx.segment.update({
                where: { sessionId_kind: { sessionId: id, kind: seg.kind } },
                data: { endedAt: now },
              }),
            ]
          : []),
        tx.studySession.update({ where: { id }, data: { status: "closed", sharingOpen: false } }),
      ]);
      // 결석은 따로 안 찍는다. 명단이 없으므로 "안 온 사람"을 계산할 근거가 없다.
      // 출석 기록이 없는 사람이 안 온 사람이다.
      return NextResponse.json({ ok: true });
    }

    if (action === "reset") {
      // 리허설을 다시 돌리기 위한 초기화. 실제 회차에서는 못 부른다.
      // 화면에서만 막으면 API를 직접 부르는 것을 못 막는다.
      if (s.weekNo !== 0) {
        return NextResponse.json({ error: "리허설 회차에서만 초기화할 수 있습니다" }, { status: 400 });
      }
      await Promise.all([
        tx.segment.updateMany({
          where: { sessionId: id },
          data: { startedAt: null, endedAt: null },
        }),
        tx.studySession.update({
          where: { id },
          data: { status: "scheduled", sharingOpen: false },
        }),
        tx.attendance.deleteMany({ where: { sessionId: id } }),
      ]);
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "unknown action" }, { status: 400 });
  });
}
