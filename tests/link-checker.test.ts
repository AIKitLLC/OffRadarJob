import { describe, it, expect, vi } from "vitest";
import {
  validateApplyUrl,
  isAcceptableApplyTarget,
  decodeCloudflareEmailProtection,
  normalizeApplyTarget,
  checkApplyLink,
  runLinkCheckBatch,
  expireStaleJobs,
  type FetchLike,
} from "../src/services/link-checker.js";
import { runLinkQualityCron, LINK_CHECK_CRON } from "../src/services/link-quality-cron.js";
import { recoverBrokenLinksData } from "../src/services/broken-link-recovery.js";
import { InMemoryD1Database } from "../src/db/in-memory-db.js";
import { JobRepository, CompanyRepository, CareerPageRepository } from "../src/db/repositories.js";
import type { ID1Database, ID1PreparedStatement } from "../src/db/types.js";
import type { Job } from "../src/types/domain.js";
import worker from "../src/index.js";

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
        if (sql.includes("FROM companies") || sql.includes("FROM career_pages")) {
          return { results: [] as unknown as T[], success: true };
        }
        if (sql.includes("LIKE '%cdn-cgi%'")) {
          const [limit] = binds as [number];
          const res = db.rows
            .filter((r) => r.status === "open" || r.apply_target.toLowerCase().includes("cdn-cgi") || r.apply_target.toLowerCase().startsWith("mailto:"))
            .slice(0, limit);
          return { results: res as unknown as T[], success: true };
        }
        const [cutoff, limit] = binds as [number, number];
        const res = db.rows
          .filter((r) => r.status === "open" && ["url", "form"].includes(r.apply_type) && (r.link_checked_at == null || r.link_checked_at < cutoff))
          .sort((a, b) => (a.link_checked_at ?? 0) - (b.link_checked_at ?? 0))
          .slice(0, limit);
        return { results: res as unknown as T[], success: true };
      },
      async run() { return { success: true, meta: { changes: stmt.exec() } }; },
      exec() {
        if (sql.includes("SET apply_type = ?, apply_target = ?")) {
          const [applyType, applyTarget, now, verifiedAt, id] = binds as any[];
          const r = db.rows.find((x) => x.id === id);
          if (r) {
            r.apply_type = applyType; r.apply_target = applyTarget; r.link_status = "ok"; r.link_fail_count = 0; r.link_checked_at = now; r.last_verified_at = verifiedAt;
          }
          return r ? 1 : 0;
        }
        if (sql.includes("closed_reason = 'invalid_link'")) {
          const [now, id] = binds as any[];
          const r = db.rows.find((x) => x.id === id);
          if (r) {
            r.status = "closed"; r.closed_reason = "invalid_link"; r.link_status = "invalid"; r.link_checked_at = now;
          }
          return r ? 1 : 0;
        }
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
    ["https://alphavantage.co/cdn-cgi/l/email-protection#dcbfbdaeb9b9aeaf9cbdb0acb4bdaabdb2a8bdbbb9f2bfb3", "email_protection"],
    ["https://acme.com/cdn-cgi/l/email-protection", "email_protection"],
    ["ftp://acme.com/job/1", "not_http"],
    ["not a url", "malformed"],
  ])("rejects %s (%s)", (url, reason) => {
    expect(validateApplyUrl(url)).toEqual({ ok: false, reason });
  });

  it("decodes Cloudflare email-protection hex and normalizes apply targets", () => {
    const cfUrl = "https://alphavantage.co/cdn-cgi/l/email-protection#dcbfbdaeb9b9aeaf9cbdb0acb4bdaabdb2a8bdbbb9f2bfb3";
    expect(decodeCloudflareEmailProtection(cfUrl)).toBe("careers@alphavantage.co");
    expect(normalizeApplyTarget("url", cfUrl)).toEqual({
      applyType: "email",
      applyTarget: "careers@alphavantage.co",
    });
    expect(normalizeApplyTarget("url", "mailto:Hiring@Acme.io?subject=Role")).toEqual({
      applyType: "email",
      applyTarget: "hiring@acme.io",
    });
  });

  it("JobRepository.upsert automatically decodes Cloudflare email-protection URLs into email apply targets and rejects un-decodable cdn-cgi links", async () => {
    const db = new InMemoryD1Database();
    const repo = new JobRepository(db);
    const cfJob: Job = {
      id: "job_cf", companyId: "comp_av", careerPageId: "cp_av", title: "Quant Engineer", seniorityLevel: "senior",
      techCategory: "backend_systems", isTechRole: true, employmentType: "full-time", isRemote: true, remoteScope: "worldwide",
      skills: [], applyType: "url",
      applyTarget: "https://alphavantage.co/cdn-cgi/l/email-protection#dcbfbdaeb9b9aeaf9cbdb0acb4bdaabdb2a8bdbbb9f2bfb3",
      status: "open", contentHash: "h_cf", firstSeenAt: 1, lastSeenAt: 1,
    } as unknown as Job;

    expect(await repo.upsert(cfJob)).toBe(true);
    const saved = await repo.findByContentHash("h_cf");
    expect(saved?.applyType).toBe("email");
    expect(saved?.applyTarget).toBe("careers@alphavantage.co");
    // upsert normalizes what it stores without mutating the caller's object
    expect(cfJob.applyType).toBe("url");
    expect(cfJob.applyTarget).toContain("/cdn-cgi/l/email-protection#");

    const brokenCfJob: Job = {
      ...cfJob,
      id: "job_cf_broken",
      contentHash: "h_cf_broken",
      applyTarget: "https://alphavantage.co/cdn-cgi/l/email-protection#invalid",
    };
    expect(await repo.upsert(brokenCfJob)).toBe(false);
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

  it.each([
    "http://127.0.0.1/jobs/1",
    "http://127.0.0.1:8080/jobs/1",
    "http://0.0.0.0/jobs/1",
    "http://10.1.2.3/jobs/1",
    "http://172.16.0.1/jobs/1",
    "http://192.168.1.1/jobs/1",
    "http://169.254.169.254/latest",
    "https://8.8.8.8/jobs/1",
    "http://[::1]/jobs/1",
    "http://[fe80::1]/jobs/1",
    "http://[fd00::1]/jobs/1",
    "http://[::ffff:127.0.0.1]/jobs/1",
    "http://2130706433/jobs/1",
    "http://0x7f000001/jobs/1",
    "http://0177.0.0.1/jobs/1",
    "http://127.1/jobs/1",
    "http://localhost/jobs/1",
    "http://localhost./jobs/1",
    "http://foo.localhost/jobs/1",
    "http://metadata.google.internal/jobs/1",
    "http://printer.local/jobs/1",
    "http://app.internal/jobs/1",
    "https://127.0.0.1.nip.io/jobs/1",
    "https://user:pass@127.0.0.1/jobs/1",
    "http://jobs/1",
  ])("rejects non-public host %s", (url) => {
    expect(validateApplyUrl(url)).toEqual({ ok: false, reason: "blocked_host" });
    expect(isAcceptableApplyTarget("url", url)).toBe(false);
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

  it("does not request a redirect target that fails the host policy", async () => {
    const calls: string[] = [];
    const fn: FetchLike = async (url) => {
      calls.push(url);
      if (url === U) return new Response(null, { status: 302, headers: { Location: "http://127.0.0.1/latest" } });
      return new Response("secret", { status: 200 });
    };
    const result = await checkApplyLink(U, fn);
    expect(result.status).toBe("invalid");
    expect(result.subrequests).toBe(1);
    expect(calls).toEqual([U]);
  });

  it("re-checks every redirect hop and stops before an internal address", async () => {
    const hop = "https://jobs.example/careers/role-2";
    const calls: string[] = [];
    const fn: FetchLike = async (url) => {
      calls.push(url);
      if (url === U) return new Response(null, { status: 302, headers: { Location: hop } });
      if (url === hop) return new Response(null, { status: 302, headers: { Location: "http://169.254.169.254/latest/meta-data" } });
      return new Response("secret", { status: 200 });
    };
    const result = await checkApplyLink(U, fn);
    expect(result.status).toBe("invalid");
    expect(calls).toEqual([U, hop]);
  });

  it("does not request an address written in an alternate literal form", async () => {
    const calls: string[] = [];
    const fn: FetchLike = async (url) => {
      calls.push(url);
      return new Response(null, { status: 302, headers: { Location: "http://2130706433/" } });
    };
    expect((await checkApplyLink(U, fn)).status).toBe("invalid");
    expect(calls).toEqual([U]);
  });

  it("follows a redirect only when the next hop is still an acceptable apply URL", async () => {
    const next = "https://boards.greenhouse.io/acme/jobs/4012345";
    const calls: string[] = [];
    const fn: FetchLike = async (url) => {
      calls.push(url);
      if (url === U) return new Response(null, { status: 301, headers: { Location: "/careers/role-2" } });
      const res = new Response("ok", { status: 200 });
      Object.defineProperty(res, "url", { value: next });
      return res;
    };
    // Relative Location stays on the original host; the second response is the job page.
    const relative = new URL("/careers/role-2", U).href;
    const result = await checkApplyLink(U, fn);
    expect(result.status).toBe("ok");
    expect(calls[0]).toBe(U);
    expect(calls[1]).toBe(relative);
    expect(result.subrequests).toBe(2);
  });

  it("does not fetch a URL that fails the host policy before any request", async () => {
    const calls: string[] = [];
    const fn: FetchLike = async (url) => {
      calls.push(url);
      return new Response("no", { status: 200 });
    };
    expect((await checkApplyLink("http://localhost/jobs/1", fn)).status).toBe("invalid");
    expect((await checkApplyLink("http://10.0.0.8/jobs/1", fn)).status).toBe("invalid");
    expect(calls).toEqual([]);
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

describe("recoverBrokenLinksData & POST /api/admin/links/repair (search & recover, never delete)", () => {
  it("finds broken records, decodes or re-researches them from source, recovers career_pages instead of deleting, and enforces trigger guards", async () => {
    const db = new InMemoryD1Database();
    const jobRepo = new JobRepository(db);
    const companyRepo = new CompanyRepository(db);
    const cpRepo = new CareerPageRepository(db);

    await companyRepo.upsert({
      id: "comp_av",
      domain: "alphavantage.co",
      name: "Alpha Vantage",
      websiteUrl: "https://alphavantage.co",
      techStack: ["Python"],
      socialLinks: {},
      contactEmail: "https://alphavantage.co/cdn-cgi/l/email-protection#dcbfbdaeb9b9aeaf9cbdb0acb4bdaabdb2a8bdbbb9f2bfb3",
      discoverySource: "seed",
      createdAt: 1,
      updatedAt: 1,
    });

    // Simulate legacy broken rows already stored in DB before the trigger existed
    db.tables.get("jobs")!.set("j_cf_legacy", {
      id: "j_cf_legacy",
      company_id: "comp_av",
      career_page_id: "cp_av",
      title: "Backend Engineer",
      seniority_level: "senior",
      tech_category: "backend_systems",
      is_tech_role: 1,
      employment_type: "full-time",
      is_remote: 1,
      remote_scope: "worldwide",
      skills: "[]",
      apply_type: "url",
      apply_target: "https://alphavantage.co/cdn-cgi/l/email-protection#dcbfbdaeb9b9aeaf9cbdb0acb4bdaabdb2a8bdbbb9f2bfb3",
      status: "open",
      content_hash: "h_legacy_cf",
      first_seen_at: 1,
      last_seen_at: 1,
    });

    db.tables.get("jobs")!.set("j_undecodable_legacy", {
      id: "j_undecodable_legacy",
      company_id: "comp_av",
      career_page_id: "cp_av",
      title: "Frontend Engineer",
      seniority_level: "mid",
      tech_category: "frontend_ui",
      is_tech_role: 1,
      employment_type: "full-time",
      is_remote: 1,
      remote_scope: "worldwide",
      skills: "[]",
      apply_type: "url",
      apply_target: "https://alphavantage.co/cdn-cgi/l/email-protection#nothex",
      status: "open",
      content_hash: "h_legacy_undecodable",
      first_seen_at: 1,
      last_seen_at: 1,
    });

    db.tables.get("career_pages")!.set("cp_bad_cf", {
      id: "cp_bad_cf",
      company_id: "comp_av",
      url: "https://alphavantage.co/cdn-cgi/l/email-protection#dcbfbdaeb9b9aeaf9cbdb0acb4bdaabdb2a8bdbbb9f2bfb3",
      page_type: "internal_page",
      status: "active",
      last_checked_at: 1,
      created_at: 1,
    });

    // Trigger guard rejects direct insert of un-normalized cdn-cgi URL into career_pages
    await expect(
      cpRepo.upsert({
        id: "cp_reject",
        companyId: "comp_av",
        url: "https://alphavantage.co/cdn-cgi/l/email-protection#dcbfbdaeb9b9aeaf9cbdb0acb4bdaabdb2a8bdbbb9f2bfb3",
        pageType: "internal_page",
        status: "active",
        lastCheckedAt: 1,
        createdAt: 1,
      })
    ).rejects.toThrow(/Cloudflare email-protection URL is not allowed/);

    // Homepage used for re-research: exposes the real careers page and contact email
    vi.stubGlobal(
      "fetch",
      async () =>
        new Response(
          `<html><body><a href="/careers">Careers</a><a href="mailto:careers@alphavantage.co">Email us</a></body></html>`,
          { status: 200 }
        )
    );

    // Run async repair endpoint via admin API
    const adminToken = "test-admin-secret-0123456789abcdef";
    const req = new Request("http://localhost/api/admin/links/repair", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-token": adminToken,
      },
      body: JSON.stringify({ async: false, batchSize: 100 }),
    });
    const res = await worker.fetch(req, { DB: db, ADMIN_TOKEN: adminToken } as any, {
      waitUntil: () => {},
      passThroughOnException: () => {},
    } as any);
    expect(res.status).toBe(200);
    const body = (await res.json()) as any;
    expect(body.success).toBe(true);
    expect(body.repair).toMatchObject({
      decodedEmails: 1,
      recoveredJobsFromSource: 1,
      closedInvalidJobs: 0,
      fixedCompanies: 1,
      recoveredCareerPages: 1,
      deactivatedCareerPages: 0,
      deletedCareerPages: 0,
    });

    // Verify j_cf_legacy was repaired into email apply
    const repairedJob = await jobRepo.getById("j_cf_legacy");
    expect(repairedJob?.applyType).toBe("email");
    expect(repairedJob?.applyTarget).toBe("careers@alphavantage.co");
    expect(repairedJob?.status).toBe("open");

    // Verify the undecodable job was recovered from the company contact email instead of being closed/deleted
    const recoveredJob = await jobRepo.getById("j_undecodable_legacy");
    expect(recoveredJob?.applyType).toBe("email");
    expect(recoveredJob?.applyTarget).toBe("careers@alphavantage.co");
    expect(recoveredJob?.status).toBe("open");
    expect(db.tables.get("jobs")!.has("j_undecodable_legacy")).toBe(true);

    // Verify company contact_email was decoded
    const repairedComp = await companyRepo.findByDomain("alphavantage.co");
    expect(repairedComp?.contactEmail).toBe("careers@alphavantage.co");

    // Verify bad career_page was retained and re-pointed at the rediscovered careers page
    const recoveredPage = db.tables.get("career_pages")!.get("cp_bad_cf");
    expect(recoveredPage).toBeDefined();
    expect(recoveredPage?.["url"]).toBe("https://alphavantage.co/careers");
    expect(recoveredPage?.["status"]).toBe("active");
    vi.unstubAllGlobals();
  });

  it("reopens a previously quarantined job when the source career page yields a fresh apply link", async () => {
    const db = new InMemoryD1Database();
    const jobRepo = new JobRepository(db);
    const now = 1_000_000_000_000;

    db.tables.get("companies")!.set("comp_r", {
      id: "comp_r",
      domain: "r.example",
      name: "R Example",
      website_url: "https://r.example",
      contact_email: null,
      discovery_source: "seed",
      created_at: 1,
      updated_at: 1,
    });
    db.tables.get("career_pages")!.set("cp_r", {
      id: "cp_r",
      company_id: "comp_r",
      url: "https://r.example/careers",
      page_type: "internal_page",
      status: "active",
      last_checked_at: 1,
      created_at: 1,
    });
    db.tables.get("jobs")!.set("j_r", {
      id: "j_r",
      company_id: "comp_r",
      career_page_id: "cp_r",
      title: "Backend Engineer",
      seniority_level: "senior",
      tech_category: "backend_systems",
      is_tech_role: 1,
      employment_type: "full-time",
      is_remote: 1,
      remote_scope: "worldwide",
      skills: "[]",
      apply_type: "url",
      apply_target: "https://r.example/cdn-cgi/l/email-protection#nothex",
      status: "closed",
      closed_reason: "invalid_link",
      link_status: "invalid",
      link_checked_at: 1,
      content_hash: "h_r",
      first_seen_at: 1,
      last_seen_at: 1,
    });

    const { fn } = fakeFetch({
      "https://r.example/careers": {
        get: [200, "https://r.example/careers", `<html><body><a href="https://r.example/jobs/backend-42">Apply Now</a></body></html>`],
      },
    });

    const summary = await recoverBrokenLinksData(db, fn, { now, batchSize: 100 });
    expect(summary).toMatchObject({ recoveredJobsFromSource: 1, reopenedJobs: 1, closedInvalidJobs: 0 });

    const reopened = await jobRepo.getById("j_r");
    expect(reopened?.status).toBe("open");
    expect(reopened?.applyType).toBe("url");
    expect(reopened?.applyTarget).toBe("https://r.example/jobs/backend-42");
  });

  it("quarantines unrecoverable records without deleting them", async () => {
    const db = new InMemoryD1Database();
    const now = 1_000_000_000_000;

    db.tables.get("companies")!.set("comp_dead", {
      id: "comp_dead",
      domain: "dead.example",
      name: "Dead Example",
      website_url: "https://dead.example",
      contact_email: "https://dead.example/cdn-cgi/l/email-protection#nothex",
      discovery_source: "seed",
      created_at: 1,
      updated_at: 1,
    });
    db.tables.get("career_pages")!.set("cp_dead", {
      id: "cp_dead",
      company_id: "comp_dead",
      url: "https://dead.example/cdn-cgi/l/email-protection#nothex",
      page_type: "internal_page",
      status: "active",
      last_checked_at: 1,
      created_at: 1,
    });
    db.tables.get("jobs")!.set("j_dead", {
      id: "j_dead",
      company_id: "comp_dead",
      career_page_id: "cp_dead",
      title: "Backend Engineer",
      seniority_level: "senior",
      tech_category: "backend_systems",
      is_tech_role: 1,
      employment_type: "full-time",
      is_remote: 1,
      remote_scope: "worldwide",
      skills: "[]",
      apply_type: "url",
      apply_target: "https://dead.example/cdn-cgi/l/email-protection#nothex",
      status: "open",
      content_hash: "h_dead",
      first_seen_at: 1,
      last_seen_at: 1,
    });

    const { fn } = fakeFetch({});
    const summary = await recoverBrokenLinksData(db, fn, { now, batchSize: 100 });

    expect(summary.closedInvalidJobs).toBe(1);
    expect(summary.deactivatedCareerPages).toBe(1);
    expect(summary.unrecoveredCompanies).toBe(1);
    expect(summary.deletedCareerPages).toBe(0);

    const jobRow = db.tables.get("jobs")!.get("j_dead");
    expect(jobRow).toBeDefined();
    expect(jobRow?.["status"]).toBe("closed");
    expect(jobRow?.["closed_reason"]).toBe("invalid_link");

    const pageRow = db.tables.get("career_pages")!.get("cp_dead");
    expect(pageRow).toBeDefined();
    expect(pageRow?.["status"]).toBe("not_found");
    expect(pageRow?.["url"]).toContain("/cdn-cgi/");

    const companyRow = db.tables.get("companies")!.get("comp_dead");
    expect(companyRow?.["contact_email"]).toContain("/cdn-cgi/");
  });

  it("recovers a company contact email by re-researching its homepage", async () => {
    const db = new InMemoryD1Database();
    const companyRepo = new CompanyRepository(db);
    const now = 1_000_000_000_000;

    db.tables.get("companies")!.set("comp_home", {
      id: "comp_home",
      domain: "home.example",
      name: "Home Example",
      website_url: "https://home.example",
      contact_email: "https://home.example/cdn-cgi/l/email-protection#nothex",
      discovery_source: "seed",
      created_at: 1,
      updated_at: 1,
    });

    const { fn } = fakeFetch({
      "https://home.example": {
        get: [200, "https://home.example", `<html><body><a href="mailto:Hiring@Home.example">Contact</a></body></html>`],
      },
    });

    const summary = await recoverBrokenLinksData(db, fn, { now, batchSize: 100 });
    expect(summary).toMatchObject({ recoveredCompaniesFromSource: 1, fixedCompanies: 1 });

    const company = await companyRepo.findByDomain("home.example");
    expect(company?.contactEmail).toBe("hiring@home.example");
  });

  it("POST /api/admin/links/repair with async:true returns 202 immediately and completes in the background via waitUntil", async () => {
    const db = new InMemoryD1Database();
    const jobRepo = new JobRepository(db);

    db.tables.get("jobs")!.set("j_async_cf", {
      id: "j_async_cf",
      company_id: "comp_none",
      career_page_id: "cp_none",
      title: "Backend Engineer",
      seniority_level: "senior",
      tech_category: "backend_systems",
      is_tech_role: 1,
      employment_type: "full-time",
      is_remote: 1,
      remote_scope: "worldwide",
      skills: "[]",
      apply_type: "url",
      apply_target: "https://alphavantage.co/cdn-cgi/l/email-protection#dcbfbdaeb9b9aeaf9cbdb0acb4bdaabdb2a8bdbbb9f2bfb3",
      status: "open",
      content_hash: "h_async_cf",
      first_seen_at: 1,
      last_seen_at: 1,
    });

    const adminToken = "test-admin-secret-0123456789abcdef";
    const req = new Request("http://localhost/api/admin/links/repair", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-token": adminToken,
      },
      body: JSON.stringify({ async: true, batchSize: "not-a-number" }),
    });

    let background: Promise<unknown> | null = null;
    const res = await worker.fetch(req, { DB: db, ADMIN_TOKEN: adminToken } as any, {
      waitUntil: (p: Promise<unknown>) => {
        background = p;
      },
      passThroughOnException: () => {},
    } as any);

    expect(res.status).toBe(202);
    const body = (await res.json()) as any;
    expect(body).toMatchObject({ success: true, status: "accepted" });
    expect(body.repair).toBeUndefined();

    expect(background).not.toBeNull();
    await background;

    const repaired = await jobRepo.getById("j_async_cf");
    expect(repaired?.applyType).toBe("email");
    expect(repaired?.applyTarget).toBe("careers@alphavantage.co");
  });

  it("POST /api/admin/links/repair rejects malformed batchSize values by falling back to defaults", async () => {
    const db = new InMemoryD1Database();
    const adminToken = "test-admin-secret-0123456789abcdef";
    const req = new Request("http://localhost/api/admin/links/repair", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-token": adminToken,
      },
      body: JSON.stringify({ async: false, batchSize: Number.NaN, runLiveCheck: "yes" }),
    });
    const res = await worker.fetch(req, { DB: db, ADMIN_TOKEN: adminToken } as any, {
      waitUntil: () => {},
      passThroughOnException: () => {},
    } as any);
    expect(res.status).toBe(200);
    const body = (await res.json()) as any;
    expect(body.success).toBe(true);
    expect(body.liveCheck).toBeNull();
  });
});
