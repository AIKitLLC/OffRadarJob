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
  AuthSession,
  SystemSetting,
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

export const WEST_COMPANY_SQL_CONDITION = `(
  COALESCE(location_hint, '') LIKE '%west coast%'
  OR COALESCE(location_hint, '') LIKE '%california%'
  OR COALESCE(location_hint, '') LIKE '%san francisco%'
  OR COALESCE(location_hint, '') LIKE '%silicon valley%'
  OR COALESCE(location_hint, '') LIKE '%san jose%'
  OR COALESCE(location_hint, '') LIKE '%los angeles%'
  OR COALESCE(location_hint, '') LIKE '%san diego%'
  OR COALESCE(location_hint, '') LIKE '%oakland%'
  OR COALESCE(location_hint, '') LIKE '%seattle%'
  OR COALESCE(location_hint, '') LIKE '%bellevue%'
  OR COALESCE(location_hint, '') LIKE '%portland%'
  OR COALESCE(location_hint, '') LIKE '%oregon%'
  OR COALESCE(location_hint, '') LIKE '%washington%'
  OR COALESCE(location_hint, '') LIKE '%nevada%'
  OR COALESCE(location_hint, '') LIKE '%las vegas%'
  OR (' ' || COALESCE(location_hint, '') || ' ') LIKE '%, ca %'
  OR (' ' || COALESCE(location_hint, '') || ' ') LIKE '%, ca,%'
  OR (' ' || COALESCE(location_hint, '') || ' ') LIKE '%, wa %'
  OR (' ' || COALESCE(location_hint, '') || ' ') LIKE '%, wa,%'
  OR (' ' || COALESCE(location_hint, '') || ' ') LIKE '%, or %'
  OR (' ' || COALESCE(location_hint, '') || ' ') LIKE '%, or,%'
  OR (' ' || COALESCE(location_hint, '') || ' ') LIKE '%, nv %'
)`;

export const NORTHEAST_COMPANY_SQL_CONDITION = `(
  COALESCE(location_hint, '') LIKE '%new york%'
  OR COALESCE(location_hint, '') LIKE '%nyc%'
  OR COALESCE(location_hint, '') LIKE '%brooklyn%'
  OR COALESCE(location_hint, '') LIKE '%manhattan%'
  OR COALESCE(location_hint, '') LIKE '%massachusetts%'
  OR COALESCE(location_hint, '') LIKE '%boston%'
  OR COALESCE(location_hint, '') LIKE '%cambridge%'
  OR COALESCE(location_hint, '') LIKE '%pennsylvania%'
  OR COALESCE(location_hint, '') LIKE '%philadelphia%'
  OR COALESCE(location_hint, '') LIKE '%pittsburgh%'
  OR COALESCE(location_hint, '') LIKE '%new jersey%'
  OR COALESCE(location_hint, '') LIKE '%connecticut%'
  OR (' ' || COALESCE(location_hint, '') || ' ') LIKE '%, ny %'
  OR (' ' || COALESCE(location_hint, '') || ' ') LIKE '%, ny,%'
  OR (' ' || COALESCE(location_hint, '') || ' ') LIKE '%, ma %'
  OR (' ' || COALESCE(location_hint, '') || ' ') LIKE '%, ma,%'
  OR (' ' || COALESCE(location_hint, '') || ' ') LIKE '%, pa %'
  OR (' ' || COALESCE(location_hint, '') || ' ') LIKE '%, pa,%'
  OR (' ' || COALESCE(location_hint, '') || ' ') LIKE '%, nj %'
  OR (' ' || COALESCE(location_hint, '') || ' ') LIKE '%, ct %'
)`;

export const SOUTH_COMPANY_SQL_CONDITION = `(
  COALESCE(location_hint, '') LIKE '%texas%'
  OR COALESCE(location_hint, '') LIKE '%austin%'
  OR COALESCE(location_hint, '') LIKE '%dallas%'
  OR COALESCE(location_hint, '') LIKE '%houston%'
  OR COALESCE(location_hint, '') LIKE '%florida%'
  OR COALESCE(location_hint, '') LIKE '%miami%'
  OR COALESCE(location_hint, '') LIKE '%tampa%'
  OR COALESCE(location_hint, '') LIKE '%orlando%'
  OR COALESCE(location_hint, '') LIKE '%georgia%'
  OR COALESCE(location_hint, '') LIKE '%atlanta%'
  OR COALESCE(location_hint, '') LIKE '%north carolina%'
  OR COALESCE(location_hint, '') LIKE '%raleigh%'
  OR COALESCE(location_hint, '') LIKE '%durham%'
  OR COALESCE(location_hint, '') LIKE '%charlotte%'
  OR COALESCE(location_hint, '') LIKE '%virginia%'
  OR COALESCE(location_hint, '') LIKE '%tennessee%'
  OR COALESCE(location_hint, '') LIKE '%nashville%'
  OR (' ' || COALESCE(location_hint, '') || ' ') LIKE '%, tx %'
  OR (' ' || COALESCE(location_hint, '') || ' ') LIKE '%, tx,%'
  OR (' ' || COALESCE(location_hint, '') || ' ') LIKE '%, fl %'
  OR (' ' || COALESCE(location_hint, '') || ' ') LIKE '%, fl,%'
  OR (' ' || COALESCE(location_hint, '') || ' ') LIKE '%, ga %'
  OR (' ' || COALESCE(location_hint, '') || ' ') LIKE '%, ga,%'
  OR (' ' || COALESCE(location_hint, '') || ' ') LIKE '%, nc %'
  OR (' ' || COALESCE(location_hint, '') || ' ') LIKE '%, nc,%'
  OR (' ' || COALESCE(location_hint, '') || ' ') LIKE '%, va %'
  OR (' ' || COALESCE(location_hint, '') || ' ') LIKE '%, va,%'
  OR (' ' || COALESCE(location_hint, '') || ' ') LIKE '%, tn %'
)`;

