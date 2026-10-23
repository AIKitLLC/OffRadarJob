/**
 * Apply-link quality: static validation at ingest, a batched live link checker
 * for the cron, and auto-expiry of jobs the crawler has not seen recently.
 *
 * Worker limits: every fetch (and every redirect hop) is a subrequest. The checker
 * works on a small, bounded batch per invocation, uses HEAD first and only falls
 * back to GET when HEAD is not conclusive, and caps the GET body it scans.
 * Redirects are followed manually so each hop is validated before it is requested.
 */
import type { ID1Database } from "../db/types.js";
import { validateApplyUrl, type StaticValidation } from "./apply-url-guard.js";
import { fetchValidatedApplyUrl, type FetchLike } from "./guarded-apply-fetch.js";

export {
  validateApplyUrl,
  isAcceptableApplyTarget,
  isBlockedApplyHost,
  decodeCloudflareEmailProtection,
  isCloudflareEmailProtectionUrl,
  normalizeApplyTarget,
} from "./apply-url-guard.js";
export type { StaticValidation, FetchLike };

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

export interface LinkCheckResult {
  status: LinkStatus;
  httpStatus?: number;
  finalUrl?: string;
  subrequests: number;
  /** True when the caller budget stopped the check before a useful result. */
  budgetExhausted?: boolean;
}

