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
  const { action } = (await req.json()) as { action: string };

  const s = await prisma.studySession.findUnique({ where: { id }, include: { segments: true } });
  if (!s) return NextResponse.json({ error: "not found" }, { status: 404 });

  const now = new Date();

  if (action === "start") {
    // 화면에서만 막으면 API를 직접 부르는 것을 못 막는다.
    if (!s.deckUrl) {
      return NextResponse.json({ error: "장표를 올려야 시작할 수 있습니다" }, { status: 400 });
    }
    const fieldCount = await prisma.formField.count({
      where: { formDef: { sessionId: id } },
    });
    if (fieldCount === 0) {
      return NextResponse.json({ error: "폼 칸이 있어야 시작할 수 있습니다" }, { status: 400 });
    }

    // 한 번에 하나만 running이다. 닫으면서 열린 구간도 같이 닫는다.
    // 안 닫으면 그 회차 마지막 구간의 ended_at이 영영 비어 구간 소요 시간이 한 칸 빈다.
    const others = await prisma.studySession.findMany({
      where: { status: "running", id: { not: id } },
      include: { segments: true },
    });
    for (const o of others) {
      const open = o.segments.filter((x) => x.startedAt && !x.endedAt);
      await prisma.$transaction([
        ...open.map((x) =>
          prisma.segment.update({ where: { id: x.id }, data: { endedAt: now } })
        ),
        prisma.studySession.update({ where: { id: o.id }, data: { status: "closed" } }),
      ]);
    }
    await prisma.$transaction([
      prisma.studySession.update({ where: { id }, data: { status: "running", sharingOpen: false } }),
      prisma.segment.update({
        where: { sessionId_kind: { sessionId: id, kind: "part1" } },
        data: { startedAt: now, endedAt: null },
      }),
    ]);
    return NextResponse.json({ ok: true });
  }

  if (action === "next") {
    const seg = currentSegment(s.segments);
    if (!seg) return NextResponse.json({ error: "no current segment" }, { status: 400 });
    const nextKind = SEGMENT_ORDER[SEGMENT_ORDER.indexOf(seg.kind) + 1];
    if (!nextKind) return NextResponse.json({ error: "last segment" }, { status: 400 });

    await prisma.$transaction([
      prisma.segment.update({
        where: { sessionId_kind: { sessionId: id, kind: seg.kind } },
        data: { endedAt: now },
      }),
      prisma.segment.update({
        where: { sessionId_kind: { sessionId: id, kind: nextKind } },
        data: { startedAt: now, endedAt: null },
      }),
    ]);
    return NextResponse.json({ ok: true });
  }

  if (action === "openSharing" || action === "closeSharing") {
    await prisma.studySession.update({
      where: { id },
      data: { sharingOpen: action === "openSharing" },
    });
    return NextResponse.json({ ok: true });
  }

  if (action === "close") {
    const seg = currentSegment(s.segments);
    await prisma.$transaction([
      ...(seg
        ? [
            prisma.segment.update({
              where: { sessionId_kind: { sessionId: id, kind: seg.kind } },
              data: { endedAt: now },
            }),
          ]
        : []),
      prisma.studySession.update({ where: { id }, data: { status: "closed", sharingOpen: false } }),
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
    await prisma.$transaction([
      prisma.segment.updateMany({
        where: { sessionId: id },
        data: { startedAt: null, endedAt: null },
      }),
      prisma.studySession.update({
        where: { id },
        data: { status: "scheduled", sharingOpen: false },
      }),
      prisma.attendance.deleteMany({ where: { sessionId: id } }),
    ]);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "unknown action" }, { status: 400 });
}
