import { ID1Database } from "./types.js";
import {
  Company,
  CompanySchema,
  CareerPage,
  CareerPageSchema,
  Job,
  JobSchema,
  CrawlLog,
  CrawlLogSchema,
  CrawlTask,
  CrawlTaskSchema,
  CrawlTaskStatus,
  User,
  CvVersion,
} from "../types/domain.js";

export const MIDWEST_COMPANY_SQL_CONDITION = `(
  COALESCE(location_hint, '') LIKE '%midwest%' 
  OR COALESCE(location_hint, '') LIKE '%illinois%' 
  OR COALESCE(location_hint, '') LIKE '%indiana%' 
  OR COALESCE(location_hint, '') LIKE '%wisconsin%' 
  OR COALESCE(location_hint, '') LIKE '%minnesota%' 
  OR COALESCE(location_hint, '') LIKE '%ohio%' 
  OR COALESCE(location_hint, '') LIKE '%michigan%' 
  OR COALESCE(location_hint, '') LIKE '%missouri%' 
  OR COALESCE(location_hint, '') LIKE '%iowa%' 
  OR COALESCE(location_hint, '') LIKE '%kansas%' 
  OR COALESCE(location_hint, '') LIKE '%nebraska%' 
  OR COALESCE(location_hint, '') LIKE '%chicago%' 
  OR COALESCE(location_hint, '') LIKE '%indianapolis%' 
  OR COALESCE(location_hint, '') LIKE '%minneapolis%' 
  OR COALESCE(location_hint, '') LIKE '%madison%' 
  OR COALESCE(location_hint, '') LIKE '%cincinnati%' 
  OR COALESCE(location_hint, '') LIKE '%columbus%' 
  OR COALESCE(location_hint, '') LIKE '%cleveland%' 
  OR COALESCE(location_hint, '') LIKE '%detroit%' 
  OR COALESCE(location_hint, '') LIKE '%ann arbor%' 
  OR COALESCE(location_hint, '') LIKE '%milwaukee%' 
  OR COALESCE(location_hint, '') LIKE '%st. louis%' 
  OR (' ' || COALESCE(location_hint, '') || ' ') LIKE '%, il %'
  OR (' ' || COALESCE(location_hint, '') || ' ') LIKE '%, in %'
  OR (' ' || COALESCE(location_hint, '') || ' ') LIKE '%, wi %'
  OR (' ' || COALESCE(location_hint, '') || ' ') LIKE '%, mn %'
  OR (' ' || COALESCE(location_hint, '') || ' ') LIKE '%, oh %'
  OR (' ' || COALESCE(location_hint, '') || ' ') LIKE '%, mi %'
  OR (' ' || COALESCE(location_hint, '') || ' ') LIKE '%, mo %'
  OR (' ' || COALESCE(location_hint, '') || ' ') LIKE '%, ia %'
  OR (' ' || COALESCE(location_hint, '') || ' ') LIKE '%, ks %'
  OR (' ' || COALESCE(location_hint, '') || ' ') LIKE '%, ne %'
  OR (' ' || COALESCE(location_hint, '') || ' ') LIKE '%, il,%'
  OR (' ' || COALESCE(location_hint, '') || ' ') LIKE '%, in,%'
  OR (' ' || COALESCE(location_hint, '') || ' ') LIKE '%, wi,%'
  OR (' ' || COALESCE(location_hint, '') || ' ') LIKE '%, mn,%'
  OR (' ' || COALESCE(location_hint, '') || ' ') LIKE '%, oh,%'
  OR (' ' || COALESCE(location_hint, '') || ' ') LIKE '%, mi,%'
  OR (' ' || COALESCE(location_hint, '') || ' ') LIKE '%, mo,%'
  OR (' ' || COALESCE(location_hint, '') || ' ') LIKE '%, ia,%'
)`;

export class CompanyRepository {
  constructor(private readonly db: ID1Database) {}

  public async upsert(company: Company): Promise<void> {
    const query = `
      INSERT INTO companies (
        id, domain, name, tagline, description, website_url,
        logo_url, industry, tech_stack, social_links,
        contact_email, headcount_estimate, location_hint, discovery_source,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(domain) DO UPDATE SET
        name = excluded.name,
        tagline = COALESCE(excluded.tagline, companies.tagline),
        description = COALESCE(excluded.description, companies.description),
        website_url = excluded.website_url,
        logo_url = COALESCE(excluded.logo_url, companies.logo_url),
        industry = COALESCE(excluded.industry, companies.industry),
        tech_stack = excluded.tech_stack,
        social_links = excluded.social_links,
        contact_email = COALESCE(excluded.contact_email, companies.contact_email),
        headcount_estimate = COALESCE(excluded.headcount_estimate, companies.headcount_estimate),
        location_hint = COALESCE(excluded.location_hint, companies.location_hint),
        updated_at = excluded.updated_at
    `;

    await this.db
      .prepare(query)
      .bind(
        company.id,
        company.domain,
        company.name,
        company.tagline ?? null,
        company.description ?? null,
        company.websiteUrl,
        company.logoUrl ?? null,
        company.industry ?? null,
        JSON.stringify(company.techStack),
        JSON.stringify(company.socialLinks),
        company.contactEmail ?? null,
        company.headcountEstimate ?? null,
        company.locationHint ?? null,
        company.discoverySource,
        company.createdAt,
        company.updatedAt
      )
      .run();
  }

  public async findByDomain(domain: string): Promise<Company | null> {
    const row = await this.db
      .prepare("SELECT * FROM companies WHERE domain = ? LIMIT 1")
      .bind(domain)
      .first<Record<string, unknown>>();

    if (!row) return null;
    return this.mapRowToCompany(row);
  }

  public async findById(id: string): Promise<Company | null> {
    const row = await this.db
      .prepare("SELECT * FROM companies WHERE id = ? LIMIT 1")
      .bind(id)
      .first<Record<string, unknown>>();

    if (!row) return null;
    return this.mapRowToCompany(row);
  }

  public async list(limit = 50): Promise<Company[]> {
    const res = await this.db
      .prepare("SELECT * FROM companies ORDER BY updated_at DESC LIMIT ?")
      .bind(limit)
      .all<Record<string, unknown>>();

    return (res.results ?? []).map((r) => this.mapRowToCompany(r));
  }

