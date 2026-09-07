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
    // 한 번에 하나만 running이다.
    await prisma.studySession.updateMany({
      where: { status: "running", id: { not: id } },
      data: { status: "closed" },
    });
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
    // FR-602. 세션이 닫힐 때까지 로그인하지 않은 참가자는 absent다.
    const participants = await prisma.user.findMany({
      where: { roles: { has: "participant" } },
      select: { id: true },
    });
    const seen = await prisma.attendance.findMany({
      where: { sessionId: id },
      select: { userId: true },
    });
    const seenSet = new Set(seen.map((a) => a.userId));
    const missing = participants.filter((p) => !seenSet.has(p.id));
    if (missing.length) {
      await prisma.attendance.createMany({
        data: missing.map((p) => ({ sessionId: id, userId: p.id, state: "absent" as const })),
        skipDuplicates: true,
      });
    }
    return NextResponse.json({ ok: true });
  }

  if (action === "reset") {
    // 리허설을 다시 돌리기 위한 초기화.
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
