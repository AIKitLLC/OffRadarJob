import { ID1Database } from "../db/types.js";
import {
  CompanyRepository,
  CareerPageRepository,
  JobRepository,
  LogRepository,
  CrawlTaskRepository,
} from "../db/repositories.js";
import { PipelineOrchestrator } from "../orchestrator/dispatcher.js";
import { Company, Job, SeniorityLevel, TechCategory, EmploymentType, ApplyType } from "../types/domain.js";
import { isIgnoredSourceDomain } from "../utils/source-policy.js";

// -----------------------------------------------------------------------------
// Public Harvester Domain Types
// -----------------------------------------------------------------------------

export interface InlineJobRole {
  title: string;
  location?: string | null;
  employmentType?: EmploymentType | null;
  applyTarget?: string | null;
  techCategory?: TechCategory | null;
  seniorityLevel?: SeniorityLevel | null;
}

export interface HarvestedCompanyProfile {
  name: string;
  domain: string;
  websiteUrl: string;
  careersUrl?: string | null;
  tagline?: string | null;
  description?: string | null;
  industry?: string | null;
  techStack: string[];
  socialLinks: Record<string, string>;
  contactEmail?: string | null;
  headcountEstimate?: string | null;
  locationHint?: string | null;
  discoverySource: string;
  fundingStage?: string | null | undefined;
  totalFunding?: string | null | undefined;
  valuationEstimate?: string | null | undefined;
  companyTier?: string | null | undefined;
  inlineRoles: InlineJobRole[];
}

export interface HarvestResult {
  source: string;
  companiesFound: number;
  companiesImported: number;
  jobsImported: number;
  companies: HarvestedCompanyProfile[];
}

export interface AlgoliaHit {
  objectID: string;
  parent_id?: number | string | null;
  story_id?: number | string | null;
  comment_text?: string | null;
  created_at?: string;
  author?: string;
}

// -----------------------------------------------------------------------------
// Utilities
// -----------------------------------------------------------------------------

export function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&#x2F;/gi, "/")
    .replace(/&#x27;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&amp;/gi, "&")
    .replace(/&#(\d+);/g, (_, dec) => {
      try {
        return String.fromCharCode(Number(dec));
      } catch {
        return "";
      }
    });
}

export function sanitizeEmail(rawEmail?: string | null): string | null {
  if (!rawEmail) return null;
  const clean = rawEmail.trim().toLowerCase();
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(clean)) return null;
  if (clean.includes("example.com") || clean.includes("domain.com") || clean.includes("yoursite.com")) {
    return null;
  }
  return clean;
}

export function extractDomainFromUrl(urlStr: string): string | null {
  try {
    const parsed = new URL(urlStr.startsWith("http") ? urlStr : `https://${urlStr}`);
    return parsed.hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return null;
  }
}

const COMMON_TECH_KEYWORDS = [
  "TypeScript", "JavaScript", "Python", "Rust", "Go", "Golang", "C++",
  "React", "Next.js", "Vue", "Svelte", "Node.js", "Ruby", "Rails",
  "Tailwind", "PostgreSQL", "SQLite", "Cloudflare", "AWS", "GCP", "Docker",
  "Kubernetes", "GraphQL", "PyTorch", "TensorFlow", "LLM", "AI", "Machine Learning",
  "WebRTC", "Kafka", "Redis", "Elixir", "Django", "FastAPI", "Swift", "Kotlin"
];

