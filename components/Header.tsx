import Link from "next/link";
import { auth } from "@/lib/auth";
import { getRunningSession } from "@/lib/session-state";

/** 로고는 이미지가 아니라 글자다. 원본 사이트도 텍스트로 찍는다. */
export function Logo({ sub }: { sub?: string }) {
  return (
    <div className="flex items-baseline gap-2">
      <span className="font-en text-[18px] font-semibold tracking-tight text-ink">
        CREAI<span className="text-accent">+</span>IT
      </span>
      {sub ? <span className="text-[13px] text-ink-2">{sub}</span> : null}
    </div>
  );
}

/** FR-104. 로그인한 사용자에게 지금 역할을 보여준다. */
export async function Header({ right }: { right?: React.ReactNode } = {}) {
  const session = await auth();
  const isAdmin = session?.user?.roles?.includes("admin") ?? false;
  const name = session?.user?.name ?? session?.user?.email ?? null;

  // FR-403. 1부가 끝난 뒤에도 장표를 다시 열 수 있어야 한다.
  // 주소를 직접 치게 두면 그 요구가 사실상 없는 것과 같다.
  const running = session?.user ? await getRunningSession(session.user) : null;
  const showDeck = !!running?.deckPath||!!running?._count.materials;
  const nav = "rounded-control px-2.5 py-1.5 transition-colors hover:bg-ink/5 hover:text-ink";

  return (
    <header className="chrome">
      <div className="mx-auto flex min-h-14 flex-wrap gap-3 py-3 max-w-5xl items-center justify-between px-5">
        <Link href="/routes">
          <Logo sub="AI 스터디" />
        </Link>
        <div className="flex flex-wrap items-center gap-1 text-[13px] text-ink-2">
          {name ? <Link href="/routes/mine" className={nav}>내 활동 기록</Link> : null}
          {isAdmin ? <Link href="/routes/admin" className={nav}>스터디 관리</Link> : null}
          {isAdmin ? <Link href="/routes/admin/applications" className={nav}>참가 신청자</Link> : null}
          {isAdmin ? <Link href="/routes/admin/library" className={nav}>공통 자료실</Link> : null}
          {isAdmin ? <Link href="/docs" className={nav}>Docsboard</Link> : null}
          {running ? <Link href={`/routes/sessions/${running.id}/activity`} className={nav}>인클래스</Link> : null}
          {showDeck ? <Link href="/routes/deck" className={nav}>장표</Link> : null}
          {name ? (
            <span className="ml-2 mr-1 flex items-center gap-2">
              <span className={isAdmin ? "pill px-2 text-[12px] font-medium" : "pill pill-muted px-2 text-[12px]"}>
                {isAdmin ? "운영진" : "참가자"}
              </span>
              <span className="text-ink-3">{name}</span>
            </span>
          ) : null}
          {right}
        </div>
      </div>
    </header>
  );
}
