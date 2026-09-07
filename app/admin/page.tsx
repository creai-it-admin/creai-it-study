import { prisma } from "@/lib/prisma";
import { SessionRow } from "./SessionRow";

export const dynamic = "force-dynamic";

export default async function AdminHome() {
  const sessions = await prisma.studySession.findMany({
    orderBy: { weekNo: "asc" },
    include: { formDef: { include: { fields: true } } },
  });

  return (
    <main className="mx-auto max-w-4xl px-5 py-8">
      <h1 className="mb-6 text-[20px] font-semibold tracking-tight">회차</h1>
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
