"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Field = { id?: string; question: string; key: string };
export function FormEditor({ sessionId, initialTopic, initialFields, initialVersion, lockedReason }: {
  sessionId: string; initialTopic: string; initialFields: { id: string; question: string }[];
  initialVersion: string; lockedReason: string | null;
}) {
  const router = useRouter();
  const [topic, setTopic] = useState(initialTopic);
  const [fields, setFields] = useState<Field[]>(initialFields.map((f) => ({ ...f, key: f.id })));
  const [version, setVersion] = useState(initialVersion);
  const [busy, setBusy] = useState(false);
  const sending = useRef(false);
  const [dirty, setDirty] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ""; };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
  function changed() { setDirty(true); setMessage(null); }
  function move(index: number, delta: number) {
    const next = [...fields];
    [next[index], next[index + delta]] = [next[index + delta], next[index]];
    setFields(next); changed();
  }
  async function save() {
    if (sending.current || lockedReason) return;
    sending.current = true; setBusy(true); setMessage(null);
    try {
      const response = await fetch(`/api/admin/session/${sessionId}/form`, {
        method: "PUT", headers: { "content-type": "application/json" },
        body: JSON.stringify({ version, topicMd: topic, fields: fields.map(({ id, question }) => ({ id, question })) }),
        signal: AbortSignal.timeout(10000),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "저장하지 못했습니다");
      setTopic(result.form.topicMd);
      setFields(result.form.fields.map((f: { id: string; question: string }) => ({ ...f, key: f.id })));
      setVersion(result.version); setDirty(false); setError(false); setMessage("저장했습니다");
      router.refresh();
    } catch (e) {
      setError(true);
      setMessage(e instanceof Error && e.name !== "TimeoutError" ? e.message : "응답을 확인하지 못했습니다. 입력 내용은 유지됩니다. 다시 시도해 주세요.");
    } finally { sending.current = false; setBusy(false); }
  }
  return <div className="flex flex-col gap-5">
    {lockedReason ? <p className="card p-4 text-[14px] text-ink-2">{lockedReason}</p> : null}
    <fieldset disabled={!!lockedReason || busy} className="flex flex-col gap-4">
      <div className="card p-5">
        <label htmlFor="form-topic" className="mb-2 block text-[14px] font-medium">인클래스 주제</label>
        <textarea id="form-topic" className="field min-h-24" value={topic} onChange={(e) => { setTopic(e.target.value); changed(); }} />
      </div>
      {fields.map((field, index) => <div key={field.key} className="card p-5">
        <div className="mb-3 flex items-center justify-between gap-3">
          <label htmlFor={`question-${field.key}`} className="text-[14px] font-medium">질문 {index + 1}</label>
          {!lockedReason ? <div className="flex gap-2">
            <button type="button" className="btn" aria-label={`질문 ${index + 1} 위로`} disabled={index === 0} onClick={() => move(index, -1)}>위로</button>
            <button type="button" className="btn" aria-label={`질문 ${index + 1} 아래로`} disabled={index === fields.length - 1} onClick={() => move(index, 1)}>아래로</button>
            <button type="button" className="btn" aria-label={`질문 ${index + 1} 삭제`} onClick={() => { setFields(fields.filter((_, i) => i !== index)); changed(); }}>삭제</button>
          </div> : null}
        </div>
        <textarea id={`question-${field.key}`} className="field min-h-20" value={field.question} onChange={(e) => { setFields(fields.map((f, i) => i === index ? { ...f, question: e.target.value } : f)); changed(); }} />
        <p className="mt-2 text-[12px] text-ink-3">참가자에게 긴 답변칸으로 표시됩니다.</p>
      </div>)}
      {!lockedReason ? <button className="btn self-start" type="button" onClick={() => { setFields([...fields, { key: crypto.randomUUID(), question: "" }]); changed(); }}>질문 추가</button> : null}
    </fieldset>
    {!lockedReason ? <div className="flex items-center gap-4">
      <button type="button" className="btn btn-primary" disabled={busy || !topic.trim() || fields.some((f) => !f.question.trim())} onClick={save}>{busy ? "저장 중" : "폼 저장"}</button>
      <span className="text-[13px] text-ink-2">{dirty ? "저장하지 않은 변경 사항이 있습니다" : `질문 ${fields.length}개`}</span>
    </div> : null}
    {fields.length === 0 ? <p className="text-[13px] text-ink-2">세션을 시작하려면 질문이 하나 이상 필요합니다.</p> : null}
    {message ? <p role={error ? "alert" : "status"} className={`text-[14px] ${error ? "text-[color:var(--warn)]" : "text-[color:var(--ok)]"}`}>{message}</p> : null}
  </div>;
}
