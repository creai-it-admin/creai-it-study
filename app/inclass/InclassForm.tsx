"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useLiveState } from "@/components/useLiveState";
import { SegmentBar } from "@/components/SegmentBar";

type Field = { id: string; order: number; question: string };
type SaveState = "idle" | "saving" | "saved" | "failed";



export function InclassForm() {
  const { state, offsetMs } = useLiveState();
  const [topic, setTopic] = useState<string | null>(null);
  const [fields, setFields] = useState<Field[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [save, setSave] = useState<SaveState>("idle");
  const [loaded, setLoaded] = useState(false);
  const [draftKey, setDraftKey] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wantSubmit = useRef(false);
  const [reloadTick, setReloadTick] = useState(0);

  // 처음 불러오기. 서버 답이 있으면 그걸 쓰고, 없거나 실패하면 브라우저 초안을 쓴다.
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch("/api/submission", { cache: "no-store" });
        const data = await res.json();
        if (!alive) return;
        if (data.formDef) {
          // 초안 키를 사람과 폼별로 나눈다. 같은 브라우저를 다른 계정이 써도 안 섞인다.
          const key = `creai_draft:${data.submissionId}`;
          setDraftKey(key);
          let local: Record<string, string> = {};
          try {
            local = JSON.parse(localStorage.getItem(key) ?? "{}");
          } catch {
            local = {};
          }
          setTopic(data.formDef.topicMd);
          setFields(data.formDef.fields);
          setAnswers({ ...(data.submission?.answers ?? {}), ...local });
          setSubmitted(data.submission?.status === "submitted");
        }
      } catch {
        // 서버를 못 부르면 폼을 못 그린다. 5초 뒤 다시 시도한다.
        if (alive) setTimeout(() => setReloadTick((t) => t + 1), 5000);
      } finally {
        if (alive) setLoaded(true);
      }
    })();
    return () => {
      alive = false;
    };
  }, [reloadTick]);

  const persist = useCallback(async (next: Record<string, string>, submit = false) => {
    if (submit) wantSubmit.current = true;
    setSave("saving");
    try {
      const res = await fetch("/api/submission", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ answers: next, submit }),
      });
      if (!res.ok) throw new Error("save failed");
      setSave("saved");
      // 서버에 들어갔으면 초안을 지운다. 안 지우면 오래된 초안이 나중에 서버 답을 덮는다.
      if (draftKey) {
        try {
          localStorage.removeItem(draftKey);
        } catch {
          /* noop */
        }
      }
      if (submit) {
        setSubmitted(true);
        wantSubmit.current = false;
      }
    } catch {
      setSave("failed");
      // FR-503. 서버에 못 넣었을 때만 브라우저에 들고 있는다.
      if (draftKey) {
        try {
          localStorage.setItem(draftKey, JSON.stringify(next));
        } catch {
          /* 저장소가 막혀 있어도 계속 쓴다 */
        }
      }
    }
  }, [draftKey]);

  // FR-502. 입력을 멈추고 2초가 지나면 초안을 저장한다.
  function onChange(fieldId: string, text: string) {
    const next = { ...answers, [fieldId]: text };
    setAnswers(next);
    setSave("saving");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => persist(next), 2000);
  }

  // 저장이 실패한 상태면 주기적으로 다시 시도한다.
  useEffect(() => {
    if (save !== "failed") return;
    // 제출하려다 실패했으면 재시도도 제출로 보낸다. 아니면 영영 초안으로 남는다.
    const id = setTimeout(() => persist(answers, wantSubmit.current), 5000);
    return () => clearTimeout(id);
  }, [save, answers, persist]);

  const label =
    save === "saving" ? "저장 중" : save === "saved" ? "저장됨" : save === "failed" ? "저장 안 됨" : "";
  const labelColor =
    save === "failed" ? "text-[color:var(--warn)]" : save === "saved" ? "text-[color:var(--ok)]" : "text-ink-3";

  if (!loaded) return <div className="card p-10 text-center text-[13px] text-ink-3">불러오는 중</div>;

  if (!topic) {
    return <div className="card p-10 text-center text-[14px] text-ink-2">이번 회차 인클 주제가 아직 없습니다</div>;
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <SegmentBar state={state} offsetMs={offsetMs} />
        <span className={`text-[12.5px] ${labelColor}`}>{label}</span>
      </div>

      <div className="card p-5">
        <p className="text-[15px] leading-relaxed font-medium">{topic}</p>
      </div>

      <div className="flex flex-col gap-4">
        {fields.map((f, i) => (
          <div key={f.id} className="card p-5">
            <label className="mb-2 block text-[14px] font-medium">
              <span className="font-en mr-2 text-ink-3">{i + 1}</span>
              {f.question}
            </label>
            <textarea
              className="field min-h-[110px] resize-y"
              value={answers[f.id] ?? ""}
              onChange={(e) => onChange(f.id, e.target.value)}
              disabled={submitted}
            />
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <span className="text-[12.5px] text-ink-3">
          {submitted ? "제출했습니다" : "공유가 열리면 다른 사람 것이 보입니다"}
        </span>
        <button
          className="btn btn-primary"
          disabled={submitted}
          onClick={() => {
            if (timer.current) clearTimeout(timer.current);
            persist(answers, true);
          }}
        >
          {submitted ? "제출했습니다" : "제출하기"}
        </button>
      </div>
    </div>
  );
}
