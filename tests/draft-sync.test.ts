import assert from "node:assert/strict";
import { test } from "node:test";
import { DraftSync, SaveError, type Draft, type SaveResult } from "../lib/draft-sync";

function setup(send: (draft: Draft) => Promise<SaveResult>, initial?: Draft) {
  let local: Draft | null = null;
  let status = "";
  let submitted = false;
  const sync = new DraftSync(initial ?? { answers: { a: "" }, submit: false, version: "v1" }, {
    write(value) { local = structuredClone(value); },
    clear() { local = null; }, send,
    status(value) { status = value; }, submitted() { submitted = true; },
  });
  return { sync, local: () => local, status: () => status, submitted: () => submitted };
}

test("typing is durable before the two-second debounce", () => {
  let calls = 0;
  const h = setup(async () => { calls++; return { version: "v2", submitted: false }; });
  h.sync.edit({ a: "last keystroke" });
  assert.equal(h.local()?.answers.a, "last keystroke");
  assert.equal(calls, 0);
  h.sync.stop();
});

test("an old response cannot delete newer edits; requests remain serial", async () => {
  let resolve!: (value: SaveResult) => void;
  const sent: Draft[] = [];
  const h = setup((draft) => {
    sent.push(structuredClone(draft));
    return new Promise((r) => { resolve = r; });
  });
  h.sync.edit({ a: "old" });
  const first = h.sync.flush();
  h.sync.edit({ a: "new" }, true);
  await h.sync.flush();
  assert.equal(sent.length, 1);
  resolve({ version: "v2", submitted: false });
  await first;
  assert.equal(h.local()?.answers.a, "new");
  const second = h.sync.flush();
  assert.deepEqual(sent[1], { answers: { a: "new" }, submit: true, version: "v2" });
  resolve({ version: "v3", submitted: true });
  await second;
  assert.equal(h.local(), null);
  assert.equal(h.submitted(), true);
  h.sync.stop();
});

test("failed submission restores and resends without more typing", async () => {
  const initial = { answers: { a: "offline" }, submit: true, version: "v1" };
  let sent: Draft | undefined;
  const h = setup(async (draft) => {
    sent = draft;
    return { version: "v2", submitted: true };
  }, initial);
  h.sync.restore();
  await new Promise((resolve) => setTimeout(resolve, 10));
  assert.deepEqual(sent, initial);
  assert.equal(h.submitted(), true);
  h.sync.stop();
});

test("lost response retries the exact snapshot before sending subsequent edits", async () => {
  const sent: Draft[] = [];
  const h = setup(async (draft) => {
    sent.push(structuredClone(draft));
    if (sent.length === 1) throw new Error("timeout");
    return { version: sent.length === 2 ? "v2" : "v3", submitted: false };
  });
  h.sync.edit({ a: "old" });
  await h.sync.flush();
  h.sync.edit({ a: "new" });
  await h.sync.flush();
  assert.deepEqual(sent[0], sent[1]);
  assert.equal(h.local()?.answers.a, "new");
  await h.sync.flush();
  assert.equal(sent[2].answers.a, "new");
  assert.equal(sent[2].version, "v2");
  h.sync.stop();
});

test("conflict preserves the draft and requires explicit resubmission", async () => {
  let calls = 0;
  const h = setup(async (draft) => {
    if (++calls === 1) throw new SaveError("conflict", "v2", true);
    assert.equal(draft.version, "v2");
    return { version: "v3", submitted: true };
  });
  h.sync.edit({ a: "keep me" });
  await h.sync.flush();
  assert.equal(h.status(), "failed");
  await h.sync.flush();
  assert.equal(calls, 1);
  assert.equal(h.local()?.answers.a, "keep me");
  h.sync.edit({ a: "reviewed" }, true);
  await h.sync.flush();
  assert.equal(h.submitted(), true);
  h.sync.stop();
});

test("late success after leaving the page cannot clear a remounted page's draft", async () => {
  let resolve!: (value: SaveResult) => void;
  const h = setup(() => new Promise((r) => { resolve = r; }));
  h.sync.edit({ a: "keep" });
  const request = h.sync.flush();
  h.sync.stop();
  resolve({ version: "v2", submitted: false });
  await request;
  assert.equal(h.local()?.answers.a, "keep");
});
