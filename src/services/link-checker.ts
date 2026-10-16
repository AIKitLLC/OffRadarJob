/**
 * Apply-link quality: static validation at ingest, a batched live link checker
 * for the cron, and auto-expiry of jobs the crawler has not seen recently.
 *
 * Worker limits: every fetch (and every redirect hop) is a subrequest. The checker
 * works on a small, bounded batch per invocation, uses HEAD first and only falls
 * back to GET when HEAD is not conclusive, and caps the GET body it scans.
 */
import type { ID1Database } from "../db/types.js";

export type LinkStatus =
  | "ok"
  | "dead"
  | "closed_page"
  | "generic_redirect"
  | "error_redirect"
  | "unverifiable"
  | "network_error"
  | "server_error"
  | "invalid";

export interface StaticValidation {
  ok: boolean;
  reason?: "not_http" | "malformed" | "linkedin" | "error_param" | "generic_careers_page";
}

const GENERIC_PATH_RE =
  /^\/(?:[a-z]{2}(?:-[a-z]{2})?\/)?(?:careers?|jobs|join(?:-us)?|work-with-us|open-positions|openings|positions|about\/careers|company\/careers)?\/?$/i;

const CLOSED_PHRASES = [
  "job closed",
  "this job is closed",
  "this job has closed",
  "position has been filled",
  "position is no longer available",
  "job is no longer available",
  "no longer accepting applications",
  "job you are looking for is no longer",
  "posting has expired",
  "job not found",
  "this job posting is no longer",
];

/** Static, network-free check of an apply URL. Used at ingest and after redirects. */
export function validateApplyUrl(raw: string): StaticValidation {
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    return { ok: false, reason: "malformed" };
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return { ok: false, reason: "not_http" };
  const host = url.hostname.toLowerCase();
  if (host === "linkedin.com" || host.endsWith(".linkedin.com") || host === "lnkd.in") {
    return { ok: false, reason: "linkedin" };
  }
  if ((url.searchParams.get("error") ?? "").toLowerCase() === "true") return { ok: false, reason: "error_param" };
  if (GENERIC_PATH_RE.test(url.pathname) && !hasJobIdentifierQuery(url)) {
    return { ok: false, reason: "generic_careers_page" };
  }
  return { ok: true };
}

function hasJobIdentifierQuery(url: URL): boolean {
  for (const key of ["gh_jid", "jobid", "job_id", "jid", "id", "pid", "posting"]) {
    if (url.searchParams.get(key)) return true;
  }
  return false;
}

/** Ingest gate: email/handle applies pass through; URL applies must pass validateApplyUrl. */
export function isAcceptableApplyTarget(applyType: string, applyTarget: string): boolean {
  if (applyType === "email" || applyType === "discord" || applyType === "x_dm") return true;
  return validateApplyUrl(applyTarget).ok;
}

export interface LinkCheckResult {
  status: LinkStatus;
  httpStatus?: number;
  finalUrl?: string;
  subrequests: number;
}

export type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

export interface CheckOptions {
  timeoutMs?: number;
  maxBodyBytes?: number;
}

const UA = "Mozilla/5.0 (compatible; OffRadarJobsLinkChecker/1.0; +https://jobs.ai-kit.net)";

async function timedFetch(fetchFn: FetchLike, url: string, method: "HEAD" | "GET", timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetchFn(url, { method, redirect: "follow", signal: controller.signal, headers: { "user-agent": UA } });
  } finally {
    clearTimeout(timer);
  }
}

async function readCapped(res: Response, maxBytes: number): Promise<string> {
  if (!res.body) return "";
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let text = "";
  let received = 0;
  try {
    while (received < maxBytes) {
      const { done, value } = await reader.read();
      if (done || !value) break;
      received += value.byteLength;
      text += decoder.decode(value, { stream: true });
    }
  } finally {
    reader.cancel().catch(() => {});
  }
  return text;
}

