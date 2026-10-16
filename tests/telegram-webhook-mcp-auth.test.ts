import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { readFileSync } from "node:fs";
import worker, { verifyTelegramAuth, resetAdminAuthRateLimit } from "../src/index.js";
import { InMemoryD1Database } from "../src/db/in-memory-db.js";
import { UserRepository } from "../src/db/repositories.js";
import { TEST_BOT_TOKEN, TEST_WEBHOOK_SECRET, TG_WEBHOOK_HEADERS, signTelegramLogin } from "./helpers/telegram.js";

// Test-only values (never real secrets).
const ADMIN = "test-admin-secret-0123456789abcdef";
const ctx = { waitUntil: () => {}, passThroughOnException: () => {} } as any;
let db: InMemoryD1Database;
const baseEnv = () => ({
  DB: db,
  ADMIN_TOKEN: ADMIN,
  TELEGRAM_BOT_TOKEN: TEST_BOT_TOKEN,
  TELEGRAM_WEBHOOK_SECRET: TEST_WEBHOOK_SECRET,
  TELEGRAM_ADMIN_IDS: "5550001",
});
const call = (path: string, init?: RequestInit, env: Record<string, unknown> = baseEnv()) =>
  worker.fetch(new Request(`https://jobs.ai-kit.net${path}`, init), env as any, ctx);
const update = (from: Record<string, unknown>, text: string) =>
  JSON.stringify({ message: { from, chat: { id: from.id }, text } });

beforeEach(() => {
  db = new InMemoryD1Database();
  resetAdminAuthRateLimit();
});

describe("(A) Telegram webhook secret and numeric admin IDs", () => {
  it("rejects calls without the secret header", async () => {
    const res = await call("/api/telegram/webhook", { method: "POST", headers: { "Content-Type": "application/json" }, body: update({ id: 5550001 }, "/stats") });
    expect(res.status).toBe(401);
  });

  it("rejects a wrong secret and processes nothing", async () => {
    const res = await call("/api/telegram/webhook", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Telegram-Bot-Api-Secret-Token": "wrong-secret-value-0000000" },
      body: update({ id: 4242, first_name: "X" }, "/start"),
    });
    expect(res.status).toBe(401);
    expect(await new UserRepository(db).findByTelegramId("4242")).toBeNull();
  });

  it("fails closed when TELEGRAM_WEBHOOK_SECRET is not configured, even if a header is sent", async () => {
    const { TELEGRAM_WEBHOOK_SECRET: _omit, ...env } = baseEnv();
    for (const header of [TEST_WEBHOOK_SECRET, ""]) {
      const res = await call("/api/telegram/webhook", { method: "POST", headers: { "Content-Type": "application/json", "X-Telegram-Bot-Api-Secret-Token": header }, body: update({ id: 1 }, "/start") }, env);
      expect(res.status).toBe(401);
    }
  });

  it("accepts the correct secret", async () => {
    const res = await call("/api/telegram/webhook", { method: "POST", headers: TG_WEBHOOK_HEADERS, body: update({ id: 4243, first_name: "Ok" }, "/start") });
    expect(res.status).toBe(200);
    expect(((await res.json()) as any).authenticated).toBe(true);
  });

  it("admin commands work only for numeric IDs in TELEGRAM_ADMIN_IDS, never usernames", async () => {
    const env = { ...baseEnv(), TELEGRAM_ADMIN_USERNAMES: "tuannx87" };
    const byName = await call("/api/telegram/webhook", { method: "POST", headers: TG_WEBHOOK_HEADERS, body: update({ id: 9999, username: "tuannx87" }, "/users") }, env);
    expect(((await byName.json()) as any).ok).not.toBe(true);
    const byId = await call("/api/telegram/webhook", { method: "POST", headers: TG_WEBHOOK_HEADERS, body: update({ id: 5550001, username: "anything" }, "/users") }, env);
    expect(((await byId.json()) as any).ok).toBe(true);
  });

  it("/start never persists role=admin, even for a configured admin ID", async () => {
    await call("/api/telegram/webhook", { method: "POST", headers: TG_WEBHOOK_HEADERS, body: update({ id: 5550001, username: "tuannx87" }, "/start") });
    expect((await new UserRepository(db).findByTelegramId("5550001"))?.role).toBe("user");
  });

  it("the default admin username is gone from source and wrangler config", () => {
    expect(readFileSync("src/index.ts", "utf8")).not.toMatch(/\|\|\s*"tuannx87"/);
    expect(readFileSync("wrangler.jsonc", "utf8")).not.toMatch(/TELEGRAM_ADMIN_USERNAMES/);
  });
});

