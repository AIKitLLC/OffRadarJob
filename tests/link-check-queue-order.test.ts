/**
 * Runs the real migrations and the real queue SQL on SQLite (node:sqlite),
 * so ordering is tested against actual SQL semantics rather than a fake.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { runLinkCheckBatch, linkCheckPriority, type FetchLike } from "../src/services/link-checker.js";
import { JobRepository } from "../src/db/repositories.js";
import type { ID1Database, ID1PreparedStatement } from "../src/db/types.js";

const require = createRequire(import.meta.url);
let sqlite: any = null;
try { sqlite = require("node:sqlite"); } catch { /* Node < 22.5 */ }
const d = sqlite ? describe : describe.skip;

function d1(db: any): ID1Database {
  const prep = (sql: string): ID1PreparedStatement => {
    let binds: unknown[] = [];
    const st: ID1PreparedStatement = {
      bind(...v) { binds = v; return st; },
      async first<T>() { return (db.prepare(sql).get(...binds) ?? null) as T; },
      async all<T>() { return { results: db.prepare(sql).all(...binds) as T[], success: true }; },
      async run() { const r = db.prepare(sql).run(...binds); return { success: true, meta: { changes: Number(r.changes) } }; },
    };
    return st;
  };
  return { prepare: prep, async batch(s) { return Promise.all(s.map(async (x) => ({ ...(await x.run()), results: [] }))); }, async exec(q) { db.exec(q); return { count: 0, duration: 0 }; } };
}

const DAY = 86_400_000;
const NOW = 1_800_000_000_000;

d("link-check queue order (real SQL)", () => {
  let raw: any;
  let db: ID1Database;
  let n = 0;
  const insert = (id: string, url: string, opts: { checked?: number | null; firstSeen?: number; status?: string; type?: string } = {}) => {
    raw.prepare(
      `INSERT INTO jobs (id, company_id, career_page_id, title, apply_type, apply_target, status, content_hash, first_seen_at, last_seen_at, link_checked_at)
       VALUES (?, 'c_q', 'cp_q', ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(id, "Role " + id, opts.type ?? "url", url, opts.status ?? "open", "h_" + id + n++, opts.firstSeen ?? NOW - 30 * DAY, NOW, opts.checked === undefined ? null : opts.checked);
  };

  beforeEach(() => {
    raw = new sqlite.DatabaseSync(":memory:");
    for (const f of readdirSync("migrations").sort()) raw.exec(readFileSync(`migrations/${f}`, "utf8"));
    raw.exec("DELETE FROM jobs");
    raw.exec("INSERT OR IGNORE INTO companies (id, domain, name, website_url, created_at, updated_at) VALUES ('c_q','q.example','Q','https://q.example',1,1)");
    raw.exec("INSERT OR IGNORE INTO career_pages (id, company_id, url, page_type, last_checked_at, created_at) VALUES ('cp_q','c_q','https://q.example/careers','custom',1,1)");
    db = d1(raw);
  });

  const order = async (batchSize: number) => {
    const seen: string[] = [];
    const fetchFn: FetchLike = async (url) => { seen.push(url); const r = new Response(null, { status: 200 }); Object.defineProperty(r, "url", { value: url }); return r; };
    await runLinkCheckBatch(db, fetchFn, { batchSize, concurrency: 1, maxSubrequests: 1000, now: NOW });
    return seen;
  };

  it("never-checked (newest ingest first) → Greenhouse/scraped → others by oldest check", async () => {
    insert("ashby_old", "https://jobs.ashbyhq.com/q/1", { checked: NOW - 10 * DAY });
    insert("lever_older", "https://jobs.lever.co/q/2", { checked: NOW - 12 * DAY });
    insert("gh", "https://boards.greenhouse.io/q/jobs/3", { checked: NOW - 2 * DAY });
    insert("scraped", "https://q.example/careers/backend-4", { checked: NOW - 3 * DAY });
    insert("new_recent", "https://jobs.ashbyhq.com/q/5", { checked: null, firstSeen: NOW - DAY });
    insert("new_older", "https://jobs.ashbyhq.com/q/6", { checked: null, firstSeen: NOW - 5 * DAY });

    expect(await order(10)).toEqual([
      "https://jobs.ashbyhq.com/q/5",          // never checked, newest ingest
      "https://jobs.ashbyhq.com/q/6",          // never checked
      "https://q.example/careers/backend-4",   // scraped, checked 3d ago (older than gh)
      "https://boards.greenhouse.io/q/jobs/3", // greenhouse, checked 2d ago
      "https://jobs.lever.co/q/2",             // other ATS, oldest check
      "https://jobs.ashbyhq.com/q/1",
    ]);
  });

  it("a small Free-plan batch spends its budget on the priority tiers", async () => {
    for (let i = 0; i < 5; i++) insert(`ashby${i}`, `https://jobs.ashbyhq.com/q/a${i}`, { checked: NOW - 30 * DAY });
    insert("gh", "https://job-boards.greenhouse.io/q/jobs/9", { checked: NOW - 2 * DAY });
    insert("new", "https://jobs.lever.co/q/new", { checked: null });
    expect(await order(2)).toEqual(["https://jobs.lever.co/q/new", "https://job-boards.greenhouse.io/q/jobs/9"]);
  });

  it("skips closed jobs, email applies and recently-checked jobs", async () => {
    insert("closed", "https://q.example/careers/x", { status: "closed" });
    insert("email", "jobs@q.example", { type: "email" });
    insert("fresh", "https://q.example/careers/y", { checked: NOW - 60_000 });
    expect(await order(10)).toEqual([]);
  });

  it("linkCheckPriority mirrors the SQL tiers", () => {
    expect(linkCheckPriority({ apply_target: "https://jobs.ashbyhq.com/a/1", link_checked_at: null })).toBe(0);
    expect(linkCheckPriority({ apply_target: "https://boards.greenhouse.io/a/jobs/1", link_checked_at: 1 })).toBe(1);
    expect(linkCheckPriority({ apply_target: "https://careers.toasttab.com/jobs/1", link_checked_at: 1 })).toBe(1);
    expect(linkCheckPriority({ apply_target: "https://jobs.lever.co/a/1", link_checked_at: 1 })).toBe(2);
  });

  it("stats counts exclude closed jobs; jobsCount(techOnly) matches the /api/jobs total", async () => {
    insert("o1", "https://q.example/careers/o1");
    insert("o2", "https://q.example/careers/o2");
    insert("c1", "https://q.example/careers/c1", { status: "closed" });
    raw.exec("UPDATE jobs SET is_tech_role = 0 WHERE id = 'o2'");
    const repo = new JobRepository(db);
    expect(await repo.count()).toBe(2);
    expect(await repo.count({ techOnly: true })).toBe(1);
    expect((await repo.listPaged({})).pagination.total).toBe(1);
    expect((await repo.getStatsSummary()).total).toBe(2);
    expect((await repo.getFreshnessMetrics()).updatedLast7d).toBe(2);
  });
});
