// FR-502 자동 저장, FR-504 제출. 자기 것만 쓸 수 있다.
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getRunningSession } from "@/lib/session-state";

export const dynamic = "force-dynamic";

async function ownSubmission(userId: string) {
  const running = await getRunningSession();
  if (!running) return null;
  const formDef = await prisma.formDef.findUnique({
    where: { sessionId: running.id },
    include: { fields: { orderBy: { order: "asc" } } },
  });
  if (!formDef) return null;

  const submission = await prisma.submission.upsert({
    where: { formDefId_userId: { formDefId: formDef.id, userId } },
    create: { formDefId: formDef.id, userId },
    update: {},
    include: { answers: true },
  });
  return { formDef, submission };
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const data = await ownSubmission(session.user.id);
  if (!data) return NextResponse.json({ formDef: null });

  return NextResponse.json({
    formDef: { topicMd: data.formDef.topicMd, fields: data.formDef.fields },
    submission: {
      status: data.submission.status,
      answers: Object.fromEntries(data.submission.answers.map((a) => [a.formFieldId, a.text])),
    },
  });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = (await req.json()) as { answers?: Record<string, string>; submit?: boolean };
  const data = await ownSubmission(session.user.id);
  if (!data) return NextResponse.json({ error: "no-form" }, { status: 400 });

  const validIds = new Set(data.formDef.fields.map((f) => f.id));
  const entries = Object.entries(body.answers ?? {}).filter(([id]) => validIds.has(id));

  await prisma.$transaction([
    ...entries.map(([formFieldId, text]) =>
      prisma.answer.upsert({
        where: { submissionId_formFieldId: { submissionId: data.submission.id, formFieldId } },
        create: { submissionId: data.submission.id, formFieldId, text },
        update: { text },
      })
    ),
    prisma.submission.update({
      where: { id: data.submission.id },
      data: body.submit ? { status: "submitted", submittedAt: new Date() } : {},
    }),
  ]);

  return NextResponse.json({ ok: true, submitted: !!body.submit });
}