export const MOUNTAIN_COMPANY_SQL_CONDITION = `(
  COALESCE(location_hint, '') LIKE '%colorado%'
  OR COALESCE(location_hint, '') LIKE '%denver%'
  OR COALESCE(location_hint, '') LIKE '%boulder%'
  OR COALESCE(location_hint, '') LIKE '%utah%'
  OR COALESCE(location_hint, '') LIKE '%salt lake%'
  OR COALESCE(location_hint, '') LIKE '%provo%'
  OR COALESCE(location_hint, '') LIKE '%lehi%'
  OR COALESCE(location_hint, '') LIKE '%arizona%'
  OR COALESCE(location_hint, '') LIKE '%phoenix%'
  OR COALESCE(location_hint, '') LIKE '%scottsdale%'
  OR COALESCE(location_hint, '') LIKE '%tempe%'
  OR COALESCE(location_hint, '') LIKE '%idaho%'
  OR COALESCE(location_hint, '') LIKE '%boise%'
  OR (' ' || COALESCE(location_hint, '') || ' ') LIKE '%, co %'
  OR (' ' || COALESCE(location_hint, '') || ' ') LIKE '%, co,%'
  OR (' ' || COALESCE(location_hint, '') || ' ') LIKE '%, ut %'
  OR (' ' || COALESCE(location_hint, '') || ' ') LIKE '%, ut,%'
  OR (' ' || COALESCE(location_hint, '') || ' ') LIKE '%, az %'
  OR (' ' || COALESCE(location_hint, '') || ' ') LIKE '%, id %'
)`;

function detectFromText(text: string, rawText: string): "midwest" | "west" | "northeast" | "south" | "mountain" | null {
  const combined = text.toLowerCase();

  // 1. Midwest
  if (
    combined.includes("midwest") ||
    /\b(illinois|indiana|wisconsin|minnesota|ohio|michigan|missouri|iowa|kansas|nebraska|chicago|indianapolis|minneapolis|madison|cincinnati|columbus|cleveland|detroit|ann arbor|milwaukee|st\. louis|des moines|omaha)\b/i.test(combined) ||
    /(?:,\s*|\s+)(IL|IN|WI|MN|OH|MI|MO|IA|KS|NE|ND|SD)(?:\s+|,|$)/.test(rawText)
  ) {
    return "midwest";
  }

  // 2. West
  if (
    combined.includes("west coast") ||
    combined.includes("pacific") ||
    /\b(california|washington|oregon|nevada|san francisco|silicon valley|san jose|los angeles|san diego|oakland|seattle|bellevue|portland|sacramento|las vegas|reno|irvine|sunnyvale|mountain view|palo alto)\b/i.test(combined) ||
    /(?:,\s*|\s+)(CA|WA|OR|NV|HI|AK)(?:\s+|,|$)/.test(rawText)
  ) {
    return "west";
  }

  // 3. Northeast
  if (
    combined.includes("northeast") ||
    combined.includes("new england") ||
    /\b(new york|nyc|brooklyn|manhattan|massachusetts|boston|cambridge|pennsylvania|philadelphia|pittsburgh|new jersey|connecticut|rhode island|vermont|new hampshire|maine|somerville)\b/i.test(combined) ||
    /(?:,\s*|\s+)(NY|MA|PA|NJ|CT|RI|NH|VT|ME)(?:\s+|,|$)/.test(rawText)
  ) {
    return "northeast";
  }

  // 4. South
  if (
    combined.includes("southeast") ||
    combined.includes("southwest") ||
    /\b(texas|austin|dallas|houston|florida|miami|tampa|orlando|georgia|atlanta|north carolina|raleigh|durham|charlotte|virginia|tennessee|nashville|south carolina|alabama|louisiana|new orleans)\b/i.test(combined) ||
    /(?:,\s*|\s+)(TX|FL|GA|NC|VA|TN|SC|AL|LA|OK|KY|MS|AR)(?:\s+|,|$)/.test(rawText)
  ) {
    return "south";
  }

  // 5. Mountain
  if (
    combined.includes("mountain") ||
    /\b(colorado|denver|boulder|utah|salt lake|provo|lehi|arizona|phoenix|scottsdale|tempe|idaho|boise|montana|wyoming)\b/i.test(combined) ||
    /(?:,\s*|\s+)(CO|UT|AZ|ID|MT|WY|NM)(?:\s+|,|$)/.test(rawText)
  ) {
    return "mountain";
  }

  return null;
}

