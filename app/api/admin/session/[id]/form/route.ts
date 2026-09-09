import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formLockedReason, formVersion, parseFormInput } from "@/lib/form-editor";

export async function PUT(req: Request, ctx: { params: Promise<{ id: string }> }) {
  if (!await requireAdmin()) return NextResponse.json({ error: "운영진만 수정할 수 있습니다." }, { status: 403 });
  const input = parseFormInput(await req.json().catch(() => null));
  if (!input) return NextResponse.json({ error: "주제와 질문을 입력해 주세요. 같은 질문 ID를 중복으로 보낼 수 없습니다." }, { status: 400 });
  const { id } = await ctx.params;
  return prisma.$transaction(async (tx) => {
    // 세션 시작과 폼 편집이 같은 잠금을 사용한다. 시작 직후 질문이 바뀌지 않는다.
    await tx.$queryRaw`SELECT 1 AS locked FROM pg_advisory_xact_lock(731204)`;
    const session = await tx.studySession.findUnique({
      where: { id }, include: { formDef: { include: { fields: true, _count: { select: { submissions: true } } } } },
    });
    if (!session) return NextResponse.json({ error: "회차를 찾을 수 없습니다." }, { status: 404 });
    const reason = formLockedReason(session.status, session.formDef?._count.submissions ?? 0);
    if (reason) return NextResponse.json({ error: reason }, { status: 409 });
    if (input.version !== formVersion(session.formDef)) {
      return NextResponse.json({ error: "다른 창에서 폼이 변경됐습니다. 입력 내용을 복사한 뒤 새로고침해 주세요." }, { status: 409 });
    }
    const existing = session.formDef?.fields ?? [];
    const validIds = new Set(existing.map((f) => f.id));
    if (input.fields.some((f) => f.id && !validIds.has(f.id))) {
      return NextResponse.json({ error: "이 회차에 없는 질문입니다." }, { status: 400 });
    }
    const form = await tx.formDef.upsert({
      where: { sessionId: id }, create: { sessionId: id, topicMd: input.topicMd }, update: { topicMd: input.topicMd },
    });
    const retained = input.fields.flatMap((f) => f.id ? [f.id] : []);
    await tx.formField.deleteMany({ where: { formDefId: form.id, id: { notIn: retained } } });
    // 순서의 unique 제약을 지키면서 기존 질문 ID를 보존한다.
    for (const [index, field] of existing.filter((f) => retained.includes(f.id)).entries()) {
      await tx.formField.update({ where: { id: field.id }, data: { order: -(index + 1) } });
    }
    for (const [index, field] of input.fields.entries()) {
      const data = { question: field.question, order: index + 1 };
      if (field.id) await tx.formField.update({ where: { id: field.id }, data });
      else await tx.formField.create({ data: { ...data, formDefId: form.id } });
    }
    const saved = await tx.formDef.findUniqueOrThrow({ where: { id: form.id }, include: { fields: { orderBy: { order: "asc" } } } });
    return NextResponse.json({ form: saved, version: formVersion(saved) });
  });
}
