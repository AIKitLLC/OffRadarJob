import type { ID1Database } from "../db/types.js";
import {
  isAcceptableApplyTarget,
  isCloudflareEmailProtectionUrl,
  normalizeApplyTarget,
  type FetchLike,
} from "./link-checker.js";
import { SourceReResearcher, type RecoveredApplyTarget } from "./source-re-research.js";

export interface BrokenLinkRecoverySummary {
  scannedJobs: number;
  decodedEmails: number;
  recoveredJobsFromSource: number;
  reopenedJobs: number;
  closedInvalidJobs: number;
  scannedCompanies: number;
  decodedCompanies: number;
  recoveredCompaniesFromSource: number;
  unrecoveredCompanies: number;
  fixedCompanies: number;
  scannedCareerPages: number;
  recoveredCareerPages: number;
  deactivatedCareerPages: number;
  deletedCareerPages: number;
  fetchesUsed: number;
}

export type BrokenLinksRepairSummary = BrokenLinkRecoverySummary;

export function emptyBrokenLinkRecoverySummary(): BrokenLinkRecoverySummary {
  return {
    scannedJobs: 0,
    decodedEmails: 0,
    recoveredJobsFromSource: 0,
    reopenedJobs: 0,
    closedInvalidJobs: 0,
    scannedCompanies: 0,
    decodedCompanies: 0,
    recoveredCompaniesFromSource: 0,
    unrecoveredCompanies: 0,
    fixedCompanies: 0,
    scannedCareerPages: 0,
    recoveredCareerPages: 0,
    deactivatedCareerPages: 0,
    deletedCareerPages: 0,
    fetchesUsed: 0,
  };
}

export interface BrokenLinkRecoveryOptions {
  batchSize?: number;
  maxFetches?: number;
  retryAfterMs?: number;
  now?: number;
}

interface BrokenJobRow {
  id: string;
  company_id: string;
  career_page_id: string | null;
  apply_type: string;
  apply_target: string;
  status: string;
  closed_reason: string | null;
  link_status: string | null;
  link_checked_at: number | null;
}

interface CompanyRow {
  id: string;
  domain: string;
  website_url: string;
  contact_email: string | null;
  updated_at: number | null;
}

interface BrokenCareerPageRow {
  id: string;
  company_id: string;
  url: string;
  last_checked_at: number | null;
}

const DEFAULT_RETRY_AFTER_MS = 7 * 24 * 60 * 60 * 1000;

function isBrokenJob(row: BrokenJobRow): boolean {
  if (row.closed_reason === "invalid_link" || row.link_status === "invalid") return true;
  const normalized = normalizeApplyTarget(row.apply_type, row.apply_target);
  if (normalized.applyType !== row.apply_type || normalized.applyTarget !== row.apply_target) return true;
  return !isAcceptableApplyTarget(row.apply_type, row.apply_target);
}

function isStaleEnough(lastAttemptAt: number | null, now: number, retryAfterMs: number): boolean {
  return lastAttemptAt == null || now - lastAttemptAt >= retryAfterMs;
}

async function findCompany(db: ID1Database, companyId: string | null): Promise<CompanyRow | null> {
  if (!companyId) return null;
  return db
    .prepare(`SELECT id, domain, website_url, contact_email, updated_at FROM companies WHERE id = ? LIMIT 1`)
    .bind(companyId)
    .first<CompanyRow>();
}

async function findCareerPageUrl(db: ID1Database, careerPageId: string | null): Promise<string | null> {
  if (!careerPageId) return null;
  const row = await db
    .prepare(`SELECT url FROM career_pages WHERE id = ? LIMIT 1`)
    .bind(careerPageId)
    .first<{ url: string }>();
  return row?.url ?? null;
}