export function detectUsRegion(
  location?: string | null,
  locationHint?: string | null,
  remoteScope?: string | null,
  isRemote?: boolean
): "midwest" | "west" | "northeast" | "south" | "mountain" | "remote" | "other" {
  // 1. Explicit job location takes top precedence
  if (location && location.trim()) {
    const fromLoc = detectFromText(location, location);
    if (fromLoc) return fromLoc;
  }

  // 2. Explicit remoteScope
  if (remoteScope && remoteScope.trim()) {
    const fromScope = detectFromText(remoteScope, remoteScope);
    if (fromScope) return fromScope;
  }

  // 3. Company location hint fallback
  if (locationHint && locationHint.trim()) {
    const fromHint = detectFromText(locationHint, locationHint);
    if (fromHint) return fromHint;
  }

  // 4. Generic Remote
  const combined = `${location ?? ""} ${locationHint ?? ""} ${remoteScope ?? ""}`.toLowerCase();
  if (isRemote || combined.includes("remote") || combined.includes("worldwide") || combined.includes("anywhere")) {
    return "remote";
  }

  return "other";
}

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

  public async list(limit = 50, region?: string): Promise<Company[]> {
    let whereClause = "WHERE 1=1";
    if (region === "midwest") {
      whereClause += ` AND ${MIDWEST_COMPANY_SQL_CONDITION}`;
    } else if (region === "west") {
      whereClause += ` AND NOT ${MIDWEST_COMPANY_SQL_CONDITION} AND ${WEST_COMPANY_SQL_CONDITION}`;
    } else if (region === "northeast") {
      whereClause += ` AND NOT ${MIDWEST_COMPANY_SQL_CONDITION} AND ${NORTHEAST_COMPANY_SQL_CONDITION}`;
    } else if (region === "south") {
      whereClause += ` AND NOT ${MIDWEST_COMPANY_SQL_CONDITION} AND ${SOUTH_COMPANY_SQL_CONDITION}`;
    } else if (region === "mountain") {
      whereClause += ` AND NOT ${MIDWEST_COMPANY_SQL_CONDITION} AND ${MOUNTAIN_COMPANY_SQL_CONDITION}`;
    }

    const orderByClause = (!region || region === "all")
      ? `ORDER BY (CASE WHEN ${MIDWEST_COMPANY_SQL_CONDITION} THEN 1 ELSE 0 END) DESC, updated_at DESC`
      : `ORDER BY updated_at DESC`;

    const res = await this.db
      .prepare(`SELECT *, (CASE WHEN ${MIDWEST_COMPANY_SQL_CONDITION} THEN 1 ELSE 0 END) AS is_midwest_priority FROM companies ${whereClause} ${orderByClause} LIMIT ?`)
      .bind(limit)
      .all<Record<string, unknown>>();

    return (res.results ?? []).map((r) => this.mapRowToCompany(r));
  }

  public async listPaged(options: {
    page?: number | undefined;
    limit?: number | undefined;
    search?: string | undefined;
    region?: string | undefined;
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
    const region = options.region && options.region !== "all" ? options.region : null;

    let whereClause = "WHERE 1=1";
    const bindings: unknown[] = [];

    if (search) {
      whereClause += " AND (LOWER(name) LIKE ? OR LOWER(domain) LIKE ? OR LOWER(COALESCE(industry, '')) LIKE ? OR LOWER(tech_stack) LIKE ?)";
      bindings.push(search, search, search, search);
    }
    if (region === "midwest") {
      whereClause += ` AND ${MIDWEST_COMPANY_SQL_CONDITION}`;
    } else if (region === "west") {
      whereClause += ` AND NOT ${MIDWEST_COMPANY_SQL_CONDITION} AND ${WEST_COMPANY_SQL_CONDITION}`;
    } else if (region === "northeast") {
      whereClause += ` AND NOT ${MIDWEST_COMPANY_SQL_CONDITION} AND ${NORTHEAST_COMPANY_SQL_CONDITION}`;
    } else if (region === "south") {
      whereClause += ` AND NOT ${MIDWEST_COMPANY_SQL_CONDITION} AND ${SOUTH_COMPANY_SQL_CONDITION}`;
    } else if (region === "mountain") {
      whereClause += ` AND NOT ${MIDWEST_COMPANY_SQL_CONDITION} AND ${MOUNTAIN_COMPANY_SQL_CONDITION}`;
    }

    const countSql = `SELECT COUNT(*) as total FROM companies ${whereClause}`;
    const orderByClause = (!region || region === "all")
      ? `ORDER BY (CASE WHEN ${MIDWEST_COMPANY_SQL_CONDITION} THEN 1 ELSE 0 END) DESC, updated_at DESC`
      : `ORDER BY updated_at DESC`;
    const itemsSql = `
      SELECT *, 
        (CASE WHEN ${MIDWEST_COMPANY_SQL_CONDITION} THEN 1 ELSE 0 END) AS is_midwest_priority 
      FROM companies 
      ${whereClause} 
      ${orderByClause} 
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

    const locHint = row["location_hint"] != null ? String(row["location_hint"]) : null;
    const detectedRegion = detectUsRegion(null, locHint, null, false);
    const isMidwestMatch = Number(row["is_midwest_priority"] ?? 0) === 1 || detectedRegion === "midwest";

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
      locationHint: locHint ?? undefined,
      discoverySource: String(row["discovery_source"] ?? "seed"),
      isMidwest: isMidwestMatch,
      usRegion: detectedRegion,
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

export const WEST_SQL_CONDITION = `(
  (COALESCE(j.location, '') || ' ' || COALESCE(c.location_hint, '') || ' ' || COALESCE(j.remote_scope, '') || ' ') LIKE '%west coast%'
  OR (COALESCE(j.location, '') || ' ' || COALESCE(c.location_hint, '') || ' ' || COALESCE(j.remote_scope, '') || ' ') LIKE '%california%'
  OR (COALESCE(j.location, '') || ' ' || COALESCE(c.location_hint, '') || ' ' || COALESCE(j.remote_scope, '') || ' ') LIKE '%san francisco%'
  OR (COALESCE(j.location, '') || ' ' || COALESCE(c.location_hint, '') || ' ' || COALESCE(j.remote_scope, '') || ' ') LIKE '%silicon valley%'
  OR (COALESCE(j.location, '') || ' ' || COALESCE(c.location_hint, '') || ' ' || COALESCE(j.remote_scope, '') || ' ') LIKE '%san jose%'
  OR (COALESCE(j.location, '') || ' ' || COALESCE(c.location_hint, '') || ' ' || COALESCE(j.remote_scope, '') || ' ') LIKE '%los angeles%'
  OR (COALESCE(j.location, '') || ' ' || COALESCE(c.location_hint, '') || ' ' || COALESCE(j.remote_scope, '') || ' ') LIKE '%san diego%'
  OR (COALESCE(j.location, '') || ' ' || COALESCE(c.location_hint, '') || ' ' || COALESCE(j.remote_scope, '') || ' ') LIKE '%oakland%'
  OR (COALESCE(j.location, '') || ' ' || COALESCE(c.location_hint, '') || ' ' || COALESCE(j.remote_scope, '') || ' ') LIKE '%seattle%'
  OR (COALESCE(j.location, '') || ' ' || COALESCE(c.location_hint, '') || ' ' || COALESCE(j.remote_scope, '') || ' ') LIKE '%bellevue%'
  OR (COALESCE(j.location, '') || ' ' || COALESCE(c.location_hint, '') || ' ' || COALESCE(j.remote_scope, '') || ' ') LIKE '%portland%'
  OR (COALESCE(j.location, '') || ' ' || COALESCE(c.location_hint, '') || ' ' || COALESCE(j.remote_scope, '') || ' ') LIKE '%oregon%'
  OR (COALESCE(j.location, '') || ' ' || COALESCE(c.location_hint, '') || ' ' || COALESCE(j.remote_scope, '') || ' ') LIKE '%washington%'
  OR (COALESCE(j.location, '') || ' ' || COALESCE(c.location_hint, '') || ' ' || COALESCE(j.remote_scope, '') || ' ') LIKE '%nevada%'
  OR (COALESCE(j.location, '') || ' ' || COALESCE(c.location_hint, '') || ' ' || COALESCE(j.remote_scope, '') || ' ') LIKE '%las vegas%'
  OR (' ' || COALESCE(j.location, '') || ' ' || COALESCE(c.location_hint, '') || ' ') LIKE '%, ca %'
  OR (' ' || COALESCE(j.location, '') || ' ' || COALESCE(c.location_hint, '') || ' ') LIKE '%, ca,%'
  OR (' ' || COALESCE(j.location, '') || ' ' || COALESCE(c.location_hint, '') || ' ') LIKE '%, wa %'
  OR (' ' || COALESCE(j.location, '') || ' ' || COALESCE(c.location_hint, '') || ' ') LIKE '%, wa,%'
  OR (' ' || COALESCE(j.location, '') || ' ' || COALESCE(c.location_hint, '') || ' ') LIKE '%, or %'
  OR (' ' || COALESCE(j.location, '') || ' ' || COALESCE(c.location_hint, '') || ' ') LIKE '%, or,%'
  OR (' ' || COALESCE(j.location, '') || ' ' || COALESCE(c.location_hint, '') || ' ') LIKE '%, nv %'
)`;

export const NORTHEAST_SQL_CONDITION = `(
  (COALESCE(j.location, '') || ' ' || COALESCE(c.location_hint, '') || ' ' || COALESCE(j.remote_scope, '') || ' ') LIKE '%new york%'
  OR (COALESCE(j.location, '') || ' ' || COALESCE(c.location_hint, '') || ' ' || COALESCE(j.remote_scope, '') || ' ') LIKE '%nyc%'
  OR (COALESCE(j.location, '') || ' ' || COALESCE(c.location_hint, '') || ' ' || COALESCE(j.remote_scope, '') || ' ') LIKE '%brooklyn%'
  OR (COALESCE(j.location, '') || ' ' || COALESCE(c.location_hint, '') || ' ' || COALESCE(j.remote_scope, '') || ' ') LIKE '%manhattan%'
  OR (COALESCE(j.location, '') || ' ' || COALESCE(c.location_hint, '') || ' ' || COALESCE(j.remote_scope, '') || ' ') LIKE '%massachusetts%'
  OR (COALESCE(j.location, '') || ' ' || COALESCE(c.location_hint, '') || ' ' || COALESCE(j.remote_scope, '') || ' ') LIKE '%boston%'
  OR (COALESCE(j.location, '') || ' ' || COALESCE(c.location_hint, '') || ' ' || COALESCE(j.remote_scope, '') || ' ') LIKE '%cambridge%'
  OR (COALESCE(j.location, '') || ' ' || COALESCE(c.location_hint, '') || ' ' || COALESCE(j.remote_scope, '') || ' ') LIKE '%pennsylvania%'
  OR (COALESCE(j.location, '') || ' ' || COALESCE(c.location_hint, '') || ' ' || COALESCE(j.remote_scope, '') || ' ') LIKE '%philadelphia%'
  OR (COALESCE(j.location, '') || ' ' || COALESCE(c.location_hint, '') || ' ' || COALESCE(j.remote_scope, '') || ' ') LIKE '%pittsburgh%'
  OR (COALESCE(j.location, '') || ' ' || COALESCE(c.location_hint, '') || ' ' || COALESCE(j.remote_scope, '') || ' ') LIKE '%new jersey%'
  OR (COALESCE(j.location, '') || ' ' || COALESCE(c.location_hint, '') || ' ' || COALESCE(j.remote_scope, '') || ' ') LIKE '%connecticut%'
  OR (' ' || COALESCE(j.location, '') || ' ' || COALESCE(c.location_hint, '') || ' ') LIKE '%, ny %'
  OR (' ' || COALESCE(j.location, '') || ' ' || COALESCE(c.location_hint, '') || ' ') LIKE '%, ny,%'
  OR (' ' || COALESCE(j.location, '') || ' ' || COALESCE(c.location_hint, '') || ' ') LIKE '%, ma %'
  OR (' ' || COALESCE(j.location, '') || ' ' || COALESCE(c.location_hint, '') || ' ') LIKE '%, ma,%'
  OR (' ' || COALESCE(j.location, '') || ' ' || COALESCE(c.location_hint, '') || ' ') LIKE '%, pa %'
  OR (' ' || COALESCE(j.location, '') || ' ' || COALESCE(c.location_hint, '') || ' ') LIKE '%, pa,%'
  OR (' ' || COALESCE(j.location, '') || ' ' || COALESCE(c.location_hint, '') || ' ') LIKE '%, nj %'
  OR (' ' || COALESCE(j.location, '') || ' ' || COALESCE(c.location_hint, '') || ' ') LIKE '%, ct %'
)`;

export const SOUTH_SQL_CONDITION = `(
  (COALESCE(j.location, '') || ' ' || COALESCE(c.location_hint, '') || ' ' || COALESCE(j.remote_scope, '') || ' ') LIKE '%texas%'
  OR (COALESCE(j.location, '') || ' ' || COALESCE(c.location_hint, '') || ' ' || COALESCE(j.remote_scope, '') || ' ') LIKE '%austin%'
  OR (COALESCE(j.location, '') || ' ' || COALESCE(c.location_hint, '') || ' ' || COALESCE(j.remote_scope, '') || ' ') LIKE '%dallas%'
  OR (COALESCE(j.location, '') || ' ' || COALESCE(c.location_hint, '') || ' ' || COALESCE(j.remote_scope, '') || ' ') LIKE '%houston%'
  OR (COALESCE(j.location, '') || ' ' || COALESCE(c.location_hint, '') || ' ' || COALESCE(j.remote_scope, '') || ' ') LIKE '%florida%'
  OR (COALESCE(j.location, '') || ' ' || COALESCE(c.location_hint, '') || ' ' || COALESCE(j.remote_scope, '') || ' ') LIKE '%miami%'
  OR (COALESCE(j.location, '') || ' ' || COALESCE(c.location_hint, '') || ' ' || COALESCE(j.remote_scope, '') || ' ') LIKE '%tampa%'
  OR (COALESCE(j.location, '') || ' ' || COALESCE(c.location_hint, '') || ' ' || COALESCE(j.remote_scope, '') || ' ') LIKE '%orlando%'
  OR (COALESCE(j.location, '') || ' ' || COALESCE(c.location_hint, '') || ' ' || COALESCE(j.remote_scope, '') || ' ') LIKE '%georgia%'
  OR (COALESCE(j.location, '') || ' ' || COALESCE(c.location_hint, '') || ' ' || COALESCE(j.remote_scope, '') || ' ') LIKE '%atlanta%'
  OR (COALESCE(j.location, '') || ' ' || COALESCE(c.location_hint, '') || ' ' || COALESCE(j.remote_scope, '') || ' ') LIKE '%north carolina%'
  OR (COALESCE(j.location, '') || ' ' || COALESCE(c.location_hint, '') || ' ' || COALESCE(j.remote_scope, '') || ' ') LIKE '%raleigh%'
  OR (COALESCE(j.location, '') || ' ' || COALESCE(c.location_hint, '') || ' ' || COALESCE(j.remote_scope, '') || ' ') LIKE '%durham%'
  OR (COALESCE(j.location, '') || ' ' || COALESCE(c.location_hint, '') || ' ' || COALESCE(j.remote_scope, '') || ' ') LIKE '%charlotte%'
  OR (COALESCE(j.location, '') || ' ' || COALESCE(c.location_hint, '') || ' ' || COALESCE(j.remote_scope, '') || ' ') LIKE '%virginia%'
  OR (COALESCE(j.location, '') || ' ' || COALESCE(c.location_hint, '') || ' ' || COALESCE(j.remote_scope, '') || ' ') LIKE '%tennessee%'
  OR (COALESCE(j.location, '') || ' ' || COALESCE(c.location_hint, '') || ' ' || COALESCE(j.remote_scope, '') || ' ') LIKE '%nashville%'
  OR (' ' || COALESCE(j.location, '') || ' ' || COALESCE(c.location_hint, '') || ' ') LIKE '%, tx %'
  OR (' ' || COALESCE(j.location, '') || ' ' || COALESCE(c.location_hint, '') || ' ') LIKE '%, tx,%'
  OR (' ' || COALESCE(j.location, '') || ' ' || COALESCE(c.location_hint, '') || ' ') LIKE '%, fl %'
  OR (' ' || COALESCE(j.location, '') || ' ' || COALESCE(c.location_hint, '') || ' ') LIKE '%, fl,%'
  OR (' ' || COALESCE(j.location, '') || ' ' || COALESCE(c.location_hint, '') || ' ') LIKE '%, ga %'
  OR (' ' || COALESCE(j.location, '') || ' ' || COALESCE(c.location_hint, '') || ' ') LIKE '%, ga,%'
  OR (' ' || COALESCE(j.location, '') || ' ' || COALESCE(c.location_hint, '') || ' ') LIKE '%, nc %'
  OR (' ' || COALESCE(j.location, '') || ' ' || COALESCE(c.location_hint, '') || ' ') LIKE '%, nc,%'
  OR (' ' || COALESCE(j.location, '') || ' ' || COALESCE(c.location_hint, '') || ' ') LIKE '%, va %'
  OR (' ' || COALESCE(j.location, '') || ' ' || COALESCE(c.location_hint, '') || ' ') LIKE '%, va,%'
  OR (' ' || COALESCE(j.location, '') || ' ' || COALESCE(c.location_hint, '') || ' ') LIKE '%, tn %'
)`;

export const MOUNTAIN_SQL_CONDITION = `(
  (COALESCE(j.location, '') || ' ' || COALESCE(c.location_hint, '') || ' ' || COALESCE(j.remote_scope, '') || ' ') LIKE '%colorado%'
  OR (COALESCE(j.location, '') || ' ' || COALESCE(c.location_hint, '') || ' ' || COALESCE(j.remote_scope, '') || ' ') LIKE '%denver%'
  OR (COALESCE(j.location, '') || ' ' || COALESCE(c.location_hint, '') || ' ' || COALESCE(j.remote_scope, '') || ' ') LIKE '%boulder%'
  OR (COALESCE(j.location, '') || ' ' || COALESCE(c.location_hint, '') || ' ' || COALESCE(j.remote_scope, '') || ' ') LIKE '%utah%'
  OR (COALESCE(j.location, '') || ' ' || COALESCE(c.location_hint, '') || ' ' || COALESCE(j.remote_scope, '') || ' ') LIKE '%salt lake%'
  OR (COALESCE(j.location, '') || ' ' || COALESCE(c.location_hint, '') || ' ' || COALESCE(j.remote_scope, '') || ' ') LIKE '%provo%'
  OR (COALESCE(j.location, '') || ' ' || COALESCE(c.location_hint, '') || ' ' || COALESCE(j.remote_scope, '') || ' ') LIKE '%lehi%'
  OR (COALESCE(j.location, '') || ' ' || COALESCE(c.location_hint, '') || ' ' || COALESCE(j.remote_scope, '') || ' ') LIKE '%arizona%'
  OR (COALESCE(j.location, '') || ' ' || COALESCE(c.location_hint, '') || ' ' || COALESCE(j.remote_scope, '') || ' ') LIKE '%phoenix%'
  OR (COALESCE(j.location, '') || ' ' || COALESCE(c.location_hint, '') || ' ' || COALESCE(j.remote_scope, '') || ' ') LIKE '%scottsdale%'
  OR (COALESCE(j.location, '') || ' ' || COALESCE(c.location_hint, '') || ' ' || COALESCE(j.remote_scope, '') || ' ') LIKE '%tempe%'
  OR (COALESCE(j.location, '') || ' ' || COALESCE(c.location_hint, '') || ' ' || COALESCE(j.remote_scope, '') || ' ') LIKE '%idaho%'
  OR (COALESCE(j.location, '') || ' ' || COALESCE(c.location_hint, '') || ' ' || COALESCE(j.remote_scope, '') || ' ') LIKE '%boise%'
  OR (' ' || COALESCE(j.location, '') || ' ' || COALESCE(c.location_hint, '') || ' ') LIKE '%, co %'
  OR (' ' || COALESCE(j.location, '') || ' ' || COALESCE(c.location_hint, '') || ' ') LIKE '%, co,%'
  OR (' ' || COALESCE(j.location, '') || ' ' || COALESCE(c.location_hint, '') || ' ') LIKE '%, ut %'
  OR (' ' || COALESCE(j.location, '') || ' ' || COALESCE(c.location_hint, '') || ' ') LIKE '%, ut,%'
  OR (' ' || COALESCE(j.location, '') || ' ' || COALESCE(c.location_hint, '') || ' ') LIKE '%, az %'
  OR (' ' || COALESCE(j.location, '') || ' ' || COALESCE(c.location_hint, '') || ' ') LIKE '%, id %'
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
      .prepare("SELECT j.*, c.name AS company_name, c.website_url AS company_website, c.location_hint FROM jobs j LEFT JOIN companies c ON j.company_id = c.id WHERE j.content_hash = ? LIMIT 1")
      .bind(hash)
      .first<Record<string, unknown>>();

    if (!row) return null;
    return this.mapRowToJob(row);
  }

  public async getById(id: string): Promise<Job | null> {
    const row = await this.db
      .prepare("SELECT j.*, c.name AS company_name, c.website_url AS company_website, c.location_hint FROM jobs j LEFT JOIN companies c ON j.company_id = c.id WHERE j.id = ? LIMIT 1")
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

    let query = "SELECT j.*, c.name AS company_name, c.website_url AS company_website, c.location_hint FROM jobs j LEFT JOIN companies c ON j.company_id = c.id WHERE 1=1";
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
      query += ` AND ${MIDWEST_SQL_CONDITION}`;
    } else if (region === "west") {
      query += ` AND NOT ${MIDWEST_SQL_CONDITION} AND ${WEST_SQL_CONDITION}`;
    } else if (region === "northeast") {
      query += ` AND NOT ${MIDWEST_SQL_CONDITION} AND ${NORTHEAST_SQL_CONDITION}`;
    } else if (region === "south") {
      query += ` AND NOT ${MIDWEST_SQL_CONDITION} AND ${SOUTH_SQL_CONDITION}`;
    } else if (region === "mountain") {
      query += ` AND NOT ${MIDWEST_SQL_CONDITION} AND ${MOUNTAIN_SQL_CONDITION}`;
    } else if (region === "remote") {
      query += " AND j.is_remote = 1";
    }
    if (search) {
      query += " AND (LOWER(j.title) LIKE ? OR LOWER(COALESCE(c.name, '')) LIKE ? OR LOWER(j.skills) LIKE ? OR LOWER(COALESCE(j.location, '')) LIKE ? OR LOWER(COALESCE(j.department, '')) LIKE ?)";
      bindings.push(search, search, search, search, search);
    }

    const listOrderByClause = (!region || region === "all")
      ? `ORDER BY (CASE WHEN ${MIDWEST_SQL_CONDITION} THEN 1 ELSE 0 END) DESC, j.first_seen_at DESC`
      : `ORDER BY j.first_seen_at DESC`;
    query += ` ${listOrderByClause} LIMIT ? OFFSET ?`;
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
    } else if (region === "west") {
      whereClause += ` AND NOT ${MIDWEST_SQL_CONDITION} AND ${WEST_SQL_CONDITION}`;
    } else if (region === "northeast") {
      whereClause += ` AND NOT ${MIDWEST_SQL_CONDITION} AND ${NORTHEAST_SQL_CONDITION}`;
    } else if (region === "south") {
      whereClause += ` AND NOT ${MIDWEST_SQL_CONDITION} AND ${SOUTH_SQL_CONDITION}`;
    } else if (region === "mountain") {
      whereClause += ` AND NOT ${MIDWEST_SQL_CONDITION} AND ${MOUNTAIN_SQL_CONDITION}`;
    } else if (region === "remote") {
      whereClause += " AND j.is_remote = 1";
    }
    if (search) {
      whereClause += " AND (LOWER(j.title) LIKE ? OR LOWER(COALESCE(c.name, '')) LIKE ? OR LOWER(j.skills) LIKE ? OR LOWER(COALESCE(j.location, '')) LIKE ? OR LOWER(COALESCE(j.department, '')) LIKE ?)";
      bindings.push(search, search, search, search, search);
    }

    const countSql = `SELECT COUNT(*) as total FROM jobs j LEFT JOIN companies c ON j.company_id = c.id ${whereClause}`;
    const pagedOrderByClause = (!region || region === "all")
      ? `ORDER BY is_midwest_match DESC, j.first_seen_at DESC`
      : `ORDER BY j.first_seen_at DESC`;
    const itemsSql = `
      SELECT j.*, c.name AS company_name, c.website_url AS company_website, c.location_hint,
        (CASE WHEN ${MIDWEST_SQL_CONDITION} THEN 1 ELSE 0 END) AS is_midwest_match
      FROM jobs j 
      LEFT JOIN companies c ON j.company_id = c.id 
      ${whereClause} 
      ${pagedOrderByClause} 
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
    westCount: number;
    northeastCount: number;
    southCount: number;
    mountainCount: number;
    total: number;
  }> {
    const res = await this.db
      .prepare(`
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN seniority_level IN ('senior', 'founding', 'lead') THEN 1 ELSE 0 END) as senior_count,
          SUM(CASE WHEN (
            (COALESCE(location, '') || ' ' || COALESCE(remote_scope, '') || ' ') LIKE '%midwest%'
            OR (' ' || COALESCE(location, '') || ' ') LIKE '%, il %'
            OR (' ' || COALESCE(location, '') || ' ') LIKE '%, in %'
            OR (' ' || COALESCE(location, '') || ' ') LIKE '%, wi %'
            OR (' ' || COALESCE(location, '') || ' ') LIKE '%, mn %'
            OR (' ' || COALESCE(location, '') || ' ') LIKE '%, oh %'
            OR (' ' || COALESCE(location, '') || ' ') LIKE '%, mi %'
            OR (' ' || COALESCE(location, '') || ' ') LIKE '%, mo %'
            OR (' ' || COALESCE(location, '') || ' ') LIKE '%, ia %'
            OR (' ' || COALESCE(location, '') || ' ') LIKE '%, ks %'
            OR (' ' || COALESCE(location, '') || ' ') LIKE '%, ne %'
          ) THEN 1 ELSE 0 END) as midwest_count,
          SUM(CASE WHEN (
            (COALESCE(location, '') || ' ' || COALESCE(remote_scope, '') || ' ') LIKE '%california%'
            OR (COALESCE(location, '') || ' ' || COALESCE(remote_scope, '') || ' ') LIKE '%san francisco%'
            OR (COALESCE(location, '') || ' ' || COALESCE(remote_scope, '') || ' ') LIKE '%seattle%'
            OR (COALESCE(location, '') || ' ' || COALESCE(remote_scope, '') || ' ') LIKE '%portland%'
            OR (' ' || COALESCE(location, '') || ' ') LIKE '%, ca %'
            OR (' ' || COALESCE(location, '') || ' ') LIKE '%, wa %'
            OR (' ' || COALESCE(location, '') || ' ') LIKE '%, or %'
          ) THEN 1 ELSE 0 END) as west_count,
          SUM(CASE WHEN (
            (COALESCE(location, '') || ' ' || COALESCE(remote_scope, '') || ' ') LIKE '%new york%'
            OR (COALESCE(location, '') || ' ' || COALESCE(remote_scope, '') || ' ') LIKE '%boston%'
            OR (' ' || COALESCE(location, '') || ' ') LIKE '%, ny %'
            OR (' ' || COALESCE(location, '') || ' ') LIKE '%, ma %'
            OR (' ' || COALESCE(location, '') || ' ') LIKE '%, pa %'
            OR (' ' || COALESCE(location, '') || ' ') LIKE '%, nj %'
          ) THEN 1 ELSE 0 END) as northeast_count,
          SUM(CASE WHEN (
            (COALESCE(location, '') || ' ' || COALESCE(remote_scope, '') || ' ') LIKE '%texas%'
            OR (COALESCE(location, '') || ' ' || COALESCE(remote_scope, '') || ' ') LIKE '%austin%'
            OR (COALESCE(location, '') || ' ' || COALESCE(remote_scope, '') || ' ') LIKE '%atlanta%'
            OR (COALESCE(location, '') || ' ' || COALESCE(remote_scope, '') || ' ') LIKE '%raleigh%'
            OR (' ' || COALESCE(location, '') || ' ') LIKE '%, tx %'
            OR (' ' || COALESCE(location, '') || ' ') LIKE '%, fl %'
            OR (' ' || COALESCE(location, '') || ' ') LIKE '%, ga %'
            OR (' ' || COALESCE(location, '') || ' ') LIKE '%, nc %'
          ) THEN 1 ELSE 0 END) as south_count,
          SUM(CASE WHEN (
            (COALESCE(location, '') || ' ' || COALESCE(remote_scope, '') || ' ') LIKE '%colorado%'
            OR (COALESCE(location, '') || ' ' || COALESCE(remote_scope, '') || ' ') LIKE '%denver%'
            OR (COALESCE(location, '') || ' ' || COALESCE(remote_scope, '') || ' ') LIKE '%salt lake%'
            OR (' ' || COALESCE(location, '') || ' ') LIKE '%, co %'
            OR (' ' || COALESCE(location, '') || ' ') LIKE '%, ut %'
            OR (' ' || COALESCE(location, '') || ' ') LIKE '%, az %'
          ) THEN 1 ELSE 0 END) as mountain_count
        FROM jobs
      `)
      .first<{
        total: number;
        senior_count: number;
        midwest_count: number;
        west_count: number;
        northeast_count: number;
        south_count: number;
        mountain_count: number;
      }>();

    return {
      total: Number(res?.total ?? 0),
      seniorCount: Number(res?.senior_count ?? 0),
      midwestCount: Number(res?.midwest_count ?? 0),
      westCount: Number(res?.west_count ?? 0),
      northeastCount: Number(res?.northeast_count ?? 0),
      southCount: Number(res?.south_count ?? 0),
      mountainCount: Number(res?.mountain_count ?? 0),
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
    const locHint = row["location_hint"] != null ? String(row["location_hint"]) : "";
    const isRemote = Number(row["is_remote"]) === 1;

    let detectedRegion = detectUsRegion(location, locHint, remoteScope, isRemote);
    if (Number(row["is_midwest_match"] ?? 0) === 1) {
      detectedRegion = "midwest";
    }
    const isMidwestMatch = Number(row["is_midwest_match"] ?? 0) === 1 || detectedRegion === "midwest";

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
      isRemote,
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
      usRegion: detectedRegion,
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

  public async findById(id: string): Promise<CrawlTask | null> {
    return this.getById(id);
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
    const role = user.role || "user";
    const query = `
      INSERT INTO users (
        id, telegram_id, username, first_name, photo_url, api_token, role, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(telegram_id) DO UPDATE SET
        username = excluded.username,
        first_name = excluded.first_name,
        photo_url = excluded.photo_url,
        role = CASE WHEN excluded.role = 'admin' THEN 'admin' ELSE COALESCE(users.role, excluded.role, 'user') END,
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
        role,
        user.createdAt,
        user.updatedAt
      )
      .run();
  }

  public async setRole(idOrTgId: string, role: "user" | "admin"): Promise<void> {
    const query = `
      UPDATE users
      SET role = ?, updated_at = ?
      WHERE id = ? OR telegram_id = ?
    `;
    await this.db.prepare(query).bind(role, Date.now(), idOrTgId, idOrTgId).run();
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

  public async list(limit: number = 50, role?: string): Promise<User[]> {
    let query = "SELECT * FROM users";
    const values: unknown[] = [];
    if (role) {
      query += " WHERE role = ?";
      values.push(role);
    }
    query += " ORDER BY created_at DESC LIMIT ?";
    values.push(limit);

    const res = await this.db.prepare(query).bind(...values).all<Record<string, unknown>>();
    return (res.results || []).map((r) => this.mapRowToUser(r));
  }

  public async count(role?: string): Promise<number> {
    let query = "SELECT COUNT(*) as count FROM users";
    const values: unknown[] = [];
    if (role) {
      query += " WHERE role = ?";
      values.push(role);
    }
    const row = await this.db.prepare(query).bind(...values).first<{ count: number }>();
    return Number(row?.count ?? 0);
  }

  private mapRowToUser(row: Record<string, unknown>): User {
    return {
      id: String(row["id"]),
      telegramId: String(row["telegram_id"]),
      username: row["username"] != null ? String(row["username"]) : undefined,
      firstName: String(row["first_name"]),
      photoUrl: row["photo_url"] != null ? String(row["photo_url"]) : undefined,
      apiToken: String(row["api_token"]),
      role: (row["role"] === "admin" ? "admin" : "user") as "user" | "admin",
      createdAt: Number(row["created_at"]),
      updatedAt: Number(row["updated_at"]),
    };
  }
}

