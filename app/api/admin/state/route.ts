// 진행 콘솔이 3초마다 부른다. FR-507.
// 명단 전원을 한 줄씩 보여준다. 폼을 아직 안 연 사람도 보여야 진행자가 챙길 수 있다.
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { currentSegment, SEGMENT_LABEL, SEGMENT_ORDER } from "@/lib/session-state";
import { rosterUsers, rosterSize } from "@/lib/roster";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const s = await prisma.studySession.findUnique({
    where: { id },
    include: {
      segments: true,
      formDef: { include: { fields: true, submissions: { include: { answers: true } } } },
      attendances: true,
    },
  });
  if (!s) return NextResponse.json({ error: "not found" }, { status: 404 });

  const seg = currentSegment(s.segments);
  const nextKind = seg ? SEGMENT_ORDER[SEGMENT_ORDER.indexOf(seg.kind) + 1] ?? null : null;

  const roster = await rosterUsers();
  const fieldCount = s.formDef?.fields.length ?? 0;
  const subByUser = new Map((s.formDef?.submissions ?? []).map((x) => [x.userId, x]));
  const attByUser = new Map(s.attendances.map((a) => [a.userId, a]));

  // 명단 전원 + 명단 밖인데 들어온 사람도 뒤에 붙인다. 모르는 이름이 보여야 알아챈다.
  const known = new Set(roster.map((u) => u.id));
  const strangers = s.attendances
    .filter((a) => !known.has(a.userId))
    .map((a) => ({ id: a.userId, name: null as string | null, email: "" }));

  const people = [...roster, ...strangers].map((u) => {
    const sub = subByUser.get(u.id);
    const att = attByUser.get(u.id);
    const filled = sub ? sub.answers.filter((a) => a.text.trim().length > 0).length : 0;
    return {
      userId: u.id,
      name: u.name ?? u.email ?? "이름 없음",
      onRoster: known.has(u.id),
      attendance: att ? att.state : "미접속",
      firstSeenAt: att?.firstSeenAt?.toISOString() ?? null,
      submissionStatus: sub?.status ?? "none",
      filled,
      total: fieldCount,
    };
  });

  return NextResponse.json({
    serverTime: new Date().toISOString(),
    rosterSize: rosterSize(),
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
    people,
  });
}