describe("(C) /api/telegram/setup-webhook", () => {
  const realFetch = globalThis.fetch;
  let captured: { url: string; body: any } | null = null;
  beforeEach(() => {
    captured = null;
    globalThis.fetch = (async (input: any, init?: RequestInit) => {
      captured = { url: String(input), body: init?.body ? JSON.parse(String(init.body)) : null };
      return Response.json({ ok: true, result: true });
    }) as any;
  });
  afterEach(() => {
    globalThis.fetch = realFetch;
  });

  it("requires admin auth and does not call Telegram for anonymous callers", async () => {
    for (const method of ["GET", "POST"]) {
      const res = await call("/api/telegram/setup-webhook", { method });
      expect(res.status).toBe(401);
    }
    expect((await call("/api/telegram/setup-webhook", { headers: { "x-admin-token": "wrong-token-value-123456" } })).status).toBe(401);
    expect(captured).toBeNull();
  });

  it("passes secret_token to setWebhook for an admin, without the secret in the URL", async () => {
    const res = await call("/api/telegram/setup-webhook", { method: "POST", headers: { "x-admin-token": ADMIN } });
    expect(res.status).toBe(200);
    expect(captured!.url).toMatch(/\/setWebhook$/);
    expect(captured!.url).not.toContain(TEST_WEBHOOK_SECRET);
    expect(captured!.body).toEqual({ url: "https://jobs.ai-kit.net/api/telegram/webhook", secret_token: TEST_WEBHOOK_SECRET });
    expect(JSON.stringify(await res.json())).not.toContain(TEST_WEBHOOK_SECRET);
  });

  it("refuses to register a webhook when TELEGRAM_WEBHOOK_SECRET is missing", async () => {
    const { TELEGRAM_WEBHOOK_SECRET: _omit, ...env } = baseEnv();
    const res = await call("/api/telegram/setup-webhook", { headers: { "x-admin-token": ADMIN } }, env);
    expect(res.status).toBe(400);
    expect(captured).toBeNull();
  });
});

