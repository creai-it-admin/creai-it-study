import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Header } from "@/components/Header";
import { getRunningSession } from "@/lib/session-state";
import { DeckViewer } from "./DeckViewer";
import { DeckFrame } from "./DeckFrame";

export const dynamic = "force-dynamic";

export default async function DeckPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const running = await getRunningSession();

  return (
    <>
      <Header />
      <main className="mx-auto max-w-5xl px-5 py-8">
        <DeckFrame>
          {running?.deckUrl ? (
            <DeckViewer url={running.deckUrl} />
          ) : (
            <div className="card p-10 text-center text-[14px] text-ink-2">
              올라온 장표가 없습니다
            </div>
          )}
        </DeckFrame>
      </main>
    </>
  );
}