function detectTechStackFromText(text: string): string[] {
  const found = new Set<string>();
  const lower = text.toLowerCase();

  for (const tech of COMMON_TECH_KEYWORDS) {
    const techLower = tech.toLowerCase();
    const regex = new RegExp(`\\b${techLower.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
    if (regex.test(lower)) {
      found.add(tech);
    }
  }

  return Array.from(found);
}

export function inferSeniority(title: string): SeniorityLevel {
  const t = title.toLowerCase();
  // 1. Internships
  if (t.includes("intern") || t.includes("co-op") || t.includes("trainee")) return "intern";

  // 2. New Grad / Early Career / Entry Level (check before senior / lead to avoid false positives)
  if (
    t.includes("new grad") ||
    t.includes("new-grad") ||
    t.includes("new graduate") ||
    t.includes("recent grad") ||
    t.includes("recent graduate") ||
    t.includes("fresh grad") ||
    t.includes("fresh graduate") ||
    t.includes("entry-level") ||
    t.includes("entry level") ||
    t.includes("early career") ||
    t.includes("early-career") ||
    t.includes("college grad") ||
    t.includes("university grad") ||
    t.includes("campus") ||
    t.includes("rotational") ||
    t.includes("apprentice") ||
    t.includes("engineering resident") ||
    t.includes("class of 202") ||
    /\b(swe|engineer|developer)\s*(1|i)\b/i.test(t) ||
    t.includes("associate software engineer") ||
    t.includes("associate developer") ||
    t.includes("associate engineer") ||
    t.includes("graduate software engineer") ||
    t.includes("graduate developer") ||
    t.includes("graduate engineer")
  ) {
    return "new_grad";
  }

  // 3. Junior
  if (t.includes("junior") || t.includes("jr.") || t.includes("jr ") || t.includes("associate")) {
    return "junior";
  }

  // 4. Founding / Executive
  if (t.includes("founding") || t.includes("founder") || t.includes("head of") || t.includes("director")) return "founding";

  // 5. Staff / Lead / Principal
  if (t.includes("staff") || t.includes("principal") || t.includes("lead") || t.includes("architect")) return "lead";

  // 6. Senior
  if (t.includes("senior") || t.includes("sr.") || t.includes("sr ")) return "senior";

  return "mid";
}

export function inferTechCategory(title: string, skills: string[]): TechCategory {
  const t = title.toLowerCase();
  const allText = `${t} ${skills.join(" ").toLowerCase()}`;

  if (allText.includes("ai") || allText.includes("ml") || allText.includes("machine learning") || allText.includes("data science") || allText.includes("llm")) {
    return "ai_ml";
  }
  if (t.includes("devops") || t.includes("cloud") || t.includes("platform") || t.includes("infrastructure") || t.includes("sre") || t.includes("security")) {
    return "devops_cloud";
  }
  if (t.includes("frontend") || t.includes("front-end") || t.includes("ui") || t.includes("react") || t.includes("vue")) {
    return "frontend_ui";
  }
  if (t.includes("backend") || t.includes("back-end") || t.includes("distributed") || t.includes("systems") || t.includes("data engineer")) {
    return "backend_systems";
  }
  if (t.includes("design") || t.includes("product designer") || t.includes("ux")) {
    return "product_design";
  }
  return "fullstack";
}

// -----------------------------------------------------------------------------
// 1. Hacker News "Who is Hiring" Harvester
// -----------------------------------------------------------------------------

export class HackerNewsHarvester {
  private readonly baseUrl = "https://hn.algolia.com/api/v1";

  /**
   * Fetch latest "Ask HN: Who is hiring?" thread story metadata
   */
  public async fetchLatestHiringStory(): Promise<{ id: string; title: string; numComments: number } | null> {
    try {
      const url = `${this.baseUrl}/search_by_date?tags=story,author_whoishiring&hitsPerPage=5`;
      const res = await fetch(url, {
        headers: { "User-Agent": "OffRadarJobHarvester/1.0" },
      });
      if (!res.ok) return null;

      const data = (await res.json()) as { hits?: Array<{ objectID: string; title?: string; num_comments?: number }> };
      const hiringStories = (data.hits ?? []).filter((h) => h.title && h.title.toLowerCase().includes("who is hiring"));
      const latest = hiringStories[0];
      if (!latest) return null;

      return {
        id: latest.objectID,
        title: latest.title ?? "Ask HN: Who is hiring?",
        numComments: latest.num_comments ?? 0,
      };
    } catch (err) {
      console.error("[HackerNewsHarvester] Failed to fetch latest hiring story:", err);
      return null;
    }
  }

  /**
   * Harvest top-level comments from an HN hiring story
   */
  public async harvestStoryComments(storyId: string, limit = 30): Promise<HarvestedCompanyProfile[]> {
    try {
      // Top-level comments have parent_id == story_id
      const queryLimit = Math.min(Math.max(limit * 2, 30), 100);
      const url = `${this.baseUrl}/search?tags=comment,story_${storyId}&hitsPerPage=${queryLimit}`;
      const res = await fetch(url, {
        headers: { "User-Agent": "OffRadarJobHarvester/1.0" },
      });
      if (!res.ok) return [];

      const data = (await res.json()) as { hits?: AlgoliaHit[] };
      const hits = data.hits ?? [];

      const profiles: HarvestedCompanyProfile[] = [];
      const seenDomains = new Set<string>();

      for (const hit of hits) {
        // Ensure top-level comment (direct posting by hiring company)
        if (hit.parent_id && String(hit.parent_id) !== String(storyId)) {
          continue;
        }

        const profile = this.parseHnComment(hit);
        if (profile && !seenDomains.has(profile.domain)) {
          seenDomains.add(profile.domain);
          profiles.push(profile);
          if (profiles.length >= limit) break;
        }
      }

      return profiles;
    } catch (err) {
      console.error(`[HackerNewsHarvester] Failed to harvest comments for story ${storyId}:`, err);
      return [];
    }
  }

  /**
   * Parse an individual HN comment into a structured Company Profile
   */
  public parseHnComment(hit: AlgoliaHit): HarvestedCompanyProfile | null {
    const rawText = hit.comment_text;
    if (!rawText || rawText.trim().length < 30) return null;

    const decoded = decodeHtmlEntities(rawText);

    // 1. Extract all URLs in the comment
    const urlMatches = decoded.match(/https?:\/\/[^\s<">')]+/gi) || [];
    const cleanUrls = Array.from(new Set(urlMatches.map((u) => u.replace(/[.,;:]$/, ""))));

    // 2. Extract Header line (before first <p> or newline)
    const headerHtml = decoded.split(/<p>|\n/i)[0] ?? "";
    const cleanHeader = headerHtml.replace(/<[^>]+>/g, " ").trim();

    // Check pipe-separated format: Company | Role | Location | ...
    const pipeParts = cleanHeader.split("|").map((p) => p.trim()).filter(Boolean);
    if (pipeParts.length < 2) {
      // Fallback: Check if first line contains "is hiring" or markdown
      return null;
    }

    const rawCompanyName = pipeParts[0]!.replace(/^[-*•\s]+/, "").replace(/[-*•\s]+$/, "").trim();
    if (!rawCompanyName || rawCompanyName.length > 50 || rawCompanyName.toLowerCase().includes("hiring")) {
      return null;
    }

    // Role candidate
    const rawRole = pipeParts[1] ?? "Software Engineer";
    const rawLocation = pipeParts[2] ?? (decoded.toLowerCase().includes("remote") ? "Remote" : "US");

    // 3. Separate candidate careers URL vs website URL
    let websiteUrl: string | null = null;
    let careersUrl: string | null = null;

    for (const u of cleanUrls) {
      const lower = u.toLowerCase();
      const isAtsOrCareers =
        lower.includes("/careers") ||
        lower.includes("/jobs") ||
        lower.includes("ashbyhq.com") ||
        lower.includes("greenhouse.io") ||
        lower.includes("lever.co") ||
        lower.includes("bamboohr.com") ||
        lower.includes("workable.com") ||
        lower.includes("notion.site");

      if (isAtsOrCareers && !careersUrl) {
        careersUrl = u;
      } else if (!websiteUrl && !lower.includes("news.ycombinator.com") && !lower.includes("github.com/")) {
        websiteUrl = u;
      }
    }

    // Fallback domain derivation
    let domain: string | null = null;
    if (websiteUrl) {
      domain = extractDomainFromUrl(websiteUrl);
    }
    if (!domain && careersUrl) {
      const parsedCareersDomain = extractDomainFromUrl(careersUrl);
      if (parsedCareersDomain && !parsedCareersDomain.includes("ashbyhq.com") && !parsedCareersDomain.includes("greenhouse.io")) {
        domain = parsedCareersDomain;
      }
    }
    if (!domain) {
      // Clean company name to create domain
      domain = `${rawCompanyName.toLowerCase().replace(/[^a-z0-9]/g, "")}.com`;
    }

    if (!websiteUrl) {
      websiteUrl = `https://${domain}`;
    }

    // 4. Extract contact email
    const emailMatch = decoded.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/i);
    const contactEmail = sanitizeEmail(emailMatch ? emailMatch[0] : null);

    // 5. Extract Tech Stack
    const techStack = detectTechStackFromText(decoded);

    // 6. Extract description snippet (plain text, strip tags, 250 chars)
    const plainDescription = decoded
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .substring(0, 300);

    // 7. Extract inline job role
    const inlineRoles: InlineJobRole[] = [];
    if (rawRole && rawRole.length > 2 && rawRole.length < 80) {
      inlineRoles.push({
        title: rawRole,
        location: rawLocation,
        employmentType: decoded.toLowerCase().includes("contract") ? "contract" : "full-time",
        applyTarget: careersUrl ?? contactEmail ?? websiteUrl,
        seniorityLevel: inferSeniority(rawRole),
        techCategory: inferTechCategory(rawRole, techStack),
      });
    }

    // 8. Extract Funding & Valuation
    let fundingStage: string | null = null;
    let totalFunding: string | null = null;
    let valuationEstimate: string | null = null;
    let companyTier: string | null = null;
    const lowerDecoded = decoded.toLowerCase();

    if (lowerDecoded.includes("bootstrapped") || lowerDecoded.includes("profitable") || lowerDecoded.includes("self-funded")) {
      fundingStage = "Bootstrapped";
      companyTier = "Bootstrapped SMB";
    } else if (lowerDecoded.match(/\bseries\s+c\b/i)) {
      fundingStage = "Series C+";
      companyTier = "Late Stage Tech";
    } else if (lowerDecoded.match(/\bseries\s+b\b/i)) {
      fundingStage = "Series B";
      companyTier = "Growth Stage Tech";
    } else if (lowerDecoded.match(/\bseries\s+a\b/i)) {
      fundingStage = "Series A";
      companyTier = "Early Growth";
    } else if (lowerDecoded.match(/\b(?:seed\s+round|seed\s+funded|pre-seed)\b/i) || lowerDecoded.includes("yc ")) {
      fundingStage = "Seed";
      companyTier = "Seed Startup";
    }

    const raisedM = decoded.match(/raised\s+(\$(?:[0-9]{1,3}(?:\.[0-9]+)?)\s*(?:million|billion|M|B|K)?)/i);
    if (raisedM && raisedM[1]) totalFunding = raisedM[1].trim();

    const valM = decoded.match(/valued\s+at\s+(\$(?:[0-9]{1,3}(?:\.[0-9]+)?)\s*(?:million|billion|M|B|K)?)/i);
    if (valM && valM[1]) valuationEstimate = valM[1].trim();

    return {
      name: rawCompanyName,
      domain,
      websiteUrl,
      careersUrl,
      tagline: `Hiring on Hacker News: ${rawRole}`,
      description: plainDescription,
      industry: "Technology",
      techStack,
      socialLinks: {},
      contactEmail,
      headcountEstimate: "1-25",
      locationHint: rawLocation,
      discoverySource: "hn_whoishiring",
      fundingStage,
      totalFunding,
      valuationEstimate,
      companyTier,
      inlineRoles,
    };
  }
}

