import { describe, it, expect } from "vitest";
import {
  validateApplyUrl,
  isAcceptableApplyTarget,
  checkApplyLink,
  runLinkCheckBatch,
  expireStaleJobs,
  type FetchLike,
} from "../src/services/link-checker.js";
import { runLinkQualityCron, LINK_CHECK_CRON } from "../src/services/link-quality-cron.js";
import { InMemoryD1Database } from "../src/db/in-memory-db.js";
import { JobRepository } from "../src/db/repositories.js";
import type { ID1Database, ID1PreparedStatement } from "../src/db/types.js";
import type { Job } from "../src/types/domain.js";

// ---- helpers ---------------------------------------------------------------

function resp(status: number, url: string, body = ""): Response {
  const r = new Response(status === 204 || status === 304 ? null : body, { status: status === 999 ? 599 : status });
  Object.defineProperty(r, "url", { value: url });
  if (status === 999) Object.defineProperty(r, "status", { value: 999 });
  return r;
}

type Route = { head?: [number, string?, string?] | "throw"; get?: [number, string?, string?] | "throw" };
function fakeFetch(routes: Record<string, Route>) {
  const calls: Array<{ method: string; url: string }> = [];
  const fn: FetchLike = async (url, init) => {
    const method = (init?.method ?? "GET").toUpperCase();
    calls.push({ method, url });
    const r = routes[url]?.[method === "HEAD" ? "head" : "get"];
    if (!r || r === "throw") throw new Error("network");
    return resp(r[0], r[1] ?? url, r[2] ?? "");
  };
  return { fn, calls };
}

interface Row { id: string; apply_type: string; apply_target: string; status: string; link_fail_count: number; link_checked_at: number | null; last_verified_at: number | null; last_seen_at: number; link_status?: string | null; closed_reason?: string | null }

/** Minimal D1 fake that understands exactly the statements the link checker issues. */
class FakeD1 implements ID1Database {
  rows: Row[] = [];
  batches = 0;
  constructor(rows: Partial<Row>[]) {
    this.rows = rows.map((r, i) => ({ id: `j${i}`, apply_type: "url", apply_target: "", status: "open", link_fail_count: 0, link_checked_at: null, last_verified_at: null, last_seen_at: Date.now(), ...r }));
  }
  prepare(sql: string): ID1PreparedStatement {
    const db = this;
    let binds: unknown[] = [];
    const stmt: ID1PreparedStatement & { exec: () => number } = {
      bind(...v: unknown[]) { binds = v; return stmt; },
      async first() { return null; },
      async all<T>() {
        const [cutoff, limit] = binds as [number, number];
        const res = db.rows
          .filter((r) => r.status === "open" && ["url", "form"].includes(r.apply_type) && (r.link_checked_at == null || r.link_checked_at < cutoff))
          .sort((a, b) => (a.link_checked_at ?? 0) - (b.link_checked_at ?? 0))
          .slice(0, limit);
        return { results: res as unknown as T[], success: true };
      },
      async run() { return { success: true, meta: { changes: stmt.exec() } }; },
      exec() {
        if (sql.includes("link_status = ?")) {
          const [status, fails, now, verified, now2, close, , id] = binds as any[];
          const r = db.rows.find((x) => x.id === id)!;
          r.link_status = status; r.link_fail_count = fails; r.link_checked_at = now;
          if (verified === 1) r.last_verified_at = now2;
          if (close === 1) { r.status = "closed"; r.closed_reason = "link_check"; }
          return 1;
        }
        if (sql.includes("closed_reason = 'stale'")) {
          const [cutoff] = binds as [number];
          let n = 0;
          for (const r of db.rows) if (r.status === "open" && r.last_seen_at < cutoff) { r.status = "closed"; r.closed_reason = "stale"; n++; }
          return n;
        }
        if (sql.includes("INSERT INTO crawl_logs")) return 1;
        throw new Error("unexpected SQL: " + sql);
      },
    };
    return stmt;
  }
  async batch(stmts: ID1PreparedStatement[]) { this.batches++; return Promise.all(stmts.map(async (s) => ({ ...(await s.run()), results: [] }))); }
  async exec() { return { count: 0, duration: 0 }; }
}

// ---- (1) ingest validation -------------------------------------------------

