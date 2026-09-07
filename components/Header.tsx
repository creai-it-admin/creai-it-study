import Link from "next/link";

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

export function Header({ right }: { right?: React.ReactNode }) {
  return (
    <header className="border-b border-line bg-surface">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-5">
        <Link href="/">
          <Logo sub="AI 스터디 0기" />
        </Link>
        <div className="flex items-center gap-3 text-[13px] text-ink-2">{right}</div>
      </div>
    </header>
  );
}