// -----------------------------------------------------------------------------
// 2. GitHub Open Directories Harvester (`remoteintech` & `established-remote`)
// -----------------------------------------------------------------------------

export class GitHubDirectoryHarvester {
  private readonly establishedRemoteUrl =
    "https://raw.githubusercontent.com/yanirs/established-remote/master/README.md";

  // Vetted selection of boutique and micro tech firms from `remoteintech/remote-jobs`
  private readonly vettedSlugs = [
    "adaface",
    "aerolab",
    "aerostrat",
    "aestudio",
    "aiir",
    "airgarage",
    "ably",
    "airbyte",
    "10up",
    "37signals",
    "doist",
    "duckduckgo",
    "buf",
    "breezy-hr",
    "close",
    "ghost",
    "knapsack",
    "linear",
    "postman",
    "prisma",
    "supabase",
    "transistor",
    "vizzuality",
    "zapier"
  ];

  /**
   * Harvest companies from yanirs/established-remote markdown table
   */
  public async harvestEstablishedRemote(limit = 30): Promise<HarvestedCompanyProfile[]> {
    try {
      const res = await fetch(this.establishedRemoteUrl, {
        headers: { "User-Agent": "OffRadarJobHarvester/1.0" },
      });
      if (!res.ok) return [];

      const markdown = await res.text();
      return this.parseEstablishedRemoteMarkdown(markdown, limit);
    } catch (err) {
      console.error("[GitHubDirectoryHarvester] Failed to harvest established-remote:", err);
      return [];
    }
  }

