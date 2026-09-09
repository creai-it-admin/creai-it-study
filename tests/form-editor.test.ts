import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { runInNewContext } from "node:vm";
import ts from "typescript";
import * as editor from "../lib/form-editor";
const require = createRequire(import.meta.url);

function harness(admin = true) {
  let writes = 0;
  const row = { status: "scheduled", formDef: { id: "form", topicMd: "주제", _count: { submissions: 0 }, fields: [
    { id: "a", order: 1, question: "첫 질문" }, { id: "b", order: 2, question: "둘째 질문" },
  ] } };
  const tx = {
    $queryRaw: async () => [], studySession: { findUnique: async () => row },
    formDef: {
      upsert: async ({ update }: any) => { writes++; row.formDef.topicMd = update.topicMd; return row.formDef; },
      findUniqueOrThrow: async () => ({ ...row.formDef, fields: [...row.formDef.fields].sort((a, b) => a.order - b.order) }),
    },
    formField: {
      deleteMany: async ({ where }: any) => { writes++; row.formDef.fields = row.formDef.fields.filter((f) => where.id.notIn.includes(f.id)); },
      update: async ({ where, data }: any) => {
        if (row.formDef.fields.some((f) => f.id !== where.id && f.order === data.order)) throw new Error("duplicate order");
        writes++; Object.assign(row.formDef.fields.find((f) => f.id === where.id)!, data);
      },
      create: async ({ data }: any) => { writes++; row.formDef.fields.push({ ...data, id: "new" }); },
    },
  };
  const dependencies: Record<string, unknown> = {
    "@/lib/auth": { requireAdmin: async () => admin ? { id: "admin" } : null },
    "@/lib/prisma": { prisma: { $transaction: (fn: any) => fn(tx) } },
    "@/lib/form-editor": editor,
  };
  const module = { exports: {} as { PUT: (...args: any[]) => Promise<Response> } };
  const code = ts.transpileModule(readFileSync("app/api/admin/session/[id]/form/route.ts", "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  runInNewContext(code, { module, exports: module.exports, Set, require: (name: string) => dependencies[name] ?? require(name) });
  const input = { version: editor.formVersion(row.formDef), topicMd: "새 주제", fields: [{ id: "b", question: "둘째 수정" }, { id: "a", question: "첫 질문" }] };
  return { row, input, writes: () => writes, put: (body: unknown = input) => module.exports.PUT(
    new Request("http://localhost/api/admin/session/id/form", { method: "PUT", body: JSON.stringify(body) }),
    { params: Promise.resolve({ id: "id" }) },
  ) };
}

test("participant cannot edit any session form", async () => {
  const h = harness(false); assert.equal((await h.put()).status, 403); assert.equal(h.writes(), 0);
});
for (const status of ["running", "closed"]) test(`${status} session rejects a stale editor save`, async () => {
  const h = harness(); h.row.status = status;
  assert.equal((await h.put()).status, 409); assert.equal(h.writes(), 0);
});
test("reset rehearsal with existing submissions preserves its questions", async () => {
  const h = harness(); h.row.formDef._count.submissions = 1;
  assert.equal((await h.put()).status, 409); assert.equal(h.writes(), 0);
});
test("concurrent editor cannot overwrite saved changes", async () => {
  const h = harness(); h.row.formDef.topicMd = "다른 운영진 수정";
  assert.equal((await h.put()).status, 409); assert.equal(h.writes(), 0);
});
test("reordering preserves IDs and does not collide with unique order", async () => {
  const h = harness(); const result = await h.put(); assert.equal(result.status, 200);
  const saved = await result.json();
  assert.deepEqual(saved.form.fields.map((f: any) => [f.id, f.order]), [["b", 1], ["a", 2]]);
  assert.equal(saved.form.fields[0].question, "둘째 수정");
  assert.notEqual(saved.version, h.input.version);
});
test("a question from another session is rejected before any writes", async () => {
  const h = harness(); h.input.fields[0].id = "foreign";
  assert.equal((await h.put()).status, 400); assert.equal(h.writes(), 0);
});
test("duplicate IDs and blank questions cannot destroy form structure", async () => {
  const h = harness();
  for (const fields of [[{ id: "a", question: "a" }, { id: "a", question: "b" }], [{ question: "  " }]]) {
    assert.equal((await h.put({ ...h.input, fields })).status, 400);
  }
  assert.equal(h.writes(), 0);
});
test("adding and removing unused questions updates the final form", async () => {
  const h = harness(); const res = await h.put({ ...h.input, fields: [{ id: "a", question: "남길 질문" }, { question: "새 질문" }] });
  const saved = await res.json(); assert.equal(res.status, 200);
  assert.deepEqual(saved.form.fields.map((f: any) => f.id), ["a", "new"]);
});
