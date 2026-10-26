import { describe, it, expect, beforeEach } from "vitest";
import worker, { MatchScanLimiter, MATCH_SCAN_LIMIT, resetMatchScanRateLimit } from "../src/index.js";
import { MatchScanLimiterCore, MATCH_SCAN_WINDOW_MS } from "../src/durable/match-scan-limiter.js";
import { InMemoryD1Database } from "../src/db/in-memory-db.js";
import { UserRepository } from "../src/db/repositories.js";
import { readFileSync } from "node:fs";
import { sqliteSql } from "./helpers/node-sqlite.js";

function fakeNamespace(opts?: { fail?: boolean }) {
  const objects = new Map<string, MatchScanLimiter>();
  const ns = {
    idFromName: (name: string) => name,
    get: (id: string) => ({
      fetch: async (_url: string, init?: RequestInit) => {
        if (opts?.fail) throw new Error("down");
        if (!objects.has(id)) objects.set(id, new MatchScanLimiter({ storage: { sql: sqliteSql() } }));
        return objects.get(id)!.fetch(new Request("https://match-scan-limiter/", init));
      },
    }),
  };
  return { ns, objects };
}

const ctx = { waitUntil: () => {}, passThroughOnException: () => {} } as any;

async function user(db: InMemoryD1Database, id: string, token: string) {
  await new UserRepository(db).upsert({
    id,
    telegramId: id,
    firstName: id,
    apiToken: token,
    createdAt: 1,
    updatedAt: 1,
  });
}

describe("match-alert scan rate limit", () => {
  beforeEach(() => {
    resetMatchScanRateLimit();
  });

  it("allows a fixed window per key, then refuses until the window resets", () => {
    const core = new MatchScanLimiterCore(sqliteSql());
    const now = 1_700_000_000_000;
    for (let i = 0; i < MATCH_SCAN_LIMIT; i++) {
      expect(core.consume("user_a", now).allowed).toBe(true);
    }
    const blocked = core.consume("user_a", now);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSeconds).toBe(Math.ceil(MATCH_SCAN_WINDOW_MS / 1000));
    expect(core.consume("user_b", now).allowed).toBe(true);
    expect(core.consume("user_a", now + MATCH_SCAN_WINDOW_MS).allowed).toBe(true);
  });

  it("limits POST /api/user/match-alerts/scan per user and not anonymous callers", async () => {
    const db = new InMemoryD1Database();
    await user(db, "user_a", "orp_user_a");
    await user(db, "user_b", "orp_user_b");
    const scan = (token?: string) =>
      worker.fetch(
        new Request("https://jobs.example/api/user/match-alerts/scan", {
          method: "POST",
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }),
        { DB: db } as never,
        ctx
      );

    for (let i = 0; i < MATCH_SCAN_LIMIT + 2; i++) expect((await scan()).status).toBe(401);
    for (let i = 0; i < MATCH_SCAN_LIMIT; i++) expect((await scan("orp_user_a")).status).toBe(200);
    const limited = await scan("orp_user_a");
    expect(limited.status).toBe(429);
    expect(limited.headers.get("Retry-After")).toBeTruthy();
    expect(await limited.json()).toEqual({ error: "Too many requests" });
    expect((await scan("orp_user_b")).status).toBe(200);
  });

  it("keeps the count in the Durable Object across a fresh in-memory fallback", async () => {
    const db = new InMemoryD1Database();
    await user(db, "user_do", "orp_user_do");
    const { ns } = fakeNamespace();
    const env = { DB: db, MATCH_SCAN_LIMITER: ns } as never;
    const scan = () =>
      worker.fetch(
        new Request("https://jobs.example/api/user/match-alerts/scan", {
          method: "POST",
          headers: { Authorization: "Bearer orp_user_do" },
        }),
        env,
        ctx
      );
    for (let i = 0; i < MATCH_SCAN_LIMIT; i++) expect((await scan()).status).toBe(200);
    resetMatchScanRateLimit();
    const limited = await scan();
    expect(limited.status).toBe(429);
  });

  it("fails closed when the Durable Object errors", async () => {
    const db = new InMemoryD1Database();
    await user(db, "user_down", "orp_user_down");
    const { ns } = fakeNamespace({ fail: true });
    const res = await worker.fetch(
      new Request("https://jobs.example/api/user/match-alerts/scan", {
        method: "POST",
        headers: { Authorization: "Bearer orp_user_down" },
      }),
      { DB: db, MATCH_SCAN_LIMITER: ns } as never,
      ctx
    );
    expect(res.status).toBe(429);
  });

  it("declares the limiter binding and a new SQLite migration", () => {
    const config = readFileSync("wrangler.jsonc", "utf8");
    expect(config).toMatch(/"name": "MATCH_SCAN_LIMITER"/);
    expect(config).toMatch(/"class_name": "MatchScanLimiter"/);
    expect(config).toMatch(/"tag": "v2-match-scan-limiter"/);
    expect(config).toMatch(/"new_sqlite_classes": \["MatchScanLimiter"\]/);
  });

  it("CI runs tests on Node 22 with the SQLite built-in enabled", () => {
    const ci = readFileSync(".github/workflows/ci.yml", "utf8");
    expect(ci).toContain('node-version: "22.23.3"');
    expect(ci).toContain("NODE_OPTIONS: --experimental-sqlite");
  });
});
