import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formLockedReason, formVersion } from "@/lib/form-editor";
import { FormEditor } from "./FormEditor";

export const dynamic = "force-dynamic";
export default async function SessionPreparation({ params }: { params: Promise<{ id: string }> }) {
  if (!await requireAdmin()) redirect("/routes/admin");
  const { id } = await params;
  const session = await prisma.studySession.findUnique({ where: { id }, include: { study:true,
    formDef: { include: { fields: { orderBy: { order: "asc" } }, _count: { select: { submissions: true } } } },
  } });
  if (!session) notFound();
  return <main className="mx-auto max-w-4xl px-5 py-8">
    <Link href={`/routes/admin/studies/${session.studyId}`} className="text-[13px] text-accent-strong">{session.study.name} 회차 목록</Link>
    <h1 className="mt-4 mb-2 text-[20px] font-semibold">{session.weekNo === 0 ? "리허설" : `${session.weekNo}주차`} 주제와 폼</h1>
    <p className="mb-6 text-[14px] text-ink-2">시작 전 회차의 주제와 질문을 준비합니다. 작성 기록이 생기면 폼을 잠가 답변을 보존합니다.</p>
    <FormEditor key={id} sessionId={id} initialTopic={session.formDef?.topicMd ?? ""} initialFields={session.formDef?.fields ?? []}
      initialVersion={formVersion(session.formDef)} lockedReason={formLockedReason(session.status, session.formDef?._count.submissions ?? 0)} />
  </main>;
}