  /**
   * Parse the Markdown table from established-remote
   */
  public parseEstablishedRemoteMarkdown(markdown: string, limit = 30): HarvestedCompanyProfile[] {
    const lines = markdown.split("\n");
    const profiles: HarvestedCompanyProfile[] = [];

    for (const line of lines) {
      if (!line.includes("|") || line.startsWith("#") || line.startsWith("---") || line.includes("Company | Industry")) {
        continue;
      }

      let cols = line.split("|").map((c) => c.trim());
      if (cols[0] === "") cols.shift();
      if (cols.length > 0 && cols[cols.length - 1] === "") cols.pop();
      if (cols.length < 5) continue;

      const compCol = cols[0] ?? "";
      const industryCol = cols[1] ?? "";
      const techCol = cols[2] ?? "";
      const jobsCol = cols[4] ?? "";

      // Match [Name](Url)
      const compMatch = compCol.match(/\[([^\]]+)\]\(([^)]+)\)/);
      if (!compMatch) continue;

      const name = compMatch[1]!.trim();
      const websiteUrl = compMatch[2]!.trim();
      const domain = extractDomainFromUrl(websiteUrl);
      if (!domain) continue;

      // Match [Jobs](CareersUrl)
      const jobsMatch = jobsCol.match(/\[Jobs\]\(([^)]+)\)/i);
      const careersUrl = jobsMatch ? jobsMatch[1]!.trim() : null;

      // Extract tech stack
      const rawTechs = techCol.split(",").map((t) => t.trim()).filter((t) => t.length > 0 && t !== "etc..");

      profiles.push({
        name,
        domain,
        websiteUrl,
        careersUrl,
        tagline: industryCol || "Remote Tech Company",
        description: `Established remote company operating in ${industryCol}.`,
        industry: industryCol || "Software",
        techStack: rawTechs.length > 0 ? rawTechs : ["TypeScript", "Fullstack"],
        socialLinks: {},
        contactEmail: null,
        headcountEstimate: "10-100",
        locationHint: "Remote / Worldwide",
        discoverySource: "github_directory",
        inlineRoles: [],
      });

      if (profiles.length >= limit) break;
    }

    return profiles;
  }

  /**
   * Harvest companies from remoteintech/remote-jobs markdown files
   */
  public async harvestRemoteInTech(limit = 15): Promise<HarvestedCompanyProfile[]> {
    const slugs = this.vettedSlugs.slice(0, limit);
    const profiles: HarvestedCompanyProfile[] = [];

    for (const slug of slugs) {
      try {
        const url = `https://cdn.jsdelivr.net/gh/remoteintech/remote-jobs@main/src/companies/${slug}.md`;
        const res = await fetch(url, {
          headers: { "User-Agent": "OffRadarJobHarvester/1.0" },
        });
        if (!res.ok) continue;

        const content = await res.text();
        const profile = this.parseRemoteInTechMarkdown(content);
        if (profile) {
          profiles.push(profile);
        }
      } catch (err) {
        console.error(`[GitHubDirectoryHarvester] Error fetching slug ${slug}:`, err);
      }
    }

    return profiles;
  }

  /**
   * Parse a single remote-in-tech markdown file
   */
  public parseRemoteInTechMarkdown(content: string): HarvestedCompanyProfile | null {
    const titleMatch = content.match(/title:\s*["']?([^"'\n]+)["']?/i);
    const websiteMatch = content.match(/website:\s*([^\n\r]+)/i);
    if (!titleMatch || !websiteMatch) return null;

    const name = titleMatch[1]!.trim();
    const websiteUrl = websiteMatch[1]!.trim();
    const domain = extractDomainFromUrl(websiteUrl);
    if (!domain) return null;

    const careersMatch = content.match(/careers_url:\s*([^\n\r]+)/i);
    const careersUrl = careersMatch ? careersMatch[1]!.trim() : null;

    const regionMatch = content.match(/region:\s*([^\n\r]+)/i);
    const region = regionMatch ? regionMatch[1]!.trim() : "Worldwide";

    const sizeMatch = content.match(/company_size:\s*([^\n\r]+)/i);
    const size = sizeMatch ? sizeMatch[1]!.trim() : "small";

    // Extract blurb from ## Company blurb
    const blurbMatch = content.match(/## Company blurb\s*\n\s*([^#]+)/i);
    const description = blurbMatch ? blurbMatch[1]!.trim().substring(0, 300) : `${name} remote engineering team.`;

    // Extract technologies list
    const techStack = detectTechStackFromText(content);

    return {
      name,
      domain,
      websiteUrl,
      careersUrl,
      tagline: `Remote engineering studio (${size})`,
      description,
      industry: "Software & Services",
      techStack: techStack.length > 0 ? techStack : ["TypeScript", "Web"],
      socialLinks: {},
      contactEmail: null,
      headcountEstimate: size,
      locationHint: region,
      discoverySource: "github_directory",
      inlineRoles: [],
    };
  }
}

