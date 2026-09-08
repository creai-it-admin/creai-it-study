// 진행 콘솔이 3초마다 부른다. FR-507, FR-508.
// 명단을 두지 않는다. 들어왔거나 폼을 연 사람이 곧 목록이다.
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { currentSegment, SEGMENT_LABEL, SEGMENT_ORDER } from "@/lib/session-state";

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
          submissions: {
            include: { answers: true, user: { select: { id: true, name: true, email: true } } },
          },
        },
      },
      attendances: { include: { user: { select: { id: true, name: true, email: true } } } },
    },
  });
  if (!s) return NextResponse.json({ error: "not found" }, { status: 404 });

  const seg = currentSegment(s.segments);
  const nextKind = seg ? SEGMENT_ORDER[SEGMENT_ORDER.indexOf(seg.kind) + 1] ?? null : null;

  const fields = s.formDef?.fields ?? [];
  const subs = s.formDef?.submissions ?? [];
  const subByUser = new Map(subs.map((x) => [x.userId, x]));
  const attByUser = new Map(s.attendances.map((a) => [a.userId, a]));

  // 들어온 사람과 폼을 연 사람을 합친다. 둘 중 하나라도 있으면 줄이 뜬다.
  const seen = new Map<string, { id: string; name: string | null; email: string }>();
  for (const a of s.attendances) seen.set(a.userId, a.user);
  for (const x of subs) seen.set(x.userId, x.user);

  const people = [...seen.values()].map((u) => {
    const sub = subByUser.get(u.id);
    const att = attByUser.get(u.id);
    const byField = new Map((sub?.answers ?? []).map((a) => [a.formFieldId, a.text]));
    return {
      key: u.id,
      userId: u.id,
      name: u.name ?? u.email,
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
  });

  people.sort((a, b) => (a.firstSeenAt ?? "").localeCompare(b.firstSeenAt ?? ""));

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
    topic: s.formDef?.topicMd ?? null,
    people,
  });
}
