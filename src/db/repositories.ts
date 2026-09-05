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
} from "../types/domain.js";

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

  public async count(): Promise<number> {
    const res = await this.db
      .prepare("SELECT COUNT(*) as count FROM companies")
      .first<{ count: number }>();
    return res?.count ?? 0;
  }

  private mapRowToCompany(row: Record<string, unknown>): Company {
    const techStack = typeof row["tech_stack"] === "string" ? JSON.parse(row["tech_stack"] as string) : [];
    const socialLinks = typeof row["social_links"] === "string" ? JSON.parse(row["social_links"] as string) : {};

    return CompanySchema.parse({
      id: row["id"],
      domain: row["domain"],
      name: row["name"],
      tagline: row["tagline"] ?? undefined,
      description: row["description"] ?? undefined,
      websiteUrl: row["website_url"],
      logoUrl: row["logo_url"] ?? undefined,
      industry: row["industry"] ?? undefined,
      techStack,
      socialLinks,
      contactEmail: row["contact_email"] ?? undefined,
      headcountEstimate: row["headcount_estimate"] ?? undefined,
      locationHint: row["location_hint"] ?? undefined,
      discoverySource: row["discovery_source"] ?? "seed",
      createdAt: Number(row["created_at"]),
      updatedAt: Number(row["updated_at"]),
    });
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
    return CareerPageSchema.parse({
      id: row["id"],
      companyId: row["company_id"],
      url: row["url"],
      pageType: row["page_type"],
      status: row["status"],
      contentHash: row["content_hash"] ?? undefined,
      lastCheckedAt: Number(row["last_checked_at"]),
      createdAt: Number(row["created_at"]),
    });
  }
}

export class JobRepository {
  constructor(private readonly db: ID1Database) {}

  public async upsert(job: Job): Promise<void> {
    const query = `
      INSERT INTO jobs (
        id, company_id, career_page_id, title, department,
        employment_type, location, is_remote, remote_scope,
        salary_min, salary_max, salary_currency, skills,
        description_summary, raw_content, apply_type, apply_target,
        status, content_hash, first_seen_at, last_seen_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(content_hash) DO UPDATE SET
        title = excluded.title,
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

  public async list(limit = 50): Promise<Job[]> {
    const res = await this.db
      .prepare("SELECT * FROM jobs ORDER BY first_seen_at DESC LIMIT ?")
      .bind(limit)
      .all<Record<string, unknown>>();

    return (res.results ?? []).map((r) => this.mapRowToJob(r));
  }

  public async count(): Promise<number> {
    const res = await this.db
      .prepare("SELECT COUNT(*) as count FROM jobs")
      .first<{ count: number }>();
    return res?.count ?? 0;
  }

  private mapRowToJob(row: Record<string, unknown>): Job {
    const skills = typeof row["skills"] === "string" ? JSON.parse(row["skills"] as string) : [];

    return JobSchema.parse({
      id: row["id"],
      companyId: row["company_id"],
      careerPageId: row["career_page_id"],
      title: row["title"],
      department: row["department"] ?? undefined,
      employmentType: row["employment_type"],
      location: row["location"] ?? undefined,
      isRemote: Number(row["is_remote"]) === 1,
      remoteScope: row["remote_scope"] ?? "worldwide",
      salaryMin: row["salary_min"] !== null ? Number(row["salary_min"]) : undefined,
      salaryMax: row["salary_max"] !== null ? Number(row["salary_max"]) : undefined,
      salaryCurrency: row["salary_currency"] ?? undefined,
      skills,
      descriptionSummary: row["description_summary"] ?? undefined,
      rawContent: row["raw_content"] ?? undefined,
      applyType: row["apply_type"],
      applyTarget: row["apply_target"],
      status: row["status"],
      contentHash: row["content_hash"],
      firstSeenAt: Number(row["first_seen_at"]),
      lastSeenAt: Number(row["last_seen_at"]),
    });
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