// -----------------------------------------------------------------------------
// 3. Y Combinator Active Startups Harvester
// -----------------------------------------------------------------------------

/** The public directory is a JSON array. Some responses wrap it, and stubs may not. */
function companyDirectoryEntries(payload: unknown): any[] | null {
  if (Array.isArray(payload)) return payload;
  if (payload && typeof payload === "object" && Array.isArray((payload as { companies?: unknown }).companies)) {
    return (payload as { companies: any[] }).companies;
  }
  return null;
}

export class YcHarvester {
  public async harvestYcStartups(limit = 20): Promise<HarvestedCompanyProfile[]> {
    try {
      const res = await fetch("https://yc-oss.github.io/api/companies/all.json", {
        headers: { "User-Agent": "OffRadarJob-Expander/1.0" },
      });
      if (!res.ok) return [];

      const list = companyDirectoryEntries(await res.json());
      if (!list) return [];
      const activeList = list.filter((c) => c.status === "Active" && c.website);
      const dayOfMonth = new Date().getUTCDate();
      const startIndex = (dayOfMonth * limit) % Math.max(1, activeList.length - limit);
      const slice = activeList.slice(startIndex, startIndex + limit);

      const profiles: HarvestedCompanyProfile[] = [];
      for (const c of slice) {
        const domain = extractDomainFromUrl(c.website);
        if (!domain) continue;

        let fundingStage = "Seed";
        let companyTier = "Seed Startup";
        if (c.stage === "Growth") {
          fundingStage = "Series B";
          companyTier = "Growth Stage Tech";
        } else if (c.stage === "Early") {
          fundingStage = "Series A";
          companyTier = "Early Growth";
        }

        profiles.push({
          name: c.name || domain,
          domain,
          websiteUrl: c.website.startsWith("http") ? c.website : `https://${c.website}`,
          tagline: c.one_liner || null,
          description: c.long_description || c.one_liner || null,
          industry: c.industries && c.industries[0] ? c.industries[0] : "Technology",
          techStack: Array.isArray(c.tags) ? c.tags.slice(0, 10) : [],
          socialLinks: {},
          contactEmail: null,
          headcountEstimate: c.team_size ? `${c.team_size}-${c.team_size}` : "1-20",
          locationHint: c.regions && c.regions[0] ? c.regions[0] : "Remote",
          discoverySource: "yc_directory",
          fundingStage,
          companyTier,
          valuationEstimate: c.isHiring ? "Active Hiring" : undefined,
          inlineRoles: [],
        });
      }

      return profiles;
    } catch (err) {
      console.error("[YcHarvester] Failed fetching YC companies:", err);
      return [];
    }
  }
}