describe("(B) POST /api/auth/telegram (Login Widget)", () => {
  const login = (body: unknown, env: Record<string, unknown> = baseEnv()) =>
    call("/api/auth/telegram", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }, env);

  it("accepts correctly signed, fresh data", async () => {
    const res = await login(signTelegramLogin({ id: 123456789, first_name: "Ann", username: "ann" }));
    expect(res.status).toBe(200);
    expect(((await res.json()) as any).user.telegramId).toBe("123456789");
  });

  it("rejects missing hash, with and without an id/username", async () => {
    for (const body of [{ id: 123456789, first_name: "Ann" }, { username: "ann" }, { telegram_id: "123456789" }, {}]) {
      expect((await login(body)).status).toBe(401);
    }
    expect(await new UserRepository(db).findByTelegramId("123456789")).toBeNull();
  });

  it("has no path that skips the hash when the bot token is unset", async () => {
    const { TELEGRAM_BOT_TOKEN: _omit, ...env } = baseEnv();
    expect((await login({ id: 123456789, first_name: "Ann" }, env)).status).toBe(503);
    expect((await login(signTelegramLogin({ id: 123456789 }), env)).status).toBe(503);
  });

  it("rejects a bad signature, tampered fields, or a different bot token", async () => {
    const signed = signTelegramLogin({ id: 123456789, first_name: "Ann" });
    expect((await login({ ...signed, id: 987654321 })).status).toBe(403);
    expect((await login({ ...signed, hash: "0".repeat(64) })).status).toBe(403);
    expect((await login(signTelegramLogin({ id: 123456789 }, "999:other-bot-token"))).status).toBe(403);
  });

  it("rejects stale auth_date (default 24h) and future-dated data", async () => {
    const now = Math.floor(Date.now() / 1000);
    expect((await login(signTelegramLogin({ id: 123456789 }, TEST_BOT_TOKEN, now - 86400 - 60))).status).toBe(403);
    expect((await login(signTelegramLogin({ id: 123456789 }, TEST_BOT_TOKEN, now - 86400 + 60))).status).toBe(200);
    expect((await login(signTelegramLogin({ id: 123456789 }, TEST_BOT_TOKEN, now + 3600))).status).toBe(403);
  });

  it("honours TELEGRAM_AUTH_MAX_AGE_SECONDS", async () => {
    const now = Math.floor(Date.now() / 1000);
    const env = { ...baseEnv(), TELEGRAM_AUTH_MAX_AGE_SECONDS: "300" };
    expect((await login(signTelegramLogin({ id: 123456789 }, TEST_BOT_TOKEN, now - 600), env)).status).toBe(403);
    expect((await login(signTelegramLogin({ id: 123456789 }, TEST_BOT_TOKEN, now - 60), env)).status).toBe(200);
  });

  it("verifyTelegramAuth requires hash and auth_date", async () => {
    const signed = signTelegramLogin({ id: 1 });
    expect(await verifyTelegramAuth(signed, TEST_BOT_TOKEN)).toBe(true);
    const { hash: _h, ...noHash } = signed;
    expect(await verifyTelegramAuth(noHash, TEST_BOT_TOKEN)).toBe(false);
    const { auth_date: _a, ...noDate } = signed;
    expect(await verifyTelegramAuth(noDate, TEST_BOT_TOKEN)).toBe(false);
    expect(await verifyTelegramAuth(signed, "")).toBe(false);
  });

  it("the demo confirm-session endpoint is off by default", async () => {
    const res = await call("/api/auth/telegram/confirm-session", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token: "x", id: "5550001" }) });
    expect(res.status).toBe(404);
  });
});

describe("(D) MCP user token transport", () => {
  let apiToken = "";
  const rpc = JSON.stringify({ jsonrpc: "2.0", id: 1, method: "initialize", params: {} });
  beforeEach(async () => {
    const res = await call("/api/auth/telegram", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(signTelegramLogin({ id: 31337, first_name: "Mcp" })) });
    apiToken = ((await res.json()) as any).user.apiToken;
  });

  it("accepts Authorization: Bearer", async () => {
    const res = await call("/mcp", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiToken}` }, body: rpc });
    expect(res.status).toBe(200);
  });

  it("rejects /mcp?token= by default", async () => {
    const res = await call(`/mcp?token=${apiToken}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: rpc });
    expect(res.status).toBe(401);
    const sse = await call(`/mcp/sse?token=${apiToken}`);
    expect(sse.status).toBe(401);
  });

  it("allows /mcp?token= only when MCP_ALLOW_QUERY_TOKEN=true", async () => {
    const env = { ...baseEnv(), MCP_ALLOW_QUERY_TOKEN: "true" };
    const res = await call(`/mcp?token=${apiToken}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: rpc }, env);
    expect(res.status).toBe(200);
  });

  it("SSE endpoint event never puts the token in a URL", async () => {
    const res = await call("/mcp/sse", { headers: { Authorization: `Bearer ${apiToken}` } });
    expect(res.status).toBe(200);
    const text = await res.text();
    expect(text).toContain("data: /mcp\n");
    expect(text).not.toContain(apiToken);
  });

  it("other user APIs no longer accept ?token=", async () => {
    expect((await call(`/api/user/me?token=${apiToken}`)).status).toBe(401);
    expect((await call("/api/user/me", { headers: { Authorization: `Bearer ${apiToken}` } })).status).toBe(200);
  });
});
