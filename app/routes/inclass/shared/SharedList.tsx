"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useLiveState } from "@/components/useLiveState";
import { SessionStatus } from "@/components/SessionStatus";

type Field = { id: string; order: number; question: string };
type Item = {
  userId: string;
  name: string;
  mine: boolean;
  status: string;
  answers: Record<string, string>;
};

export function SharedList() {
  const { state } = useLiveState();
  const [open, setOpen] = useState(false);
  const [topic, setTopic] = useState<string | null>(null);
  const [fields, setFields] = useState<Field[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  // null은 아직 서버 답을 못 받은 상태다. false로 두면 첫 폴링이 실패했을 때
  // 아직 제출 안 한 사람이 폼으로 돌아갈 길을 잃는다. 모를 때는 띄우는 쪽으로 둔다.
  const [live, setLive] = useState<boolean | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let alive = true;
    async function load() {
      try {
        const res = await fetch("/api/shared", { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        if (!alive) return;
        setOpen(data.open);
        setTopic(data.topicMd ?? null);
        setFields(data.fields ?? []);
        setItems(data.items ?? []);
        setLive(Boolean(data.live));
      } catch {
        /* 조용히 다시 시도한다 */
      } finally {
        if (alive) setLoaded(true);
      }
    }
    load();
    const id = setInterval(load, 3000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  if (!loaded) return <div className="card p-10 text-center text-[13px] text-ink-3">불러오는 중</div>;

  return (
    <div className="flex flex-col gap-5">
      <SessionStatus state={state} />

      {topic ? (
        <div className="card p-5">
          <p className="text-[15px] leading-relaxed font-medium">{topic}</p>
        </div>
      ) : null}

      {!open ? (
        <div className="card p-10 text-center text-[14px] text-ink-2">
          공유가 열리면 다른 사람 것이 보입니다
        </div>
      ) : null}

      {/* 아직 제출 안 한 사람이 폼으로 돌아갈 길. 없으면 여기서 갇힌다.
          폼을 한 번도 안 연 사람은 제출물 행 자체가 없으므로 "내 것이 없을 때"도 포함한다.
          회차가 끝나면 items가 통째로 비므로 live로 걸러야 제출한 사람에게 안 뜬다.
          서버가 끝났다고 말한 경우에만 감춘다. 폴링이 실패해 모르는 동안은 띄운다. */}
      {live !== false && !items.some((i) => i.mine && i.status === "submitted") ? (
        <div className="card flex items-center justify-between gap-4 p-4">
          <span className="text-[13.5px] text-ink-2">아직 제출하지 않았습니다</span>
          <Link href="/routes/inclass" className="btn btn-primary">
            내 폼으로 돌아가기
          </Link>
        </div>
      ) : null}

      <div className="flex flex-col gap-3">
        {items.map((it) => {
          const isOpen = expanded === it.userId;
          return (
            <div key={it.userId} className="card overflow-hidden">
              <button
                className="flex w-full items-center justify-between px-5 py-4 text-left"
                onClick={() => setExpanded(isOpen ? null : it.userId)}
              >
                <span className="text-[14.5px] font-medium">
                  {it.name}
                  {it.mine ? <span className="ml-2 text-[12px] text-ink-3">내 것</span> : null}
                </span>
                <span className="text-[12.5px] text-ink-3">{isOpen ? "접기" : "펴기"}</span>
              </button>
              {isOpen ? (
                <div className="flex flex-col gap-4 border-t border-line px-5 py-4">
                  {fields.map((f, i) => (
                    <div key={f.id}>
                      <p className="mb-1 text-[13px] text-ink-2">
                        <span className="font-en mr-2 text-ink-3">{i + 1}</span>
                        {f.question}
                      </p>
                      <p className="whitespace-pre-wrap text-[14px] leading-relaxed">
                        {it.answers[f.id]?.trim() || <span className="text-ink-3">비어 있음</span>}
                      </p>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