export class AuthSessionRepository {
  constructor(private readonly db: ID1Database) {}

  public async create(token: string, createdAt: number = Date.now()): Promise<void> {
    const query = `
      INSERT INTO auth_sessions (token, status, created_at)
      VALUES (?, 'pending', ?)
      ON CONFLICT(token) DO UPDATE SET
        status = 'pending',
        created_at = excluded.created_at
    `;
    await this.db.prepare(query).bind(token, createdAt).run();
  }

  public async findByToken(token: string): Promise<AuthSession | null> {
    const row = await this.db
      .prepare("SELECT * FROM auth_sessions WHERE token = ? LIMIT 1")
      .bind(token)
      .first<Record<string, unknown>>();
    return row ? this.mapRowToSession(row) : null;
  }

  public async markAuthenticated(
    token: string,
    user: User,
    apiToken: string,
    authenticatedAt: number = Date.now()
  ): Promise<void> {
    const query = `
      UPDATE auth_sessions
      SET status = 'authenticated',
          telegram_id = ?,
          api_token = ?,
          user_json = ?,
          authenticated_at = ?
      WHERE token = ?
    `;
    await this.db
      .prepare(query)
      .bind(
        user.telegramId,
        apiToken,
        JSON.stringify(user),
        authenticatedAt,
        token
      )
      .run();
  }

