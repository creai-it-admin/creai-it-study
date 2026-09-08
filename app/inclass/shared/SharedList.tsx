"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useLiveState } from "@/components/useLiveState";
import { SegmentBar } from "@/components/SegmentBar";

type Field = { id: string; order: number; question: string };
type Item = {
  userId: string;
  name: string;
  mine: boolean;
  status: string;
  answers: Record<string, string>;
};

export function SharedList() {
  const { state, offsetMs } = useLiveState();
  const [open, setOpen] = useState(false);
  const [topic, setTopic] = useState<string | null>(null);
  const [fields, setFields] = useState<Field[]>([]);
  const [items, setItems] = useState<Item[]>([]);
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
      <SegmentBar state={state} offsetMs={offsetMs} />

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

      {/* 아직 제출 안 한 사람이 폼으로 돌아갈 길. 없으면 여기서 갇힌다. */}
      {items.some((i) => i.mine && i.status !== "submitted") ? (
        <div className="card flex items-center justify-between gap-4 p-4">
          <span className="text-[13.5px] text-ink-2">아직 제출하지 않았습니다</span>
          <Link href="/inclass" className="btn btn-primary">
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