// -----------------------------------------------------------------------------
// 4. Public Source Manager (Orchestrates Harvesting, Ingest & Pipeline Dispatch)
// -----------------------------------------------------------------------------

export class PublicSourceManager {
  private readonly hnHarvester: HackerNewsHarvester;
  private readonly ghHarvester: GitHubDirectoryHarvester;
  private readonly ycHarvester: YcHarvester;

  public readonly companyRepo: CompanyRepository;
  public readonly careerPageRepo: CareerPageRepository;
  public readonly jobRepo: JobRepository;
  public readonly logRepo: LogRepository;
  public readonly taskRepo: CrawlTaskRepository;

  constructor(private readonly db: ID1Database) {
    this.companyRepo = new CompanyRepository(db);
    this.careerPageRepo = new CareerPageRepository(db);
    this.jobRepo = new JobRepository(db);
    this.logRepo = new LogRepository(db);
    this.taskRepo = new CrawlTaskRepository(db);

    this.hnHarvester = new HackerNewsHarvester();
    this.ghHarvester = new GitHubDirectoryHarvester();
    this.ycHarvester = new YcHarvester();
  }

  /**
   * Harvest profiles from chosen public source
   */
  public async harvestProfiles(
    source: "hn" | "github" | "yc" | "all" = "all",
    limit = 20
  ): Promise<HarvestedCompanyProfile[]> {
    const profiles: HarvestedCompanyProfile[] = [];

    if (source === "hn" || source === "all") {
      const story = await this.hnHarvester.fetchLatestHiringStory();
      if (story) {
        const hnLimit = source === "all" ? Math.floor(limit / 3) : limit;
        const hnProfiles = await this.hnHarvester.harvestStoryComments(story.id, hnLimit);
        profiles.push(...hnProfiles);
      }
    }

    if (source === "github" || source === "all") {
      const ghLimit = source === "all" ? Math.ceil(limit / 3) : limit;
      const [estProfiles, ritProfiles] = await Promise.all([
        this.ghHarvester.harvestEstablishedRemote(Math.ceil(ghLimit / 2)),
        this.ghHarvester.harvestRemoteInTech(Math.floor(ghLimit / 2)),
      ]);
      profiles.push(...estProfiles, ...ritProfiles);
    }

    if (source === "yc" || source === "all") {
      const ycLimit = source === "all" ? Math.max(5, Math.floor(limit / 3)) : limit;
      const ycProfiles = await this.ycHarvester.harvestYcStartups(ycLimit);
      profiles.push(...ycProfiles);
    }

    // Deduplicate by domain
    const unique = new Map<string, HarvestedCompanyProfile>();
    for (const p of profiles) {
      if (
        isIgnoredSourceDomain(p.domain) ||
        isIgnoredSourceDomain(p.websiteUrl) ||
        isIgnoredSourceDomain(p.careersUrl)
      ) continue;
      if (!unique.has(p.domain)) {
        unique.set(p.domain, p);
      }
    }

    return Array.from(unique.values()).slice(0, limit);
  }

