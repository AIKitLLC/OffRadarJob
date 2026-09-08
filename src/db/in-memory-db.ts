import { ID1Database, ID1PreparedStatement, ID1Result, ID1Response } from "./types.js";
import { detectUsRegion } from "./repositories.js";

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

    if (q.includes("FROM companies") && q.includes("COUNT(*)")) {
      const rows = Array.from(this.db.tables.get("companies")!.values());
      const wherePart = extractWhereClause(q);
      let filtered = rows;
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
      return { results: [{ count: filtered.length, total: filtered.length } as T], success: true };
    }

    if (q.includes("FROM companies")) {
      let rows = Array.from(this.db.tables.get("companies")!.values());
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

    // Jobs queries
    if (q.includes("FROM jobs") && q.includes("WHERE content_hash = ?")) {
      const hash = String(this.boundValues[0]);
      const table = this.db.tables.get("jobs")!;
      for (const row of table.values()) {
        if (row["content_hash"] === hash) {
          return { results: [row as T], success: true };
        }
      }
      return { results: [], success: true };
    }

    if (q.includes("FROM jobs") && q.includes("WHERE id = ?")) {
      const id = String(this.boundValues[0]);
      const table = this.db.tables.get("jobs")!;
      const row = table.get(id);
      if (row) {
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

    if (q.includes("FROM jobs")) {
      let rows = Array.from(this.db.tables.get("jobs")!.values());

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
        const searchPattern = String(this.boundValues[bindingIdx++] || "").replace(/%/g, "").toLowerCase();
        if (searchPattern) {
          rows = rows.filter((r) =>
            String(r["title"] ?? "").toLowerCase().includes(searchPattern) ||
            String(r["skills"] ?? "").toLowerCase().includes(searchPattern)
          );
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
        const remoteScope = String(r["remote_scope"] ?? "");
        const location = String(r["location"] ?? "");
        const locationHint = String(r["location_hint"] ?? "");
        return remoteScope.toLowerCase().includes("midwest") ||
          location.toLowerCase().includes("midwest") ||
          locationHint.toLowerCase().includes("midwest") ||
          /\b(Illinois|Indiana|Wisconsin|Minnesota|Ohio|Michigan|Missouri|Iowa|Kansas|Nebraska|Chicago|Indianapolis|Minneapolis|Madison|Cincinnati|Columbus|Cleveland|Detroit|Ann Arbor|Milwaukee|Saint Louis|Des Moines)\b/i.test(location) ||
          /\b(Illinois|Indiana|Wisconsin|Minnesota|Ohio|Michigan|Missouri|Iowa|Kansas|Nebraska|Chicago|Indianapolis|Minneapolis|Madison|Cincinnati|Columbus|Cleveland|Detroit|Ann Arbor|Milwaukee|Saint Louis|Des Moines)\b/i.test(locationHint) ||
          /(?:,\s*|\s+)(IL|IN|WI|MN|OH|MI|MO|IA|KS|NE|ND|SD)(?:\s+|,|$)/.test(location) ||
          /(?:,\s*|\s+)(IL|IN|WI|MN|OH|MI|MO|IA|KS|NE|ND|SD)(?:\s+|,|$)/.test(locationHint);
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

    return { results: [], success: true };
  }

  public async run(): Promise<ID1Response> {
    const q = this.query.trim();

    // INSERT/UPDATE companies
    if (q.includes("INTO companies")) {
      const [
        id, domain, name, tagline, description, websiteUrl,
        logoUrl, industry, techStack, socialLinks,
        contactEmail, headcountEstimate, locationHint, discoverySource,
        createdAt, updatedAt
      ] = this.boundValues;

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

    // INSERT/UPDATE career_pages
    if (q.includes("INTO career_pages")) {
      const [id, companyId, url, pageType, status, contentHash, lastCheckedAt, createdAt] =
        this.boundValues;

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
        if (row["content_hash"] === record["content_hash"]) {
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
      const [
        id, userId, jobId, title, targetRole, content,
        skills, matchScore, tailoredNotes, createdAt, updatedAt
      ] = this.boundValues;
      const record: Record<string, unknown> = {
        id: String(id),
        user_id: String(userId),
        job_id: jobId ? String(jobId) : null,
        title: String(title),
        target_role: targetRole ? String(targetRole) : null,
        content: String(content),
        skills: String(skills ?? "[]"),
        match_score: matchScore !== undefined && matchScore !== null ? Number(matchScore) : null,
        tailored_notes: tailoredNotes ? String(tailoredNotes) : null,
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
        if (q.includes("content = ?")) row["content"] = String(this.boundValues[valIdx++]);
        if (q.includes("skills = ?")) row["skills"] = String(this.boundValues[valIdx++]);
        if (q.includes("match_score = ?")) row["match_score"] = this.boundValues[valIdx++] ?? null;
        if (q.includes("tailored_notes = ?")) row["tailored_notes"] = this.boundValues[valIdx++] ?? null;
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

    return { success: true };
  }
}