describe("validateApplyUrl (ingest validation)", () => {
  it.each([
    ["https://www.linkedin.com/jobs/view/123", "linkedin"],
    ["https://lnkd.in/abc", "linkedin"],
    ["https://job-boards.greenhouse.io/acme?error=true", "error_param"],
    ["https://acme.com/careers", "generic_careers_page"],
    ["https://acme.com/careers/", "generic_careers_page"],
    ["https://acme.com/jobs", "generic_careers_page"],
    ["https://acme.com/", "generic_careers_page"],
    ["https://acme.com/en-us/careers", "generic_careers_page"],
    ["https://acme.com/join-us", "generic_careers_page"],
    ["ftp://acme.com/job/1", "not_http"],
    ["not a url", "malformed"],
  ])("rejects %s (%s)", (url, reason) => {
    expect(validateApplyUrl(url)).toEqual({ ok: false, reason });
  });

  it.each([
    "https://jobs.ashbyhq.com/acme/1b2c3d",
    "https://boards.greenhouse.io/acme/jobs/4012345",
    "https://jobs.lever.co/acme/2f1e-uuid",
    "https://acme.com/careers/senior-backend-engineer",
    "https://acme.com/careers?gh_jid=4012345",
  ])("accepts job-specific URL %s", (url) => {
    expect(validateApplyUrl(url).ok).toBe(true);
  });

  it("lets email/handle applies through and gates url/form applies", () => {
    expect(isAcceptableApplyTarget("email", "jobs@acme.com")).toBe(true);
    expect(isAcceptableApplyTarget("url", "https://acme.com/careers")).toBe(false);
    expect(isAcceptableApplyTarget("form", "https://www.linkedin.com/jobs/view/1")).toBe(false);
  });

  it("JobRepository.upsert skips rejected apply targets and keeps valid ones", async () => {
    const db = new InMemoryD1Database();
    const repo = new JobRepository(db);
    const base: Job = {
      id: "job_a", companyId: "comp_a", careerPageId: "cp_a", title: "Backend Engineer", seniorityLevel: "mid",
      techCategory: "backend", isTechRole: true, employmentType: "full-time", isRemote: true, remoteScope: "worldwide",
      skills: [], applyType: "url", applyTarget: "https://acme.com/careers", status: "open", contentHash: "h_a",
      firstSeenAt: 1, lastSeenAt: 1,
    } as unknown as Job;
    expect(await repo.upsert(base)).toBe(false);
    expect(await repo.findByContentHash("h_a")).toBeNull();
    expect(await repo.upsert({ ...base, applyTarget: "https://acme.com/careers/backend-engineer" })).toBe(true);
  });
});

// ---- link checker ----------------------------------------------------------

describe("checkApplyLink (HEAD with GET fallback)", () => {
  const U = "https://acme.com/careers/role-1";

  it("ok on HEAD 2xx with one subrequest", async () => {
    const { fn, calls } = fakeFetch({ [U]: { head: [200] } });
    expect(await checkApplyLink(U, fn)).toMatchObject({ status: "ok", subrequests: 1 });
    expect(calls.map((c) => c.method)).toEqual(["HEAD"]);
  });

  it("404/410 is dead without a GET", async () => {
    const { fn, calls } = fakeFetch({ [U]: { head: [410] } });
    expect((await checkApplyLink(U, fn)).status).toBe("dead");
    expect(calls).toHaveLength(1);
  });

  it("falls back to GET when HEAD is rejected (405) or throws", async () => {
    const a = fakeFetch({ [U]: { head: [405], get: [200, U, "<h1>Senior Engineer</h1>"] } });
    expect(await checkApplyLink(U, a.fn)).toMatchObject({ status: "ok", subrequests: 2 });
    const b = fakeFetch({ [U]: { head: "throw", get: [200] } });
    expect((await checkApplyLink(U, b.fn)).status).toBe("ok");
  });

  it("detects Greenhouse ?error=true redirect", async () => {
    const { fn } = fakeFetch({ [U]: { head: [200, "https://job-boards.greenhouse.io/acme?error=true"] } });
    expect((await checkApplyLink(U, fn)).status).toBe("error_redirect");
  });

  it("detects redirect to a generic careers page", async () => {
    const { fn } = fakeFetch({ [U]: { head: [200, "https://acme.com/careers"] } });
    expect((await checkApplyLink(U, fn)).status).toBe("generic_redirect");
  });

  it("detects a 'job closed' page on the GET body", async () => {
    const { fn } = fakeFetch({ [U]: { head: [403], get: [200, U, "<p>Sorry, this position has been filled.</p>"] } });
    expect((await checkApplyLink(U, fn)).status).toBe("closed_page");
  });

  it("403/429/999 on both methods is unverifiable, 5xx is server_error, network is network_error", async () => {
    expect((await checkApplyLink(U, fakeFetch({ [U]: { head: [429], get: [429] } }).fn)).status).toBe("unverifiable");
    expect((await checkApplyLink(U, fakeFetch({ [U]: { head: [503], get: [502] } }).fn)).status).toBe("server_error");
    expect((await checkApplyLink(U, fakeFetch({}).fn)).status).toBe("network_error");
  });
});

