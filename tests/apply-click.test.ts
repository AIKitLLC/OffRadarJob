import { beforeEach, describe, expect, it } from "vitest";
import { asD1, loadSqlite, migratedSqlite, type SqliteRaw } from "./helpers/sqlite-d1.js";
import { JobRepository } from "../src/db/repositories.js";
import { handleApplyClickRoutes } from "../src/http/apply-click-routes.js";
import {
  CLICK_DEDUPE_WINDOW_MS,
  isCountableRequest,
  isDuplicateClick,
  parseClickTags,
} from "../src/analytics/click-source.js";
import type { ID1Database } from "../src/db/types.js";
import type { User } from "../src/types/domain.js";

// Issue #39: apply-click measurement.

const NOW = 1_800_000_000_000;
const BROWSER = "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 Chrome/130 Safari/537.36";
const USER: User = {
  id: "user_a",
  telegramId: "tg_a",
  firstName: "A",
  apiToken: "tok_a",
  createdAt: 1,
  updatedAt: 1,
} as User;

describe("click-source rules", () => {
  it("maps unknown sources to other and keeps a slug only for list traffic", () => {
    expect(parseClickTags("LIST", "midwest-gems")).toEqual({ source: "list", listSlug: "midwest-gems" });
    expect(parseClickTags("digest", "midwest-gems")).toEqual({ source: "digest", listSlug: null });
    expect(parseClickTags("list", "Bad Slug!")).toEqual({ source: "list", listSlug: null });
    expect(parseClickTags("evil<script>", null)).toEqual({ source: "other", listSlug: null });
    expect(parseClickTags(null, null)).toEqual({ source: "other", listSlug: null });
  });

  it("counts only real GETs from non-bot clients", () => {
    expect(isCountableRequest({ method: "GET", userAgent: BROWSER, purpose: null })).toBe(true);
    expect(isCountableRequest({ method: "HEAD", userAgent: BROWSER, purpose: null })).toBe(false);
    expect(isCountableRequest({ method: "GET", userAgent: BROWSER, purpose: "prefetch" })).toBe(false);
    expect(isCountableRequest({ method: "GET", userAgent: null, purpose: null })).toBe(false);
    for (const ua of ["TelegramBot (like TwitterBot)", "Slackbot-LinkExpanding 1.0", "LinkedInBot/1.0", "curl/8.4.0", "facebookexternalhit/1.1"]) {
      expect(isCountableRequest({ method: "GET", userAgent: ua, purpose: null }), ua).toBe(false);
    }
  });

  it("dedupes signed-in clicks inside the window only", () => {
    expect(isDuplicateClick("u", NOW - 1000, NOW)).toBe(true);
    expect(isDuplicateClick("u", NOW - CLICK_DEDUPE_WINDOW_MS, NOW)).toBe(false);
    expect(isDuplicateClick("u", null, NOW)).toBe(false);
    expect(isDuplicateClick(null, NOW - 1000, NOW)).toBe(false);
  });
});

const sqlite = loadSqlite();
const d = sqlite ? describe : describe.skip;