function recoveredJobStatement(db: ID1Database, row: BrokenJobRow, target: RecoveredApplyTarget, now: number) {
  if (row.status === "closed" && row.closed_reason === "invalid_link") {
    return db
      .prepare(
        `UPDATE jobs
         SET apply_type = ?, apply_target = ?, status = 'open', closed_reason = NULL, link_status = 'ok', link_fail_count = 0, link_checked_at = ?, last_verified_at = ?
         WHERE id = ?`
      )
      .bind(target.applyType, target.applyTarget, now, now, row.id);
  }
  return db
    .prepare(
      `UPDATE jobs
       SET apply_type = ?, apply_target = ?, link_status = 'ok', link_fail_count = 0, link_checked_at = ?, last_verified_at = ?
       WHERE id = ?`
    )
    .bind(target.applyType, target.applyTarget, now, now, row.id);
}

async function recoverJobFromSource(
  db: ID1Database,
  researcher: SourceReResearcher,
  row: BrokenJobRow
): Promise<RecoveredApplyTarget | null> {
  const company = await findCompany(db, row.company_id);
  if (company?.contact_email) {
    const normalizedCompanyEmail = normalizeApplyTarget("email", company.contact_email);
    if (
      normalizedCompanyEmail.applyType === "email" &&
      isAcceptableApplyTarget(normalizedCompanyEmail.applyType, normalizedCompanyEmail.applyTarget)
    ) {
      return normalizedCompanyEmail;
    }
  }

  const careerPageUrl = await findCareerPageUrl(db, row.career_page_id);
  return researcher.findApplyTargetViaCompanySite(careerPageUrl, company?.website_url ?? null);
}