describe("runLinkCheckBatch (cron, hide after 2 failures)", () => {
  const OK = "https://a.com/careers/ok-1";
  const DEAD = "https://a.com/careers/dead-1";

  it("closes a job only after 2 consecutive failures and resets on success", async () => {
    const db = new FakeD1([{ apply_target: DEAD }, { apply_target: OK }]);
    const { fn } = fakeFetch({ [DEAD]: { head: [404] }, [OK]: { head: [200] } });
    const t0 = 1_000_000_000_000;
    const s1 = await runLinkCheckBatch(db, fn, { now: t0 });
    expect(s1).toMatchObject({ checked: 2, ok: 1, failed: 1, closed: 0 });
    expect(db.rows[0]).toMatchObject({ status: "open", link_fail_count: 1, link_status: "dead" });
    expect(db.rows[1]).toMatchObject({ status: "open", link_fail_count: 0, last_verified_at: t0 });

    // too soon: nothing is re-checked
    expect((await runLinkCheckBatch(db, fn, { now: t0 + 60_000 })).checked).toBe(0);

    const s2 = await runLinkCheckBatch(db, fn, { now: t0 + 86_400_000 });
    expect(s2.closed).toBe(1);
    expect(db.rows[0]).toMatchObject({ status: "closed", closed_reason: "link_check", link_fail_count: 2 });
    expect(db.batches).toBe(2);
  });

  it("unverifiable results do not count as failures", async () => {
    const db = new FakeD1([{ apply_target: DEAD, link_fail_count: 1 }]);
    const { fn } = fakeFetch({ [DEAD]: { head: [999], get: [999] } });
    await runLinkCheckBatch(db, fn, { now: 5 });
    expect(db.rows[0]).toMatchObject({ status: "open", link_fail_count: 1, link_status: "unverifiable" });
  });

  it("respects the subrequest budget and batch size, skips email/closed jobs", async () => {
    const rows = Array.from({ length: 30 }, (_, i) => ({ apply_target: `https://a.com/careers/r-${i}` }));
    const db = new FakeD1([...rows, { apply_type: "email", apply_target: "x@a.com" }, { status: "closed", apply_target: OK }]);
    const { fn, calls } = fakeFetch({});
    const s = await runLinkCheckBatch(db, fn, { batchSize: 25, maxSubrequests: 10, concurrency: 3, now: 1 });
    expect(calls.length).toBeLessThanOrEqual(10);
    expect(s.subrequests).toBe(calls.length);
    expect(s.checked + s.skippedForBudget).toBe(25);
    expect(calls.some((c) => c.url === "x@a.com" || c.url === OK)).toBe(false);
  });
});

// ---- (4) auto-expire -------------------------------------------------------

describe("expireStaleJobs", () => {
  const DAY = 86_400_000;
  it("closes open jobs not seen for 14 days by default, clamps to 7-14", async () => {
    const now = 100 * DAY;
    const db = new FakeD1([{ last_seen_at: now - 15 * DAY }, { last_seen_at: now - 10 * DAY }, { last_seen_at: now - DAY }]);
    expect(await expireStaleJobs(db, { now })).toBe(1);
    expect(db.rows.map((r) => r.status)).toEqual(["closed", "open", "open"]);
    expect(await expireStaleJobs(db, { now, staleDays: 3 })).toBe(1); // clamped to 7
    expect(db.rows[1]).toMatchObject({ status: "closed", closed_reason: "stale" });
  });
});

describe("runLinkQualityCron", () => {
  it("runs expiry + a bounded batch using env overrides", async () => {
    const now = 50 * 86_400_000;
    const db = new FakeD1([
      { last_seen_at: now - 20 * 86_400_000, apply_target: "https://a.com/careers/stale" },
      { apply_target: "https://a.com/careers/live", last_seen_at: now },
    ]);
    const { fn } = fakeFetch({ "https://a.com/careers/live": { head: [200] } });
    const r = await runLinkQualityCron({ DB: db, LINK_CHECK_BATCH_SIZE: "5", JOB_STALE_DAYS: "14" }, fn, now);
    expect(r.expired).toBe(1);
    expect(r.check).toMatchObject({ checked: 1, ok: 1 });
    expect(LINK_CHECK_CRON).toBe("15,35,55 2-7 * * *");
  });
});

describe("public listings hide closed jobs", () => {
  it("listPaged and count exclude status=closed", async () => {
    const db = new InMemoryD1Database();
    const repo = new JobRepository(db);
    const mk = (id: string, status: "open" | "closed") => ({
      id, companyId: "comp_x", careerPageId: "cp_x", title: "Engineer " + id, seniorityLevel: "mid",
      techCategory: "backend", isTechRole: true, employmentType: "full-time", isRemote: true, remoteScope: "worldwide",
      skills: [], applyType: "url", applyTarget: `https://x.com/careers/${id}`, status, contentHash: "h_" + id,
      firstSeenAt: 1, lastSeenAt: 1,
    }) as unknown as Job;
    await repo.upsert(mk("open1", "open"));
    await repo.upsert(mk("closed1", "closed"));
    const page = await repo.listPaged({ techOnly: false });
    expect(page.items.map((j) => j.id)).toEqual(["open1"]);
    expect(await repo.count()).toBe(1);
  });
});
