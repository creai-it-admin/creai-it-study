import { createHash } from "node:crypto";

export type FormContent = { topicMd: string; fields: { id: string; order: number; question: string }[] };
export type FormInput = { version: string; topicMd: string; fields: { id?: string; question: string }[] };

export function formVersion(form: FormContent | null): string {
  return createHash("sha256").update(JSON.stringify(form ? {
    topicMd: form.topicMd,
    fields: [...form.fields].sort((a, b) => a.order - b.order).map(({ id, order, question }) => ({ id, order, question })),
  } : null)).digest("hex");
}

export function parseFormInput(value: unknown): FormInput | null {
  if (!value || typeof value !== "object") return null;
  const input = value as Record<string, unknown>;
  if (typeof input.version !== "string" || typeof input.topicMd !== "string" ||
      !input.topicMd.trim() || !Array.isArray(input.fields)) return null;
  const fields: FormInput["fields"] = [];
  const ids = new Set<string>();
  for (const raw of input.fields) {
    if (!raw || typeof raw !== "object" || typeof raw.question !== "string" || !raw.question.trim()) return null;
    if (raw.id !== undefined && (typeof raw.id !== "string" || !raw.id || ids.has(raw.id))) return null;
    if (raw.id) ids.add(raw.id);
    fields.push({ ...(raw.id ? { id: raw.id } : {}), question: raw.question.trim() });
  }
  return { version: input.version, topicMd: input.topicMd.trim(), fields };
}

export function formLockedReason(status: string, submissions: number): string | null {
  if (status !== "scheduled") return "진행 중이거나 끝난 회차의 폼은 수정할 수 없습니다.";
  if (submissions > 0) return "기존 작성·제출 기록을 보존하기 위해 이 회차의 폼은 수정할 수 없습니다.";
  return null;
}
