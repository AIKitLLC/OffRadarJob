import { ID1Database } from "./types.js";
import { ClickSource } from "../analytics/click-source.js";

// Storage for apply-click measurement (#39). Kept out of repositories.ts.

export interface ApplyClick {
  id: string;
  jobId: string;
  userId: string | null;
  source: ClickSource;
  listSlug: string | null;
  createdAt: number;
}

export interface CompanyClickRow {
  companyId: string | null;
  companyName: string | null;
  clicks: number;
  signedInUsers: number;
  anonymousClicks: number;
}

export interface ClickSummary {
  sinceMs: number;
  total: number;
  byCompany: CompanyClickRow[];
  bySource: Array<{ source: string; clicks: number }>;
  byList: Array<{ listSlug: string; clicks: number }>;
}

const toNumber = (value: unknown): number => (typeof value === "number" ? value : Number(value ?? 0));
const toText = (value: unknown): string | null => (typeof value === "string" ? value : null);

export class ApplyClickRepository {
  constructor(private readonly db: ID1Database) {}

  public async record(click: ApplyClick): Promise<void> {
    await this.db
      .prepare(
        `INSERT INTO apply_clicks (id, job_id, user_id, source, list_slug, created_at) VALUES (?, ?, ?, ?, ?, ?)`
      )
      .bind(click.id, click.jobId, click.userId, click.source, click.listSlug, click.createdAt)
      .run();
  }

  public async lastClickAt(userId: string, jobId: string): Promise<number | null> {
    const row = await this.db
      .prepare(`SELECT MAX(created_at) AS last FROM apply_clicks WHERE user_id = ? AND job_id = ?`)
      .bind(userId, jobId)
      .first<{ last: unknown }>();
    return row && row.last !== null && row.last !== undefined ? toNumber(row.last) : null;
  }

  public async summary(sinceMs: number, companyLimit = 50): Promise<ClickSummary> {
    const companies = await this.db
      .prepare(
        `SELECT j.company_id AS company_id, c.name AS company_name, COUNT(*) AS clicks,
                COUNT(DISTINCT ac.user_id) AS signed_in_users,
                SUM(CASE WHEN ac.user_id IS NULL THEN 1 ELSE 0 END) AS anonymous_clicks
         FROM apply_clicks ac
         JOIN jobs j ON j.id = ac.job_id
         LEFT JOIN companies c ON c.id = j.company_id
         WHERE ac.created_at >= ?
         GROUP BY j.company_id, c.name
         ORDER BY clicks DESC, j.company_id ASC
         LIMIT ?`
      )
      .bind(sinceMs, companyLimit)
      .all<Record<string, unknown>>();

    const sources = await this.db
      .prepare(
        `SELECT source, COUNT(*) AS clicks FROM apply_clicks WHERE created_at >= ? GROUP BY source ORDER BY clicks DESC, source ASC`
      )
      .bind(sinceMs)
      .all<Record<string, unknown>>();

    const lists = await this.db
      .prepare(
        `SELECT list_slug, COUNT(*) AS clicks FROM apply_clicks
         WHERE created_at >= ? AND list_slug IS NOT NULL
         GROUP BY list_slug ORDER BY clicks DESC, list_slug ASC`
      )
      .bind(sinceMs)
      .all<Record<string, unknown>>();

    const bySource = sources.results.map((r) => ({ source: String(r["source"]), clicks: toNumber(r["clicks"]) }));
    return {
      sinceMs,
      total: bySource.reduce((sum, r) => sum + r.clicks, 0),
      byCompany: companies.results.map((r) => ({
        companyId: toText(r["company_id"]),
        companyName: toText(r["company_name"]),
        clicks: toNumber(r["clicks"]),
        signedInUsers: toNumber(r["signed_in_users"]),
        anonymousClicks: toNumber(r["anonymous_clicks"]),
      })),
      bySource,
      byList: lists.results.map((r) => ({ listSlug: String(r["list_slug"]), clicks: toNumber(r["clicks"]) })),
    };
  }
}
