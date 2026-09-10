import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Header } from "@/components/Header";
import { formatDate, getMySubmissions, sessionTitle } from "@/lib/history";

export const dynamic = "force-dynamic";
export default async function MinePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const submissions = await getMySubmissions(session.user.id, session.user.roles);
  return <>
    {await Header()}
    <main className="mx-auto max-w-4xl px-5 py-8">
      <h1 className="text-[20px] font-semibold">지난 내 제출물</h1>
      <p className="mt-2 mb-6 text-[14px] text-ink-2">끝난 회차의 내 제출물만 표시합니다. 종료 후에는 수정할 수 없습니다.</p>
      {submissions.length === 0 ? <div className="card p-8 text-[14px] text-ink-2">끝난 회차에 제출한 답변이 아직 없습니다.</div> :
        <div className="flex flex-col gap-5">{submissions.map((sub) => {
          const answers = new Map(sub.answers.map((a) => [a.formFieldId, a.text]));
          return <article key={sub.id} className="card p-5">
            <h2 className="text-[17px] font-semibold">{sub.formDef.session.study.name} · {sessionTitle(sub.formDef.session.weekNo)}</h2>
            <p className="mt-1 text-[12px] text-ink-2">제출 {formatDate(sub.submittedAt)}</p>
            <p className="my-4 whitespace-pre-wrap border-b border-line pb-4 text-[14px]">{sub.formDef.topicMd}</p>
            <dl className="flex flex-col gap-5">{sub.formDef.fields.map((field, i) => <div key={field.id}>
              <dt className="mb-1 text-[13px] text-ink-2">{i + 1}. {field.question}</dt>
              <dd className="whitespace-pre-wrap break-words text-[14px]">{answers.get(field.id)?.trim() || "비어 있음"}</dd>
            </div>)}</dl>
          </article>;
        })}</div>}
      <Link href="/" className="btn mt-6">현재 세션으로</Link>
    </main>
  </>;
}
