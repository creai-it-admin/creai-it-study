// FR-505, FR-506. sharing_open이 거짓이면 남의 제출물을 서버가 주지 않는다.
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getRunningSession } from "@/lib/session-state";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const running = await getRunningSession();
  if (!running) return NextResponse.json({ open: false, items: [] });

  const formDef = await prisma.formDef.findUnique({
    where: { sessionId: running.id },
    include: { fields: { orderBy: { order: "asc" } } },
  });
  if (!formDef) return NextResponse.json({ open: running.sharingOpen, items: [] });

  // 공유가 닫혀 있으면 자기 것만 준다.
  const where = running.sharingOpen
    ? { formDefId: formDef.id, status: "submitted" as const }
    : { formDefId: formDef.id, userId: session.user.id };

  const subs = await prisma.submission.findMany({
    where,
    include: { user: { select: { id: true, name: true } }, answers: true },
    orderBy: { submittedAt: "asc" },
  });

  return NextResponse.json({
    open: running.sharingOpen,
    topicMd: formDef.topicMd,
    fields: formDef.fields,
    items: subs.map((s) => ({
      userId: s.user.id,
      name: s.user.name ?? "이름 없음",
      mine: s.user.id === session.user.id,
      status: s.status,
      answers: Object.fromEntries(s.answers.map((a) => [a.formFieldId, a.text])),
    })),
  });
}