  /**
   * Ingest harvested profiles into D1 database, save direct jobs & career pages
   */
  public async ingestProfiles(
    profiles: HarvestedCompanyProfile[]
  ): Promise<{
    importedCompanies: Company[];
    directJobsCount: number;
    targetsToCrawl: Array<{ companyId: string; url: string; careersUrl?: string }>;
  }> {
    const importedCompanies: Company[] = [];
    let directJobsCount = 0;
    const targetsToCrawl: Array<{ companyId: string; url: string; careersUrl?: string }> = [];

    const now = Date.now();

    for (const p of profiles) {
      if (
        isIgnoredSourceDomain(p.domain) ||
        isIgnoredSourceDomain(p.websiteUrl) ||
        isIgnoredSourceDomain(p.careersUrl)
      ) continue;

      // Reuse existing company ID if already present in DB to avoid FOREIGN KEY constraint failures
      const existingCompany = await this.companyRepo.findByDomain(p.domain);
      const companyId = existingCompany?.id ?? `comp_${p.domain.replace(/[^a-z0-9]/g, "_")}`;

      const company: Company = {
        id: companyId,
        domain: p.domain,
        name: p.name,
        tagline: p.tagline ?? undefined,
        description: p.description ?? undefined,
        websiteUrl: p.websiteUrl,
        industry: p.industry ?? "Technology",
        techStack: p.techStack,
        socialLinks: p.socialLinks,
        contactEmail: p.contactEmail ?? undefined,
        headcountEstimate: p.headcountEstimate ?? undefined,
        locationHint: p.locationHint ?? undefined,
        discoverySource: p.discoverySource,
        fundingStage: p.fundingStage ?? existingCompany?.fundingStage,
        totalFunding: p.totalFunding ?? existingCompany?.totalFunding,
        valuationEstimate: p.valuationEstimate ?? existingCompany?.valuationEstimate,
        companyTier: p.companyTier ?? existingCompany?.companyTier,
        primaryDepartment: existingCompany?.primaryDepartment,
        hiringDepartments: existingCompany?.hiringDepartments,
        createdAt: now,
        updatedAt: now,
      };

      await this.companyRepo.upsert(company);
      importedCompanies.push(company);

      // Ingest career page if available
      let careerPageId: string | null = null;
      if (p.careersUrl) {
        careerPageId = `page_${companyId}_public`;
        await this.careerPageRepo.upsert({
          id: careerPageId,
          companyId,
          url: p.careersUrl,
          pageType: "custom",
          status: "active",
          lastCheckedAt: now,
          createdAt: now,
        });
      } else if (p.inlineRoles && p.inlineRoles.length > 0) {
        careerPageId = `page_${companyId}_direct`;
        await this.careerPageRepo.upsert({
          id: careerPageId,
          companyId,
          url: p.websiteUrl,
          pageType: "internal_page",
          status: "active",
          lastCheckedAt: now,
          createdAt: now,
        });
      }

      // If source provided direct inline roles (e.g. HN hiring comment), ingest them directly
      for (const role of p.inlineRoles) {
        const title = role.title.trim();
        const contentHash = `hash_${companyId}_${title.toLowerCase().replace(/[^a-z0-9]/g, "_")}`;
        const jobId = `job_${companyId}_${contentHash.substring(0, 16)}`;

        const job: Job = {
          id: jobId,
          companyId,
          careerPageId: careerPageId ?? `page_${companyId}_direct`,
          title,
          department: role.techCategory ? (role.techCategory.includes("design") ? "Product & Design" : "Engineering") : "Engineering",
          seniorityLevel: role.seniorityLevel ?? inferSeniority(title),
          techCategory: role.techCategory ?? inferTechCategory(title, p.techStack),
          isTechRole: true,
          employmentType: role.employmentType ?? "full-time",
          location: role.location ?? p.locationHint ?? "Remote",
          isRemote: true,
          remoteScope: "worldwide",
          skills: p.techStack,
          descriptionSummary: p.description ?? `${p.name} is hiring for ${title}`,
          applyType: (role.applyTarget?.includes("@") ? "email" : "url") as ApplyType,
          applyTarget: role.applyTarget || p.careersUrl || p.websiteUrl,
          status: "open",
          contentHash,
          firstSeenAt: now,
          lastSeenAt: now,
        };

        if (await this.jobRepo.upsert(job)) {
          directJobsCount++;
        }
      }

      if (p.inlineRoles && p.inlineRoles.length > 0) {
        try {
          await this.companyRepo.recalculateDepartmentWeights(companyId);
        } catch {}
      }

      targetsToCrawl.push({
        companyId,
        url: p.careersUrl || p.websiteUrl,
        ...(p.careersUrl ? { careersUrl: p.careersUrl } : {}),
      });
    }

    return {
      importedCompanies,
      directJobsCount,
      targetsToCrawl,
    };
  }

