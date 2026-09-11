import { auth } from "@/lib/auth";
import Link from "next/link";
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
  // 이미 로그인된 계정에는 폼을 다시 안 보여준다.
  // 여기서 리디렉션하면 /home에서 뒤로 가기를 눌렀을 때 다시 앞으로 튕겨서
  // 뒤로 가기가 영영 안 먹는 것처럼 보인다. 그래서 안내만 띄운다.
  if (session?.user?.consented) {
    return (
      <main className="flex min-h-dvh items-center justify-center px-5 py-8">
        <div className="card w-full max-w-[420px] p-8">
          <div className="mb-6">
            <Logo />
          </div>
          <p className="mb-6 text-[14.5px] text-ink-2">
            {session.user.name ?? session.user.email}(으)로 로그인되어 있습니다.
          </p>
          <Link href="/routes" className="btn btn-primary w-full">
            들어가기
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-dvh items-center justify-center px-5 py-8">
      <div className="card w-full max-w-[420px] p-8">
        <div className="mb-7 flex flex-col items-start gap-3">
          <Logo />
          <h1 className="text-[22px] font-semibold tracking-tight">AI 스터디</h1>
        </div>

        {sp.consent ? (
          <p className="mb-4 rounded-lg bg-accent-soft px-3 py-2 text-[13px] text-accent-strong">
            동의가 저장되지 않았습니다. 아래에서 다시 확인해 주세요.
          </p>
        ) : null}

        <LoginForm consentRequired={!!sp.consent} />
      </div>
    </main>
  );
}
