import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Header } from "@/components/Header";
import { HomeWatcher } from "./HomeWatcher";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const isAdmin = session.user.roles?.includes("admin");

  return (
    <>
      <Header right={isAdmin ? <Link href="/admin" className="hover:text-ink">운영</Link> : null} />
      <main className="mx-auto max-w-5xl px-5 py-16">
        <div className="card p-10 text-center">
          <p className="text-[15px] text-ink-2">오늘은 세션이 없습니다</p>
        </div>
      </main>
      <HomeWatcher />
    </>
  );
}
