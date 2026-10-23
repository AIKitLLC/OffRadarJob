import { describe, it, expect, beforeEach } from "vitest";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import worker, {
  isAuthorized,
  verifyAdminToken,
  timingSafeEqualStr,
  LEAKED_ADMIN_TOKEN_SHA256,
  ADMIN_COOKIE_NAME,
  ADMIN_AUTH_MAX_FAILURES,
  resetAdminAuthRateLimit,
  createAdminSession,
  verifyAdminSession,
  ADMIN_SESSION_TTL_SECONDS,
} from "../src/index.js";
import { InMemoryD1Database } from "../src/db/in-memory-db.js";

// Test-only secret (never a real token).
const SECRET = "test-admin-secret-0123456789abcdef";
const SESSION_SECRET = "test-session-secret-0123456789abcdefghij";
const ctx = { waitUntil: () => {}, passThroughOnException: () => {} } as any;

/** The token that used to be hardcoded, read from git history (last commit that had it). Never logged. */
function leakedDefaultToken(): string | null {
  try {
    const src = execFileSync("git", ["show", "7304e5c:src/index.ts"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
    return src.match(/DEFAULT_ADMIN_TOKEN = "([^"]+)"/)?.[1] ?? null;
  } catch {
    return null;
  }
}
const LEAKED = leakedDefaultToken();

let db: InMemoryD1Database;
const call = (path: string, init?: RequestInit, env: Record<string, unknown> = { ADMIN_TOKEN: SECRET, ADMIN_SESSION_SECRET: SESSION_SECRET }) =>
  worker.fetch(new Request(`https://jobs.ai-kit.net${path}`, init), { DB: db, ...env } as any, ctx);

beforeEach(() => {
  db = new InMemoryD1Database();
  resetAdminAuthRateLimit();
});

describe("admin fails closed without the ADMIN_TOKEN secret", () => {
  it("GET /admin is 404 and sets no cookie", async () => {
    const res = await call("/admin", undefined, {});
    expect(res.status).toBe(404);
    expect(res.headers.get("Set-Cookie")).toBeNull();
  });

  it("admin APIs are 401 even with a token supplied", async () => {
    for (const path of ["/api/admin/stats", "/api/admin/tasks"]) {
      const res = await call(path, { headers: { "x-admin-token": SECRET } }, {});
      expect(res.status).toBe(401);
    }
  });

  it("POST /admin/login is 404", async () => {
    const res = await call("/admin/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token: SECRET }) }, {});
    expect(res.status).toBe(404);
  });

  it("a too-short secret also keeps admin closed", async () => {
    expect(await verifyAdminToken({ ADMIN_TOKEN: "short" }, "short")).toBe(false);
  });
});

describe("token checks", () => {
  it("rejects a wrong token on header, bearer and login", async () => {
    expect((await call("/api/admin/stats", { headers: { "x-admin-token": SECRET + "x" } })).status).toBe(401);
    expect((await call("/api/admin/stats", { headers: { Authorization: "Bearer wrong-token-value-123456" } })).status).toBe(401);
    const login = await call("/admin/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token: "wrong-token-value-123456" }) });
    expect(login.status).toBe(401);
    expect(login.headers.get("Set-Cookie")).toBeNull();
  });

  it("accepts the configured secret via header", async () => {
    expect((await call("/api/admin/stats", { headers: { "x-admin-token": SECRET } })).status).toBe(200);
  });

  it("no longer accepts tokens in the query string", async () => {
    expect((await call(`/api/admin/stats?token=${SECRET}`)).status).toBe(401);
  });

  it("constant-time compare behaves like equality", async () => {
    expect(await timingSafeEqualStr("abc", "abc")).toBe(true);
    expect(await timingSafeEqualStr("abc", "abd")).toBe(false);
    expect(await timingSafeEqualStr("abc", "abcd")).toBe(false);
  });
});

describe.skipIf(!LEAKED)("old hardcoded default token", () => {
  it("matches the denylisted hash", () => {
    expect(createHash("sha256").update(LEAKED!).digest("hex")).toBe(LEAKED_ADMIN_TOKEN_SHA256);
  });

  it("is rejected when a different secret is configured", async () => {
    expect((await call("/api/admin/stats", { headers: { "x-admin-token": LEAKED! } })).status).toBe(401);
    const tg = await call("/admin/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token: LEAKED }) });
    expect(tg.status).toBe(401);
  });

  it("is rejected with no secret configured (no fallback)", async () => {
    expect((await call("/api/admin/stats", { headers: { "x-admin-token": LEAKED! } }, {})).status).toBe(401);
  });

  it("keeps admin closed even if someone re-sets it as the secret", async () => {
    expect((await call("/admin", undefined, { ADMIN_TOKEN: LEAKED })).status).toBe(404);
    expect((await call("/api/admin/stats", { headers: { "x-admin-token": LEAKED! } }, { ADMIN_TOKEN: LEAKED })).status).toBe(401);
  });
});

describe("/admin login flow", () => {
  it("anonymous GET /admin shows the login form and sets NO cookie", async () => {
    const res = await call("/admin");
    expect(res.status).toBe(401);
    expect(res.headers.get("Set-Cookie")).toBeNull();
    const html = await res.text();
    expect(html).toContain('action="/admin/login"');
    expect(html).not.toContain("Crawl Tasks Monitor");
    expect(html).not.toContain(SECRET);
  });

  it("POST /admin/login sets an HttpOnly Secure SameSite=Strict cookie that then authorizes", async () => {
    const form = new FormData();
    form.set("token", SECRET);
    const res = await call("/admin/login", { method: "POST", body: form });
    expect(res.status).toBe(303);
    const cookie = res.headers.get("Set-Cookie")!;
    expect(cookie).toContain(`${ADMIN_COOKIE_NAME}=`);
    expect(cookie).toContain("HttpOnly");
    expect(cookie).toContain("Secure");
    expect(cookie).toContain("SameSite=Strict");
    const session = cookie.split(";")[0]!;
    const page = await call("/admin", { headers: { Cookie: session } });
    expect(page.status).toBe(200);
    expect(await page.text()).toContain("Crawl Tasks Monitor");
  });

  it("the legacy auto-set admin_token cookie name is not honoured", async () => {
    const req = new Request("https://jobs.ai-kit.net/api/admin/stats", { headers: { Cookie: `admin_token=${SECRET}` } });
    expect(await isAuthorized(req, new URL(req.url), { DB: db, ADMIN_TOKEN: SECRET } as any)).toBe(false);
  });
});

describe("public dashboard hides admin controls", () => {
  it("omits the admin link, seed ingest, and admin session request for anonymous visitors", async () => {
    const res = await call("/");
    const html = await res.text();
    expect(res.headers.get("Cache-Control")).toContain("private");
    expect(html).not.toMatch(/<a[^>]*href="\/admin"/);
    expect(html).not.toContain('id="seed-ingest"');
    expect(html).not.toContain("/api/admin/session");
  });

  it("includes the admin link and seed ingest only after a valid admin session", async () => {
    const form = new FormData();
    form.set("token", SECRET);
    const login = await call("/admin/login", { method: "POST", body: form });
    const session = login.headers.get("Set-Cookie")!.split(";")[0]!;
    const html = await (await call("/", { headers: { Cookie: session } })).text();
    expect(html).toMatch(/<a href="\/admin" id="admin-link"/);
    expect(html).toContain('id="seed-ingest"');
    expect(html).not.toContain("/api/admin/session");
  });

  it("a bad admin cookie does not reveal the link or consume the auth limiter", async () => {
    for (let i = 0; i < ADMIN_AUTH_MAX_FAILURES + 2; i++) {
      const html = await (await call("/", { headers: { Cookie: `${ADMIN_COOKIE_NAME}=not-a-session` } })).text();
      expect(html).not.toMatch(/<a[^>]*href="\/admin"/);
      expect(html).not.toContain('id="seed-ingest"');
      expect(html).not.toContain("/api/admin/session");
    }
    expect((await call("/api/admin/stats", { headers: { "x-admin-token": SECRET } })).status).toBe(200);
  });

  it("/api/admin/session reports admin=false for anonymous visitors", async () => {
    expect(await (await call("/api/admin/session")).json()).toEqual({ admin: false });
    expect(await (await call("/api/admin/session", { headers: { "x-admin-token": SECRET } })).json()).toEqual({ admin: true });
  });

  it("seed ingest API requires admin", async () => {
    const res = await call("/api/crawl/seed", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: "https://example.org" }) });
    expect(res.status).toBe(401);
  });
});

describe("config hygiene", () => {
  it("wrangler.jsonc has no ADMIN_TOKEN var and the source has no default token", () => {
    expect(readFileSync("wrangler.jsonc", "utf8")).not.toMatch(/ADMIN_TOKEN/);
    expect(readFileSync("src/index.ts", "utf8")).not.toMatch(/DEFAULT_ADMIN_TOKEN/);
    if (LEAKED) {
      for (const f of ["src/index.ts", "src/ui/admin-dashboard.ts", "src/scripts/weekly-scanner.ts", "src/scripts/harvest-public-sources.ts", "src/scripts/continuous-batch-feeder.ts"]) {
        expect(readFileSync(f, "utf8").includes(LEAKED)).toBe(false);
      }
    }
  });
});

describe("admin auth rate limit (per IP)", () => {
  const login = (ip: string, token: string) =>
    call("/admin/login", { method: "POST", headers: { "Content-Type": "application/json", "CF-Connecting-IP": ip }, body: JSON.stringify({ token }) });

  it("returns 429 after repeated failed logins, even for the correct token, and only for that IP", async () => {
    for (let i = 0; i < ADMIN_AUTH_MAX_FAILURES - 1; i++) expect((await login("203.0.113.7", "wrong-token-value-123456")).status).toBe(401);
    expect((await login("203.0.113.7", "wrong-token-value-123456")).status).toBe(429);
    const blocked = await login("203.0.113.7", SECRET);
    expect(blocked.status).toBe(429);
    expect(blocked.headers.get("Retry-After")).toBeTruthy();
    expect(blocked.headers.get("Set-Cookie")).toBeNull();
    expect((await login("198.51.100.9", SECRET)).status).toBe(303);
  });

  it("failed header tokens on admin APIs also count toward the limit", async () => {
    for (let i = 0; i < ADMIN_AUTH_MAX_FAILURES; i++) {
      await call("/api/admin/stats", { headers: { "x-admin-token": "wrong-token-value-123456", "CF-Connecting-IP": "203.0.113.8" } });
    }
    expect((await call("/api/admin/stats", { headers: { "x-admin-token": SECRET, "CF-Connecting-IP": "203.0.113.8" } })).status).toBe(429);
  });

  it("anonymous requests without a credential are not counted", async () => {
    for (let i = 0; i < ADMIN_AUTH_MAX_FAILURES + 2; i++) await call("/admin", { headers: { "CF-Connecting-IP": "203.0.113.9" } });
    expect((await call("/api/admin/stats", { headers: { "x-admin-token": SECRET, "CF-Connecting-IP": "203.0.113.9" } })).status).toBe(200);
  });
});

describe("signed admin session cookie", () => {
  const env = { ADMIN_TOKEN: SECRET, ADMIN_SESSION_SECRET: SESSION_SECRET };

  it("the login cookie never contains the raw admin token and is a signed {iat,exp} payload", async () => {
    const form = new FormData();
    form.set("token", SECRET);
    const res = await call("/admin/login", { method: "POST", body: form });
    const cookie = res.headers.get("Set-Cookie")!;
    expect(cookie).not.toContain(SECRET);
    expect(cookie).not.toContain(encodeURIComponent(SECRET));
    expect(cookie).toContain(`Max-Age=${ADMIN_SESSION_TTL_SECONDS}`);
    const value = cookie.split(";")[0]!.split("=").slice(1).join("=");
    const payload = JSON.parse(Buffer.from(value.split(".")[0]!, "base64url").toString("utf8"));
    expect(payload.exp - payload.iat).toBe(8 * 60 * 60);
  });

  it("a cookie holding the raw token is rejected", async () => {
    const req = new Request("https://jobs.ai-kit.net/api/admin/stats", { headers: { Cookie: `${ADMIN_COOKIE_NAME}=${SECRET}` } });
    expect(await isAuthorized(req, new URL(req.url), { DB: db, ...env } as any)).toBe(false);
  });

  it("verifies fresh sessions and rejects expired, tampered or foreign-key sessions", async () => {
    const now = Date.now();
    const s = (await createAdminSession(env, now))!;
    expect(await verifyAdminSession(env, s, now)).toBe(true);
    expect(await verifyAdminSession(env, s, now + ADMIN_SESSION_TTL_SECONDS * 1000 + 1000)).toBe(false);
    const [p, sig] = s.split(".");
    const forged = Buffer.from(JSON.stringify({ iat: Math.floor(now / 1000), exp: Math.floor(now / 1000) + 10 * 365 * 86400 })).toString("base64url");
    expect(await verifyAdminSession(env, `${forged}.${sig}`, now)).toBe(false);
    expect(await verifyAdminSession(env, `${p}.${sig!.slice(0, -2)}AA`, now)).toBe(false);
    expect(await verifyAdminSession({ ADMIN_TOKEN: SECRET, ADMIN_SESSION_SECRET: "another-session-secret-0123456789abcdef" }, s, now)).toBe(false);
    expect(await verifyAdminSession(env, "garbage", now)).toBe(false);
    expect(await verifyAdminSession({}, s, now)).toBe(false);
  });

  it("rotating ADMIN_SESSION_SECRET invalidates existing sessions", async () => {
    const s = (await createAdminSession(env))!;
    const page = await call("/admin", { headers: { Cookie: `${ADMIN_COOKIE_NAME}=${s}` } }, { ADMIN_TOKEN: SECRET, ADMIN_SESSION_SECRET: "rotated-session-secret-0123456789abcdef" });
    expect(page.status).toBe(401);
  });
});

describe("scripts send the admin token only in a header", () => {
  it("does not put the token in the query string", () => {
    for (const f of ["src/scripts/continuous-batch-feeder.ts", "src/scripts/harvest-public-sources.ts"]) {
      const src = readFileSync(f, "utf8");
      expect(src).not.toMatch(/[?&]token=\$\{/);
      expect(src).toContain('"x-admin-token": token');
    }
  });
});
