import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { LoginForm } from "./LoginForm";
import { Logo } from "@/components/Header";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ consent?: string }>;
}) {
  const sp = await searchParams;
  const session = await auth();
  // 이미 동의한 계정에는 다시 안 보여준다.
  if (session?.user?.consented) redirect("/");

  return (
    <main className="flex min-h-dvh items-center justify-center px-5">
      <div className="card w-full max-w-[420px] p-8">
        <div className="mb-7 flex flex-col items-start gap-3">
          <Logo />
          <h1 className="text-[22px] font-semibold tracking-tight">AI 스터디 0기</h1>
        </div>

        {sp.consent ? (
          <p className="mb-4 rounded-lg bg-accent-soft px-3 py-2 text-[13px] text-accent-strong">
            동의가 저장되지 않았습니다. 아래에서 다시 확인해 주세요.
          </p>
        ) : null}

        <LoginForm />
      </div>
    </main>
  );
}
