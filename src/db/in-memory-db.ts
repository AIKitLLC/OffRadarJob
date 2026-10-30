import { ID1Database, ID1PreparedStatement, ID1Result, ID1Response } from "./types.js";
import { literalFromWrappedLikePattern } from "./job-catalog-search.js";
import { detectUsRegion } from "./repositories.js";
import { matchesUsState } from "../utils/us-states.js";
import { isIgnoredSourceDomain } from "../utils/source-policy.js";

/**
 * In-memory ID1Database mock for Node / Vitest testing & standalone simulation.
 * Emulates Cloudflare D1 database behavior with table stores.
 */
export class InMemoryD1Database implements ID1Database {
  public readonly tables: Map<string, Map<string, Record<string, unknown>>> = new Map();

  constructor() {
    this.tables.set("companies", new Map());
    this.tables.set("career_pages", new Map());
    this.tables.set("jobs", new Map());
    this.tables.set("crawl_logs", new Map());
    this.tables.set("crawl_tasks", new Map());
    this.tables.set("users", new Map());
    this.tables.set("cv_versions", new Map());
    this.tables.set("auth_sessions", new Map());
    this.tables.set("system_settings", new Map());
    this.tables.set("llm_feedbacks", new Map());
    this.tables.set("user_subscriptions", new Map());
    this.tables.set("candidate_profiles", new Map());
    this.tables.set("saved_job_filters", new Map());
    this.tables.set("job_quality_decisions", new Map());
    this.tables.set("match_alerts", new Map());
  }

  public prepare(query: string): ID1PreparedStatement {
    return new InMemoryPreparedStatement(this, query);
  }

  public async exec(_query: string): Promise<{ count: number; duration: number }> {
    return { count: 0, duration: 1 };
  }

  public clear(): void {
    for (const store of this.tables.values()) {
      store.clear();
    }
  }
}

class InMemoryPreparedStatement implements ID1PreparedStatement {
  private boundValues: unknown[] = [];

  constructor(
    private readonly db: InMemoryD1Database,
    private readonly query: string
  ) {}

  public bind(...values: unknown[]): ID1PreparedStatement {
    this.boundValues = values;
    return this;
  }

  public async first<T = unknown>(colName?: string): Promise<T | null> {
    const res = await this.all<T>();
    const firstRow = res.results[0];
    if (!firstRow) return null;
    if (colName) {
      const record = firstRow as Record<string, unknown>;
      return (record[colName] as T) ?? null;
    }
    return firstRow;
  }