export interface CheckOptions {
  timeoutMs?: number;
  maxBodyBytes?: number;
  /** Return false to refuse another outbound request. */
  allowSubrequest?: () => boolean;
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

function statusForReason(reason: StaticValidation["reason"] | undefined): LinkStatus {
  if (reason === "error_param") return "error_redirect";
  if (reason === "generic_careers_page") return "generic_redirect";
  return "invalid";
}

function classifyFinal(originalUrl: string, res: Response): LinkStatus | null {
  const finalUrl = res.url || originalUrl;
  const verdict = validateApplyUrl(finalUrl);
  if (!verdict.ok && verdict.reason === "blocked_host") return "invalid";
  if (res.status === 404 || res.status === 410) return "dead";
  if (res.status === 403 || res.status === 429 || res.status === 999 || res.status === 401) return "unverifiable";
  if (res.status >= 500) return "server_error";
  if (res.status >= 400) return "dead";
  if (finalUrl !== originalUrl) {
    if (!verdict.ok && verdict.reason === "email_protection") return "invalid";
    if (!verdict.ok && verdict.reason === "error_param") return "error_redirect";
    if (!verdict.ok && verdict.reason === "generic_careers_page") return "generic_redirect";
  }
  return null;
}

/** Check one URL: HEAD first, GET fallback when HEAD is not a clean 2xx. */
export async function checkApplyLink(url: string, fetchFn: FetchLike, opts: CheckOptions = {}): Promise<LinkCheckResult> {
  const timeoutMs = opts.timeoutMs ?? 8000;
  const maxBodyBytes = opts.maxBodyBytes ?? 64 * 1024;
  const pre = validateApplyUrl(url);
  if (!pre.ok) return { status: statusForReason(pre.reason), subrequests: 0 };

  let subrequests = 0;
  const attempt = async (method: "HEAD" | "GET"): Promise<LinkCheckResult | "continue"> => {
    const fetched = await fetchValidatedApplyUrl(url, fetchFn, method, {
      timeoutMs,
      ...(opts.allowSubrequest ? { allowSubrequest: opts.allowSubrequest } : {}),
    });
    subrequests += fetched.subrequests;
    if (fetched.outcome === "budget") {
      return { status: "unverifiable", subrequests, budgetExhausted: true, finalUrl: fetched.finalUrl };
    }
    if (fetched.outcome === "rejected") {
      return { status: statusForReason(fetched.reason), finalUrl: fetched.finalUrl, subrequests };
    }
    if (fetched.outcome === "network") return "continue";
    const res = fetched.response;
    const klass = classifyFinal(url, res);
    const finalUrl = res.url || fetched.finalUrl || url;
    if (method === "HEAD") {
      if (res.status >= 200 && res.status < 300 && klass === null) {
        return { status: "ok", httpStatus: res.status, finalUrl, subrequests };
      }
      if (klass === "error_redirect" || klass === "generic_redirect" || klass === "invalid" || res.status === 404 || res.status === 410) {
        return { status: klass ?? "dead", httpStatus: res.status, finalUrl, subrequests };
      }
      return "continue";
    }
    if (klass !== null) return { status: klass, httpStatus: res.status, finalUrl, subrequests };
    const body = (await readCapped(res, maxBodyBytes)).toLowerCase();
    if (CLOSED_PHRASES.some((p) => body.includes(p))) {
      return { status: "closed_page", httpStatus: res.status, finalUrl, subrequests };
    }
    return { status: "ok", httpStatus: res.status, finalUrl, subrequests };
  };

  const head = await attempt("HEAD");
  if (head !== "continue") return head;
  const get = await attempt("GET");
  if (get !== "continue") return get;
  return { status: "network_error", subrequests };
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

/** Apply hosts that come from a structured ATS feed (not scraped from a careers page). */
export const ATS_HOST_PATTERNS = [
  "greenhouse.io",
  "ashbyhq.com",
  "lever.co",
  "workable.com",
  "smartrecruiters.com",
  "bamboohr.com",
  "recruitee.com",
  "breezy.hr",
  "jobvite.com",
  "myworkdayjobs.com",
  "rippling.com",
  "wellfound.com",
];

const hostLike = (h: string) => `LOWER(apply_target) LIKE '%${h}/%'`;

/**
 * Queue priority (Free plan: ~360 checks/day, so order matters):
 *   0 = never checked (newly ingested first, newest first_seen_at first)
 *   1 = error-prone sources: Greenhouse, and links scraped from company careers pages (no ATS host)
 *   2 = everything else (Ashby, Lever, other ATS), oldest link_checked_at first
 */
export const LINK_CHECK_PRIORITY_SQL = `CASE
  WHEN link_checked_at IS NULL THEN 0
  WHEN ${hostLike("greenhouse.io")} THEN 1
  WHEN NOT (${ATS_HOST_PATTERNS.map(hostLike).join(" OR ")}) THEN 1
  ELSE 2
END`;

/** Same priority in TypeScript (used for logging/tests). */
export function linkCheckPriority(row: { apply_target: string; link_checked_at: number | null }): 0 | 1 | 2 {
  if (row.link_checked_at == null) return 0;
  const t = row.apply_target.toLowerCase();
  if (t.includes("greenhouse.io/")) return 1;
  if (!ATS_HOST_PATTERNS.some((h) => t.includes(`${h}/`))) return 1;
  return 2;
}

interface QueueRow {
  id: string;
  apply_target: string;
  link_fail_count: number | null;
}

/**
 * Check a bounded batch of open URL jobs, oldest-checked first.
 * Each URL costs at least a HEAD and maybe a GET, plus one request per redirect
 * hop. Jobs are skipped once the subrequest budget cannot cover another check,
 * and a hop is not requested once the budget is spent.
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
       ORDER BY ${LINK_CHECK_PRIORITY_SQL} ASC,
         CASE WHEN link_checked_at IS NULL THEN -first_seen_at ELSE link_checked_at END ASC,
         id ASC
       LIMIT ?`
    )
    .bind(now - minRecheckMs, batchSize)
    .all<QueueRow>();
  const rows = res.results ?? [];

  const summary: LinkCheckBatchSummary = { checked: 0, ok: 0, failed: 0, unverifiable: 0, closed: 0, skippedForBudget: 0, subrequests: 0 };
  const updates: Array<{ id: string; status: LinkStatus; failCount: number; close: boolean; verified: boolean }> = [];
  let spent = 0;
  let idx = 0;
  const allowSubrequest = () => {
    if (spent >= maxSubrequests) return false;
    spent += 1;
    return true;
  };

  const worker = async () => {
    while (idx < rows.length) {
      const row = rows[idx++]!;
      if (spent + 2 > maxSubrequests) {
        summary.skippedForBudget++;
        continue;
      }
      const result = await checkApplyLink(row.apply_target, fetchFn, {
        timeoutMs: opts.timeoutMs ?? 8000,
        allowSubrequest,
      });
      if (result.budgetExhausted && result.subrequests === 0) {
        summary.skippedForBudget++;
        continue;
      }
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