function classifyFinal(originalUrl: string, res: Response): LinkStatus | null {
  const finalUrl = res.url || originalUrl;
  if (res.status === 404 || res.status === 410) return "dead";
  if (res.status === 403 || res.status === 429 || res.status === 999 || res.status === 401) return "unverifiable";
  if (res.status >= 500) return "server_error";
  if (res.status >= 400) return "dead";
  if (finalUrl !== originalUrl) {
    const v = validateApplyUrl(finalUrl);
    if (!v.ok && v.reason === "error_param") return "error_redirect";
    if (!v.ok && v.reason === "generic_careers_page") return "generic_redirect";
  }
  return null;
}

/** Check one URL: HEAD first, GET fallback when HEAD is not a clean 2xx. */
export async function checkApplyLink(url: string, fetchFn: FetchLike, opts: CheckOptions = {}): Promise<LinkCheckResult> {
  const timeoutMs = opts.timeoutMs ?? 8000;
  const maxBodyBytes = opts.maxBodyBytes ?? 64 * 1024;
  const pre = validateApplyUrl(url);
  if (!pre.ok) {
    return { status: pre.reason === "error_param" ? "error_redirect" : pre.reason === "generic_careers_page" ? "generic_redirect" : "invalid", subrequests: 0 };
  }

  let subrequests = 0;
  try {
    subrequests++;
    const head = await timedFetch(fetchFn, url, "HEAD", timeoutMs);
    const headClass = classifyFinal(url, head);
    if (head.status >= 200 && head.status < 300 && headClass === null) {
      return { status: "ok", httpStatus: head.status, finalUrl: head.url || url, subrequests };
    }
    if (headClass === "error_redirect" || headClass === "generic_redirect" || head.status === 404 || head.status === 410) {
      return { status: headClass ?? "dead", httpStatus: head.status, finalUrl: head.url || url, subrequests };
    }
  } catch {
    // fall through to GET: some hosts reject or hang on HEAD
  }

  try {
    subrequests++;
    const get = await timedFetch(fetchFn, url, "GET", timeoutMs);
    const getClass = classifyFinal(url, get);
    if (getClass !== null) return { status: getClass, httpStatus: get.status, finalUrl: get.url || url, subrequests };
    const body = (await readCapped(get, maxBodyBytes)).toLowerCase();
    if (CLOSED_PHRASES.some((p) => body.includes(p))) {
      return { status: "closed_page", httpStatus: get.status, finalUrl: get.url || url, subrequests };
    }
    return { status: "ok", httpStatus: get.status, finalUrl: get.url || url, subrequests };
  } catch {
    return { status: "network_error", subrequests };
  }
}

/** Statuses that count as a failed check. 'unverifiable' (403/429/999) neither fails nor verifies. */
export function isFailure(status: LinkStatus): boolean {
  return status !== "ok" && status !== "unverifiable";
}

export const LINK_FAILURES_TO_CLOSE = 2;

export interface LinkCheckBatchOptions {
  batchSize?: number;
  concurrency?: number;
  /** Hard cap on outbound fetches for this invocation (Worker subrequest limit). */
  maxSubrequests?: number;
  /** Do not re-check a job checked more recently than this. */
  minRecheckMs?: number;
  now?: number;
  timeoutMs?: number;
}

export interface LinkCheckBatchSummary {
  checked: number;
  ok: number;
  failed: number;
  unverifiable: number;
  closed: number;
  skippedForBudget: number;
  subrequests: number;
}

interface QueueRow {
  id: string;
  apply_target: string;
  link_fail_count: number | null;
}

/**
 * Check a bounded batch of open URL jobs, oldest-checked first.
 * Each URL costs at most 2 fetches (HEAD + GET); jobs are skipped once the
 * subrequest budget cannot cover another worst-case check.
 */