  public async all<T = unknown>(): Promise<ID1Result<T>> {
    const q = this.query.trim();

    // Companies queries
    if (q.includes("FROM companies") && q.includes("WHERE domain = ?")) {
      const domain = String(this.boundValues[0]);
      const table = this.db.tables.get("companies")!;
      for (const row of table.values()) {
        if (row["domain"] === domain) {
          return { results: [row as T], success: true };
        }
      }
      return { results: [], success: true };
    }

    if (q.includes("FROM companies") && q.includes("WHERE id = ?")) {
      const id = String(this.boundValues[0]);
      const table = this.db.tables.get("companies")!;
      const row = table.get(id);
      return { results: row ? [row as T] : [], success: true };
    }

    const extractWhereClause = (sql: string): string => {
      const whereIdx = sql.indexOf("WHERE");
      if (whereIdx === -1) return "";
      const afterWhere = sql.slice(whereIdx);
      const orderIdx = afterWhere.indexOf("ORDER BY");
      const limitIdx = afterWhere.indexOf("LIMIT");
      const groupIdx = afterWhere.indexOf("GROUP BY");
      const endIdx = Math.min(
        orderIdx !== -1 ? orderIdx : Infinity,
        limitIdx !== -1 ? limitIdx : Infinity,
        groupIdx !== -1 ? groupIdx : Infinity
      );
      return endIdx === Infinity ? afterWhere : afterWhere.slice(0, endIdx);
    };
    const sourcePolicyApplied = (sql: string): boolean => sql.includes("NOT (LOWER(COALESCE(");
    const visibleCompany = (row: Record<string, unknown>): boolean => !isIgnoredSourceDomain(String(row["domain"] ?? ""));
    const visibleJob = (row: Record<string, unknown>): boolean => {
      const company = this.db.tables.get("companies")?.get(String(row["company_id"]));
      return !isIgnoredSourceDomain(String(company?.["domain"] ?? ""));
    };

    if (q.includes("FROM companies") && q.includes("COUNT(*)")) {
      const rows = Array.from(this.db.tables.get("companies")!.values());
      const wherePart = extractWhereClause(q);
      let filtered = sourcePolicyApplied(q) ? rows.filter(visibleCompany) : rows;
      if (wherePart.includes("LIKE '%california%'") || wherePart.includes("LIKE '%, ca %'")) {
        filtered = filtered.filter((r) => detectUsRegion(null, String(r["location_hint"] ?? ""), null, false) === "west");
      } else if (wherePart.includes("LIKE '%new york%'") || wherePart.includes("LIKE '%, ny %'")) {
        filtered = filtered.filter((r) => detectUsRegion(null, String(r["location_hint"] ?? ""), null, false) === "northeast");
      } else if (wherePart.includes("LIKE '%texas%'") || wherePart.includes("LIKE '%, tx %'")) {
        filtered = filtered.filter((r) => detectUsRegion(null, String(r["location_hint"] ?? ""), null, false) === "south");
      } else if (wherePart.includes("LIKE '%colorado%'") || wherePart.includes("LIKE '%, co %'")) {
        filtered = filtered.filter((r) => detectUsRegion(null, String(r["location_hint"] ?? ""), null, false) === "mountain");
      } else if (wherePart.includes("LIKE '%midwest%'") || wherePart.includes("LIKE '%illinois%'") || wherePart.includes("LIKE '%, il %'")) {
        filtered = filtered.filter((r) => detectUsRegion(null, String(r["location_hint"] ?? ""), null, false) === "midwest");
      }
      if (q.includes("LOWER(funding_stage)")) {
        const stageVals = this.boundValues.filter((v) => typeof v === "string" && !String(v).includes("%"));
        const stageVal = String(stageVals[0] ?? "").toLowerCase().replace(/_/g, " ");
        if (stageVal) {
          filtered = filtered.filter((r) => {
            const fs = String(r["funding_stage"] ?? "").toLowerCase().replace(/_/g, " ");
            return fs === stageVal || fs.includes(stageVal);
          });
        }
      }
      if (q.includes("LOWER(primary_department) = ?")) {
        const deptVals = this.boundValues.filter((v) => typeof v === "string" && !String(v).includes("%"));
        const deptVal = deptVals[deptVals.length - 1];
        if (deptVal) {
          filtered = filtered.filter((r) => String(r["primary_department"] ?? "").toLowerCase() === String(deptVal).toLowerCase());
        }
      }
      if (q.includes("LOWER(COALESCE(location_hint, '')) LIKE '% ' || ? || ' %'")) {
        const stateVals = this.boundValues.filter((v) => typeof v === "string" && !String(v).includes("%"));
        const stateCode = String(stateVals[0] ?? "");
        if (stateCode) {
          filtered = filtered.filter((r) => matchesUsState(String(r["location_hint"] ?? ""), stateCode));
        }
      }
      return { results: [{ count: filtered.length, total: filtered.length } as T], success: true };
    }

    if (q.includes("FROM companies") && q.includes("LIKE '%cdn-cgi%'")) {
      const limit = Number(this.boundValues[0] ?? 500);
      const rows = Array.from(this.db.tables.get("companies")!.values())
        .filter((r) => {
          const email = String(r["contact_email"] ?? "").toLowerCase();
          return Boolean(email) && (email.includes("cdn-cgi") || email.startsWith("mailto:"));
        })
        .slice(0, limit);
      return { results: rows as T[], success: true };
    }

    if (q.includes("FROM companies")) {
      let rows = Array.from(this.db.tables.get("companies")!.values());
      if (sourcePolicyApplied(q)) rows = rows.filter(visibleCompany);
      const wherePart = extractWhereClause(q);
      if (wherePart.includes("LIKE '%california%'") || wherePart.includes("LIKE '%, ca %'")) {
        rows = rows.filter((r) => detectUsRegion(null, String(r["location_hint"] ?? ""), null, false) === "west");
      } else if (wherePart.includes("LIKE '%new york%'") || wherePart.includes("LIKE '%, ny %'")) {
        rows = rows.filter((r) => detectUsRegion(null, String(r["location_hint"] ?? ""), null, false) === "northeast");
      } else if (wherePart.includes("LIKE '%texas%'") || wherePart.includes("LIKE '%, tx %'")) {
        rows = rows.filter((r) => detectUsRegion(null, String(r["location_hint"] ?? ""), null, false) === "south");
      } else if (wherePart.includes("LIKE '%colorado%'") || wherePart.includes("LIKE '%, co %'")) {
        rows = rows.filter((r) => detectUsRegion(null, String(r["location_hint"] ?? ""), null, false) === "mountain");
      } else if (wherePart.includes("LIKE '%midwest%'") || wherePart.includes("LIKE '%illinois%'") || wherePart.includes("LIKE '%, il %'")) {
        rows = rows.filter((r) => detectUsRegion(null, String(r["location_hint"] ?? ""), null, false) === "midwest");
      }
      if (q.includes("LOWER(funding_stage)")) {
        const stageVals = this.boundValues.filter((v) => typeof v === "string" && !String(v).includes("%"));
        const stageVal = String(stageVals[0] ?? "").toLowerCase().replace(/_/g, " ");
        if (stageVal) {
          rows = rows.filter((r) => {
            const fs = String(r["funding_stage"] ?? "").toLowerCase().replace(/_/g, " ");
            return fs === stageVal || fs.includes(stageVal);
          });
        }
      }
      if (q.includes("LOWER(primary_department) = ?")) {
        const deptVals = this.boundValues.filter((v) => typeof v === "string" && !String(v).includes("%"));
        const deptVal = deptVals[deptVals.length - 1];
        if (deptVal) {
          rows = rows.filter((r) => String(r["primary_department"] ?? "").toLowerCase() === String(deptVal).toLowerCase());
        }
      }
      if (q.includes("LOWER(COALESCE(location_hint, '')) LIKE '% ' || ? || ' %'")) {
        const stateVals = this.boundValues.filter((v) => typeof v === "string" && !String(v).includes("%"));
        const stateCode = String(stateVals[0] ?? "");
        if (stateCode) {
          rows = rows.filter((r) => matchesUsState(String(r["location_hint"] ?? ""), stateCode));
        }
      }

      if (q.includes("is_midwest_priority")) {
        rows.sort((a, b) => {
          const locA = String(a["location_hint"] ?? "");
          const locB = String(b["location_hint"] ?? "");
          const aMid = detectUsRegion(null, locA, null, false) === "midwest";
          const bMid = detectUsRegion(null, locB, null, false) === "midwest";
          if (aMid && !bMid) return -1;
          if (!aMid && bMid) return 1;
          return Number(b["updated_at"] ?? 0) - Number(a["updated_at"] ?? 0);
        });
      } else {
        rows.sort((a, b) => Number(b["updated_at"] ?? 0) - Number(a["updated_at"] ?? 0));
      }
      return { results: rows as T[], success: true };
    }

    // Career Pages queries
    if (q.includes("FROM career_pages") && q.includes("LIKE '%cdn-cgi%'")) {
      const limit = Number(this.boundValues[0] ?? 500);
      const rows = Array.from(this.db.tables.get("career_pages")!.values())
        .filter((r) => String(r["url"] ?? "").toLowerCase().includes("cdn-cgi"))
        .slice(0, limit);
      return { results: rows as T[], success: true };
    }

    if (q.includes("FROM career_pages") && q.includes("WHERE id = ?")) {
      const id = String(this.boundValues[0]);
      const row = this.db.tables.get("career_pages")!.get(id);
      return { results: row ? [row as T] : [], success: true };
    }

    if (q.includes("FROM career_pages") && q.includes("WHERE url = ?")) {
      const url = String(this.boundValues[0]);
      const table = this.db.tables.get("career_pages")!;
      for (const row of table.values()) {
        if (row["url"] === url) {
          return { results: [row as T], success: true };
        }
      }
      return { results: [], success: true };
    }

    if (q.includes("FROM career_pages") && q.includes("WHERE company_id = ?")) {
      const companyId = String(this.boundValues[0]);
      const rows = Array.from(this.db.tables.get("career_pages")!.values()).filter(
        (r) => r["company_id"] === companyId
      );
      return { results: rows as T[], success: true };
    }

    if (q.includes("DISTINCT company_id FROM jobs")) {
      const table = this.db.tables.get("jobs")!;
      const ids = Array.from(new Set(Array.from(table.values()).map((r) => String(r["company_id"]))));
      return { results: ids.map((id) => ({ company_id: id })) as T[], success: true };
    }

    if (q.includes("FROM jobs") && q.includes("WHERE company_id = ?") && (q.includes("GROUP BY dept") || q.includes("GROUP BY department"))) {
      const companyId = String(this.boundValues[0]);
      const table = this.db.tables.get("jobs")!;
      const deptCounts = new Map<string, number>();
      for (const r of table.values()) {
        if (r["company_id"] === companyId && r["status"] === "open") {
          const d = String(r["department"] || "General").trim() || "General";
          deptCounts.set(d, (deptCounts.get(d) || 0) + 1);
        }
      }
      const results: Array<{ dept: string; cnt: number }> = [];
      for (const [dept, cnt] of deptCounts.entries()) {
        results.push({ dept, cnt });
      }
      results.sort((a, b) => b.cnt - a.cnt);
      return { results: results as T[], success: true };
    }

    if (q.includes("FROM jobs") && (q.includes("WHERE content_hash = ?") || q.includes("WHERE j.content_hash = ?"))) {
      const hash = String(this.boundValues[0]);
      const table = this.db.tables.get("jobs")!;
      for (const row of table.values()) {
        if (row["content_hash"] === hash && (!sourcePolicyApplied(q) || visibleJob(row))) {
          return { results: [row as T], success: true };
        }
      }
      return { results: [], success: true };
    }

    if (q.includes("FROM jobs") && (q.includes("WHERE id = ?") || q.includes("WHERE j.id = ?"))) {
      const id = String(this.boundValues[0]);
      const table = this.db.tables.get("jobs")!;
      const row = table.get(id);
      if (row && (!sourcePolicyApplied(q) || visibleJob(row))) {
        const compTable = this.db.tables.get("companies");
        const comp = compTable?.get(String(row["company_id"]));
        const enriched = {
          ...row,
          company_name: comp?.["name"] || row["company_name"] || row["company_id"],
          company_website: comp?.["website_url"] || row["company_website"],
        };
        return { results: [enriched as T], success: true };
      }
      return { results: [], success: true };
    }

    if (q.includes("FROM jobs") && q.includes("LIKE '%cdn-cgi%'")) {
      const limit = Number(this.boundValues[0] ?? 500);
      const rows = Array.from(this.db.tables.get("jobs")!.values())
        .filter((r) => {
          const target = String(r["apply_target"] ?? "").toLowerCase();
          return (
            target.includes("/cdn-cgi/") ||
            target.includes("email-protection") ||
            target.startsWith("mailto:") ||
            r["closed_reason"] === "invalid_link" ||
            r["link_status"] === "invalid"
          );
        })
        .slice(0, limit);
      return { results: rows as T[], success: true };
    }

    if (q.includes("FROM jobs") && q.includes("link_checked_at IS NULL OR link_checked_at < ?")) {
      const [cutoff, limit] = this.boundValues as [number, number];
      const rows = Array.from(this.db.tables.get("jobs")!.values())
        .filter((r) => {
          const status = String(r["status"] ?? "open");
          const applyType = String(r["apply_type"] ?? "url");
          const checkedAt = r["link_checked_at"] != null ? Number(r["link_checked_at"]) : null;
          return status === "open" && (applyType === "url" || applyType === "form") && (checkedAt === null || checkedAt < cutoff);
        })
        .slice(0, limit || 20);
      return { results: rows as T[], success: true };
    }

    if (q.includes("FROM jobs")) {
      let rows = Array.from(this.db.tables.get("jobs")!.values());
      if (sourcePolicyApplied(q)) rows = rows.filter(visibleJob);
      if (q.includes("j.status = 'open'") || q.includes("status = 'open'")) {
        rows = rows.filter((row) => String(row["status"] ?? "open") === "open");
      }

      let bindingIdx = 0;
      if (q.includes("is_tech_role = 1")) {
        rows = rows.filter((r) => Number(r["is_tech_role"] ?? 1) === 1);
      }
      if (q.includes("seniority_level = ?")) {
        const gradeVal = String(this.boundValues[bindingIdx++]);
        rows = rows.filter((r) => r["seniority_level"] === gradeVal);
      }
      if (q.includes("tech_category = ?")) {
        const catVal = String(this.boundValues[bindingIdx++]);
        rows = rows.filter((r) => r["tech_category"] === catVal);
      }
      if (q.includes("LOWER(j.title) LIKE ?") || q.includes("title LIKE ?")) {
        const wrapped = this.boundValues.find(
          (value): value is string => typeof value === "string" && value.startsWith("%") && value.endsWith("%")
        );
        const searchPattern = wrapped ? literalFromWrappedLikePattern(wrapped) : "";
        if (searchPattern) {
          const companies = this.db.tables.get("companies");
          rows = rows.filter((r) => {
            const companyName = companies?.get(String(r["company_id"]))?.["name"];
            return (
              String(r["title"] ?? "").toLowerCase().includes(searchPattern) ||
              String(r["skills"] ?? "").toLowerCase().includes(searchPattern) ||
              String(r["location"] ?? "").toLowerCase().includes(searchPattern) ||
              String(r["department"] ?? "").toLowerCase().includes(searchPattern) ||
              String(r["description_summary"] ?? "").toLowerCase().includes(searchPattern) ||
              String(companyName ?? "").toLowerCase().includes(searchPattern)
            );
          });
        }
      }

      const compTable = this.db.tables.get("companies");
      rows = rows.map((r) => {
        const comp = compTable?.get(String(r["company_id"]));
        return {
          ...r,
          company_name: comp?.["name"] || r["company_name"] || r["company_id"],
          company_website: comp?.["website_url"] || r["company_website"],
          location_hint: comp?.["location_hint"] || r["location_hint"],
        };
      });

      const isMidwestRow = (r: Record<string, unknown>) => {
        return detectUsRegion(
          r["location"] ? String(r["location"]) : null,
          r["location_hint"] ? String(r["location_hint"]) : null,
          r["remote_scope"] ? String(r["remote_scope"]) : null,
          Number(r["is_remote"] ?? 0) === 1
        ) === "midwest";
      };

      const wherePart = extractWhereClause(q);
      if (wherePart.includes("LIKE '%california%'") || wherePart.includes("LIKE '%, ca %'")) {
        rows = rows.filter((r) => detectUsRegion(String(r["location"] ?? ""), String(r["location_hint"] ?? ""), String(r["remote_scope"] ?? ""), Number(r["is_remote"] ?? 0) === 1) === "west");
      } else if (wherePart.includes("LIKE '%new york%'") || wherePart.includes("LIKE '%, ny %'")) {
        rows = rows.filter((r) => detectUsRegion(String(r["location"] ?? ""), String(r["location_hint"] ?? ""), String(r["remote_scope"] ?? ""), Number(r["is_remote"] ?? 0) === 1) === "northeast");
      } else if (wherePart.includes("LIKE '%texas%'") || wherePart.includes("LIKE '%, tx %'")) {
        rows = rows.filter((r) => detectUsRegion(String(r["location"] ?? ""), String(r["location_hint"] ?? ""), String(r["remote_scope"] ?? ""), Number(r["is_remote"] ?? 0) === 1) === "south");
      } else if (wherePart.includes("LIKE '%colorado%'") || wherePart.includes("LIKE '%, co %'")) {
        rows = rows.filter((r) => detectUsRegion(String(r["location"] ?? ""), String(r["location_hint"] ?? ""), String(r["remote_scope"] ?? ""), Number(r["is_remote"] ?? 0) === 1) === "mountain");
      } else if (wherePart.includes("LIKE '%midwest%'") || wherePart.includes("remote_scope LIKE '%midwest%'") || wherePart.includes("LIKE '%illinois%'")) {
        rows = rows.filter((r) => isMidwestRow(r));
      }
      if (wherePart.includes("j.is_remote = 1")) {
        rows = rows.filter((r) => Number(r["is_remote"] ?? 0) === 1);
      }
      if (q.includes("COALESCE(j.location, c.location_hint)")) {
        const stateVals = this.boundValues.filter((v) => typeof v === "string" && !String(v).includes("%"));
        const stateCode = String(stateVals[0] ?? "");
        if (stateCode) {
          rows = rows.filter((r) => matchesUsState(`${r["location"] ?? ""} ${r["location_hint"] ?? ""}`, stateCode));
        }
      }

      if (q.includes("COUNT(*)") && q.includes("midwest_count")) {
        let seniorCount = 0;
        let midwestCount = 0;
        let westCount = 0;
        let northeastCount = 0;
        let southCount = 0;
        let mountainCount = 0;

        for (const r of rows) {
          const level = String(r["seniority_level"] ?? "");
          if (["senior", "founding", "lead"].includes(level)) seniorCount++;
          const reg = detectUsRegion(
            String(r["location"] ?? ""),
            String(r["location_hint"] ?? ""),
            String(r["remote_scope"] ?? ""),
            Number(r["is_remote"] ?? 0) === 1
          );
          if (reg === "midwest" || isMidwestRow(r)) midwestCount++;
          if (reg === "west") westCount++;
          if (reg === "northeast") northeastCount++;
          if (reg === "south") southCount++;
          if (reg === "mountain") mountainCount++;
        }

        return {
          results: [{
            total: rows.length,
            senior_count: seniorCount,
            midwest_count: midwestCount,
            west_count: westCount,
            northeast_count: northeastCount,
            south_count: southCount,
            mountain_count: mountainCount,
          } as T],
          success: true,
        };
      }

      if (q.includes("MAX(last_seen_at)")) {
        const now = Date.now();
        const oneDayAgo = Number(this.boundValues[0] ?? (now - 86400000));
        const sevenDaysAgo = Number(this.boundValues[2] ?? (now - 7 * 86400000));

        let maxLastSeen: number | null = null;
        let updatedLast24h = 0;
        let createdLast24h = 0;
        let updatedLast7d = 0;

        for (const r of rows) {
          const ls = Number(r["last_seen_at"] ?? 0);
          const fs = Number(r["first_seen_at"] ?? 0);
          if (ls > (maxLastSeen ?? 0)) maxLastSeen = ls;
          if (ls >= oneDayAgo) updatedLast24h++;
          if (fs >= oneDayAgo) createdLast24h++;
          if (ls >= sevenDaysAgo) updatedLast7d++;
        }

        return {
          results: [{
            latest_last_seen: maxLastSeen,
            updated_last_24h: updatedLast24h,
            created_last_24h: createdLast24h,
            updated_last_7d: updatedLast7d,
          } as T],
          success: true,
        };
      }

      if (q.includes("COUNT(*)")) {
        return { results: [{ total: rows.length, count: rows.length } as T], success: true };
      }

      if (q.includes("is_midwest_match DESC") || q.includes("ORDER BY is_midwest") || q.includes("THEN 1 ELSE 0 END) DESC")) {
        rows.sort((a, b) => {
          const aMid = isMidwestRow(a) ? 1 : 0;
          const bMid = isMidwestRow(b) ? 1 : 0;
          if (bMid !== aMid) return bMid - aMid;
          return Number(b["first_seen_at"] ?? 0) - Number(a["first_seen_at"] ?? 0);
        });
      } else {
        rows.sort((a, b) => Number(b["first_seen_at"] ?? 0) - Number(a["first_seen_at"] ?? 0));
      }
      if (q.includes("LIMIT ?")) {
        const hasOffset = q.includes("OFFSET ?");
        const span = hasOffset ? 2 : 1;
        if (this.boundValues.length >= span) {
          const limit = Number(this.boundValues[this.boundValues.length - span]);
          const offset = hasOffset ? Number(this.boundValues[this.boundValues.length - 1]) : 0;
          if (Number.isFinite(limit) && limit >= 0 && Number.isFinite(offset) && offset >= 0) {
            rows = rows.slice(offset, offset + limit);
          }
        }
      }
      return { results: rows as T[], success: true };
    }

    // Crawl logs queries
    if (q.includes("FROM crawl_logs")) {
      const rows = Array.from(this.db.tables.get("crawl_logs")!.values());
      rows.sort((a, b) => Number(b["created_at"] ?? 0) - Number(a["created_at"] ?? 0));
      return { results: rows as T[], success: true };
    }

    // Crawl tasks queries
    if (q.includes("FROM crawl_tasks") && (q.includes("COUNT(*)") || q.includes("SUM("))) {
      const table = this.db.tables.get("crawl_tasks")!;
      const rows = Array.from(table.values());
      const total = rows.length;
      const pending = rows.filter((r) => r["status"] === "pending").length;
      const running = rows.filter((r) => r["status"] === "running").length;
      const completed = rows.filter((r) => r["status"] === "completed").length;
      const failed = rows.filter((r) => r["status"] === "failed").length;
      const jobs_found = rows.reduce((acc, r) => acc + Number(r["jobs_found"] ?? 0), 0);
      return {
        results: [{ total, pending, running, completed, failed, jobs_found } as T],
        success: true,
      };
    }

    if (q.includes("FROM crawl_tasks") && q.includes("WHERE id = ?")) {
      const id = String(this.boundValues[0]);
      const table = this.db.tables.get("crawl_tasks")!;
      const row = table.get(id);
      return { results: row ? [row as T] : [], success: true };
    }

    if (q.includes("FROM crawl_tasks")) {
      let rows = Array.from(this.db.tables.get("crawl_tasks")!.values());
      if (q.includes("WHERE status = ?")) {
        const statusVal = String(this.boundValues[0]);
        rows = rows.filter((r) => r["status"] === statusVal);
      }
      rows.sort((a, b) => Number(b["created_at"] ?? 0) - Number(a["created_at"] ?? 0));
      return { results: rows as T[], success: true };
    }

    // Users queries
    if (q.includes("FROM users") && q.includes("COUNT(*)")) {
      const table = this.db.tables.get("users")!;
      let rows = Array.from(table.values());
      if (q.includes("WHERE role = ?")) {
        const targetRole = String(this.boundValues[0]);
        rows = rows.filter((r) => r["role"] === targetRole);
      }
      return { results: [{ count: rows.length, total: rows.length } as T], success: true };
    }

    if (q.includes("FROM users") && q.includes("WHERE id = ?")) {
      const id = String(this.boundValues[0]);
      const table = this.db.tables.get("users")!;
      const row = table.get(id);
      return { results: row ? [row as T] : [], success: true };
    }

    if (q.includes("FROM users") && q.includes("WHERE telegram_id = ?")) {
      const tgId = String(this.boundValues[0]);
      const table = this.db.tables.get("users")!;
      for (const row of table.values()) {
        if (row["telegram_id"] === tgId) {
          return { results: [row as T], success: true };
        }
      }
      return { results: [], success: true };
    }

    if (q.includes("FROM users") && q.includes("WHERE api_token = ?")) {
      const token = String(this.boundValues[0]);
      const table = this.db.tables.get("users")!;
      for (const row of table.values()) {
        if (row["api_token"] === token) {
          return { results: [row as T], success: true };
        }
      }
      return { results: [], success: true };
    }

    if (q.includes("FROM users")) {
      const table = this.db.tables.get("users")!;
      let rows = Array.from(table.values());
      if (q.includes("WHERE role = ?")) {
        const targetRole = String(this.boundValues[0]);
        rows = rows.filter((r) => r["role"] === targetRole);
      }
      rows.sort((a, b) => Number(b["created_at"] ?? 0) - Number(a["created_at"] ?? 0));
      return { results: rows as T[], success: true };
    }

    // CV versions queries
    if (q.includes("FROM cv_versions") && q.includes("WHERE cv.id = ?")) {
      const id = String(this.boundValues[0]);
      const table = this.db.tables.get("cv_versions")!;
      const row = table.get(id);
      if (!row) return { results: [], success: true };
      if (this.boundValues.length > 1 && row["user_id"] !== String(this.boundValues[1])) {
        return { results: [], success: true };
      }
      return { results: [row as T], success: true };
    }

    if (q.includes("FROM cv_versions") && q.includes("WHERE cv.user_id = ?")) {
      const userId = String(this.boundValues[0]);
      const table = this.db.tables.get("cv_versions")!;
      const rows = Array.from(table.values()).filter((r) => r["user_id"] === userId);
      rows.sort((a, b) => Number(b["updated_at"] ?? 0) - Number(a["updated_at"] ?? 0));
      return { results: rows as T[], success: true };
    }

    // Auth sessions queries
    if (q.includes("FROM auth_sessions") && q.includes("WHERE token = ?")) {
      const token = String(this.boundValues[0]);
      const table = this.db.tables.get("auth_sessions")!;
      const row = table.get(token);
      return { results: row ? [row as T] : [], success: true };
    }

    // System settings queries
    if (q.includes("FROM system_settings") && q.includes("WHERE key = ?")) {
      const key = String(this.boundValues[0]);
      const table = this.db.tables.get("system_settings")!;
      const row = table.get(key);
      return { results: row ? [row as T] : [], success: true };
    }

    if (q.includes("FROM system_settings")) {
      const rows = Array.from(this.db.tables.get("system_settings")!.values());
      return { results: rows as T[], success: true };
    }

    // LLM Feedbacks queries
    if (q.includes("FROM llm_feedbacks")) {
      const fbTable = this.db.tables.get("llm_feedbacks")!;
      let rows = Array.from(fbTable.values());

      // Enrich with users, jobs, companies
      const userTable = this.db.tables.get("users");
      const jobTable = this.db.tables.get("jobs");
      const compTable = this.db.tables.get("companies");

      rows = rows.map((r) => {
        const u = userTable?.get(String(r["user_id"]));
        const j = r["job_id"] ? jobTable?.get(String(r["job_id"])) : null;
        const c = r["company_id"] ? compTable?.get(String(r["company_id"])) : null;
        return {
          ...r,
          username: u?.["username"] || null,
          user_first_name: u?.["first_name"] || null,
          job_title: j?.["title"] || null,
          company_name: c?.["name"] || null,
        };
      });

      // Check stats summary query
      if (q.includes("COUNT(*) as total") && q.includes("SUM(CASE WHEN status = 'new'")) {
        let total = rows.length;
        let newCount = 0;
        let criticalCount = 0;
        let brokenLinkCount = 0;
        let userPrefCount = 0;
        let actionedCount = 0;

        for (const r of rows) {
          if (r["status"] === "new") newCount++;
          if (r["sentiment"] === "critical") criticalCount++;
          if (r["feedback_type"] === "broken_link") brokenLinkCount++;
          if (r["feedback_type"] === "user_preference") userPrefCount++;
          if (r["status"] === "actioned") actionedCount++;
        }

        return {
          results: [{
            total,
            new_count: newCount,
            critical_count: criticalCount,
            broken_link_count: brokenLinkCount,
            user_pref_count: userPrefCount,
            actioned_count: actionedCount,
          } as T],
          success: true,
        };
      }

      // Single item by id: WHERE fb.id = ?
      if (q.includes("WHERE fb.id = ?")) {
        const targetId = String(this.boundValues[0]);
        const found = rows.find((r) => r["id"] === targetId);
        return { results: found ? [found as T] : [], success: true };
      }

      // Filter by user_id for listByUser: WHERE fb.user_id = ?
      if (q.includes("WHERE fb.user_id = ?") && !q.includes("fb.feedback_type")) {
        const targetUserId = String(this.boundValues[0]);
        let userRows = rows.filter((r) => r["user_id"] === targetUserId);
        userRows.sort((a, b) => Number(b["created_at"] ?? 0) - Number(a["created_at"] ?? 0));
        const limitVal = typeof this.boundValues[1] === "number" ? this.boundValues[1] : 20;
        return { results: userRows.slice(0, limitVal) as T[], success: true };
      }

      // General filtered list with where clauses
      let filtered = rows;
      let bIdx = 0;
      if (q.includes("fb.user_id = ?")) {
        const uid = String(this.boundValues[bIdx++]);
        filtered = filtered.filter((r) => r["user_id"] === uid);
      }
      if (q.includes("fb.feedback_type = ?")) {
        const ft = String(this.boundValues[bIdx++]);
        filtered = filtered.filter((r) => r["feedback_type"] === ft);
      }
      if (q.includes("fb.sentiment = ?")) {
        const st = String(this.boundValues[bIdx++]);
        filtered = filtered.filter((r) => r["sentiment"] === st);
      }
      if (q.includes("fb.status = ?")) {
        const ss = String(this.boundValues[bIdx++]);
        filtered = filtered.filter((r) => r["status"] === ss);
      }
      if (q.includes("LOWER(fb.comment) LIKE ?")) {
        const searchPattern = String(this.boundValues[bIdx++] || "").replace(/%/g, "").toLowerCase();
        bIdx += 2; // skips suggested_action and context_summary bindings
        if (searchPattern) {
          filtered = filtered.filter((r) =>
            String(r["comment"] ?? "").toLowerCase().includes(searchPattern) ||
            String(r["suggested_action"] ?? "").toLowerCase().includes(searchPattern) ||
            String(r["context_summary"] ?? "").toLowerCase().includes(searchPattern)
          );
        }
      }

      if (q.includes("COUNT(*) as total")) {
        return { results: [{ total: filtered.length } as T], success: true };
      }

      filtered.sort((a, b) => Number(b["created_at"] ?? 0) - Number(a["created_at"] ?? 0));

      if (q.includes("LIMIT ? OFFSET ?")) {
        const limit = Number(this.boundValues[bIdx++] ?? 20);
        const offset = Number(this.boundValues[bIdx++] ?? 0);
        filtered = filtered.slice(offset, offset + limit);
      } else if (q.includes("LIMIT ?")) {
        const limit = Number(this.boundValues[bIdx++] ?? 20);
        filtered = filtered.slice(0, limit);
      }

      return { results: filtered as T[], success: true };
    }

    // User Subscriptions queries
    if (q.includes("FROM user_subscriptions")) {
      const table = this.db.tables.get("user_subscriptions")!;
      const rows = Array.from(table.values());

      if (q.includes("COUNT(*) as total") && q.includes("SUM(CASE WHEN is_active = 1")) {
        let active = 0;
        for (const r of rows) {
          if (Number(r["is_active"] ?? 1) === 1) active++;
        }
        return {
          results: [{ total: rows.length, active } as T],
          success: true,
        };
      }

      if (q.includes("WHERE user_id = ?")) {
        const uid = String(this.boundValues[0]);
        const matched = rows.find((r) => r["user_id"] === uid);
        return { results: matched ? [matched as T] : [], success: true };
      }

      if (q.includes("WHERE telegram_id = ?")) {
        const tgid = String(this.boundValues[0]);
        const matched = rows.find((r) => r["telegram_id"] === tgid);
        return { results: matched ? [matched as T] : [], success: true };
      }

      let filtered = rows;
      if (q.includes("WHERE is_active = 1")) {
        filtered = filtered.filter((r) => Number(r["is_active"] ?? 1) === 1);
        if (q.includes("AND frequency = ?")) {
          const freq = String(this.boundValues[0]);
          filtered = filtered.filter((r) => r["frequency"] === freq);
        }
      }

      filtered.sort((a, b) => Number(a["created_at"] ?? 0) - Number(b["created_at"] ?? 0));
      return { results: filtered as T[], success: true };
    }

    if (q.includes("FROM candidate_profiles") && q.includes("WHERE id = ?") && q.includes("user_id = ?")) {
      const [id, userId] = this.boundValues;
      const row = this.db.tables.get("candidate_profiles")!.get(String(id));
      if (row && row["user_id"] === String(userId)) return { results: [row as T], success: true };
      return { results: [], success: true };
    }

    if (q.includes("FROM candidate_profiles") && q.includes("user_id = ?")) {
      const userId = String(this.boundValues[0]);
      const rows = Array.from(this.db.tables.get("candidate_profiles")!.values()).filter((row) => row["user_id"] === userId);
      return { results: rows as T[], success: true };
    }

    if (q.includes("FROM candidate_profiles")) {
      const rows = Array.from(this.db.tables.get("candidate_profiles")!.values());
      return { results: rows as T[], success: true };
    }

    if (q.includes("FROM saved_job_filters") && q.includes("WHERE id = ?") && !q.includes("user_id = ?")) {
      const row = this.db.tables.get("saved_job_filters")!.get(String(this.boundValues[0]));
      return { results: row ? [row as T] : [], success: true };
    }

    if (q.includes("FROM saved_job_filters") && q.includes("user_id = ?")) {
      const userId = String(this.boundValues[0]);
      const rows = Array.from(this.db.tables.get("saved_job_filters")!.values()).filter((row) => row["user_id"] === userId);
      return { results: rows as T[], success: true };
    }

    if (q.includes("FROM saved_job_filters") && q.includes("is_active = 1")) {
      const rows = Array.from(this.db.tables.get("saved_job_filters")!.values()).filter((row) => Number(row["is_active"]) === 1);
      return { results: rows as T[], success: true };
    }

    if (q.includes("FROM job_quality_decisions") && q.includes("job_id = ?") && q.includes("content_hash = ?")) {
      const [jobId, contentHash, rulesetVersion] = this.boundValues;
      const rows = Array.from(this.db.tables.get("job_quality_decisions")!.values()).filter(
        (row) => row["job_id"] === String(jobId) && row["content_hash"] === String(contentHash) && row["ruleset_version"] === String(rulesetVersion)
      );
      return { results: rows as T[], success: true };
    }

    if (q.includes("FROM job_quality_decisions") && q.includes("COUNT(*)")) {
      const count = this.db.tables.get("job_quality_decisions")!.size;
      return { results: [{ count } as T], success: true };
    }

    if (q.includes("FROM match_alerts") && q.includes("alert_key = ?")) {
      const alertKey = String(this.boundValues[0]);
      const rows = Array.from(this.db.tables.get("match_alerts")!.values()).filter((row) => row["alert_key"] === alertKey);
      return { results: rows as T[], success: true };
    }

    if (q.includes("FROM match_alerts") && q.includes("job_id = ?")) {
      const jobId = String(this.boundValues[0]);
      const rows = Array.from(this.db.tables.get("match_alerts")!.values()).filter((row) => row["job_id"] === jobId);
      return { results: rows as T[], success: true };
    }

    if (q.includes("FROM match_alerts") && q.includes("user_id = ?")) {
      const userId = String(this.boundValues[0]);
      const rows = Array.from(this.db.tables.get("match_alerts")!.values()).filter((row) => row["user_id"] === userId);
      return { results: rows as T[], success: true };
    }

    return { results: [], success: true };
  }