export async function recoverBrokenLinksData(
  db: ID1Database,
  fetchFn: FetchLike = (input, init) => fetch(input, init),
  opts: BrokenLinkRecoveryOptions = {}
): Promise<BrokenLinkRecoverySummary> {
  const now = opts.now ?? Date.now();
  const batchSize = Math.max(10, Math.min(opts.batchSize ?? 500, 2000));
  const retryAfterMs = opts.retryAfterMs ?? DEFAULT_RETRY_AFTER_MS;
  const researcher = new SourceReResearcher(fetchFn, { maxFetches: opts.maxFetches ?? 20 });
  const summary = emptyBrokenLinkRecoverySummary();
  const stmts: ReturnType<ID1Database["prepare"]>[] = [];

  const jobsRes = await db
    .prepare(
      `SELECT id, company_id, career_page_id, apply_type, apply_target, status, closed_reason, link_status, link_checked_at FROM jobs
       WHERE LOWER(apply_target) LIKE '%/cdn-cgi/%'
          OR LOWER(apply_target) LIKE '%email-protection%'
          OR LOWER(apply_target) LIKE 'mailto:%'
          OR closed_reason = 'invalid_link'
          OR link_status = 'invalid'
       LIMIT ?`
    )
    .bind(batchSize)
    .all<BrokenJobRow>();

  for (const row of jobsRes.results ?? []) {
    if (!isBrokenJob(row)) continue;
    summary.scannedJobs++;

    const normalized = normalizeApplyTarget(row.apply_type, row.apply_target);
    if (
      (normalized.applyType !== row.apply_type || normalized.applyTarget !== row.apply_target) &&
      isAcceptableApplyTarget(normalized.applyType, normalized.applyTarget)
    ) {
      summary.decodedEmails++;
      if (row.status === "closed" && row.closed_reason === "invalid_link") summary.reopenedJobs++;
      stmts.push(recoveredJobStatement(db, row, normalized, now));
      continue;
    }

    if (!isStaleEnough(row.link_checked_at, now, retryAfterMs)) continue;

    const recovered = await recoverJobFromSource(db, researcher, row).catch(() => null);
    if (recovered && isAcceptableApplyTarget(recovered.applyType, recovered.applyTarget)) {
      summary.recoveredJobsFromSource++;
      if (row.status === "closed" && row.closed_reason === "invalid_link") summary.reopenedJobs++;
      stmts.push(recoveredJobStatement(db, row, recovered, now));
      continue;
    }

    if (row.status === "open") {
      summary.closedInvalidJobs++;
      stmts.push(
        db
          .prepare(
            `UPDATE jobs
             SET status = 'closed', closed_reason = 'invalid_link', link_status = 'invalid', link_checked_at = ?
             WHERE id = ?`
          )
          .bind(now, row.id)
      );
    } else {
      stmts.push(
        db
          .prepare(
            `UPDATE jobs
             SET link_status = 'invalid', link_checked_at = ?
             WHERE id = ?`
          )
          .bind(now, row.id)
      );
    }
  }

  const companiesRes = await db
    .prepare(
      `SELECT id, domain, website_url, contact_email, updated_at FROM companies
       WHERE contact_email IS NOT NULL
         AND (LOWER(contact_email) LIKE '%cdn-cgi%' OR LOWER(contact_email) LIKE 'mailto:%')
       LIMIT ?`
    )
    .bind(batchSize)
    .all<CompanyRow>();

  for (const company of companiesRes.results ?? []) {
    if (!company.contact_email) continue;
    summary.scannedCompanies++;

    const normalized = normalizeApplyTarget("email", company.contact_email);
    if (
      normalized.applyType === "email" &&
      normalized.applyTarget !== company.contact_email &&
      isAcceptableApplyTarget(normalized.applyType, normalized.applyTarget)
    ) {
      summary.decodedCompanies++;
      summary.fixedCompanies++;
      stmts.push(
        db.prepare(`UPDATE companies SET contact_email = ?, updated_at = ? WHERE id = ?`).bind(normalized.applyTarget, now, company.id)
      );
      continue;
    }
    if (normalized.applyType === "email" && isAcceptableApplyTarget(normalized.applyType, normalized.applyTarget)) {
      continue;
    }

    if (!isStaleEnough(company.updated_at, now, retryAfterMs)) continue;

    const recoveredEmail = company.website_url
      ? await researcher.findEmailOnPage(company.website_url).catch(() => null)
      : null;
    if (recoveredEmail && isAcceptableApplyTarget("email", recoveredEmail)) {
      summary.recoveredCompaniesFromSource++;
      summary.fixedCompanies++;
      stmts.push(
        db.prepare(`UPDATE companies SET contact_email = ?, updated_at = ? WHERE id = ?`).bind(recoveredEmail, now, company.id)
      );
      continue;
    }

    summary.unrecoveredCompanies++;
    stmts.push(
      db.prepare(`UPDATE companies SET contact_email = ?, updated_at = ? WHERE id = ?`).bind(company.contact_email, now, company.id)
    );
  }

  const careerPagesRes = await db
    .prepare(`SELECT id, company_id, url, last_checked_at FROM career_pages WHERE LOWER(url) LIKE '%cdn-cgi%' LIMIT ?`)
    .bind(batchSize)
    .all<BrokenCareerPageRow>();

  for (const page of careerPagesRes.results ?? []) {
    if (!isCloudflareEmailProtectionUrl(page.url) && !page.url.toLowerCase().includes("/cdn-cgi/")) continue;
    summary.scannedCareerPages++;

    if (!isStaleEnough(page.last_checked_at, now, retryAfterMs)) continue;

    const company = await findCompany(db, page.company_id);
    const recoveredUrl = company?.website_url
      ? await researcher.findCareerPageUrlOnPage(company.website_url).catch(() => null)
      : null;

    if (recoveredUrl && !isCloudflareEmailProtectionUrl(recoveredUrl)) {
      summary.recoveredCareerPages++;
      stmts.push(
        db
          .prepare(`UPDATE career_pages SET url = ?, status = 'active', last_checked_at = ? WHERE id = ?`)
          .bind(recoveredUrl, now, page.id)
      );
      continue;
    }

    summary.deactivatedCareerPages++;
    stmts.push(
      db
        .prepare(`UPDATE career_pages SET status = 'not_found', last_checked_at = ? WHERE id = ?`)
        .bind(now, page.id)
    );
  }

  summary.fetchesUsed = researcher.fetchesUsed;

  if (stmts.length > 0) {
    if (db.batch) {
      for (let i = 0; i < stmts.length; i += 50) {
        await db.batch(stmts.slice(i, i + 50));
      }
    } else {
      for (const stmt of stmts) {
        await stmt.run();
      }
    }
  }

  return summary;
}

export const repairBrokenLinksData = recoverBrokenLinksData;
