import { describe, it, expect, beforeEach } from "vitest";
import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import worker, {
  AdminAuthLimiter,
  ADMIN_AUTH_MAX_FAILURES,
  ADMIN_COOKIE_NAME,
  createAdminSession,
  verifyAdminSession,
  isTelegramAdmin,
  resetAdminAuthRateLimit,
} from "../src/index.js";
import { AdminAuthLimiterCore, ADMIN_AUTH_WINDOW_MS, type SqlLike } from "../src/durable/admin-auth-limiter.js";
import { InMemoryD1Database } from "../src/db/in-memory-db.js";

// Test-only values (never real secrets).
const ADMIN = "test-admin-secret-0123456789abcdef";
const SESSION = "test-session-secret-0123456789abcdefghij";
const ctx = { waitUntil: () => {}, passThroughOnException: () => {} } as any;

/** Real SQLite (node:sqlite) behind the Durable Object `sql.exec` shape. */
function sqliteSql(): SqlLike {
  const db = new DatabaseSync(":memory:");
  // Like ctx.storage.sql.exec, the statement runs immediately; toArray() returns the rows.
  return {
    exec: (q: string, ...b: unknown[]) => {
      const rows = db.prepare(q).all(...(b as any[])) as Record<string, unknown>[];
      return { toArray: () => rows };
    },
  };
}

/** Fake DO namespace: one AdminAuthLimiter (with its own SQLite) per name, like idFromName(). */
function fakeNamespace() {
  const objects = new Map<string, AdminAuthLimiter>();
  let calls = 0;
  const ns = {
    idFromName: (name: string) => name,
    get: (id: string) => ({
      fetch: async (_url: string, init?: RequestInit) => {
        calls++;
        if (!objects.has(id)) objects.set(id, new AdminAuthLimiter({ storage: { sql: sqliteSql() } }));
        return objects.get(id)!.fetch(new Request("https://do/", init));
      },
    }),
  };
  return { ns, objects, calls: () => calls };
}

let db: InMemoryD1Database;
const baseEnv = (extra: Record<string, unknown> = {}) => ({ DB: db, ADMIN_TOKEN: ADMIN, ADMIN_SESSION_SECRET: SESSION, ...extra });
const call = (path: string, init?: RequestInit, env: Record<string, unknown> = baseEnv()) =>
  worker.fetch(new Request(`https://jobs.ai-kit.net${path}`, init), env as any, ctx);
const login = (env: Record<string, unknown>, token = ADMIN, ip = "203.0.113.50", headers: Record<string, string> = {}) =>
  call("/admin/login", { method: "POST", headers: { "Content-Type": "application/json", "CF-Connecting-IP": ip, ...headers }, body: JSON.stringify({ token }) }, env);

beforeEach(() => {
  db = new InMemoryD1Database();
  resetAdminAuthRateLimit();
});

describe("(1) durable admin auth rate limiter (SQLite Durable Object)", () => {
  it("core: limits after max failures, per key, and resets after the window", () => {
    const core = new AdminAuthLimiterCore(sqliteSql());
    const t0 = 1_000_000;
    for (let i = 1; i < ADMIN_AUTH_MAX_FAILURES; i++) expect(core.recordFailure("ip:a", t0)).toBe(false);
    expect(core.recordFailure("ip:a", t0)).toBe(true);
    expect(core.isLimited("ip:a", t0 + 1)).toBe(true);
    expect(core.isLimited("ip:b", t0 + 1)).toBe(false);
    expect(core.isLimited("ip:a", t0 + ADMIN_AUTH_WINDOW_MS)).toBe(false);
    expect(core.recordFailure("ip:a", t0 + ADMIN_AUTH_WINDOW_MS)).toBe(false);
  });

  it("worker state survives isolate memory loss when the DO binding is present", async () => {
    const { ns, calls } = fakeNamespace();
    const env = baseEnv({ ADMIN_AUTH_LIMITER: ns });
    for (let i = 0; i < ADMIN_AUTH_MAX_FAILURES; i++) await login(env, "wrong-token-value-0123456789abcdef");
    resetAdminAuthRateLimit(); // simulate a fresh isolate: in-memory fallback is empty
    const blocked = await login(env);
    expect(blocked.status).toBe(429);
    expect(blocked.headers.get("Set-Cookie")).toBeNull();
    expect(calls()).toBeGreaterThan(ADMIN_AUTH_MAX_FAILURES);
    expect((await login(env, ADMIN, "198.51.100.77")).status).toBe(303);
  });

  it("fails closed when the Durable Object errors", async () => {
    const broken = { idFromName: (n: string) => n, get: () => ({ fetch: async () => { throw new Error("down"); } }) };
    expect((await login(baseEnv({ ADMIN_AUTH_LIMITER: broken }))).status).toBe(429);
  });

  it("wrangler.jsonc declares the DO binding with a SQLite migration", () => {
    const cfg = readFileSync("wrangler.jsonc", "utf8");
    expect(cfg).toMatch(/"name":\s*"ADMIN_AUTH_LIMITER",\s*"class_name":\s*"AdminAuthLimiter"/);
    expect(cfg).toMatch(/"new_sqlite_classes":\s*\[\s*"AdminAuthLimiter"\s*\]/);
    expect(readFileSync("src/index.ts", "utf8")).not.toMatch(/const adminAuthFailures = new Map/);
  });
});

