import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SessionRow } from "./SessionRow";

export const dynamic = "force-dynamic";

export default async function AdminHome() {
  if (!await requireAdmin()) redirect("/login");
  const sessions = await prisma.studySession.findMany({
    orderBy: { weekNo: "asc" },
    include: { formDef: { include: { fields: true } } },
  });

  return (
    <main className="mx-auto max-w-4xl px-5 py-8">
      <div className="mb-6 flex items-center justify-between gap-4">
        <h1 className="text-[20px] font-semibold tracking-tight">회차</h1>
        <Link href="/admin/data" className="btn">종료된 회차 결과</Link>
      </div>
      <div className="flex flex-col gap-3">
        {sessions.map((s) => (
          <SessionRow
            key={s.id}
            id={s.id}
            weekNo={s.weekNo}
            date={s.date.toISOString()}
            status={s.status}
            deckUrl={s.deckUrl}
            fieldCount={s.formDef?.fields.length ?? 0}
          />
        ))}
      </div>
    </main>
  );
}
