"use client";

import { useEffect, useRef, useState } from "react";
import { useLiveState } from "@/components/useLiveState";
import { SegmentBar } from "@/components/SegmentBar";
import { DraftSync, SaveError, type Draft } from "@/lib/draft-sync";

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
  const sync = useRef<DraftSync | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [localFailed, setLocalFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    let retry: ReturnType<typeof setTimeout>;
    const ac = new AbortController();
    async function load() {
      try {
        const res = await fetch("/api/submission", {
          cache: "no-store", signal: AbortSignal.any([ac.signal, AbortSignal.timeout(10000)]),
        });
        if (!res.ok) throw new Error("load failed");
        const data = await res.json();
        if (!alive) return;
        setLoadFailed(false);
        if (data.formDef) {
          const key = `creai_draft:${data.submissionId}`;
          let local: Draft | null = null;
          try {
            const raw = localStorage.getItem(key);
            if (raw) {
              const parsed = JSON.parse(raw);
              // Keep drafts written by the previous demo version.
              local = parsed.answers && typeof parsed.version === "string"
                ? parsed : { answers: parsed, submit: false, version: data.submission.version };
              if (!local || typeof local.answers !== "object" || !local.answers ||
                  Object.values(local.answers).some((value) => typeof value !== "string")) local = null;
            }
          } catch { /* A blocked browser store must not prevent loading the form. */ }
          const initial: Draft = {
            answers: Object.fromEntries(data.formDef.fields.map((f: Field) =>
              [f.id, local?.answers[f.id] ?? data.submission.answers[f.id] ?? ""])),
            submit: local?.submit === true,
            version: local?.version ?? data.submission.version,
          };
          setTopic(data.formDef.topicMd);
          setFields(data.formDef.fields);
          setAnswers(initial.answers);
          setSubmitted(data.submission.status === "submitted");
          const controller = new DraftSync(initial, {
            write(draft) {
              try { localStorage.setItem(key, JSON.stringify(draft)); setLocalFailed(false); }
              catch { setLocalFailed(true); }
            },
            clear() { try { localStorage.removeItem(key); } catch { /* noop */ } },
            async send(draft) {
              const response = await fetch("/api/submission", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ ...draft, submissionId: data.submissionId }),
                signal: AbortSignal.timeout(10000),
              });
              const result = await response.json();
              if (!response.ok) {
                throw new SaveError(result.error ?? "저장하지 못했습니다", result.version,
                  response.status >= 400 && response.status < 500 && response.status !== 429);
              }
              return result;
            },
            status(value, message) { if (alive) { setSave(value); setSaveError(message ?? null); } },
            submitted() { if (alive) setSubmitted(true); },
          });
          sync.current = controller;
          if (local) controller.restore();
        }
      } catch {
        if (alive) { setLoadFailed(true); retry = setTimeout(load, 5000); }
      } finally {
        if (alive) setLoaded(true);
      }
    }
    void load();
    return () => {
      alive = false;
      ac.abort();
      clearTimeout(retry);
      sync.current?.stop();
      sync.current = null;
    };
  }, []);

  function onChange(fieldId: string, text: string) {
    const next = { ...answers, [fieldId]: text };
    setAnswers(next);
    sync.current?.edit(next);
  }

  const label =
    save === "saving" ? "저장 중" : save === "saved" ? "저장됨" : save === "failed" ? "저장 안 됨" : "";
  const labelColor =
    save === "failed" ? "text-[color:var(--warn)]" : save === "saved" ? "text-[color:var(--ok)]" : "text-ink-3";

  if (!loaded) return <div className="card p-10 text-center text-[13px] text-ink-3">불러오는 중</div>;

  if (!topic) {
    return (
      <div className="card p-10 text-center text-[14px] text-ink-2">
        {loadFailed
          ? "폼을 불러오지 못했습니다. 5초마다 다시 시도합니다. 로그인이 만료됐다면 다시 로그인해 주세요."
          : "이번 회차 인클 주제가 아직 없습니다"}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <SegmentBar state={state} offsetMs={offsetMs} />
        <span className={`text-[12.5px] ${labelColor}`}>{label}</span>
      </div>

      {saveError ? <p role="alert" className="text-[13px] text-[color:var(--warn)]">{saveError}</p> : null}
      {localFailed ? <p role="alert" className="text-[13px] text-[color:var(--warn)]">이 브라우저에 초안을 보관할 수 없습니다. 저장됨을 확인하기 전에는 새로고침하지 마세요.</p> : null}
      <div className="card p-5">
        <p className="text-[15px] leading-relaxed font-medium">{topic}</p>
      </div>

      <div className="flex flex-col gap-4">
        {fields.map((f, i) => (
          <div key={f.id} className="card p-5">
            <label htmlFor={`answer-${f.id}`} className="mb-2 block text-[14px] font-medium">
              <span className="font-en mr-2 text-ink-3">{i + 1}</span>
              {f.question}
            </label>
            <textarea
              id={`answer-${f.id}`}
              className="field min-h-[110px] resize-y"
              value={answers[f.id] ?? ""}
              onChange={(e) => onChange(f.id, e.target.value)}
            />
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <span className="text-[12.5px] text-ink-3">
          {submitted ? "제출했습니다. 제출한 뒤에도 고칠 수 있습니다" : "공유가 열리면 다른 사람 것이 보입니다"}
        </span>
        <button
          className="btn btn-primary"
          onClick={() => {
            sync.current?.edit(answers, true);
          }}
        >
          {submitted ? "다시 제출하기" : "제출하기"}
        </button>
      </div>
    </div>
  );
}
