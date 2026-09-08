"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

const STATUS_LABEL: Record<string, string> = {
  scheduled: "예정",
  running: "진행 중",
  closed: "끝남",
};

export function SessionRow({
  id,
  weekNo,
  date,
  status,
  deckUrl,
  fieldCount,
}: {
  id: string;
  weekNo: number;
  date: string;
  status: string;
  deckUrl: string | null;
  fieldCount: number;
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<string | null>(null);

  const title = weekNo === 0 ? "리허설" : `${weekNo}주차`;
  const dateLabel = new Date(date).toLocaleDateString("ko-KR", {
    month: "long",
    day: "numeric",
    timeZone: "Asia/Seoul",
  });

  // 파일은 서버를 안 거치고 Supabase로 바로 간다. Vercel 요청 본문 상한(4.5MB)을 피한다.
  async function upload(file: File) {
    setBusy(true);
    setError(null);
    setProgress("주소 받는 중");
    try {
      const signRes = await fetch(`/api/admin/session/${id}/deck/sign`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ size: file.size, type: file.type }),
      });
      const sign = await signRes.json();
      if (!signRes.ok) throw new Error(sign.error ?? "주소를 받지 못했습니다");

      setProgress("올리는 중");
      const put = await fetch(sign.signedUrl, {
        method: "PUT",
        headers: { "content-type": "application/pdf" },
        body: file,
      });
      if (!put.ok) throw new Error("올리다 실패했습니다");

      setProgress("확인 중");
      const saveRes = await fetch(`/api/admin/session/${id}/deck`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ path: sign.path }),
      });
      const saved = await saveRes.json();
      if (!saveRes.ok) throw new Error(saved.error ?? "기록에 실패했습니다");

      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setProgress(null);
      setBusy(false);
    }
  }

  async function control(action: string) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/session/${id}/control`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "실패했습니다");
      if (action === "start") router.push(`/admin/run/${id}`);
      else router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card flex flex-col gap-3 p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-baseline gap-3">
          <span className="text-[15px] font-semibold">{title}</span>
          <span className="text-[13px] text-ink-2">{dateLabel}</span>
          <span className="rounded-md bg-accent-soft px-2 py-0.5 text-[11.5px] text-accent-strong">
            {STATUS_LABEL[status] ?? status}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {status === "running" ? (
            <a className="btn btn-primary" href={`/admin/run/${id}`}>
              진행 콘솔
            </a>
          ) : status === "closed" ? (
            // 닫힌 회차를 다시 시작하면 구간 시각이 덮인다. 실수로 못 누르게 확인을 받는다.
            <button
              className="btn"
              disabled={busy}
              onClick={() => {
                if (confirm("이미 끝난 회차입니다. 다시 시작하면 구간 시각이 덮입니다. 계속할까요?"))
                  control("start");
              }}
            >
              다시 시작
            </button>
          ) : (
            <button className="btn btn-primary" disabled={busy || !deckUrl || fieldCount === 0} onClick={() => control("start")}>
              세션 시작
            </button>
          )}
          {weekNo === 0 ? (
            <button className="btn" disabled={busy} onClick={() => control("reset")}>
              초기화
            </button>
          ) : null}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 text-[13px] text-ink-2">
        <span>
          장표{" "}
          {deckUrl ? (
            <a className="text-accent-strong" href={deckUrl} target="_blank" rel="noreferrer">
              올라감
            </a>
          ) : (
            <span className="text-ink-3">없음</span>
          )}
        </span>
        <span>폼 칸 {fieldCount}개</span>
        <input
          ref={fileRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) upload(f);
            e.target.value = "";
          }}
        />
        <button className="btn" disabled={busy} onClick={() => fileRef.current?.click()}>
          {progress ?? (deckUrl ? "장표 바꾸기" : "장표 올리기")}
        </button>
      </div>

      {!deckUrl || fieldCount === 0 ? (
        <p className="text-[12.5px] text-ink-3">
          {!deckUrl && fieldCount === 0
            ? "장표와 폼 칸이 있어야 세션을 시작할 수 있습니다."
            : !deckUrl
              ? "장표를 올려야 세션을 시작할 수 있습니다."
              : "이 회차 폼 칸이 아직 없습니다. 시드로 넣어야 합니다."}
        </p>
      ) : null}
      {error ? <p className="text-[12.5px] text-[color:var(--warn)]">{error}</p> : null}
    </div>
  );
}