  public async listPaged(options: {
    page?: number | undefined;
    limit?: number | undefined;
    search?: string | undefined;
  } = {}): Promise<{
    items: Company[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  }> {
    const page = Math.max(1, options.page ?? 1);
    const limit = Math.min(Math.max(1, options.limit ?? 30), 100);
    const offset = (page - 1) * limit;
    const search = options.search?.trim() ? `%${options.search.trim().toLowerCase()}%` : null;

    let whereClause = "WHERE 1=1";
    const bindings: unknown[] = [];

    if (search) {
      whereClause += " AND (LOWER(name) LIKE ? OR LOWER(domain) LIKE ? OR LOWER(COALESCE(industry, '')) LIKE ? OR LOWER(tech_stack) LIKE ?)";
      bindings.push(search, search, search, search);
    }

    const countSql = `SELECT COUNT(*) as total FROM companies ${whereClause}`;
    const itemsSql = `
      SELECT *, 
        (CASE WHEN ${MIDWEST_COMPANY_SQL_CONDITION} THEN 1 ELSE 0 END) AS is_midwest_priority 
      FROM companies 
      ${whereClause} 
      ORDER BY is_midwest_priority DESC, updated_at DESC 
      LIMIT ? OFFSET ?
    `;

    const [countRes, itemsRes] = await Promise.all([
      this.db.prepare(countSql).bind(...bindings).first<{ total: number }>(),
      this.db.prepare(itemsSql).bind(...bindings, limit, offset).all<Record<string, unknown>>(),
    ]);

    const total = Number(countRes?.total ?? 0);
    const totalPages = Math.ceil(total / limit) || 1;
    const items = (itemsRes.results ?? []).map((r) => this.mapRowToCompany(r));

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  public async count(): Promise<number> {
    const res = await this.db
      .prepare("SELECT COUNT(*) as count FROM companies")
      .first<{ count: number }>();
    return res?.count ?? 0;
  }

  private mapRowToCompany(row: Record<string, unknown>): Company {
    let techStack: string[] = [];
    try {
      techStack = typeof row["tech_stack"] === "string" ? JSON.parse(row["tech_stack"] as string) : [];
    } catch {}
    let socialLinks: Record<string, string> = {};
    try {
      socialLinks = typeof row["social_links"] === "string" ? JSON.parse(row["social_links"] as string) : {};
    } catch {}

    return {
      id: String(row["id"]),
      domain: String(row["domain"]),
      name: String(row["name"]),
      tagline: row["tagline"] != null ? String(row["tagline"]) : undefined,
      description: row["description"] != null ? String(row["description"]) : undefined,
      websiteUrl: String(row["website_url"]),
      logoUrl: row["logo_url"] != null ? String(row["logo_url"]) : undefined,
      industry: row["industry"] != null ? String(row["industry"]) : undefined,
      techStack,
      socialLinks,
      contactEmail: row["contact_email"] != null ? String(row["contact_email"]) : undefined,
      headcountEstimate: row["headcount_estimate"] != null ? String(row["headcount_estimate"]) : undefined,
      locationHint: row["location_hint"] != null ? String(row["location_hint"]) : undefined,
      discoverySource: String(row["discovery_source"] ?? "seed"),
      isMidwest: Number(row["is_midwest_priority"] ?? 0) === 1 || 
        (row["location_hint"] != null && (
          /\b(Illinois|Indiana|Wisconsin|Minnesota|Ohio|Michigan|Missouri|Iowa|Kansas|Nebraska|Chicago|Indianapolis|Minneapolis|Madison|Cincinnati|Columbus|Cleveland|Detroit|Ann Arbor|Milwaukee|Saint Louis|Des Moines|Midwest)\b/i.test(String(row["location_hint"])) ||
          /(?:,\s*|\s+)(IL|IN|WI|MN|OH|MI|MO|IA|KS|NE|ND|SD)(?:\s+|,|$)/.test(String(row["location_hint"]))
        )),
      createdAt: Number(row["created_at"]),
      updatedAt: Number(row["updated_at"]),
    };
  }
}

export class CareerPageRepository {
  constructor(private readonly db: ID1Database) {}

  public async upsert(page: CareerPage): Promise<void> {
    const query = `
      INSERT INTO career_pages (
        id, company_id, url, page_type, status, content_hash,
        last_checked_at, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(url) DO UPDATE SET
        status = excluded.status,
        content_hash = COALESCE(excluded.content_hash, career_pages.content_hash),
        last_checked_at = excluded.last_checked_at
    `;

    await this.db
      .prepare(query)
      .bind(
        page.id,
        page.companyId,
        page.url,
        page.pageType,
        page.status,
        page.contentHash ?? null,
        page.lastCheckedAt,
        page.createdAt
      )
      .run();
  }

  public async findByUrl(url: string): Promise<CareerPage | null> {
    const row = await this.db
      .prepare("SELECT * FROM career_pages WHERE url = ? LIMIT 1")
      .bind(url)
      .first<Record<string, unknown>>();

    if (!row) return null;
    return this.mapRowToCareerPage(row);
  }

  public async findByCompanyId(companyId: string): Promise<CareerPage[]> {
    const res = await this.db
      .prepare("SELECT * FROM career_pages WHERE company_id = ?")
      .bind(companyId)
      .all<Record<string, unknown>>();

    return (res.results ?? []).map((r) => this.mapRowToCareerPage(r));
  }

  private mapRowToCareerPage(row: Record<string, unknown>): CareerPage {
    return {
      id: String(row["id"]),
      companyId: String(row["company_id"]),
      url: String(row["url"]),
      pageType: (row["page_type"] as any) ?? "internal_page",
      status: (row["status"] as any) ?? "active",
      contentHash: row["content_hash"] != null ? String(row["content_hash"]) : undefined,
      lastCheckedAt: Number(row["last_checked_at"]),
      createdAt: Number(row["created_at"]),
    };
  }
}

export const MIDWEST_SQL_CONDITION = `(
  (COALESCE(j.location, '') || ' ' || COALESCE(c.location_hint, '') || ' ' || COALESCE(j.remote_scope, '') || ' ') LIKE '%midwest%'
  OR (COALESCE(j.location, '') || ' ' || COALESCE(c.location_hint, '') || ' ' || COALESCE(j.remote_scope, '') || ' ') LIKE '%illinois%'
  OR (COALESCE(j.location, '') || ' ' || COALESCE(c.location_hint, '') || ' ' || COALESCE(j.remote_scope, '') || ' ') LIKE '%indiana%'
  OR (COALESCE(j.location, '') || ' ' || COALESCE(c.location_hint, '') || ' ' || COALESCE(j.remote_scope, '') || ' ') LIKE '%wisconsin%'
  OR (COALESCE(j.location, '') || ' ' || COALESCE(c.location_hint, '') || ' ' || COALESCE(j.remote_scope, '') || ' ') LIKE '%minnesota%'
  OR (COALESCE(j.location, '') || ' ' || COALESCE(c.location_hint, '') || ' ' || COALESCE(j.remote_scope, '') || ' ') LIKE '%ohio%'
  OR (COALESCE(j.location, '') || ' ' || COALESCE(c.location_hint, '') || ' ' || COALESCE(j.remote_scope, '') || ' ') LIKE '%michigan%'
  OR (COALESCE(j.location, '') || ' ' || COALESCE(c.location_hint, '') || ' ' || COALESCE(j.remote_scope, '') || ' ') LIKE '%missouri%'
  OR (COALESCE(j.location, '') || ' ' || COALESCE(c.location_hint, '') || ' ' || COALESCE(j.remote_scope, '') || ' ') LIKE '%iowa%'
  OR (COALESCE(j.location, '') || ' ' || COALESCE(c.location_hint, '') || ' ' || COALESCE(j.remote_scope, '') || ' ') LIKE '%kansas%'
  OR (COALESCE(j.location, '') || ' ' || COALESCE(c.location_hint, '') || ' ' || COALESCE(j.remote_scope, '') || ' ') LIKE '%nebraska%'
  OR (COALESCE(j.location, '') || ' ' || COALESCE(c.location_hint, '') || ' ' || COALESCE(j.remote_scope, '') || ' ') LIKE '%chicago%'
  OR (COALESCE(j.location, '') || ' ' || COALESCE(c.location_hint, '') || ' ' || COALESCE(j.remote_scope, '') || ' ') LIKE '%indianapolis%'
  OR (COALESCE(j.location, '') || ' ' || COALESCE(c.location_hint, '') || ' ' || COALESCE(j.remote_scope, '') || ' ') LIKE '%minneapolis%'
  OR (COALESCE(j.location, '') || ' ' || COALESCE(c.location_hint, '') || ' ' || COALESCE(j.remote_scope, '') || ' ') LIKE '%madison%'
  OR (COALESCE(j.location, '') || ' ' || COALESCE(c.location_hint, '') || ' ' || COALESCE(j.remote_scope, '') || ' ') LIKE '%cincinnati%'
  OR (COALESCE(j.location, '') || ' ' || COALESCE(c.location_hint, '') || ' ' || COALESCE(j.remote_scope, '') || ' ') LIKE '%columbus%'
  OR (COALESCE(j.location, '') || ' ' || COALESCE(c.location_hint, '') || ' ' || COALESCE(j.remote_scope, '') || ' ') LIKE '%cleveland%'
  OR (COALESCE(j.location, '') || ' ' || COALESCE(c.location_hint, '') || ' ' || COALESCE(j.remote_scope, '') || ' ') LIKE '%detroit%'
  OR (COALESCE(j.location, '') || ' ' || COALESCE(c.location_hint, '') || ' ' || COALESCE(j.remote_scope, '') || ' ') LIKE '%ann arbor%'
  OR (COALESCE(j.location, '') || ' ' || COALESCE(c.location_hint, '') || ' ' || COALESCE(j.remote_scope, '') || ' ') LIKE '%milwaukee%'
  OR (COALESCE(j.location, '') || ' ' || COALESCE(c.location_hint, '') || ' ' || COALESCE(j.remote_scope, '') || ' ') LIKE '%st. louis%'
  OR (COALESCE(j.location, '') || ' ' || COALESCE(c.location_hint, '') || ' ' || COALESCE(j.remote_scope, '') || ' ') LIKE '%, il %'
  OR (COALESCE(j.location, '') || ' ' || COALESCE(c.location_hint, '') || ' ' || COALESCE(j.remote_scope, '') || ' ') LIKE '%, in %'
  OR (COALESCE(j.location, '') || ' ' || COALESCE(c.location_hint, '') || ' ' || COALESCE(j.remote_scope, '') || ' ') LIKE '%, wi %'
  OR (COALESCE(j.location, '') || ' ' || COALESCE(c.location_hint, '') || ' ' || COALESCE(j.remote_scope, '') || ' ') LIKE '%, mn %'
  OR (COALESCE(j.location, '') || ' ' || COALESCE(c.location_hint, '') || ' ' || COALESCE(j.remote_scope, '') || ' ') LIKE '%, oh %'
  OR (COALESCE(j.location, '') || ' ' || COALESCE(c.location_hint, '') || ' ' || COALESCE(j.remote_scope, '') || ' ') LIKE '%, mi %'
  OR (COALESCE(j.location, '') || ' ' || COALESCE(c.location_hint, '') || ' ' || COALESCE(j.remote_scope, '') || ' ') LIKE '%, mo %'
  OR (COALESCE(j.location, '') || ' ' || COALESCE(c.location_hint, '') || ' ' || COALESCE(j.remote_scope, '') || ' ') LIKE '%, ia %'
  OR (COALESCE(j.location, '') || ' ' || COALESCE(c.location_hint, '') || ' ' || COALESCE(j.remote_scope, '') || ' ') LIKE '%, ks %'
  OR (COALESCE(j.location, '') || ' ' || COALESCE(c.location_hint, '') || ' ' || COALESCE(j.remote_scope, '') || ' ') LIKE '%, ne %'
  OR (COALESCE(j.location, '') || ' ' || COALESCE(c.location_hint, '') || ' ' || COALESCE(j.remote_scope, '') || ' ') LIKE '%, il,%'
  OR (COALESCE(j.location, '') || ' ' || COALESCE(c.location_hint, '') || ' ' || COALESCE(j.remote_scope, '') || ' ') LIKE '%, in,%'
  OR (COALESCE(j.location, '') || ' ' || COALESCE(c.location_hint, '') || ' ' || COALESCE(j.remote_scope, '') || ' ') LIKE '%, wi,%'
  OR (COALESCE(j.location, '') || ' ' || COALESCE(c.location_hint, '') || ' ' || COALESCE(j.remote_scope, '') || ' ') LIKE '%, mn,%'
  OR (COALESCE(j.location, '') || ' ' || COALESCE(c.location_hint, '') || ' ' || COALESCE(j.remote_scope, '') || ' ') LIKE '%, oh,%'
  OR (COALESCE(j.location, '') || ' ' || COALESCE(c.location_hint, '') || ' ' || COALESCE(j.remote_scope, '') || ' ') LIKE '%, mi,%'
  OR (COALESCE(j.location, '') || ' ' || COALESCE(c.location_hint, '') || ' ' || COALESCE(j.remote_scope, '') || ' ') LIKE '%, mo,%'
  OR (COALESCE(j.location, '') || ' ' || COALESCE(c.location_hint, '') || ' ' || COALESCE(j.remote_scope, '') || ' ') LIKE '%, ia,%'
)`;

export class JobRepository {
  constructor(private readonly db: ID1Database) {}

  public async upsert(job: Job): Promise<void> {
    const query = `
      INSERT INTO jobs (
        id, company_id, career_page_id, title, department,
        seniority_level, tech_category, is_tech_role,
        employment_type, location, is_remote, remote_scope,
        salary_min, salary_max, salary_currency, skills,
        description_summary, raw_content, apply_type, apply_target,
        status, content_hash, first_seen_at, last_seen_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(content_hash) DO UPDATE SET
        title = excluded.title,
        seniority_level = excluded.seniority_level,
        tech_category = excluded.tech_category,
        is_tech_role = excluded.is_tech_role,
        status = excluded.status,
        last_seen_at = excluded.last_seen_at,
        description_summary = COALESCE(excluded.description_summary, jobs.description_summary),
        apply_target = excluded.apply_target
    `;

    await this.db
      .prepare(query)
      .bind(
        job.id,
        job.companyId,
        job.careerPageId,
        job.title,
        job.department ?? null,
        job.seniorityLevel,
        job.techCategory,
        job.isTechRole ? 1 : 0,
        job.employmentType,
        job.location ?? null,
        job.isRemote ? 1 : 0,
        job.remoteScope,
        job.salaryMin ?? null,
        job.salaryMax ?? null,
        job.salaryCurrency ?? null,
        JSON.stringify(job.skills),
        job.descriptionSummary ?? null,
        job.rawContent ?? null,
        job.applyType,
        job.applyTarget,
        job.status,
        job.contentHash,
        job.firstSeenAt,
        job.lastSeenAt
      )
      .run();
  }

  public async findByContentHash(hash: string): Promise<Job | null> {
    const row = await this.db
      .prepare("SELECT * FROM jobs WHERE content_hash = ? LIMIT 1")
      .bind(hash)
      .first<Record<string, unknown>>();

    if (!row) return null;
    return this.mapRowToJob(row);
  }

  public async getById(id: string): Promise<Job | null> {
    const row = await this.db
      .prepare("SELECT * FROM jobs WHERE id = ? LIMIT 1")
      .bind(id)
      .first<Record<string, unknown>>();

    if (!row) return null;
    return this.mapRowToJob(row);
  }

  public async updateStatus(id: string, status: "open" | "closed"): Promise<void> {
    await this.db
      .prepare("UPDATE jobs SET status = ?, last_seen_at = ? WHERE id = ?")
      .bind(status, Date.now(), id)
      .run();
  }

  public async delete(id: string): Promise<void> {
    await this.db
      .prepare("DELETE FROM jobs WHERE id = ?")
      .bind(id)
      .run();
  }

  public async list(options: {
    limit?: number | undefined;
    offset?: number | undefined;
    grade?: string | undefined;
    techCategory?: string | undefined;
    region?: string | undefined;
    techOnly?: boolean | undefined;
    search?: string | undefined;
  } = {}): Promise<Job[]> {
    const limit = options.limit ?? 50;
    const offset = options.offset ?? 0;
    const grade = options.grade && options.grade !== "all" ? options.grade : null;
    const techCategory = options.techCategory && options.techCategory !== "all" ? options.techCategory : null;
    const region = options.region && options.region !== "all" ? options.region : null;
    const techOnly = options.techOnly !== false ? 1 : 0;
    const search = options.search?.trim() ? `%${options.search.trim().toLowerCase()}%` : null;

    let query = "SELECT j.*, c.name AS company_name, c.website_url AS company_website FROM jobs j LEFT JOIN companies c ON j.company_id = c.id WHERE 1=1";
    const bindings: unknown[] = [];

    if (techOnly === 1) {
      query += " AND j.is_tech_role = 1";
    }
    if (grade) {
      query += " AND j.seniority_level = ?";
      bindings.push(grade);
    }
    if (techCategory) {
      query += " AND j.tech_category = ?";
      bindings.push(techCategory);
    }
    if (region === "midwest") {
      query += " AND (j.remote_scope LIKE '%midwest%' OR j.location LIKE '%Midwest%' OR j.location LIKE '%IN%' OR j.location LIKE '%IL%' OR j.location LIKE '%WI%' OR j.location LIKE '%MN%' OR j.location LIKE '%OH%')";
    } else if (region === "remote") {
      query += " AND j.is_remote = 1";
    }
    if (search) {
      query += " AND (LOWER(j.title) LIKE ? OR LOWER(COALESCE(c.name, '')) LIKE ? OR LOWER(j.skills) LIKE ? OR LOWER(COALESCE(j.location, '')) LIKE ? OR LOWER(COALESCE(j.department, '')) LIKE ?)";
      bindings.push(search, search, search, search, search);
    }

    query += " ORDER BY j.first_seen_at DESC LIMIT ? OFFSET ?";
    bindings.push(limit, offset);

    const stmt = this.db.prepare(query);
    const res = await stmt.bind(...bindings).all<Record<string, unknown>>();

    return (res.results ?? []).map((r) => this.mapRowToJob(r));
  }

  public async listPaged(options: {
    page?: number | undefined;
    limit?: number | undefined;
    grade?: string | undefined;
    techCategory?: string | undefined;
    region?: string | undefined;
    techOnly?: boolean | undefined;
    search?: string | undefined;
  } = {}): Promise<{
    items: Job[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  }> {
    const page = Math.max(1, options.page ?? 1);
    const limit = Math.min(Math.max(1, options.limit ?? 30), 100);
    const offset = (page - 1) * limit;

    const grade = options.grade && options.grade !== "all" ? options.grade : null;
    const techCategory = options.techCategory && options.techCategory !== "all" ? options.techCategory : null;
    const region = options.region && options.region !== "all" ? options.region : null;
    const techOnly = options.techOnly !== false ? 1 : 0;
    const search = options.search?.trim() ? `%${options.search.trim().toLowerCase()}%` : null;

    let whereClause = "WHERE 1=1";
    const bindings: unknown[] = [];

    if (techOnly === 1) {
      whereClause += " AND j.is_tech_role = 1";
    }
    if (grade) {
      whereClause += " AND j.seniority_level = ?";
      bindings.push(grade);
    }
    if (techCategory) {
      whereClause += " AND j.tech_category = ?";
      bindings.push(techCategory);
    }
    if (region === "midwest") {
      whereClause += ` AND ${MIDWEST_SQL_CONDITION}`;
    } else if (region === "remote") {
      whereClause += " AND j.is_remote = 1";
    }
    if (search) {
      whereClause += " AND (LOWER(j.title) LIKE ? OR LOWER(COALESCE(c.name, '')) LIKE ? OR LOWER(j.skills) LIKE ? OR LOWER(COALESCE(j.location, '')) LIKE ? OR LOWER(COALESCE(j.department, '')) LIKE ?)";
      bindings.push(search, search, search, search, search);
    }

    const countSql = `SELECT COUNT(*) as total FROM jobs j LEFT JOIN companies c ON j.company_id = c.id ${whereClause}`;
    const itemsSql = `
      SELECT j.*, c.name AS company_name, c.website_url AS company_website,
        (CASE WHEN ${MIDWEST_SQL_CONDITION} THEN 1 ELSE 0 END) AS is_midwest_match
      FROM jobs j 
      LEFT JOIN companies c ON j.company_id = c.id 
      ${whereClause} 
      ORDER BY is_midwest_match DESC, j.first_seen_at DESC 
      LIMIT ? OFFSET ?
    `;

    const [countRes, itemsRes] = await Promise.all([
      this.db.prepare(countSql).bind(...bindings).first<{ total: number }>(),
      this.db.prepare(itemsSql).bind(...bindings, limit, offset).all<Record<string, unknown>>(),
    ]);

    const total = Number(countRes?.total ?? 0);
    const totalPages = Math.ceil(total / limit) || 1;
    const items = (itemsRes.results ?? []).map((r) => this.mapRowToJob(r));

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  public async getStatsSummary(): Promise<{
    seniorCount: number;
    midwestCount: number;
    total: number;
  }> {
    const res = await this.db
      .prepare(`
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN seniority_level IN ('senior', 'founding', 'lead') THEN 1 ELSE 0 END) as senior_count,
          SUM(CASE WHEN (
            (COALESCE(location, '') || ' ' || COALESCE(remote_scope, '') || ' ') LIKE '%midwest%'
            OR (COALESCE(location, '') || ' ' || COALESCE(remote_scope, '') || ' ') LIKE '%illinois%'
            OR (COALESCE(location, '') || ' ' || COALESCE(remote_scope, '') || ' ') LIKE '%indiana%'
            OR (COALESCE(location, '') || ' ' || COALESCE(remote_scope, '') || ' ') LIKE '%wisconsin%'
            OR (COALESCE(location, '') || ' ' || COALESCE(remote_scope, '') || ' ') LIKE '%minnesota%'
            OR (COALESCE(location, '') || ' ' || COALESCE(remote_scope, '') || ' ') LIKE '%ohio%'
            OR (COALESCE(location, '') || ' ' || COALESCE(remote_scope, '') || ' ') LIKE '%michigan%'
            OR (COALESCE(location, '') || ' ' || COALESCE(remote_scope, '') || ' ') LIKE '%missouri%'
            OR (COALESCE(location, '') || ' ' || COALESCE(remote_scope, '') || ' ') LIKE '%iowa%'
            OR (COALESCE(location, '') || ' ' || COALESCE(remote_scope, '') || ' ') LIKE '%kansas%'
            OR (COALESCE(location, '') || ' ' || COALESCE(remote_scope, '') || ' ') LIKE '%nebraska%'
            OR (COALESCE(location, '') || ' ' || COALESCE(remote_scope, '') || ' ') LIKE '%chicago%'
            OR (COALESCE(location, '') || ' ' || COALESCE(remote_scope, '') || ' ') LIKE '%indianapolis%'
            OR (COALESCE(location, '') || ' ' || COALESCE(remote_scope, '') || ' ') LIKE '%minneapolis%'
            OR (COALESCE(location, '') || ' ' || COALESCE(remote_scope, '') || ' ') LIKE '%madison%'
            OR (COALESCE(location, '') || ' ' || COALESCE(remote_scope, '') || ' ') LIKE '%cincinnati%'
            OR (COALESCE(location, '') || ' ' || COALESCE(remote_scope, '') || ' ') LIKE '%columbus%'
            OR (COALESCE(location, '') || ' ' || COALESCE(remote_scope, '') || ' ') LIKE '%cleveland%'
            OR (COALESCE(location, '') || ' ' || COALESCE(remote_scope, '') || ' ') LIKE '%detroit%'
            OR (COALESCE(location, '') || ' ' || COALESCE(remote_scope, '') || ' ') LIKE '%ann arbor%'
            OR (COALESCE(location, '') || ' ' || COALESCE(remote_scope, '') || ' ') LIKE '%milwaukee%'
            OR (COALESCE(location, '') || ' ' || COALESCE(remote_scope, '') || ' ') LIKE '%st. louis%'
            OR (COALESCE(location, '') || ' ' || COALESCE(remote_scope, '') || ' ') LIKE '%, il %'
            OR (COALESCE(location, '') || ' ' || COALESCE(remote_scope, '') || ' ') LIKE '%, in %'
            OR (COALESCE(location, '') || ' ' || COALESCE(remote_scope, '') || ' ') LIKE '%, wi %'
            OR (COALESCE(location, '') || ' ' || COALESCE(remote_scope, '') || ' ') LIKE '%, mn %'
            OR (COALESCE(location, '') || ' ' || COALESCE(remote_scope, '') || ' ') LIKE '%, oh %'
            OR (COALESCE(location, '') || ' ' || COALESCE(remote_scope, '') || ' ') LIKE '%, mi %'
            OR (COALESCE(location, '') || ' ' || COALESCE(remote_scope, '') || ' ') LIKE '%, mo %'
            OR (COALESCE(location, '') || ' ' || COALESCE(remote_scope, '') || ' ') LIKE '%, ia %'
            OR (COALESCE(location, '') || ' ' || COALESCE(remote_scope, '') || ' ') LIKE '%, ks %'
            OR (COALESCE(location, '') || ' ' || COALESCE(remote_scope, '') || ' ') LIKE '%, ne %'
            OR (COALESCE(location, '') || ' ' || COALESCE(remote_scope, '') || ' ') LIKE '%, il,%'
            OR (COALESCE(location, '') || ' ' || COALESCE(remote_scope, '') || ' ') LIKE '%, in,%'
            OR (COALESCE(location, '') || ' ' || COALESCE(remote_scope, '') || ' ') LIKE '%, wi,%'
            OR (COALESCE(location, '') || ' ' || COALESCE(remote_scope, '') || ' ') LIKE '%, mn,%'
            OR (COALESCE(location, '') || ' ' || COALESCE(remote_scope, '') || ' ') LIKE '%, oh,%'
            OR (COALESCE(location, '') || ' ' || COALESCE(remote_scope, '') || ' ') LIKE '%, mi,%'
            OR (COALESCE(location, '') || ' ' || COALESCE(remote_scope, '') || ' ') LIKE '%, mo,%'
            OR (COALESCE(location, '') || ' ' || COALESCE(remote_scope, '') || ' ') LIKE '%, ia,%'
          ) THEN 1 ELSE 0 END) as midwest_count
        FROM jobs
      `)
      .first<{
        total: number;
        senior_count: number;
        midwest_count: number;
      }>();

    return {
      total: Number(res?.total ?? 0),
      seniorCount: Number(res?.senior_count ?? 0),
      midwestCount: Number(res?.midwest_count ?? 0),
    };
  }

  public async count(): Promise<number> {
    const res = await this.db
      .prepare("SELECT COUNT(*) as count FROM jobs")
      .first<{ count: number }>();
    return res?.count ?? 0;
  }

  private mapRowToJob(row: Record<string, unknown>): Job {
    let skills: string[] = [];
    try {
      skills = typeof row["skills"] === "string" ? JSON.parse(row["skills"] as string) : [];
    } catch {}

    const remoteScope = String(row["remote_scope"] ?? "worldwide");
    const location = row["location"] != null ? String(row["location"]) : "";
    const isMidwestMatch = Number(row["is_midwest_match"] ?? 0) === 1 ||
      remoteScope.toLowerCase().includes("midwest") ||
      location.toLowerCase().includes("midwest") ||
      /\b(Illinois|Indiana|Wisconsin|Minnesota|Ohio|Michigan|Missouri|Iowa|Kansas|Nebraska|Chicago|Indianapolis|Minneapolis|Madison|Cincinnati|Columbus|Cleveland|Detroit|Ann Arbor|Milwaukee|Saint Louis|Des Moines)\b/i.test(location) ||
      /(?:,\s*|\s+)(IL|IN|WI|MN|OH|MI|MO|IA|KS|NE|ND|SD)(?:\s+|,|$)/.test(location);

    return {
      id: String(row["id"]),
      companyId: String(row["company_id"]),
      careerPageId: String(row["career_page_id"]),
      title: String(row["title"]),
      department: row["department"] != null ? String(row["department"]) : undefined,
      seniorityLevel: (row["seniority_level"] as any) ?? "mid",
      techCategory: (row["tech_category"] as any) ?? "fullstack",
      isTechRole: Number(row["is_tech_role"] ?? 1) === 1,
      employmentType: (row["employment_type"] as any) ?? "full-time",
      location: row["location"] != null ? String(row["location"]) : undefined,
      isRemote: Number(row["is_remote"]) === 1,
      remoteScope: (row["remote_scope"] as any) ?? "worldwide",
      salaryMin: row["salary_min"] !== null && row["salary_min"] !== undefined ? Number(row["salary_min"]) : undefined,
      salaryMax: row["salary_max"] !== null && row["salary_max"] !== undefined ? Number(row["salary_max"]) : undefined,
      salaryCurrency: row["salary_currency"] != null ? String(row["salary_currency"]) : undefined,
      skills,
      descriptionSummary: row["description_summary"] != null ? String(row["description_summary"]) : undefined,
      rawContent: row["raw_content"] != null ? String(row["raw_content"]) : undefined,
      applyType: (row["apply_type"] as any) ?? "url",
      applyTarget: String(row["apply_target"]),
      status: (row["status"] as any) ?? "open",
      contentHash: String(row["content_hash"]),
      companyName: row["company_name"] != null ? String(row["company_name"]) : undefined,
      companyWebsite: row["company_website"] != null ? String(row["company_website"]) : undefined,
      firstSeenAt: Number(row["first_seen_at"]),
      lastSeenAt: Number(row["last_seen_at"]),
      isMidwest: isMidwestMatch,
    };
  }
}

export class LogRepository {
  constructor(private readonly db: ID1Database) {}

  public async log(entry: CrawlLog): Promise<void> {
    const query = `
      INSERT INTO crawl_logs (
        id, agent_name, target_url, status, duration_ms, message, metadata, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await this.db
      .prepare(query)
      .bind(
        entry.id,
        entry.agentName,
        entry.targetUrl,
        entry.status,
        entry.durationMs,
        entry.message,
        JSON.stringify(entry.metadata ?? {}),
        entry.createdAt
      )
      .run();
  }

  public async getRecent(limit = 100): Promise<CrawlLog[]> {
    const res = await this.db
      .prepare("SELECT * FROM crawl_logs ORDER BY created_at DESC LIMIT ?")
      .bind(limit)
      .all<Record<string, unknown>>();

    return (res.results ?? []).map((r) =>
      CrawlLogSchema.parse({
        id: r["id"],
        agentName: r["agent_name"],
        targetUrl: r["target_url"],
        status: r["status"],
        durationMs: Number(r["duration_ms"]),
        message: r["message"],
        metadata: typeof r["metadata"] === "string" ? JSON.parse(r["metadata"] as string) : {},
        createdAt: Number(r["created_at"]),
      })
    );
  }
}

export class CrawlTaskRepository {
  constructor(private readonly db: ID1Database) {}

  public async create(task: CrawlTask): Promise<void> {
    const query = `
      INSERT INTO crawl_tasks (
        id, target_url, source_type, status, company_id,
        jobs_found, error_message, metadata, created_at, completed_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await this.db
      .prepare(query)
      .bind(
        task.id,
        task.targetUrl,
        task.sourceType,
        task.status,
        task.companyId ?? null,
        task.jobsFound,
        task.errorMessage ?? null,
        JSON.stringify(task.metadata ?? {}),
        task.createdAt,
        task.completedAt ?? null
      )
      .run();
  }

  public async update(
    id: string,
    updates: {
      status?: CrawlTaskStatus | undefined;
      companyId?: string | null | undefined;
      jobsFound?: number | undefined;
      errorMessage?: string | null | undefined;
      completedAt?: number | null | undefined;
      metadata?: Record<string, unknown> | undefined;
    }
  ): Promise<void> {
    const setClauses: string[] = [];
    const bindings: unknown[] = [];

    if (updates.status !== undefined) {
      setClauses.push("status = ?");
      bindings.push(updates.status);
    }
    if (updates.companyId !== undefined) {
      setClauses.push("company_id = ?");
      bindings.push(updates.companyId);
    }
    if (updates.jobsFound !== undefined) {
      setClauses.push("jobs_found = ?");
      bindings.push(updates.jobsFound);
    }
    if (updates.errorMessage !== undefined) {
      setClauses.push("error_message = ?");
      bindings.push(updates.errorMessage);
    }
    if (updates.completedAt !== undefined) {
      setClauses.push("completed_at = ?");
      bindings.push(updates.completedAt);
    }
    if (updates.metadata !== undefined) {
      setClauses.push("metadata = ?");
      bindings.push(JSON.stringify(updates.metadata));
    }

    if (setClauses.length === 0) return;

    const query = `UPDATE crawl_tasks SET ${setClauses.join(", ")} WHERE id = ?`;
    bindings.push(id);

    await this.db.prepare(query).bind(...bindings).run();
  }

  public async getById(id: string): Promise<CrawlTask | null> {
    const row = await this.db
      .prepare("SELECT * FROM crawl_tasks WHERE id = ? LIMIT 1")
      .bind(id)
      .first<Record<string, unknown>>();

    if (!row) return null;
    return this.mapRowToTask(row);
  }

  public async list(options: {
    status?: CrawlTaskStatus | undefined;
    limit?: number | undefined;
  } = {}): Promise<CrawlTask[]> {
    const limit = options.limit ?? 50;
    let query = "SELECT * FROM crawl_tasks";
    const bindings: unknown[] = [];

    if (options.status) {
      query += " WHERE status = ?";
      bindings.push(options.status);
    }

    query += " ORDER BY created_at DESC LIMIT ?";
    bindings.push(limit);

    const res = await this.db.prepare(query).bind(...bindings).all<Record<string, unknown>>();
    return (res.results ?? []).map((r) => this.mapRowToTask(r));
  }

  public async getStats(): Promise<{
    total: number;
    pending: number;
    running: number;
    completed: number;
    failed: number;
    jobsFound: number;
  }> {
    const res = await this.db
      .prepare(`
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
          SUM(CASE WHEN status = 'running' THEN 1 ELSE 0 END) as running,
          SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
          SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed,
          COALESCE(SUM(jobs_found), 0) as jobs_found
        FROM crawl_tasks
      `)
      .first<{
        total: number;
        pending: number;
        running: number;
        completed: number;
        failed: number;
        jobs_found: number;
      }>();

    return {
      total: Number(res?.total ?? 0),
      pending: Number(res?.pending ?? 0),
      running: Number(res?.running ?? 0),
      completed: Number(res?.completed ?? 0),
      failed: Number(res?.failed ?? 0),
      jobsFound: Number(res?.jobs_found ?? 0),
    };
  }

  private mapRowToTask(row: Record<string, unknown>): CrawlTask {
    let metadata: Record<string, unknown> = {};
    try {
      metadata = typeof row["metadata"] === "string" ? JSON.parse(row["metadata"] as string) : (row["metadata"] as any ?? {});
    } catch {}

    return {
      id: String(row["id"]),
      targetUrl: String(row["target_url"]),
      sourceType: (row["source_type"] as any) ?? "manual",
      status: (row["status"] as any) ?? "pending",
      companyId: row["company_id"] != null ? String(row["company_id"]) : undefined,
      jobsFound: Number(row["jobs_found"] ?? 0),
      errorMessage: row["error_message"] != null ? String(row["error_message"]) : undefined,
      metadata,
      createdAt: Number(row["created_at"]),
      completedAt: row["completed_at"] !== null && row["completed_at"] !== undefined ? Number(row["completed_at"]) : undefined,
    };
  }
}

export class UserRepository {
  constructor(private readonly db: ID1Database) {}

  public async upsert(user: User): Promise<void> {
    const query = `
      INSERT INTO users (
        id, telegram_id, username, first_name, photo_url, api_token, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(telegram_id) DO UPDATE SET
        username = excluded.username,
        first_name = excluded.first_name,
        photo_url = excluded.photo_url,
        updated_at = excluded.updated_at
    `;
    await this.db
      .prepare(query)
      .bind(
        user.id,
        user.telegramId,
        user.username ?? null,
        user.firstName,
        user.photoUrl ?? null,
        user.apiToken,
        user.createdAt,
        user.updatedAt
      )
      .run();
  }

  public async findById(id: string): Promise<User | null> {
    const row = await this.db
      .prepare("SELECT * FROM users WHERE id = ? LIMIT 1")
      .bind(id)
      .first<Record<string, unknown>>();
    return row ? this.mapRowToUser(row) : null;
  }

  public async findByTelegramId(telegramId: string): Promise<User | null> {
    const row = await this.db
      .prepare("SELECT * FROM users WHERE telegram_id = ? LIMIT 1")
      .bind(telegramId)
      .first<Record<string, unknown>>();
    return row ? this.mapRowToUser(row) : null;
  }

  public async findByApiToken(token: string): Promise<User | null> {
    const row = await this.db
      .prepare("SELECT * FROM users WHERE api_token = ? LIMIT 1")
      .bind(token)
      .first<Record<string, unknown>>();
    return row ? this.mapRowToUser(row) : null;
  }

  private mapRowToUser(row: Record<string, unknown>): User {
    return {
      id: String(row["id"]),
      telegramId: String(row["telegram_id"]),
      username: row["username"] != null ? String(row["username"]) : undefined,
      firstName: String(row["first_name"]),
      photoUrl: row["photo_url"] != null ? String(row["photo_url"]) : undefined,
      apiToken: String(row["api_token"]),
      createdAt: Number(row["created_at"]),
      updatedAt: Number(row["updated_at"]),
    };
  }
}

export class CvRepository {
  constructor(private readonly db: ID1Database) {}

  public async create(cv: CvVersion): Promise<void> {
    const query = `
      INSERT INTO cv_versions (
        id, user_id, job_id, title, target_role, content,
        skills, match_score, tailored_notes, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    await this.db
      .prepare(query)
      .bind(
        cv.id,
        cv.userId,
        cv.jobId ?? null,
        cv.title,
        cv.targetRole ?? null,
        cv.content,
        JSON.stringify(cv.skills ?? []),
        cv.matchScore ?? null,
        cv.tailoredNotes ?? null,
        cv.createdAt,
        cv.updatedAt
      )
      .run();
  }

  public async update(
    id: string,
    userId: string,
    updates: {
      title?: string | undefined;
      targetRole?: string | null | undefined;
      content?: string | undefined;
      skills?: string[] | undefined;
      matchScore?: number | null | undefined;
      tailoredNotes?: string | null | undefined;
      jobId?: string | null | undefined;
    }
  ): Promise<void> {
    const fields: string[] = [];
    const bindings: unknown[] = [];

    if (updates.title !== undefined) {
      fields.push("title = ?");
      bindings.push(updates.title);
    }
    if (updates.targetRole !== undefined) {
      fields.push("target_role = ?");
      bindings.push(updates.targetRole);
    }
    if (updates.content !== undefined) {
      fields.push("content = ?");
      bindings.push(updates.content);
    }
    if (updates.skills !== undefined) {
      fields.push("skills = ?");
      bindings.push(JSON.stringify(updates.skills));
    }
    if (updates.matchScore !== undefined) {
      fields.push("match_score = ?");
      bindings.push(updates.matchScore);
    }
    if (updates.tailoredNotes !== undefined) {
      fields.push("tailored_notes = ?");
      bindings.push(updates.tailoredNotes);
    }
    if (updates.jobId !== undefined) {
      fields.push("job_id = ?");
      bindings.push(updates.jobId);
    }

    fields.push("updated_at = ?");
    bindings.push(Date.now());

    bindings.push(id, userId);

    const query = `UPDATE cv_versions SET ${fields.join(", ")} WHERE id = ? AND user_id = ?`;
    await this.db.prepare(query).bind(...bindings).run();
  }

  public async getById(id: string, userId?: string | undefined): Promise<CvVersion | null> {
    let query = `
      SELECT cv.*, j.title as job_title, c.name as company_name
      FROM cv_versions cv
      LEFT JOIN jobs j ON cv.job_id = j.id
      LEFT JOIN companies c ON j.company_id = c.id
      WHERE cv.id = ?
    `;
    const bindings: unknown[] = [id];
    if (userId) {
      query += " AND cv.user_id = ?";
      bindings.push(userId);
    }
    query += " LIMIT 1";

    const row = await this.db.prepare(query).bind(...bindings).first<Record<string, unknown>>();
    return row ? this.mapRowToCv(row) : null;
  }

  public async listByUser(userId: string): Promise<CvVersion[]> {
    const query = `
      SELECT cv.*, j.title as job_title, c.name as company_name
      FROM cv_versions cv
      LEFT JOIN jobs j ON cv.job_id = j.id
      LEFT JOIN companies c ON j.company_id = c.id
      WHERE cv.user_id = ?
      ORDER BY cv.updated_at DESC
    `;
    const res = await this.db.prepare(query).bind(userId).all<Record<string, unknown>>();
    return (res.results ?? []).map((r) => this.mapRowToCv(r));
  }

  public async delete(id: string, userId: string): Promise<boolean> {
    const res = await this.db
      .prepare("DELETE FROM cv_versions WHERE id = ? AND user_id = ?")
      .bind(id, userId)
      .run();
    const changes = (res.meta as { changes?: number } | undefined)?.changes;
    return changes != null ? changes > 0 : true;
  }

  private mapRowToCv(row: Record<string, unknown>): CvVersion {
    let skills: string[] = [];
    try {
      skills = typeof row["skills"] === "string" ? JSON.parse(row["skills"] as string) : [];
    } catch {}

    return {
      id: String(row["id"]),
      userId: String(row["user_id"]),
      jobId: row["job_id"] != null ? String(row["job_id"]) : undefined,
      title: String(row["title"]),
      targetRole: row["target_role"] != null ? String(row["target_role"]) : undefined,
      content: String(row["content"]),
      skills,
      matchScore: row["match_score"] != null ? Number(row["match_score"]) : undefined,
      tailoredNotes: row["tailored_notes"] != null ? String(row["tailored_notes"]) : undefined,
      createdAt: Number(row["created_at"]),
      updatedAt: Number(row["updated_at"]),
      jobTitle: row["job_title"] != null ? String(row["job_title"]) : undefined,
      companyName: row["company_name"] != null ? String(row["company_name"]) : undefined,
    };
  }
}


