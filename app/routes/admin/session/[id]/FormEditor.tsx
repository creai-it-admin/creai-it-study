"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Field = { id?: string; question: string; stage?: string; key: string };
export function FormEditor({ sessionId, initialTopic, initialAgentMd, initialWebSearch, initialFields, initialVersion, lockedReason }: {
  sessionId: string; initialTopic: string; initialAgentMd: string; initialWebSearch: boolean; initialFields: { id: string; question: string; stage?: string }[];
  initialVersion: string; lockedReason: string | null;
}) {
  const router = useRouter();
  const [topic, setTopic] = useState(initialTopic);
  const [agentMd, setAgentMd] = useState(initialAgentMd);
  const [webSearch, setWebSearch] = useState(initialWebSearch);
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
        body: JSON.stringify({ version, topicMd: topic, agentMd, agentWebSearch: webSearch, fields: fields.map(({ id, question, stage }) => ({ id, question, stage:stage??"before" })) }),
        signal: AbortSignal.timeout(10000),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "저장하지 못했습니다");
      setTopic(result.form.topicMd); setAgentMd(result.form.agentMd); setWebSearch(result.form.agentWebSearch);
      setFields(result.form.fields.map((f: { id: string; question: string; stage?:string }) => ({ ...f, key: f.id })));
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
      <div className="card p-5">
        <label htmlFor="form-agent" className="mb-1 block text-[14px] font-medium">AI 실습 에이전트</label>
        <p className="mb-3 text-[13px] text-ink-2">참가자가 활동 화면에서 함께 작업할 AI의 과제·역할·제공 자료를 적습니다. 목표와 결과 기준은 참가자가 정하도록 피드백 전 질문으로 남겨 주세요. 비워 두면 AI 실습 없이 진행합니다.</p>
        <textarea id="form-agent" className="field min-h-40" maxLength={20000} value={agentMd} onChange={(e) => { setAgentMd(e.target.value); changed(); }} placeholder={"과제: …\n에이전트 역할: …\n제공 자료: …"} />
        <label className="mt-3 flex items-center gap-2 text-[14px]"><input type="checkbox" checked={webSearch} onChange={(e) => { setWebSearch(e.target.checked); changed(); }} /> 웹 검색 허용 · 검색어와 출처가 작업 기록에 남습니다</label>
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
        <select aria-label={`질문 ${index + 1} 작성 시점`} className="field mb-3" value={field.stage??"before"} onChange={e=>{setFields(fields.map((f,i)=>i===index?{...f,stage:e.target.value}:f));changed();}}><option value="before">피드백 전 · 첫 결과와 함께</option><option value="after">피드백 후 · 수정 결과와 함께</option></select>
        <textarea id={`question-${field.key}`} className="field min-h-20" value={field.question} onChange={(e) => { setFields(fields.map((f, i) => i === index ? { ...f, question: e.target.value } : f)); changed(); }} />
        <p className="mt-2 text-[12px] text-ink-3">참가자에게 긴 답변칸으로 표시됩니다.</p>
      </div>)}
      {!lockedReason ? <button className="btn self-start" type="button" onClick={() => { setFields([...fields, { key: crypto.randomUUID(), question: "", stage:"before" }]); changed(); }}>질문 추가</button> : null}
    </fieldset>
    {!lockedReason ? <div className="flex items-center gap-4">
      <button type="button" className="btn btn-primary" disabled={busy || !topic.trim() || fields.some((f) => !f.question.trim())} onClick={save}>{busy ? "저장 중" : "폼 저장"}</button>
      <span className="text-[13px] text-ink-2">{dirty ? "저장하지 않은 변경 사항이 있습니다" : `질문 ${fields.length}개`}</span>
    </div> : null}
    {fields.length === 0 ? <p className="text-[13px] text-ink-2">세션을 시작하려면 질문이 하나 이상 필요합니다.</p> : null}
    {message ? <p role={error ? "alert" : "status"} className={`text-[14px] ${error ? "text-warn" : "text-ok"}`}>{message}</p> : null}
  </div>;
}
