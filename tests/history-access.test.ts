import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { runInNewContext } from "node:vm";
import ts from "typescript";
const require = createRequire(import.meta.url);
function load(file: string, dependencies: Record<string, unknown>) {
  const module = { exports: {} as any };
  const source = ts.transpileModule(readFileSync(file, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  runInNewContext(source, { module, exports: module.exports, URL, process: { env: {} },
    require: (name: string) => name in dependencies ? dependencies[name] : require(name),
  });
  return module.exports;
}

for (const path of ["/admin", "/admin/data", "/admin/session/example", "/api/admin/session/example/form"]) {
  test(`participant gets HTTP 403 for ${path}`, async () => {
    const api = load("middleware.ts", { "next-auth/jwt": { getToken: async () => ({ consented: true, roles: ["participant"] }) } });
    const result = await api.middleware({ nextUrl: new URL(`http://localhost${path}`), url: `http://localhost${path}` });
    assert.equal(result.status, 403);
  });
}
test("lookalike public path does not bypass the login gate", async () => {
  const api = load("middleware.ts", { "next-auth/jwt": { getToken: async () => null } });
  const result = await api.middleware({ nextUrl: new URL("http://localhost/login-private"), url: "http://localhost/login-private" });
  assert.equal(result.status, 307);
  assert.equal(result.headers.get("location"), "http://localhost/login");
});
test("history query enforces current user, submitted status and closed session", async () => {
  const history = load("lib/history.ts", { "@/lib/prisma": { prisma: {
    submission: { findMany: async (args: any) => {
      assert.equal(args.where.userId, "current-user");
      assert.equal(args.where.status, "submitted");
      assert.equal(args.where.formDef.session.status, "closed");
      return [];
    } },
  } } });
  await history.getMySubmissions("current-user");
});
test("unfinished segments do not acquire invented durations", () => {
  const history = load("lib/history.ts", { "@/lib/prisma": { prisma: {} } });
  const start = new Date("2026-09-08T10:00:00Z");
  assert.equal(history.elapsedSeconds(start, null), null);
  assert.equal(history.elapsedSeconds(start, new Date("2026-09-08T09:59:00Z")), null);
  assert.equal(history.elapsedSeconds(start, new Date("2026-09-08T10:40:15Z")), 2415);
});
