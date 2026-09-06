/**
 * New Grad & Early Career Harvester
 * Sources high-quality entry-level & university graduate software engineering roles
 * from vetted open directories (SimplifyJobs 2025/2026 repository) and Midwest tech programs.
 */

import { ID1Database } from "../db/types.js";
import {
  CompanyRepository,
  CareerPageRepository,
  JobRepository,
  detectUsRegion,
} from "../db/repositories.js";
import {
  Company,
  Job,
  CareerPage,
  TechCategory,
  SeniorityLevel,
} from "../types/domain.js";
import {
  extractDomainFromUrl,
  inferTechCategory,
} from "./public-source-harvester.js";
import { NEW_GRAD_MIDWEST_SEEDS } from "../demo/newgrad-seeds.js";

export interface ParsedNewGradRow {
  companyName: string;
  companyDomain: string;
  websiteUrl: string;
  roleTitle: string;
  locations: string[];
  applyUrl: string;
  isClosed: boolean;
  categoryHint?: string;
}

export class NewGradHarvester {
  public static readonly REPO_README_URL =
    "https://raw.githubusercontent.com/SimplifyJobs/New-Grad-Positions/dev/README.md";

  /**
   * Fetch raw README content from SimplifyJobs/New-Grad-Positions
   */
  public async fetchRawReadme(): Promise<string | null> {
    try {
      const res = await fetch(NewGradHarvester.REPO_README_URL, {
        headers: { "User-Agent": "OffRadarJob-Harvester/1.0" },
      });
      if (!res.ok) return null;
      return await res.text();
    } catch (err) {
      console.error("[NewGradHarvester] Failed to fetch SimplifyJobs README:", err);
      return null;
    }
  }