describe("(2) dedicated ADMIN_SESSION_SECRET", () => {
  for (const [label, extra] of [
    ["missing", { ADMIN_SESSION_SECRET: undefined }],
    ["shorter than 32 chars", { ADMIN_SESSION_SECRET: "x".repeat(31) }],
    ["equal to ADMIN_TOKEN", { ADMIN_SESSION_SECRET: ADMIN }],
  ] as const) {
    it(`fails closed when it is ${label}`, async () => {
      const env = baseEnv(extra);
      const res = await login(env);
      expect(res.status).toBe(503);
      expect(res.headers.get("Set-Cookie")).toBeNull();
      expect(await createAdminSession(env)).toBeNull();
      const good = (await createAdminSession(baseEnv()))!;
      expect(await verifyAdminSession(env, good)).toBe(false);
    });
  }

  it("sessions are signed with the session secret, not a key derived from ADMIN_TOKEN", async () => {
    const s = (await createAdminSession(baseEnv()))!;
    expect(await verifyAdminSession(baseEnv(), s)).toBe(true);
    // Same session secret, rotated ADMIN_TOKEN: still valid (key does not depend on ADMIN_TOKEN).
    expect(await verifyAdminSession(baseEnv({ ADMIN_TOKEN: "rotated-admin-secret-0123456789abcdef" }), s)).toBe(true);
    // Rotated session secret: invalid.
    expect(await verifyAdminSession(baseEnv({ ADMIN_SESSION_SECRET: "other-session-secret-0123456789abcdefgh" }), s)).toBe(false);
  });

  it("ADMIN_TOKEN shorter than 32 chars keeps admin closed", async () => {
    expect((await call("/admin", undefined, baseEnv({ ADMIN_TOKEN: "a".repeat(31) }))).status).toBe(404);
  });
});

describe("(3) CSRF origin checks and POST-only setup-webhook", () => {
  const post = (path: string, headers: Record<string, string>) =>
    call(path, { method: "POST", headers: { "Content-Type": "application/json", ...headers }, body: "{}" });

  it("rejects cross-site Origin and Sec-Fetch-Site on admin writes, even with a valid token", async () => {
    expect((await post("/api/admin/rerank", { "x-admin-token": ADMIN, Origin: "https://evil.example" })).status).toBe(403);
    expect((await post("/api/admin/rerank", { "x-admin-token": ADMIN, Origin: "null" })).status).toBe(403);
    expect((await post("/api/admin/rerank", { "x-admin-token": ADMIN, "Sec-Fetch-Site": "cross-site" })).status).toBe(403);
    expect((await post("/api/admin/rerank", { "x-admin-token": ADMIN, "Sec-Fetch-Site": "same-site" })).status).toBe(403);
    expect((await post("/api/crawl/seed", { "x-admin-token": ADMIN, Origin: "https://evil.example" })).status).toBe(403);
    expect((await post("/admin/logout", { Origin: "https://evil.example" })).status).toBe(403);
    expect((await login(baseEnv(), ADMIN, "203.0.113.60", { Origin: "https://evil.example" })).status).toBe(403);
  });

  it("rejects a cookie-only admin write that carries no Origin/Sec-Fetch-Site", async () => {
    const s = (await createAdminSession(baseEnv()))!;
    expect((await post("/api/admin/rerank", { Cookie: `${ADMIN_COOKIE_NAME}=${s}` })).status).toBe(403);
  });

  it("allows same-origin browser writes and header-token scripts", async () => {
    const s = (await createAdminSession(baseEnv()))!;
    const sameOrigin = await post("/api/admin/feedbacks/status", { Cookie: `${ADMIN_COOKIE_NAME}=${s}`, Origin: "https://jobs.ai-kit.net", "Sec-Fetch-Site": "same-origin" });
    expect(sameOrigin.status).not.toBe(403);
    expect(sameOrigin.status).not.toBe(401);
    const script = await post("/api/admin/feedbacks/status", { "x-admin-token": ADMIN });
    expect(script.status).not.toBe(403);
    expect(script.status).not.toBe(401);
  });

  it("GET reads are not blocked by the origin check", async () => {
    expect((await call("/api/admin/stats", { headers: { "x-admin-token": ADMIN, "Sec-Fetch-Site": "cross-site" } })).status).toBe(200);
  });

  it("setup-webhook is POST-only", async () => {
    const res = await call("/api/telegram/setup-webhook", { headers: { "x-admin-token": ADMIN } });
    expect(res.status).toBe(405);
    expect(res.headers.get("Allow")).toBe("POST");
  });
});

describe("(4) bot admin only from TELEGRAM_ADMIN_IDS", () => {
  it("ignores role=admin from D1", () => {
    const env = { DB: db, TELEGRAM_ADMIN_IDS: "5550001" } as any;
    expect(isTelegramAdmin(env, { id: 42 }, "admin")).toBe(false);
    expect(isTelegramAdmin({ DB: db } as any, { id: 42 }, "admin")).toBe(false);
    expect(isTelegramAdmin(env, { id: 5550001 }, "user")).toBe(true);
  });
});