d("apply-click routes (real SQL)", () => {
  let raw: SqliteRaw;
  let db: ID1Database;
  let now = NOW;

  const addJob = (id: string, applyType: string, applyTarget: string, companyId = "c_a") => {
    raw.prepare(
      `INSERT INTO jobs (id, company_id, career_page_id, title, apply_type, apply_target, status, content_hash, first_seen_at, last_seen_at)
       VALUES (?, ?, 'cp_a', ?, ?, ?, 'open', ?, ?, ?)`
    ).run(id, companyId, `Role ${id}`, applyType, applyTarget, `h_${id}`, NOW, NOW);
  };

  const call = async (
    path: string,
    opts: { method?: string; ua?: string | null; user?: User | null; admin?: boolean; headers?: Record<string, string> } = {}
  ) => {
    const headers = new Headers(opts.headers ?? {});
    if (opts.ua !== null) headers.set("User-Agent", opts.ua ?? BROWSER);
    const request = new Request(`https://jobs.example${path}`, { method: opts.method ?? "GET", headers });
    const url = new URL(request.url);
    const pending: Promise<unknown>[] = [];
    const response = await handleApplyClickRoutes({
      request,
      path: url.pathname,
      url,
      db,
      getJob: (id) => new JobRepository(db).getById(id),
      getUser: async () => opts.user ?? null,
      authorizeAdmin: async () => opts.admin === true,
      waitUntil: (p) => pending.push(p),
      now: () => now,
    });
    await Promise.all(pending);
    return response;
  };

  const clicks = () => raw.prepare("SELECT job_id, user_id, source, list_slug FROM apply_clicks ORDER BY created_at, id").all();

  beforeEach(() => {
    raw = migratedSqlite(sqlite!);
    db = asD1(raw);
    now = NOW;
    raw.exec("DELETE FROM jobs");
    raw.exec("INSERT OR IGNORE INTO companies (id, domain, name, website_url, created_at, updated_at) VALUES ('c_a','a.example','Acme','https://a.example',1,1)");
    raw.exec("INSERT OR IGNORE INTO companies (id, domain, name, website_url, created_at, updated_at) VALUES ('c_b','b.example','Beta','https://b.example',1,1)");
    raw.exec("INSERT OR IGNORE INTO career_pages (id, company_id, url, page_type, last_checked_at, created_at) VALUES ('cp_a','c_a','https://a.example/careers','custom',1,1)");
    raw.exec("INSERT INTO users (id, telegram_id, first_name, api_token, created_at, updated_at) VALUES ('user_a','tg_a','A','tok_a',1,1)");
    addJob("job_1", "url", "https://boards.greenhouse.io/acme/jobs/111");
    addJob("job_2", "url", "https://jobs.lever.co/beta/222", "c_b");
    addJob("job_mail", "email", "jobs@a.example");
    addJob("job_local", "url", "https://127.0.0.1/jobs/1");
  });

  it("redirects to the stored apply URL with safe headers", async () => {
    const res = await call("/go/job_1?src=list&l=midwest-gems");
    expect(res?.status).toBe(302);
    expect(res?.headers.get("Location")).toBe("https://boards.greenhouse.io/acme/jobs/111");
    expect(res?.headers.get("Cache-Control")).toBe("no-store");
    expect(res?.headers.get("Referrer-Policy")).toBe("origin");
    expect(clicks()).toEqual([{ job_id: "job_1", user_id: null, source: "list", list_slug: "midwest-gems" }]);
  });

  it("never follows a URL from the query string", async () => {
    const res = await call("/go/job_1?url=https%3A%2F%2Fevil.example&next=https://evil.example");
    expect(res?.headers.get("Location")).toBe("https://boards.greenhouse.io/acme/jobs/111");
  });

  it("returns 404 for unknown jobs, non-URL applies, unsafe stored URLs and malformed ids", async () => {
    for (const path of ["/go/nope", "/go/job_mail", "/go/job_local", "/go/..%2F..%2Fetc", "/go/%E0%A4%A", "/go/"]) {
      expect((await call(path))?.status, path).toBe(404);
    }
    expect(clicks()).toEqual([]);
  });

  it("redirects bots, HEAD and prefetch requests without counting them", async () => {
    expect((await call("/go/job_1", { ua: "TelegramBot (like TwitterBot)" }))?.status).toBe(302);
    expect((await call("/go/job_1", { method: "HEAD" }))?.status).toBe(302);
    expect((await call("/go/job_1", { headers: { "Sec-Purpose": "prefetch" } }))?.status).toBe(302);
    expect((await call("/go/job_1", { ua: null }))?.status).toBe(302);
    expect(clicks()).toEqual([]);
  });

  it("dedupes a signed-in user per job for one hour; anonymous clicks all count", async () => {
    await call("/go/job_1?src=dashboard", { user: USER });
    now = NOW + 10 * 60_000;
    await call("/go/job_1?src=dashboard", { user: USER });
    now = NOW + CLICK_DEDUPE_WINDOW_MS + 1;
    await call("/go/job_1?src=dashboard", { user: USER });
    await call("/go/job_1");
    await call("/go/job_1");
    const rows = clicks();
    expect(rows.filter((r) => r["user_id"] === "user_a")).toHaveLength(2);
    expect(rows.filter((r) => r["user_id"] === null)).toHaveLength(2);
  });

  it("still redirects when recording fails", async () => {
    raw.exec("DROP TABLE apply_clicks");
    const res = await call("/go/job_1");
    expect(res?.status).toBe(302);
  });

  it("admin summary needs auth, validates days and aggregates by company, source and list", async () => {
    expect((await call("/api/admin/clicks"))?.status).toBe(401);
    expect((await call("/api/admin/clicks?days=0", { admin: true }))?.status).toBe(400);
    expect((await call("/api/admin/clicks?days=abc", { admin: true }))?.status).toBe(400);

    await call("/go/job_1?src=list&l=midwest-gems");
    await call("/go/job_1?src=digest", { user: USER });
    await call("/go/job_2?src=telegram");
    raw.prepare("INSERT INTO apply_clicks (id, job_id, user_id, source, list_slug, created_at) VALUES ('old','job_2',NULL,'list','old-list',?)").run(NOW - 40 * 86_400_000);

    const res = await call("/api/admin/clicks?days=30", { admin: true });
    expect(res?.status).toBe(200);
    const body = (await res!.json()) as {
      days: number;
      total: number;
      byCompany: Array<{ companyName: string; clicks: number; signedInUsers: number; anonymousClicks: number }>;
      bySource: Array<{ source: string; clicks: number }>;
      byList: Array<{ listSlug: string; clicks: number }>;
    };
    expect(body.days).toBe(30);
    expect(body.total).toBe(3);
    expect(body.byCompany).toEqual([
      { companyId: "c_a", companyName: "Acme", clicks: 2, signedInUsers: 1, anonymousClicks: 1 },
      { companyId: "c_b", companyName: "Beta", clicks: 1, signedInUsers: 0, anonymousClicks: 1 },
    ]);
    expect(body.bySource).toEqual([
      { source: "digest", clicks: 1 },
      { source: "list", clicks: 1 },
      { source: "telegram", clicks: 1 },
    ]);
    expect(body.byList).toEqual([{ listSlug: "midwest-gems", clicks: 1 }]);
  });

  it("cascades with the job and drops user_id when the user is deleted", async () => {
    await call("/go/job_1", { user: USER });
    await call("/go/job_2", { user: USER });
    raw.exec("DELETE FROM users WHERE id = 'user_a'");
    expect(clicks().map((r) => r["user_id"])).toEqual([null, null]);
    raw.exec("DELETE FROM jobs WHERE id = 'job_1'");
    expect(clicks().map((r) => r["job_id"])).toEqual(["job_2"]);
  });

  it("ignores other paths", async () => {
    expect(await call("/api/jobs")).toBeNull();
    expect(await call("/go/job_1", { method: "POST" })).toBeNull();
  });
});