  /**
   * Parse HTML / Markdown table rows from the README
   */
  public parseTableRows(htmlOrMarkdown: string, limit = 500): ParsedNewGradRow[] {
    const rows = htmlOrMarkdown.split(/<tr[^>]*>/i);
    const parsed: ParsedNewGradRow[] = [];

    for (const r of rows) {
      if (!r.includes("</td>")) continue;
      // Skip header rows
      if (r.includes("<th>") || r.includes("Role</th>")) continue;
      // Skip closed roles
      if (r.includes("🔒") || r.toLowerCase().includes("application is closed")) continue;

      // Extract all hrefs
      const hrefMatches = [...r.matchAll(/href="([^"]+)"/g)].map((m) => m[1] ?? "");
      
      // Filter out Simplify affiliate/profile links to find direct ATS application links
      const directApplyUrls = hrefMatches.filter(
        (url) => !url.includes("simplify.jobs/c/") && !url.includes("simplify.jobs/p/") && !url.includes("simplify.jobs/install")
      );
      const applyUrl = directApplyUrls[0] || hrefMatches[0];
      if (!applyUrl) continue;

      // Extract company name
      const companyMatch =
        r.match(/<td><strong><a[^>]*href="[^"]*"[^>]*>([^<]+)<\/a><\/strong><\/td>/i) ||
        r.match(/<td><strong>([^<]+)<\/strong><\/td>/i) ||
        r.match(/<td>([^<]+)<\/td>/i);

      let companyName = companyMatch ? (companyMatch[1] ?? "").trim() : "";
      // Strip emojis
      companyName = companyName.replace(/[🔥🛂🇺🇸🎓]/g, "").trim();
      if (!companyName || companyName.length < 2) continue;

      // Extract cells by <td>...</td>
      const tdMatches = [...r.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map((m) =>
        (m[1] ?? "")
          .replace(/<br\s*\/?>/gi, "\n")
          .replace(/<\/br>/gi, "\n")
          .replace(/<[^>]+>/g, " ")
          .replace(/&amp;/g, "&")
          .replace(/&lt;/g, "<")
          .replace(/&gt;/g, ">")
          .replace(/&#x27;/g, "'")
          .trim()
      );

      if (tdMatches.length < 3) continue;

      const roleTitle = tdMatches[1]?.replace(/\s+/g, " ").trim() ?? "";
      const rawLocation = tdMatches[2] ?? "";
      if (!roleTitle) continue;

      // Extract location array - split on newline or semicolon, preserving 'City, State' commas
      const locations = rawLocation
        .split(/\n|;/)
        .map((l) => l.trim())
        .filter((l) => l.length > 1);
      if (locations.length === 0) locations.push("US / Remote");

      // Infer domain
      let companyDomain = extractDomainFromUrl(applyUrl) || "";
      // If domain is generic ATS (e.g. greenhouse.io, ashbyhq.com, myworkdayjobs.com), synthesize clean domain
      if (
        !companyDomain ||
        companyDomain.includes("greenhouse.io") ||
        companyDomain.includes("ashbyhq.com") ||
        companyDomain.includes("lever.co") ||
        companyDomain.includes("myworkdayjobs.com") ||
        companyDomain.includes("eightfold.ai") ||
        companyDomain.includes("icims.com") ||
        companyDomain.includes("simplify.jobs")
      ) {
        const cleanSlug = companyName.toLowerCase().replace(/[^a-z0-9]/g, "");
        companyDomain = `${cleanSlug}.com`;
      }

      const websiteUrl = `https://${companyDomain}`;

      parsed.push({
        companyName,
        companyDomain,
        websiteUrl,
        roleTitle,
        locations,
        applyUrl,
        isClosed: false,
      });

      if (parsed.length >= limit) break;
    }

    return parsed;
  }

  /**
   * Determine if any location belongs to Midwest US
   */
  public isMidwestLocation(locations: string[]): boolean {
    const midwestIdentifiers = [
      "il", "illinois", "chicago",
      "in", "indiana", "indianapolis", "carmel",
      "wi", "wisconsin", "madison", "milwaukee", "verona",
      "mn", "minnesota", "minneapolis", "st. paul", "saint paul", "arden hills",
      "oh", "ohio", "columbus", "cleveland", "cincinnati", "lakewood",
      "mi", "michigan", "detroit", "ann arbor", "grand rapids",
      "ia", "iowa", "des moines", "moline", "urbandale", "cedar rapids",
      "mo", "missouri", "st. louis", "saint louis", "kansas city",
      "ne", "nebraska", "omaha", "lincoln",
      "ks", "kansas", "overland park", "wichita",
      "nd", "north dakota", "fargo",
      "sd", "south dakota", "sioux falls",
    ];

    for (const loc of locations) {
      const lower = loc.toLowerCase().replace(/[^a-z0-9\s]/g, " ");
      const words = lower.split(/\s+/);
      for (const id of midwestIdentifiers) {
        if (words.includes(id) || lower.includes(` ${id} `) || lower.startsWith(`${id} `) || lower.endsWith(` ${id}`)) {
          return true;
        }
      }
    }
    return false;
  }

  /**
   * Harvest and import New Grad jobs directly into D1 database
   */
  public async importNewGradRoles(
    db: ID1Database,
    limit = 350
  ): Promise<{ totalParsed: number; importedJobs: number; midwestJobs: number }> {
    const companyRepo = new CompanyRepository(db);
    const careerPageRepo = new CareerPageRepository(db);
    const jobRepo = new JobRepository(db);

    let totalParsed = 0;
    let importedJobs = 0;
    let midwestJobs = 0;
    const now = Date.now();

    // 1. First import curated Midwest Flagship New Grad Seeds
    for (const seed of NEW_GRAD_MIDWEST_SEEDS) {
      await companyRepo.upsert(seed.company);
      await careerPageRepo.upsert(seed.careerPage);
      for (const j of seed.jobs) {
        await jobRepo.upsert(j);
        importedJobs++;
        midwestJobs++;
      }
    }

    // 2. Fetch and parse online open positions from SimplifyJobs
    const rawReadme = await this.fetchRawReadme();
    if (!rawReadme) {
      return { totalParsed: NEW_GRAD_MIDWEST_SEEDS.length, importedJobs, midwestJobs };
    }

    const rows = this.parseTableRows(rawReadme, limit);
    totalParsed = rows.length;

    for (const row of rows) {
      try {
        const cleanCompId = `comp_ng_${row.companyDomain.replace(/[^a-z0-9]/g, "_")}`;
        const cleanPageId = `page_ng_${row.companyDomain.replace(/[^a-z0-9]/g, "_")}`;
        const primaryLoc = row.locations.slice(0, 3).join(" / ");
        const isMidwest = this.isMidwestLocation(row.locations);
        const usRegion = detectUsRegion(primaryLoc, primaryLoc, isMidwest ? "us_midwest" : "us_national", primaryLoc.toLowerCase().includes("remote"));

        const company: Company = {
          id: cleanCompId,
          domain: row.companyDomain,
          name: row.companyName,
          tagline: `Tech Employer (Hiring 2025/2026 New Grads)`,
          description: `${row.companyName} is actively hiring early-career software engineers and university graduates.`,
          websiteUrl: row.websiteUrl,
          industry: "Technology",
          techStack: ["TypeScript", "Python", "Java", "React", "Cloud"],
          socialLinks: {},
          contactEmail: null,
          headcountEstimate: "50-1000",
          locationHint: primaryLoc,
          discoverySource: "newgrad_directory",
          createdAt: now,
          updatedAt: now,
        };

        const careerPage: CareerPage = {
          id: cleanPageId,
          companyId: cleanCompId,
          url: row.applyUrl,
          pageType: "ats_embed",
          status: "active",
          contentHash: `hash_page_${cleanCompId}`,
          lastCheckedAt: now,
          createdAt: now,
        };

        const jobId = `job_ng_${cleanCompId}_${Math.abs(this.hashCode(row.roleTitle + primaryLoc))}`;
        const techCat = inferTechCategory(row.roleTitle, ["Software", "Engineering", "Algorithms"]);

        const job: Job = {
          id: jobId,
          companyId: cleanCompId,
          careerPageId: cleanPageId,
          title: row.roleTitle,
          department: "Engineering / Early Career",
          seniorityLevel: "new_grad",
          techCategory: techCat,
          isTechRole: true,
          employmentType: "full-time",
          location: primaryLoc,
          isRemote: primaryLoc.toLowerCase().includes("remote"),
          remoteScope: isMidwest ? "us_midwest" : "us_national",
          salaryMin: null,
          salaryMax: null,
          salaryCurrency: "USD",
          skills: ["Software Engineering", "Computer Science", "Algorithms", "Git"],
          descriptionSummary: `${row.companyName} is hiring a ${row.roleTitle} for 2025/2026 graduates in ${primaryLoc}. Direct ATS application link.`,
          rawContent: `Role: ${row.roleTitle}. Company: ${row.companyName}. Location: ${primaryLoc}. Application link: ${row.applyUrl}`,
          applyType: "url",
          applyTarget: row.applyUrl,
          status: "open",
          contentHash: `hash_${jobId}`,
          companyName: row.companyName,
          companyWebsite: row.websiteUrl,
          firstSeenAt: now,
          lastSeenAt: now,
          isMidwest,
          usRegion: isMidwest ? "midwest" : (usRegion as any),
        };

        await companyRepo.upsert(company);
        await careerPageRepo.upsert(careerPage);
        await jobRepo.upsert(job);

        importedJobs++;
        if (isMidwest) {
          midwestJobs++;
        }
      } catch (err) {
        console.warn(`[NewGradHarvester] Error importing job for ${row.companyName}:`, err);
      }
    }

    return { totalParsed, importedJobs, midwestJobs };
  }

  private hashCode(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    return hash;
  }
}
