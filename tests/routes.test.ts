import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { runInNewContext } from "node:vm";
import ts from "typescript";

const require = createRequire(import.meta.url);
// Execute the actual handlers, substituting only authentication and database I/O.
function load(file: string, dependencies: Record<string, unknown>) {
  const source = ts.transpileModule(readFileSync(file, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const module = { exports: {} as Record<string, (...args: any[]) => Promise<Response>> };
  runInNewContext(source, { module, exports: module.exports, Date, Set, Map, Object, Number, Promise,
    require(name: string) { return name in dependencies ? dependencies[name] : require(name); },
  });
  return module.exports;
}

function submissionHarness() {
  let writes = 0;
  const row = {
    id: "sub-A", userId: "user", status: "draft", updatedAt: new Date("2026-09-08T00:00:00.000Z"),
    answers: [{ formFieldId: "field-A", text: "saved" }],
    formDef: { fields: [{ id: "field-A" }], session: { status: "running" } },
  };
  const tx = {
    $queryRaw: async () => [],
    submission: {
      findFirst: async ({ where }: any) => where.id === row.id && where.userId === row.userId ? row : null,
      update: async ({ data }: any) => { writes++; Object.assign(row, data); return row; },
    },
    answer: { upsert: async ({ update }: any) => { writes++; row.answers[0].text = update.text; } },
  };
  const api = load("app/api/submission/route.ts", {
    "@/lib/auth": { auth: async () => ({ user: { id: "user" } }) },
    "@/lib/prisma": { prisma: { $transaction: (fn: any) => fn(tx) } },
    "@/lib/session-state": {},
  });
  const body = { submissionId: row.id, version: row.updatedAt.toISOString(), answers: { "field-A": "new" }, submit: true };
  return { row, body, writes: () => writes,
    post: (value = body) => api.POST(new Request("http://localhost/api/submission", { method: "POST", body: JSON.stringify(value) })),
  };
}

test("a delayed request for a closed session cannot submit into the new session", async () => {
  const h = submissionHarness(); h.row.formDef.session.status = "closed";
  assert.equal((await h.post()).status, 409);
  assert.equal(h.writes(), 0);
});

test("submission ownership is enforced", async () => {
  const h = submissionHarness(); h.row.userId = "someone-else";
  assert.equal((await h.post()).status, 404);
  assert.equal(h.writes(), 0);
});

test("stale save cannot overwrite a newer answer", async () => {
  const h = submissionHarness(); h.row.updatedAt = new Date("2026-09-08T00:00:01.000Z");
  assert.equal((await h.post()).status, 409);
  assert.equal(h.writes(), 0);
  assert.equal(h.row.answers[0].text, "saved");
});

test("successful submission can be retried after losing its response", async () => {
  const h = submissionHarness();
  const first = await h.post();
  assert.equal(first.status, 200);
  const result = await first.json();
  assert.notEqual(result.version, h.body.version);
  const writes = h.writes();
  const retry = await h.post();
  assert.equal(retry.status, 200);
  assert.equal(h.writes(), writes);
  assert.equal((await retry.json()).submitted, true);
});

test("unknown form fields reject the whole request instead of recording a blank submission", async () => {
  const h = submissionHarness();
  const res = await h.post({ ...h.body, answers: { "field-B": "wrong session" } } as any);
  assert.equal(res.status, 409);
  assert.equal(h.writes(), 0);
});

function controlHarness() {
  let writes = 0;
  const segments = [
    { kind: "part1", startedAt: new Date("2026-09-08T00:00:00Z"), endedAt: null },
    { kind: "part2", startedAt: null, endedAt: null },
    { kind: "break_", startedAt: null, endedAt: null },
  ];
  const row = { id: "session", status: "running", weekNo: 1, segments };
  const tx = {
    $queryRaw: async () => [],
    studySession: { findUnique: async () => row },
    segment: { update: async ({ where, data }: any) => {
      writes++;
      Object.assign(segments.find((s) => s.kind === where.sessionId_kind.kind)!, data);
    } },
  };
  const prisma = { $transaction: (fn: any) => fn(tx) };
  const state = load("lib/session-state.ts", { "@/lib/prisma": { prisma } });
  const api = load("app/api/admin/session/[id]/control/route.ts", {
    "@/lib/auth": { requireAdmin: async () => ({ id: "admin" }) },
    "@/lib/prisma": { prisma }, "@/lib/session-state": state,
  });
  return { row, writes: () => writes, post: (body: unknown) => api.POST(
    new Request("http://localhost/api/admin/session/session/control", { method: "POST", body: JSON.stringify(body) }),
    { params: Promise.resolve({ id: "session" }) },
  ) };
}

test("repeating the same next command advances only one segment", async () => {
  const h = controlHarness();
  const command = { action: "next", expectedSegment: "part1", expectedStartedAt: "2026-09-08T00:00:00.000Z" };
  assert.equal((await h.post(command)).status, 200);
  assert.equal((await h.post(command)).status, 409);
  assert.equal(h.writes(), 2);
  assert.equal(h.row.segments[2].startedAt, null);
});

test("a closed session cannot advance, share or close again", async () => {
  const h = controlHarness(); h.row.status = "closed";
  for (const action of ["next", "openSharing", "closeSharing", "close"]) {
    assert.equal((await h.post({ action })).status, 409);
  }
  assert.equal(h.writes(), 0);
});

test("non-rehearsal reset remains forbidden", async () => {
  const h = controlHarness();
  assert.equal((await h.post({ action: "reset" })).status, 400);
  assert.equal(h.writes(), 0);
});