  private mapRowToSession(row: Record<string, unknown>): AuthSession {
    return {
      token: String(row["token"]),
      status: String(row["status"]) as "pending" | "authenticated" | "expired",
      telegramId: row["telegram_id"] != null ? String(row["telegram_id"]) : undefined,
      apiToken: row["api_token"] != null ? String(row["api_token"]) : undefined,
      userJson: row["user_json"] != null ? String(row["user_json"]) : undefined,
      createdAt: Number(row["created_at"]),
      authenticatedAt: row["authenticated_at"] != null ? Number(row["authenticated_at"]) : undefined,
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

// -----------------------------------------------------------------------------
// System Settings Repository (Dynamic Telegram Bot & App Config)
// -----------------------------------------------------------------------------

export class SystemSettingsRepository {
  constructor(private readonly db: ID1Database) {}

  public async get(key: string): Promise<string | null> {
    const row = await this.db
      .prepare("SELECT value FROM system_settings WHERE key = ? LIMIT 1")
      .bind(key)
      .first<{ value: string }>();
    return row?.value ?? null;
  }

  public async set(key: string, value: string): Promise<void> {
    const now = Date.now();
    await this.db
      .prepare(
        `INSERT INTO system_settings (key, value, updated_at) 
         VALUES (?, ?, ?) 
         ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`
      )
      .bind(key, value, now)
      .run();
  }

  public async setMany(entries: Record<string, string>): Promise<void> {
    const now = Date.now();
    for (const [key, value] of Object.entries(entries)) {
      if (value !== undefined && value !== null) {
        await this.db
          .prepare(
            `INSERT INTO system_settings (key, value, updated_at) 
             VALUES (?, ?, ?) 
             ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`
          )
          .bind(key, String(value), now)
          .run();
      }
    }
  }

  public async getAll(): Promise<Record<string, string>> {
    const res = await this.db
      .prepare("SELECT key, value FROM system_settings")
      .all<{ key: string; value: string }>();
    const map: Record<string, string> = {};
    for (const row of res.results ?? []) {
      if (row.key) {
        map[row.key] = row.value;
      }
    }
    return map;
  }

  public async delete(key: string): Promise<boolean> {
    const res = await this.db
      .prepare("DELETE FROM system_settings WHERE key = ?")
      .bind(key)
      .run();
    const changes = (res.meta as { changes?: number } | undefined)?.changes;
    return changes != null ? changes > 0 : true;
  }
}



