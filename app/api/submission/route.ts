import {sessionAccessWhere,type StudyViewer} from '@/lib/study-access';
// FR-502 자동 저장, FR-504 제출. 자기 것만 쓸 수 있다.
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

async function ownSubmission(user: StudyViewer) {
  const userId=user.id;
  return prisma.$transaction(async (tx) => {
    // 폼을 여는 요청도 편집·시작·종료와 엇갈리지 않게 한다.
    await tx.$queryRaw`SELECT 1 AS locked FROM pg_advisory_xact_lock_shared(731204)`;
    const running = await tx.studySession.findFirst({ where: { status: "running", ...sessionAccessWhere(user) }, orderBy: { date: "asc" } });
    if (!running) return null;
    const formDef = await tx.formDef.findUnique({
      where: { sessionId: running.id }, include: { fields: { orderBy: { order: "asc" } } },
    });
    if (!formDef) return null;
    const submission = await tx.submission.upsert({
      where: { formDefId_userId: { formDefId: formDef.id, userId } },
      create: { formDefId: formDef.id, userId }, update: {}, include: { answers: true },
    });
    return { formDef, submission };
  });
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const data = await ownSubmission(session.user);
  if (!data) return NextResponse.json({ formDef: null });

  return NextResponse.json({
    submissionId: data.submission.id,
    formDef: { topicMd: data.formDef.topicMd, fields: data.formDef.fields },
    submission: {
      status: data.submission.status,
      version: data.submission.updatedAt.toISOString(),
      answers: Object.fromEntries(data.submission.answers.map((a) => [a.formFieldId, a.text])),
    },
  });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body || typeof body.submissionId !== "string" || typeof body.version !== "string" ||
      !Number.isFinite(Date.parse(body.version)) || typeof body.submit !== "boolean" ||
      !body.answers || typeof body.answers !== "object" || Array.isArray(body.answers) ||
      Object.values(body.answers).some((value) => typeof value !== "string")) {
    return NextResponse.json({ error: "잘못된 저장 요청입니다. 새로고침 후 다시 시도해 주세요." }, { status: 400 });
  }
  const entries = Object.entries(body.answers) as [string, string][];
  return prisma.$transaction(async (tx) => {
    // Session controls take the exclusive lock; saves cannot cross a close/start boundary.
    await tx.$queryRaw`SELECT 1 AS locked FROM pg_advisory_xact_lock_shared(731204)`;
    // Serialize writes to this submission, including requests whose browser timed out.
    await tx.$queryRaw`SELECT "id" FROM "Submission" WHERE "id" = ${body.submissionId} FOR UPDATE`;
    const submission = await tx.submission.findFirst({
      where: { id: body.submissionId, userId: session.user.id, formDef:{session:sessionAccessWhere(session.user)} },
      include: { answers: true, formDef: { include: { fields: true, session: true } } },
    });
    if (!submission) return NextResponse.json({ error: "제출물을 찾을 수 없습니다." }, { status: 404 });
    if (submission.formDef.session.status !== "running") {
      return NextResponse.json({ error: "회차가 종료되어 저장하지 못했습니다. 초안은 이 브라우저에 보관됩니다." }, { status: 409 });
    }
    const validIds = new Set(submission.formDef.fields.map((f) => f.id));
    if (entries.length !== validIds.size || entries.some(([id]) => !validIds.has(id))) {
      return NextResponse.json({ error: "폼 구성이 바뀌었습니다. 초안을 복사한 뒤 새로고침해 주세요." }, { status: 409 });
    }
    const version = submission.updatedAt.toISOString();
    if (version !== body.version) {
      // The previous request may have committed even though its response was lost.
      const saved = new Map(submission.answers.map((a) => [a.formFieldId, a.text]));
      if (entries.every(([id, text]) => (saved.get(id) ?? "") === text) &&
          (!body.submit || submission.status === "submitted")) {
        return NextResponse.json({ ok: true, version, submitted: submission.status === "submitted" });
      }
      return NextResponse.json({
        error: "다른 저장 내용과 충돌했습니다. 현재 글을 확인한 뒤 다시 제출해 주세요. 초안은 보관됩니다.", version,
      }, { status: 409 });
    }
    for (const [formFieldId, text] of entries) {
      await tx.answer.upsert({
        where: { submissionId_formFieldId: { submissionId: submission.id, formFieldId } },
        create: { submissionId: submission.id, formFieldId, text }, update: { text },
      });
    }
    const updated = await tx.submission.update({
      where: { id: submission.id },
      data: {
        updatedAt: new Date(Math.max(Date.now(), submission.updatedAt.getTime() + 1)),
        ...(body.submit ? { status: "submitted", submittedAt: new Date() } : {}),
      },
    });
    return NextResponse.json({ ok: true, version: updated.updatedAt.toISOString(), submitted: updated.status === "submitted" });
  });
}
