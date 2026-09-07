// 진행 콘솔이 3초마다 부른다. FR-507.
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { currentSegment, SEGMENT_LABEL, SEGMENT_ORDER } from "@/lib/session-state";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const s = await prisma.studySession.findUnique({
    where: { id },
    include: {
      segments: true,
      formDef: { include: { fields: true, submissions: { include: { user: true, answers: true } } } },
      attendances: { include: { user: true } },
    },
  });
  if (!s) return NextResponse.json({ error: "not found" }, { status: 404 });

  const seg = currentSegment(s.segments);
  const nextKind = seg ? SEGMENT_ORDER[SEGMENT_ORDER.indexOf(seg.kind) + 1] ?? null : null;

  const fieldCount = s.formDef?.fields.length ?? 0;
  const submissions = (s.formDef?.submissions ?? []).map((sub) => {
    const filled = sub.answers.filter((a) => a.text.trim().length > 0).length;
    return {
      userId: sub.userId,
      name: sub.user.name ?? sub.user.email,
      status: sub.status,
      filled,
      total: fieldCount,
    };
  });

  return NextResponse.json({
    serverTime: new Date().toISOString(),
    session: {
      id: s.id,
      weekNo: s.weekNo,
      status: s.status,
      sharingOpen: s.sharingOpen,
      deckUrl: s.deckUrl,
    },
    segment: seg
      ? {
          kind: seg.kind,
          label: SEGMENT_LABEL[seg.kind],
          startedAt: seg.startedAt?.toISOString() ?? null,
          plannedMin: seg.plannedMin,
        }
      : null,
    nextSegment: nextKind ? { kind: nextKind, label: SEGMENT_LABEL[nextKind] } : null,
    attendance: s.attendances.map((a) => ({
      userId: a.userId,
      name: a.user.name ?? a.user.email,
      state: a.state,
      firstSeenAt: a.firstSeenAt.toISOString(),
    })),
    submissions,
  });
}