export async function runLinkCheckBatch(
  db: ID1Database,
  fetchFn: FetchLike,
  opts: LinkCheckBatchOptions = {}
): Promise<LinkCheckBatchSummary> {
  const now = opts.now ?? Date.now();
  const batchSize = Math.max(1, Math.min(opts.batchSize ?? 20, 200));
  const concurrency = Math.max(1, Math.min(opts.concurrency ?? 4, 6));
  const maxSubrequests = Math.max(2, opts.maxSubrequests ?? 40);
  const minRecheckMs = opts.minRecheckMs ?? 20 * 60 * 60 * 1000;

  const res = await db
    .prepare(
      `SELECT id, apply_target, link_fail_count FROM jobs
       WHERE status = 'open' AND apply_type IN ('url', 'form')
         AND (link_checked_at IS NULL OR link_checked_at < ?)
       ORDER BY COALESCE(link_checked_at, 0) ASC
       LIMIT ?`
    )
    .bind(now - minRecheckMs, batchSize)
    .all<QueueRow>();
  const rows = res.results ?? [];

  const summary: LinkCheckBatchSummary = { checked: 0, ok: 0, failed: 0, unverifiable: 0, closed: 0, skippedForBudget: 0, subrequests: 0 };
  const updates: Array<{ id: string; status: LinkStatus; failCount: number; close: boolean; verified: boolean }> = [];
  let reserved = 0;
  let idx = 0;

  const worker = async () => {
    while (idx < rows.length) {
      const row = rows[idx++]!;
      if (reserved + 2 > maxSubrequests) {
        summary.skippedForBudget++;
        continue;
      }
      reserved += 2;
      const result = await checkApplyLink(row.apply_target, fetchFn, { timeoutMs: opts.timeoutMs ?? 8000 });
      reserved -= 2 - result.subrequests;
      summary.subrequests += result.subrequests;
      summary.checked++;
      const prev = Number(row.link_fail_count ?? 0);
      if (result.status === "ok") {
        summary.ok++;
        updates.push({ id: row.id, status: "ok", failCount: 0, close: false, verified: true });
      } else if (!isFailure(result.status)) {
        summary.unverifiable++;
        updates.push({ id: row.id, status: result.status, failCount: prev, close: false, verified: false });
      } else {
        summary.failed++;
        const failCount = prev + 1;
        const close = failCount >= LINK_FAILURES_TO_CLOSE;
        if (close) summary.closed++;
        updates.push({ id: row.id, status: result.status, failCount, close, verified: false });
      }
    }
  };
  await Promise.all(Array.from({ length: Math.min(concurrency, rows.length) }, worker));

  const stmts = updates.map((u) =>
    db
      .prepare(
        `UPDATE jobs SET link_status = ?, link_fail_count = ?, link_checked_at = ?,
           last_verified_at = CASE WHEN ? = 1 THEN ? ELSE last_verified_at END,
           status = CASE WHEN ? = 1 THEN 'closed' ELSE status END,
           closed_reason = CASE WHEN ? = 1 THEN 'link_check' ELSE closed_reason END
         WHERE id = ?`
      )
      .bind(u.status, u.failCount, now, u.verified ? 1 : 0, now, u.close ? 1 : 0, u.close ? 1 : 0, u.id)
  );
  if (stmts.length > 0) {
    if (db.batch) await db.batch(stmts);
    else for (const s of stmts) await s.run();
  }
  return summary;
}

export const DEFAULT_STALE_DAYS = 14;

/** Close open jobs the crawler has not seen for `staleDays` (7–14). One UPDATE, no subrequests. */
export async function expireStaleJobs(db: ID1Database, opts: { staleDays?: number; now?: number } = {}): Promise<number> {
  const staleDays = Math.max(7, Math.min(opts.staleDays ?? DEFAULT_STALE_DAYS, 14));
  const cutoff = (opts.now ?? Date.now()) - staleDays * 24 * 60 * 60 * 1000;
  const res = await db
    .prepare(
      `UPDATE jobs SET status = 'closed', closed_reason = 'stale'
       WHERE status = 'open' AND last_seen_at < ?`
    )
    .bind(cutoff)
    .run();
  return Number((res as { meta?: { changes?: number } }).meta?.changes ?? 0);
}
