import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import ts from "typescript";

function hookHarness(enterRunning: boolean) {
  let next = { sessionId: "session", segment: "part1", sharingOpen: false, route: "/deck", serverTime: new Date().toISOString() };
  const routes: string[] = [];
  let tick!: () => Promise<void>;
  let cleanup!: () => void;
  const module = { exports: {} as { useLiveState: (opts: unknown) => void } };
  const source = ts.transpileModule(readFileSync("components/useLiveState.ts", "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  runInNewContext(source, {
    module, exports: module.exports, Date, AbortSignal,
    fetch: async () => ({ ok: true, json: async () => next }),
    setInterval: (fn: typeof tick) => { tick = fn; return 1; }, clearInterval: () => {},
    require: (name: string) => name === "react" ? {
      useState: (value: unknown) => [value, () => {}],
      useRef: (value: unknown) => ({ current: value }),
      useEffect: (effect: () => () => void) => { cleanup = effect(); },
    } : { useRouter: () => ({ push: (path: string) => routes.push(path), replace: (path: string) => routes.push(path) }) },
  });
  module.exports.useLiveState({ enterRunning });
  return { routes, tick: () => tick(), stop: () => cleanup(), set: (value: Partial<typeof next>) => { next = { ...next, ...value }; } };
}

test("home stays put when a session starts", async () => {
  const h = hookHarness(true);
  await new Promise((resolve) => setImmediate(resolve));
  assert.deepEqual(h.routes, []);
  await h.tick();
  assert.deepEqual(h.routes, []);
  h.stop();
});

test("state changes do not interrupt participant navigation", async () => {
  const h = hookHarness(false);
  await new Promise((resolve) => setImmediate(resolve));
  assert.deepEqual(h.routes, []);
  h.set({ segment: "part2", route: "/inclass" });
  await h.tick();
  await h.tick();
  assert.deepEqual(h.routes, []);
  h.stop();
});