  /**
   * End-to-end: Harvest from public source, ingest companies & feed direct websites to PipelineOrchestrator
   */
  public async harvestAndGatherAsync(
    source: "hn" | "github" | "yc" | "all" = "all",
    limit = 20,
    orchestrator?: PipelineOrchestrator
  ): Promise<{
    source: string;
    companiesHarvested: number;
    directJobsCount: number;
    crawledJobsCount: number;
    taskIds: string[];
  }> {
    const startTime = Date.now();
    const profiles = await this.harvestProfiles(source, limit);
    const { importedCompanies, directJobsCount, targetsToCrawl } = await this.ingestProfiles(profiles);

    const actualOrchestrator = orchestrator ?? new PipelineOrchestrator(this.db);
    const taskIds: string[] = [];
    let crawledJobsCount = 0;

    for (const target of targetsToCrawl) {
      const taskId = `task_harvest_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      taskIds.push(taskId);

      await this.taskRepo.create({
        id: taskId,
        targetUrl: target.url,
        sourceType: `harvest_${source}`,
        status: "pending",
        companyId: target.companyId,
        jobsFound: 0,
        metadata: { careersUrl: target.careersUrl, directWebsite: target.url },
        createdAt: Date.now(),
      });

      try {
        const result = await actualOrchestrator.processSeedAsync(
          target.url,
          `harvest_${source}`,
          taskId
        );
        crawledJobsCount += result.jobs.length;
      } catch (err) {
        console.error(`[PublicSourceManager] Pipeline run failed for ${target.url}:`, err);
      }
    }

    await this.logRepo.log({
      id: `log_harvest_${Date.now()}`,
      agentName: "public_source_manager",
      targetUrl: `harvest://${source}`,
      status: "success",
      durationMs: Date.now() - startTime,
      message: `Harvested ${importedCompanies.length} companies from ${source}. Ingested ${directJobsCount} direct jobs and crawled ${crawledJobsCount} web jobs.`,
      metadata: {
        source,
        companiesCount: importedCompanies.length,
        directJobsCount,
        crawledJobsCount,
        taskIds,
      },
      createdAt: Date.now(),
    });

    return {
      source,
      companiesHarvested: importedCompanies.length,
      directJobsCount,
      crawledJobsCount,
      taskIds,
    };
  }
}
