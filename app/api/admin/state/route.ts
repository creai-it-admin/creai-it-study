// 진행 콘솔이 3초마다 부른다. FR-507, FR-508, FR-603.
// 명단 전원을 한 줄씩 보여준다. 아직 계정이 없는 사람도 나와야 누가 안 왔는지 안다.
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { currentSegment, SEGMENT_LABEL, SEGMENT_ORDER } from "@/lib/session-state";
import { rosterEntries, rosterSize } from "@/lib/roster";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  // 미들웨어가 이미 막지만 여기서도 막는다. 답변 본문 전량이 나가는 자리라 한 겹으로 두지 않는다.
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const s = await prisma.studySession.findUnique({
    where: { id },
    include: {
      segments: true,
      formDef: {
        include: {
          fields: { orderBy: { order: "asc" } },
          submissions: { include: { answers: true } },
        },
      },
      attendances: { include: { user: { select: { id: true, name: true, email: true } } } },
    },
  });
  if (!s) return NextResponse.json({ error: "not found" }, { status: 404 });

  const seg = currentSegment(s.segments);
  const nextKind = seg ? SEGMENT_ORDER[SEGMENT_ORDER.indexOf(seg.kind) + 1] ?? null : null;

  const entries = await rosterEntries();
  const fields = s.formDef?.fields ?? [];
  const subByUser = new Map((s.formDef?.submissions ?? []).map((x) => [x.userId, x]));
  const attByUser = new Map(s.attendances.map((a) => [a.userId, a]));

  function row(key: string, name: string, userId: string | null, onRoster: boolean) {
    const sub = userId ? subByUser.get(userId) : undefined;
    const att = userId ? attByUser.get(userId) : undefined;
    const byField = new Map((sub?.answers ?? []).map((a) => [a.formFieldId, a.text]));
    return {
      key,
      userId,
      name,
      onRoster,
      attendance: att ? att.state : "미접속",
      firstSeenAt: att?.firstSeenAt?.toISOString() ?? null,
      submissionStatus: sub?.status ?? "none",
      filled: sub ? sub.answers.filter((a) => a.text.trim().length > 0).length : 0,
      total: fields.length,
      // FR-508. 제출 전에도 본문을 보여준다. 누가 막혔는지 알아야 개입한다.
      answers: fields.map((f) => ({
        fieldId: f.id,
        order: f.order,
        question: f.question,
        text: byField.get(f.id) ?? "",
      })),
    };
  }

  const known = new Set(entries.filter((e) => e.user).map((e) => e.user!.id));
  const people = [
    ...entries.map((e) =>
      row(e.user?.id ?? e.email, e.user?.name ?? e.email, e.user?.id ?? null, true)
    ),
    // 명단 밖인데 들어온 사람도 뒤에 붙인다. 모르는 이름이 보여야 알아챈다.
    ...s.attendances
      .filter((a) => !known.has(a.userId))
      .map((a) => row(a.userId, a.user.name ?? a.user.email, a.userId, false)),
  ];

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
    topic: s.formDef?.topicMd ?? null,
    people,
  });
}
