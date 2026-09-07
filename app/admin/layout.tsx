// /admin 경로는 admin 역할이 없으면 403이다.
import { requireAdmin } from "@/lib/auth";
import { Header } from "@/components/Header";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();
  if (!admin) {
    return (
      <>
        <Header />
        <main className="mx-auto max-w-3xl px-5 py-20">
          <div className="card p-10 text-center">
            <p className="text-[15px] font-medium">403</p>
            <p className="mt-2 text-[13.5px] text-ink-2">운영진만 볼 수 있는 화면입니다.</p>
          </div>
        </main>
      </>
    );
  }
  return (
    <>
      <Header right={<span>운영진</span>} />
      {children}
    </>
  );
}