  public async run(): Promise<ID1Response> {
    const q = this.query.trim();

    // INSERT/UPDATE companies
    if (q.includes("INTO companies")) {
      let id: unknown, domain: unknown, name: unknown, tagline: unknown, description: unknown, websiteUrl: unknown,
          logoUrl: unknown, industry: unknown, techStack: unknown, socialLinks: unknown,
          contactEmail: unknown, headcountEstimate: unknown, locationHint: unknown, discoverySource: unknown,
          fundingStage: unknown, totalFunding: unknown, valuationEstimate: unknown, companyTier: unknown,
          primaryDepartment: unknown, hiringDepartmentsJson: unknown,
          createdAt: unknown, updatedAt: unknown;

      if (this.boundValues.length >= 22) {
        [
          id, domain, name, tagline, description, websiteUrl,
          logoUrl, industry, techStack, socialLinks,
          contactEmail, headcountEstimate, locationHint, discoverySource,
          fundingStage, totalFunding, valuationEstimate, companyTier,
          primaryDepartment, hiringDepartmentsJson,
          createdAt, updatedAt
        ] = this.boundValues;
      } else {
        [
          id, domain, name, tagline, description, websiteUrl,
          logoUrl, industry, techStack, socialLinks,
          contactEmail, headcountEstimate, locationHint, discoverySource,
          createdAt, updatedAt
        ] = this.boundValues;
      }

      const record: Record<string, unknown> = {
        id: String(id),
        domain: String(domain),
        name: String(name),
        tagline: tagline ?? null,
        description: description ?? null,
        website_url: String(websiteUrl),
        logo_url: logoUrl ?? null,
        industry: industry ?? null,
        tech_stack: String(techStack),
        social_links: String(socialLinks),
        contact_email: contactEmail ?? null,
        headcount_estimate: headcountEstimate ?? null,
        location_hint: locationHint ?? null,
        discovery_source: String(discoverySource),
        funding_stage: fundingStage ?? null,
        total_funding: totalFunding ?? null,
        valuation_estimate: valuationEstimate ?? null,
        company_tier: companyTier ?? null,
        primary_department: primaryDepartment ?? null,
        hiring_departments_json: hiringDepartmentsJson ?? "{}",
        created_at: Number(createdAt),
        updated_at: Number(updatedAt),
      };

      const table = this.db.tables.get("companies")!;
      let existingId: string | null = null;
      for (const [rowId, row] of table.entries()) {
        if (row["domain"] === record["domain"]) {
          existingId = rowId;
          break;
        }
      }
      table.set(existingId ?? String(id), record);
      return { success: true };
    }

    // UPDATE companies (department weights)
    if (q.includes("UPDATE companies") && q.includes("primary_department = ?")) {
      const [primaryDept, hiringDeptsJson, updatedAt, companyId] = this.boundValues;
      const table = this.db.tables.get("companies")!;
      const row = table.get(String(companyId));
      if (row) {
        row["primary_department"] = primaryDept;
        row["hiring_departments_json"] = hiringDeptsJson;
        row["updated_at"] = updatedAt;
      }
      return { success: true };
    }

    if (q.includes("UPDATE companies SET contact_email = ?")) {
      const [contactEmail, updatedAt, companyId] = this.boundValues;
      const row = this.db.tables.get("companies")!.get(String(companyId));
      if (row) {
        row["contact_email"] = contactEmail ?? null;
        row["updated_at"] = Number(updatedAt);
      }
      return { success: true, meta: { changes: row ? 1 : 0 } };
    }

    if (q.includes("UPDATE career_pages SET url = ?, status = 'active'")) {
      const [url, checkedAt, id] = this.boundValues;
      const urlLower = String(url ?? "").toLowerCase();
      if (urlLower.includes("/cdn-cgi/") || urlLower.includes("email-protection")) {
        throw new Error("Rejected broken career_page url: Cloudflare email-protection URL is not allowed");
      }
      const row = this.db.tables.get("career_pages")!.get(String(id));
      if (row) {
        row["url"] = String(url);
        row["status"] = "active";
        row["last_checked_at"] = Number(checkedAt);
      }
      return { success: true, meta: { changes: row ? 1 : 0 } };
    }

    if (q.includes("UPDATE career_pages SET status = 'not_found'")) {
      const [checkedAt, id] = this.boundValues;
      const row = this.db.tables.get("career_pages")!.get(String(id));
      if (row) {
        row["status"] = "not_found";
        row["last_checked_at"] = Number(checkedAt);
      }
      return { success: true, meta: { changes: row ? 1 : 0 } };
    }

    if (q.includes("DELETE FROM career_pages WHERE id = ?")) {
      const id = String(this.boundValues[0]);
      const existed = this.db.tables.get("career_pages")!.delete(id);
      return { success: true, meta: { changes: existed ? 1 : 0 } };
    }

    // INSERT/UPDATE career_pages
    if (q.includes("INTO career_pages")) {
      const [id, companyId, url, pageType, status, contentHash, lastCheckedAt, createdAt] =
        this.boundValues;
      const urlLower = String(url ?? "").toLowerCase();
      if (urlLower.includes("/cdn-cgi/") || urlLower.includes("email-protection")) {
        throw new Error("Rejected broken career_page url: Cloudflare email-protection URL is not allowed");
      }

      const record: Record<string, unknown> = {
        id: String(id),
        company_id: String(companyId),
        url: String(url),
        page_type: String(pageType),
        status: String(status),
        content_hash: contentHash ?? null,
        last_checked_at: Number(lastCheckedAt),
        created_at: Number(createdAt),
      };

      const table = this.db.tables.get("career_pages")!;
      let existingId: string | null = null;
      for (const [rowId, row] of table.entries()) {
        if (row["url"] === record["url"]) {
          existingId = rowId;
          break;
        }
      }
      table.set(existingId ?? String(id), record);
      return { success: true };
    }

    // INSERT/UPDATE jobs
    if (q.includes("INTO jobs")) {
      const [
        id, companyId, careerPageId, title, department,
        seniorityLevel, techCategory, isTechRole,
        employmentType, location, isRemote, remoteScope, salaryMin, salaryMax, salaryCurrency,
        skills, descriptionSummary, rawContent, applyType, applyTarget,
        status, contentHash, firstSeenAt, lastSeenAt
      ] = this.boundValues;

      const targetLower = String(applyTarget ?? "").toLowerCase();
      if (targetLower.includes("/cdn-cgi/") || targetLower.includes("email-protection")) {
        throw new Error("Rejected broken apply_target: Cloudflare email-protection URL is not allowed");
      }

      const record: Record<string, unknown> = {
        id: String(id),
        company_id: String(companyId),
        career_page_id: String(careerPageId),
        title: String(title),
        department: department ?? null,
        seniority_level: String(seniorityLevel ?? "mid"),
        tech_category: String(techCategory ?? "fullstack"),
        is_tech_role: Number(isTechRole ?? 1),
        employment_type: String(employmentType),
        location: location ?? null,
        is_remote: Number(isRemote),
        remote_scope: String(remoteScope ?? "worldwide"),
        salary_min: (salaryMin !== undefined && salaryMin !== null) ? Number(salaryMin) : null,
        salary_max: (salaryMax !== undefined && salaryMax !== null) ? Number(salaryMax) : null,
        salary_currency: salaryCurrency ?? null,
        skills: String(skills),
        description_summary: descriptionSummary ?? null,
        raw_content: rawContent ?? null,
        apply_type: String(applyType),
        apply_target: String(applyTarget),
        status: String(status),
        content_hash: String(contentHash),
        first_seen_at: Number(firstSeenAt),
        last_seen_at: Number(lastSeenAt),
      };

      const table = this.db.tables.get("jobs")!;
      let existingId: string | null = null;
      for (const [rowId, row] of table.entries()) {
        if (row["id"] === record["id"]) {
          existingId = rowId;
          break;
        }
        if (
          record["content_hash"] &&
          record["content_hash"] !== "undefined" &&
          record["content_hash"] !== "null" &&
          row["content_hash"] === record["content_hash"]
        ) {
          existingId = rowId;
          break;
        }
      }
      table.set(existingId ?? String(id), record);
      return { success: true };
    }

    // INSERT crawl_logs
    if (q.includes("INTO crawl_logs")) {
      const [id, agentName, targetUrl, status, durationMs, message, metadata, createdAt] =
        this.boundValues;
      const record: Record<string, unknown> = {
        id: String(id),
        agent_name: String(agentName),
        target_url: String(targetUrl),
        status: String(status),
        duration_ms: Number(durationMs),
        message: String(message),
        metadata: String(metadata ?? "{}"),
        created_at: Number(createdAt),
      };
      this.db.tables.get("crawl_logs")!.set(String(id), record);
      return { success: true };
    }

    if (q.includes("UPDATE jobs SET skills = ?")) {
      const [skills, id] = this.boundValues;
      const existing = this.db.tables.get("jobs")!.get(String(id));
      if (existing) existing["skills"] = String(skills);
      return { success: true, meta: { changes: existing ? 1 : 0 } };
    }

    if (q.includes("UPDATE jobs") && q.includes("SET apply_type = ?, apply_target = ?")) {
      const [applyType, applyTarget, checkedAt, verifiedAt, id] = this.boundValues;
      const targetLower = String(applyTarget ?? "").toLowerCase();
      if (targetLower.includes("/cdn-cgi/") || targetLower.includes("email-protection")) {
        throw new Error("Rejected broken apply_target: Cloudflare email-protection URL is not allowed");
      }
      const existing = this.db.tables.get("jobs")!.get(String(id));
      if (existing) {
        existing["apply_type"] = String(applyType);
        existing["apply_target"] = String(applyTarget);
        if (q.includes("status = 'open'")) {
          existing["status"] = "open";
          existing["closed_reason"] = null;
        }
        existing["link_status"] = "ok";
        existing["link_fail_count"] = 0;
        existing["link_checked_at"] = Number(checkedAt);
        existing["last_verified_at"] = Number(verifiedAt);
      }
      return { success: true, meta: { changes: existing ? 1 : 0 } };
    }

    if (q.includes("UPDATE jobs") && q.includes("SET link_status = 'invalid', link_checked_at = ?")) {
      const [checkedAt, id] = this.boundValues;
      const existing = this.db.tables.get("jobs")!.get(String(id));
      if (existing) {
        existing["link_status"] = "invalid";
        existing["link_checked_at"] = Number(checkedAt);
      }
      return { success: true, meta: { changes: existing ? 1 : 0 } };
    }

    if (q.includes("UPDATE jobs") && q.includes("closed_reason = 'invalid_link'")) {
      const [checkedAt, id] = this.boundValues;
      const existing = this.db.tables.get("jobs")!.get(String(id));
      if (existing) {
        existing["status"] = "closed";
        existing["closed_reason"] = "invalid_link";
        existing["link_status"] = "invalid";
        existing["link_checked_at"] = Number(checkedAt);
      }
      return { success: true, meta: { changes: existing ? 1 : 0 } };
    }

    if (q.includes("UPDATE jobs SET status = 'closed', closed_reason = 'stale'")) {
      const cutoff = Number(this.boundValues[0] ?? 0);
      let changes = 0;
      for (const r of this.db.tables.get("jobs")!.values()) {
        if (r["status"] === "open" && Number(r["last_seen_at"] ?? 0) < cutoff) {
          r["status"] = "closed";
          r["closed_reason"] = "stale";
          changes++;
        }
      }
      return { success: true, meta: { changes } };
    }

    if (q.includes("UPDATE jobs SET link_status = ?")) {
      const [status, failCount, checkedAt, verified, verifiedAt, close, , id] = this.boundValues;
      const existing = this.db.tables.get("jobs")!.get(String(id));
      if (existing) {
        existing["link_status"] = String(status);
        existing["link_fail_count"] = Number(failCount);
        existing["link_checked_at"] = Number(checkedAt);
        if (Number(verified) === 1) existing["last_verified_at"] = Number(verifiedAt);
        if (Number(close) === 1) {
          existing["status"] = "closed";
          existing["closed_reason"] = "link_check";
        }
      }
      return { success: true, meta: { changes: existing ? 1 : 0 } };
    }

    // UPDATE jobs SET status = ?, last_seen_at = ? WHERE id = ?
    if (q.includes("UPDATE jobs SET status =")) {
      const [status, lastSeenAt, id] = this.boundValues;
      const table = this.db.tables.get("jobs")!;
      const existing = table.get(String(id));
      if (existing) {
        existing["status"] = String(status);
        existing["last_seen_at"] = Number(lastSeenAt);
      }
      return { success: true };
    }

    // DELETE FROM jobs WHERE id = ?
    if (q.includes("DELETE FROM jobs WHERE id = ?")) {
      const id = String(this.boundValues[0]);
      this.db.tables.get("jobs")!.delete(id);
      return { success: true };
    }

    // INSERT INTO crawl_tasks
    if (q.includes("INTO crawl_tasks")) {
      const [
        id, targetUrl, sourceType, status, companyId,
        jobsFound, errorMessage, metadata, createdAt, completedAt
      ] = this.boundValues;

      const record: Record<string, unknown> = {
        id: String(id),
        target_url: String(targetUrl),
        source_type: String(sourceType),
        status: String(status),
        company_id: companyId ? String(companyId) : null,
        jobs_found: Number(jobsFound ?? 0),
        error_message: errorMessage ? String(errorMessage) : null,
        metadata: String(metadata ?? "{}"),
        created_at: Number(createdAt),
        completed_at: completedAt ? Number(completedAt) : null,
      };

      this.db.tables.get("crawl_tasks")!.set(String(id), record);
      return { success: true };
    }

    // UPDATE crawl_tasks SET ... WHERE id = ?
    if (q.includes("UPDATE crawl_tasks SET")) {
      const table = this.db.tables.get("crawl_tasks")!;
      const id = String(this.boundValues[this.boundValues.length - 1]);
      const record = table.get(id);
      if (record) {
        let valIndex = 0;
        if (q.includes("status = ?")) {
          record["status"] = String(this.boundValues[valIndex++]);
        }
        if (q.includes("company_id = ?")) {
          const cId = this.boundValues[valIndex++];
          record["company_id"] = cId ? String(cId) : null;
        }
        if (q.includes("jobs_found = ?")) {
          record["jobs_found"] = Number(this.boundValues[valIndex++]);
        }
        if (q.includes("error_message = ?")) {
          const em = this.boundValues[valIndex++];
          record["error_message"] = em ? String(em) : null;
        }
        if (q.includes("completed_at = ?")) {
          const ca = this.boundValues[valIndex++];
          record["completed_at"] = ca ? Number(ca) : null;
        }
        if (q.includes("metadata = ?")) {
          record["metadata"] = String(this.boundValues[valIndex++]);
        }
      }
      return { success: true };
    }

    // INSERT/UPDATE users
    if (q.includes("INTO users")) {
      let id, telegramId, username, firstName, photoUrl, apiToken, role, createdAt, updatedAt;
      if (this.boundValues.length >= 9) {
        [id, telegramId, username, firstName, photoUrl, apiToken, role, createdAt, updatedAt] = this.boundValues;
      } else {
        [id, telegramId, username, firstName, photoUrl, apiToken, createdAt, updatedAt] = this.boundValues;
        role = "user";
      }
      const record: Record<string, unknown> = {
        id: String(id),
        telegram_id: String(telegramId),
        username: username ?? null,
        first_name: String(firstName),
        photo_url: photoUrl ?? null,
        api_token: String(apiToken),
        role: String(role || "user"),
        created_at: Number(createdAt),
        updated_at: Number(updatedAt),
      };
      const table = this.db.tables.get("users")!;
      let existingId: string | null = null;
      for (const [rId, r] of table.entries()) {
        if (r["telegram_id"] === record["telegram_id"]) {
          existingId = rId;
          if (r["role"] === "admin" && record["role"] !== "admin") {
            record["role"] = "admin";
          }
          break;
        }
      }
      table.set(existingId ?? String(id), record);
      return { success: true };
    }

    // UPDATE users SET role =
    if (q.includes("UPDATE users") && q.includes("SET role =")) {
      const role = String(this.boundValues[0]);
      const updatedAt = Number(this.boundValues[1]);
      const idOrTg = String(this.boundValues[2]);
      const table = this.db.tables.get("users")!;
      for (const row of table.values()) {
        if (row["id"] === idOrTg || row["telegram_id"] === idOrTg) {
          row["role"] = role;
          row["updated_at"] = updatedAt;
        }
      }
      return { success: true };
    }

    // INSERT cv_versions
    if (q.includes("INTO cv_versions")) {
      let id: unknown, userId: unknown, jobId: unknown, title: unknown;
      let targetRole: unknown, targetGroup: unknown, content: unknown;
      let skills: unknown, matchScore: unknown, tailoredNotes: unknown;
      let decisionSuggestions: unknown, createdAt: unknown, updatedAt: unknown;

      if (this.boundValues.length === 13) {
        [
          id, userId, jobId, title, targetRole, targetGroup, content,
          skills, matchScore, tailoredNotes, decisionSuggestions, createdAt, updatedAt
        ] = this.boundValues;
      } else {
        [
          id, userId, jobId, title, targetRole, content,
          skills, matchScore, tailoredNotes, createdAt, updatedAt
        ] = this.boundValues;
      }

      const record: Record<string, unknown> = {
        id: String(id),
        user_id: String(userId),
        job_id: jobId ? String(jobId) : null,
        title: String(title),
        target_role: targetRole ? String(targetRole) : null,
        target_group: targetGroup ? String(targetGroup) : null,
        content: String(content),
        skills: String(skills ?? "[]"),
        match_score: matchScore !== undefined && matchScore !== null ? Number(matchScore) : null,
        tailored_notes: tailoredNotes ? String(tailoredNotes) : null,
        decision_suggestions: decisionSuggestions ? String(decisionSuggestions) : null,
        created_at: Number(createdAt),
        updated_at: Number(updatedAt),
      };
      this.db.tables.get("cv_versions")!.set(String(id), record);
      return { success: true };
    }

    // UPDATE cv_versions SET ... WHERE id = ? AND user_id = ?
    if (q.includes("UPDATE cv_versions SET")) {
      const id = String(this.boundValues[this.boundValues.length - 2]);
      const userId = String(this.boundValues[this.boundValues.length - 1]);
      const table = this.db.tables.get("cv_versions")!;
      const row = table.get(id);
      if (row && row["user_id"] === userId) {
        let valIdx = 0;
        if (q.includes("title = ?")) row["title"] = String(this.boundValues[valIdx++]);
        if (q.includes("target_role = ?")) row["target_role"] = this.boundValues[valIdx++] ?? null;
        if (q.includes("target_group = ?")) row["target_group"] = this.boundValues[valIdx++] ?? null;
        if (q.includes("content = ?")) row["content"] = String(this.boundValues[valIdx++]);
        if (q.includes("skills = ?")) row["skills"] = String(this.boundValues[valIdx++]);
        if (q.includes("match_score = ?")) row["match_score"] = this.boundValues[valIdx++] ?? null;
        if (q.includes("tailored_notes = ?")) row["tailored_notes"] = this.boundValues[valIdx++] ?? null;
        if (q.includes("decision_suggestions = ?")) row["decision_suggestions"] = this.boundValues[valIdx++] ?? null;
        if (q.includes("job_id = ?")) row["job_id"] = this.boundValues[valIdx++] ?? null;
        row["updated_at"] = Date.now();
      }
      return { success: true };
    }

    // DELETE FROM cv_versions WHERE id = ? AND user_id = ?
    if (q.includes("DELETE FROM cv_versions WHERE id = ? AND user_id = ?")) {
      const id = String(this.boundValues[0]);
      const userId = String(this.boundValues[1]);
      const table = this.db.tables.get("cv_versions")!;
      const row = table.get(id);
      if (row && row["user_id"] === userId) {
        table.delete(id);
      }
      return { success: true, meta: { changes: 1 } };
    }

    // INSERT INTO auth_sessions
    if (q.includes("INTO auth_sessions")) {
      const [token, createdAt] = [String(this.boundValues[0]), Number(this.boundValues[1])];
      const table = this.db.tables.get("auth_sessions")!;
      const existing = table.get(token) || {};
      table.set(token, {
        ...existing,
        token,
        status: "pending",
        created_at: createdAt,
      });
      return { success: true };
    }

    // UPDATE auth_sessions
    if (q.includes("UPDATE auth_sessions")) {
      const [telegramId, apiToken, userJson, authenticatedAt, token] = this.boundValues;
      const table = this.db.tables.get("auth_sessions")!;
      const existing = table.get(String(token)) || { token: String(token), created_at: Date.now() };
      table.set(String(token), {
        ...existing,
        status: "authenticated",
        telegram_id: String(telegramId),
        api_token: String(apiToken),
        user_json: String(userJson),
        authenticated_at: Number(authenticatedAt),
      });
      return { success: true };
    }

    // INSERT / UPDATE system_settings
    if (q.includes("INTO system_settings")) {
      const [key, value, updatedAt] = this.boundValues;
      const table = this.db.tables.get("system_settings")!;
      table.set(String(key), {
        key: String(key),
        value: String(value),
        updated_at: Number(updatedAt),
      });
      return { success: true };
    }

    // DELETE FROM system_settings
    if (q.includes("DELETE FROM system_settings WHERE key = ?")) {
      const key = String(this.boundValues[0]);
      const table = this.db.tables.get("system_settings")!;
      const deleted = table.delete(key);
      return { success: true, meta: { changes: deleted ? 1 : 0 } };
    }

    // INSERT INTO llm_feedbacks
    if (q.includes("INTO llm_feedbacks")) {
      const [
        id, userId, feedbackType, sentiment, rating, comment,
        jobId, companyId, contextSummary, suggestedAction,
        metadata, status, createdAt, updatedAt
      ] = this.boundValues;

      const record: Record<string, unknown> = {
        id: String(id),
        user_id: String(userId),
        feedback_type: String(feedbackType),
        sentiment: String(sentiment || "neutral"),
        rating: rating !== undefined && rating !== null ? Number(rating) : null,
        comment: String(comment),
        job_id: jobId ? String(jobId) : null,
        company_id: companyId ? String(companyId) : null,
        context_summary: contextSummary ? String(contextSummary) : null,
        suggested_action: suggestedAction ? String(suggestedAction) : null,
        metadata: String(metadata || "{}"),
        status: String(status || "new"),
        created_at: Number(createdAt),
        updated_at: Number(updatedAt),
      };

      this.db.tables.get("llm_feedbacks")!.set(String(id), record);
      return { success: true };
    }

    // UPDATE llm_feedbacks SET status = ?, updated_at = ? WHERE id = ?
    if (q.includes("UPDATE llm_feedbacks SET status =")) {
      const [status, updatedAt, id] = this.boundValues;
      const table = this.db.tables.get("llm_feedbacks")!;
      const row = table.get(String(id));
      if (row) {
        row["status"] = String(status);
        row["updated_at"] = Number(updatedAt);
      }
      return { success: true, meta: { changes: row ? 1 : 0 } };
    }

    // DELETE FROM llm_feedbacks WHERE id = ?
    if (q.includes("DELETE FROM llm_feedbacks WHERE id = ?")) {
      const id = String(this.boundValues[0]);
      const table = this.db.tables.get("llm_feedbacks")!;
      const deleted = table.delete(id);
      return { success: true, meta: { changes: deleted ? 1 : 0 } };
    }

    // INSERT INTO user_subscriptions
    if (q.includes("INTO user_subscriptions")) {
      const [
        id, userId, telegramId, isActive, frequency,
        targetRoles, techCategories, regions, minSalary,
        lastNotifiedAt, createdAt, updatedAt
      ] = this.boundValues;

      const table = this.db.tables.get("user_subscriptions")!;
      let existingId = String(id);
      for (const [key, val] of table.entries()) {
        if (val["user_id"] === String(userId)) {
          existingId = key;
          break;
        }
      }

      const existingRecord = table.get(existingId);
      const record = {
        id: existingId,
        user_id: String(userId),
        telegram_id: String(telegramId),
        is_active: Number(isActive),
        frequency: String(frequency),
        target_roles: String(targetRoles),
        tech_categories: String(techCategories),
        regions: String(regions),
        min_salary: minSalary != null ? Number(minSalary) : null,
        last_notified_at: lastNotifiedAt != null ? Number(lastNotifiedAt) : (existingRecord ? existingRecord["last_notified_at"] : null),
        created_at: existingRecord ? existingRecord["created_at"] : Number(createdAt),
        updated_at: Number(updatedAt),
      };

      table.set(existingId, record);
      return { success: true, meta: { changes: 1 } };
    }

    // UPDATE user_subscriptions SET is_active = ?, updated_at = ? WHERE user_id = ?
    if (q.includes("UPDATE user_subscriptions SET is_active =")) {
      const [isActive, updatedAt, userId] = this.boundValues;
      const table = this.db.tables.get("user_subscriptions")!;
      let changes = 0;
      for (const [_, v] of table.entries()) {
        if (v["user_id"] === String(userId)) {
          v["is_active"] = Number(isActive);
          v["updated_at"] = Number(updatedAt);
          changes++;
        }
      }
      return { success: true, meta: { changes } };
    }

    if (q.includes("INTO candidate_profiles")) {
      const [id, userId, label, profileJson, sourceCvId, createdAt, updatedAt] = this.boundValues;
      const table = this.db.tables.get("candidate_profiles")!;
      const existing = table.get(String(id));
      table.set(String(id), {
        id: String(id),
        user_id: String(userId),
        label: String(label),
        profile_json: String(profileJson),
        source_cv_id: sourceCvId ?? null,
        created_at: existing ? existing["created_at"] : Number(createdAt),
        updated_at: Number(updatedAt),
      });
      return { success: true, meta: { changes: 1 } };
    }

    if (q.includes("DELETE FROM candidate_profiles WHERE id = ? AND user_id = ?")) {
      const [id, userId] = this.boundValues;
      const table = this.db.tables.get("candidate_profiles")!;
      const row = table.get(String(id));
      if (row && row["user_id"] === String(userId)) {
        table.delete(String(id));
        return { success: true, meta: { changes: 1 } };
      }
      return { success: true, meta: { changes: 0 } };
    }

    if (q.includes("INTO saved_job_filters")) {
      const [id, userId, profileId, filterJson, isActive, createdAt, updatedAt] = this.boundValues;
      const table = this.db.tables.get("saved_job_filters")!;
      const existing = table.get(String(id));
      table.set(String(id), {
        id: String(id),
        user_id: String(userId),
        profile_id: String(profileId),
        filter_json: String(filterJson),
        is_active: Number(isActive),
        created_at: existing ? existing["created_at"] : Number(createdAt),
        updated_at: Number(updatedAt),
      });
      return { success: true, meta: { changes: 1 } };
    }

    if (q.includes("DELETE FROM saved_job_filters WHERE id = ? AND user_id = ?")) {
      const [id, userId] = this.boundValues;
      const table = this.db.tables.get("saved_job_filters")!;
      const row = table.get(String(id));
      if (row && row["user_id"] === String(userId)) {
        table.delete(String(id));
        return { success: true, meta: { changes: 1 } };
      }
      return { success: true, meta: { changes: 0 } };
    }

    if (q.includes("INTO job_quality_decisions")) {
      const [
        id,
        jobId,
        contentHash,
        action,
        qualityScore,
        authenticity,
        sponsorshipSignal,
        rulesetVersion,
        decisionKey,
        source,
        recordJson,
        createdAt,
      ] = this.boundValues;
      const table = this.db.tables.get("job_quality_decisions")!;
      for (const row of table.values()) {
        if (row["job_id"] === String(jobId) && row["content_hash"] === String(contentHash) && row["ruleset_version"] === String(rulesetVersion)) {
          return { success: true, meta: { changes: 0 } };
        }
      }
      table.set(String(id), {
        id: String(id),
        job_id: String(jobId),
        content_hash: String(contentHash),
        action: String(action),
        quality_score: Number(qualityScore),
        authenticity: String(authenticity),
        sponsorship_signal: String(sponsorshipSignal),
        ruleset_version: String(rulesetVersion),
        decision_key: String(decisionKey),
        source: String(source),
        record_json: String(recordJson),
        created_at: Number(createdAt),
      });
      return { success: true, meta: { changes: 1 } };
    }

    if (q.includes("DELETE FROM job_quality_decisions WHERE job_id = ?")) {
      const [jobId, contentHash, rulesetVersion] = this.boundValues;
      const table = this.db.tables.get("job_quality_decisions")!;
      let changes = 0;
      for (const [key, row] of table.entries()) {
        if (row["job_id"] === String(jobId) && row["content_hash"] === String(contentHash) && row["ruleset_version"] === String(rulesetVersion)) {
          table.delete(key);
          changes += 1;
        }
      }
      return { success: true, meta: { changes } };
    }

    if (q.includes("INTO match_alerts")) {
      const [id, alertKey, userId, profileId, filterId, jobId, contentHash, score, reasonsJson, createdAt] = this.boundValues;
      const table = this.db.tables.get("match_alerts")!;
      for (const row of table.values()) {
        if (row["alert_key"] === String(alertKey)) return { success: true, meta: { changes: 0 } };
      }
      table.set(String(id), {
        id: String(id),
        alert_key: String(alertKey),
        user_id: String(userId),
        profile_id: String(profileId),
        filter_id: String(filterId),
        job_id: String(jobId),
        content_hash: String(contentHash),
        score: Number(score),
        reasons_json: String(reasonsJson),
        created_at: Number(createdAt),
      });
      return { success: true, meta: { changes: 1 } };
    }

    // UPDATE user_subscriptions SET last_notified_at = ?, updated_at = ? WHERE id = ?
    if (q.includes("UPDATE user_subscriptions SET last_notified_at =")) {
      const [lastNotifiedAt, updatedAt, id] = this.boundValues;
      const table = this.db.tables.get("user_subscriptions")!;
      const record = table.get(String(id));
      if (record) {
        record["last_notified_at"] = Number(lastNotifiedAt);
        record["updated_at"] = Number(updatedAt);
        return { success: true, meta: { changes: 1 } };
      }
      return { success: true, meta: { changes: 0 } };
    }

    return { success: true };
  }
}
