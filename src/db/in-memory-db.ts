import { ID1Database, ID1PreparedStatement, ID1Result, ID1Response } from "./types.js";

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

    if (q.includes("FROM companies") && q.includes("COUNT(*)")) {
      const count = this.db.tables.get("companies")!.size;
      return { results: [{ count } as T], success: true };
    }

    if (q.includes("FROM companies")) {
      const rows = Array.from(this.db.tables.get("companies")!.values());
      rows.sort((a, b) => Number(b["updated_at"] ?? 0) - Number(a["updated_at"] ?? 0));
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
      return { results: row ? [row as T] : [], success: true };
    }

    if (q.includes("FROM jobs") && q.includes("COUNT(*)")) {
      const count = this.db.tables.get("jobs")!.size;
      return { results: [{ count } as T], success: true };
    }

    if (q.includes("FROM jobs")) {
      let rows = Array.from(this.db.tables.get("jobs")!.values());

      if (q.includes("is_tech_role = 1")) {
        rows = rows.filter((r) => Number(r["is_tech_role"] ?? 1) === 1);
      }
      if (q.includes("seniority_level = ?")) {
        const gradeVal = String(this.boundValues[0]);
        rows = rows.filter((r) => r["seniority_level"] === gradeVal);
      }
      if (q.includes("tech_category = ?")) {
        const catVal = String(this.boundValues[this.boundValues.length - 2]);
        rows = rows.filter((r) => r["tech_category"] === catVal);
      }

      rows.sort((a, b) => Number(b["first_seen_at"] ?? 0) - Number(a["first_seen_at"] ?? 0));
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

    return { success: true };
  }
}