d("apply-click wiring through the worker", () => {
  it("serves /go/:jobId from the worker fetch handler and records the click", async () => {
    const { default: worker } = await import("../src/index.js");
    const raw = migratedSqlite(sqlite!);
    const db = asD1(raw);
    raw.exec("INSERT OR IGNORE INTO companies (id, domain, name, website_url, created_at, updated_at) VALUES ('c_w','w.example','W','https://w.example',1,1)");
    raw.exec("INSERT OR IGNORE INTO career_pages (id, company_id, url, page_type, last_checked_at, created_at) VALUES ('cp_w','c_w','https://w.example/careers','custom',1,1)");
    raw.prepare(
      `INSERT INTO jobs (id, company_id, career_page_id, title, apply_type, apply_target, status, content_hash, first_seen_at, last_seen_at)
       VALUES ('job_w', 'c_w', 'cp_w', 'Engineer', 'url', 'https://jobs.ashbyhq.com/w/1', 'open', 'h_w', 1, 1)`
    ).run();
    const pending: Promise<unknown>[] = [];
    const ctx = { waitUntil: (p: Promise<unknown>) => pending.push(p), passThroughOnException: () => {} };
    const res = await worker.fetch(
      new Request("https://jobs.example/go/job_w?src=digest", { headers: { "User-Agent": BROWSER } }),
      { DB: db, ADMIN_TOKEN: "unused" } as never,
      ctx as never
    );
    await Promise.all(pending);
    expect(res.status).toBe(302);
    expect(res.headers.get("Location")).toBe("https://jobs.ashbyhq.com/w/1");
    expect(raw.prepare("SELECT source FROM apply_clicks WHERE job_id = 'job_w'").all()).toEqual([{ source: "digest" }]);
  });
});
