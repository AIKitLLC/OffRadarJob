import * as cheerio from "cheerio";
import { BaseAgent } from "./base.js";
import {
  Result,
  Ok,
  Err,
  Job,
  EmploymentType,
  ApplyType,
  SeniorityLevel,
  TechCategory,
} from "../types/domain.js";
import { ExtractMessage } from "../types/queues.js";
import { JobRepository, LogRepository, CompanyRepository } from "../db/repositories.js";
import { isIgnoredSourceDomain } from "../utils/source-policy.js";

const TECH_SKILLS = [
  "TypeScript", "JavaScript", "Python", "Rust", "Go", "Golang", "C++",
  "React", "Next.js", "Vue", "Svelte", "Node.js", "Ruby", "Rails",
  "Tailwind", "PostgreSQL", "SQLite", "Cloudflare", "AWS", "Docker",
  "Kubernetes", "GraphQL", "Figma", "UI/UX", "Solidity", "iOS", "Android",
  "Swift", "Kotlin", "Flutter", "Machine Learning", "LLM", "AI"
];

export class JobExtractorAgent extends BaseAgent {
  public readonly name = "job_extractor_agent";

  constructor(
    private readonly jobRepo: JobRepository,
    logRepo?: LogRepository,
    private readonly companyRepo?: CompanyRepository
  ) {
    super(logRepo);
  }

  public async process(msg: ExtractMessage): Promise<Result<Job[], Error>> {
    const startTime = Date.now();
    const targetUrl = msg.careerPageUrl;

    try {
      if (isIgnoredSourceDomain(targetUrl)) {
        await this.recordLog(
          targetUrl,
          "warning",
          Date.now() - startTime,
          `Skipped blocked source domain: ${targetUrl}`
        );
        return Ok([]);
      }

      const fetchResult = await this.safeFetch(targetUrl, { timeoutMs: 8000 });
      if (!fetchResult.ok) {
        await this.recordLog(
          targetUrl,
          "error",
          Date.now() - startTime,
          `Failed to fetch career page: ${fetchResult.error.message}`
        );
        return Err(fetchResult.error);
      }

      const html = fetchResult.value;
      const $ = cheerio.load(html);

      const rawJobs = this.extractJobItems($, targetUrl);
      const jobs: Job[] = [];
      const now = Date.now();

      for (const raw of rawJobs) {
        const contentHash = await this.generateContentHash(
          msg.companyId,
          raw.title,
          raw.applyTarget
        );

        const job: Job = {
          id: `job_${msg.companyId}_${contentHash.substring(0, 12)}`,
          companyId: msg.companyId,
          careerPageId: msg.careerPageId,
          title: raw.title,
          department: raw.department,
          seniorityLevel: raw.seniorityLevel,
          techCategory: raw.techCategory,
          isTechRole: raw.isTechRole,
          employmentType: raw.employmentType,
          location: raw.location,
          isRemote: raw.isRemote,
          remoteScope: raw.remoteScope,
          salaryMin: raw.salaryMin,
          salaryMax: raw.salaryMax,
          salaryCurrency: raw.salaryCurrency,
          skills: raw.skills,
          descriptionSummary: raw.descriptionSummary,
          rawContent: raw.rawContent,
          applyType: raw.applyType,
          applyTarget: raw.applyTarget,
          status: "open",
          contentHash,
          firstSeenAt: now,
          lastSeenAt: now,
        };

        await this.jobRepo.upsert(job);
        jobs.push(job);
      }

      if (this.companyRepo && jobs.length > 0) {
        try {
          await this.companyRepo.recalculateDepartmentWeights(msg.companyId);
        } catch (recalcErr) {
          console.warn(`[JobExtractorAgent] Failed to recalculate department weights for ${msg.companyId}:`, recalcErr);
        }
      }

      await this.recordLog(
        targetUrl,
        "success",
        Date.now() - startTime,
        `Extracted ${jobs.length} jobs for company ${msg.companyId}`,
        { jobTitles: jobs.map((j) => j.title) }
      );

      return Ok(jobs);
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error(String(err));
      await this.recordLog(
        targetUrl,
        "error",
        Date.now() - startTime,
        `Job extraction failed: ${error.message}`
      );
      return Err(error);
    }
  }

  /**
   * Structural parser targeting micro-company career listings
   */
  private extractJobItems(
    $: cheerio.CheerioAPI,
    baseUrl: string
  ): Array<{
    title: string;
    department?: string;
    seniorityLevel: SeniorityLevel;
    techCategory: TechCategory;
    isTechRole: boolean;
    employmentType: EmploymentType;
    location?: string;
    isRemote: boolean;
    remoteScope: string;
    salaryMin?: number;
    salaryMax?: number;
    salaryCurrency?: string;
    skills: string[];
    descriptionSummary?: string;
    rawContent?: string;
    applyType: ApplyType;
    applyTarget: string;
  }> {
    const jobs: Array<{
      title: string;
      department?: string;
      seniorityLevel: SeniorityLevel;
      techCategory: TechCategory;
      isTechRole: boolean;
      employmentType: EmploymentType;
      location?: string;
      isRemote: boolean;
      remoteScope: string;
      salaryMin?: number;
      salaryMax?: number;
      salaryCurrency?: string;
      skills: string[];
      descriptionSummary?: string;
      rawContent?: string;
      applyType: ApplyType;
      applyTarget: string;
    }> = [];

    // Approach 1: Look for common job listing elements / headings
    const candidateHeadings: ReturnType<typeof $>[] = [];

    $("h2, h3, h4, .job-title, [data-job-title]").each((_, el) => {
      const $el = $(el);
      const text = $el.text().trim();
      if (this.isLikelyJobTitle(text)) {
        candidateHeadings.push($el);
      }
    });

    // Default fallback apply target: mailto on page or the page URL itself
    let pageApplyEmail: string | null = null;
    $('a[href^="mailto:"]').each((_, el) => {
      if (!pageApplyEmail) {
        pageApplyEmail = $(el).attr("href")?.replace(/^mailto:/i, "").split("?")[0]?.trim() ?? null;
      }
    });

    for (const $heading of candidateHeadings) {
      const title = $heading.text().trim();

      // Find surrounding container (section, card, or next siblings)
      const container = $heading.closest("article, section, li, .job-card, .job-item");
      const contextText = container.length > 0 ? container.text() : $heading.parent().text();

      // Parse properties from contextText
      const isRemote = this.detectIsRemote(contextText);
      const remoteScope = this.detectRemoteScope(contextText);
      const employmentType = this.detectEmploymentType(contextText);
      const salaryInfo = this.extractSalary(contextText);
      const skills = this.extractSkills(contextText);
      const seniorityLevel = this.detectSeniorityLevel(title, contextText);
      const techCategory = this.detectTechCategory(title, contextText, skills);
      const isTechRole = this.isTechnicalJob(title, contextText, skills);

      // Find apply method for this specific role or fallback to page default
      let applyType: ApplyType = "url";
      let applyTarget = baseUrl;

      const directMail = container.find('a[href^="mailto:"]').attr("href");
      if (directMail) {
        applyType = "email";
        applyTarget = directMail.replace(/^mailto:/i, "").split("?")[0]?.trim() || baseUrl;
      } else if (pageApplyEmail) {
        applyType = "email";
        applyTarget = pageApplyEmail;
      } else {
        const directLink = container.find("a[href]").first().attr("href");
        if (directLink) {
          try {
            applyTarget = new URL(directLink, baseUrl).toString();
            applyType = applyTarget.includes("form") ? "form" : "url";
          } catch {
            // keep baseUrl
          }
        }
      }

      jobs.push({
        title,
        department: this.inferDepartment(title),
        seniorityLevel,
        techCategory,
        isTechRole,
        employmentType,
        location: isRemote ? "Remote" : "On-site / Hybrid",
        isRemote,
        remoteScope,
        ...salaryInfo,
        skills,
        descriptionSummary: contextText.slice(0, 300).trim(),
        rawContent: contextText.slice(0, 1000).trim(),
        applyType,
        applyTarget,
      });
    }

    return jobs;
  }

  private detectSeniorityLevel(title: string, text: string): SeniorityLevel {
    const titleLower = title.toLowerCase();
    const textLower = text.toLowerCase();

    // 1. Internships check (in title first)
    if (titleLower.includes("intern") || titleLower.includes("co-op") || titleLower.includes("trainee")) {
      return "intern";
    }

    // 2. New Grad / Early Career check (in title first to avoid body text 'senior' false-positives)
    const isNewGradTitle =
      titleLower.includes("new grad") ||
      titleLower.includes("new-grad") ||
      titleLower.includes("new graduate") ||
      titleLower.includes("recent grad") ||
      titleLower.includes("recent graduate") ||
      titleLower.includes("fresh grad") ||
      titleLower.includes("fresh graduate") ||
      titleLower.includes("entry-level") ||
      titleLower.includes("entry level") ||
      titleLower.includes("early career") ||
      titleLower.includes("early-career") ||
      titleLower.includes("college grad") ||
      titleLower.includes("university grad") ||
      titleLower.includes("campus") ||
      titleLower.includes("rotational") ||
      titleLower.includes("apprentice") ||
      titleLower.includes("engineering resident") ||
      titleLower.includes("class of 202") ||
      /\b(swe|engineer|developer)\s*(1|i)\b/i.test(titleLower) ||
      titleLower.includes("associate software engineer") ||
      titleLower.includes("associate developer") ||
      titleLower.includes("associate engineer") ||
      titleLower.includes("graduate software engineer") ||
      titleLower.includes("graduate developer") ||
      titleLower.includes("graduate engineer");

    if (isNewGradTitle) {
      return "new_grad";
    }

    // 3. Founding / Executive in title
    if (
      titleLower.includes("founding") ||
      titleLower.includes("co-founder") ||
      titleLower.includes("head of") ||
      titleLower.includes("director of") ||
      titleLower.includes("cto")
    ) {
      return "founding";
    }

    // 4. Lead / Principal / Staff in title
    if (
      titleLower.includes("lead") ||
      titleLower.includes("principal") ||
      titleLower.includes("staff") ||
      titleLower.includes("architect")
    ) {
      return "lead";
    }

    // 5. Senior in title
    if (
      titleLower.includes("senior") ||
      titleLower.includes("sr.") ||
      titleLower.includes("sr ") ||
      titleLower.includes("experienced")
    ) {
      return "senior";
    }

    // 6. Junior in title
    if (
      titleLower.includes("junior") ||
      titleLower.includes("jr.") ||
      titleLower.includes("jr ") ||
      titleLower.includes("associate")
    ) {
      return "junior";
    }

    // 7. Check body text for New Grad / Early Career
    if (
      textLower.includes("new grad") ||
      textLower.includes("new graduate") ||
      textLower.includes("recent graduate") ||
      textLower.includes("entry-level") ||
      textLower.includes("entry level") ||
      textLower.includes("early career") ||
      textLower.includes("university graduate") ||
      textLower.includes("class of 202")
    ) {
      return "new_grad";
    }

    if (textLower.includes("internship") || textLower.includes("co-op")) {
      return "intern";
    }

    if (
      textLower.includes("founding") ||
      textLower.includes("co-founder") ||
      textLower.includes("director of")
    ) {
      return "founding";
    }

    if (
      textLower.includes("principal engineer") ||
      textLower.includes("staff engineer")
    ) {
      return "lead";
    }

    if (
      textLower.includes("senior engineer") ||
      textLower.includes("senior developer") ||
      textLower.includes("sr. engineer")
    ) {
      return "senior";
    }

    return "mid";
  }

  private detectTechCategory(title: string, text: string, skills: string[]): TechCategory {
    const lower = `${title} ${text}`.toLowerCase();
    const skillsStr = skills.join(" ").toLowerCase();

    if (
      lower.includes("ai") ||
      lower.includes("llm") ||
      lower.includes("machine learning") ||
      lower.includes("scraping") ||
      lower.includes("data science") ||
      skillsStr.includes("ai") ||
      skillsStr.includes("llm")
    ) {
      return "ai_ml";
    }
    if (
      lower.includes("cloud") ||
      lower.includes("devops") ||
      lower.includes("sre") ||
      lower.includes("infrastructure") ||
      skillsStr.includes("aws") ||
      skillsStr.includes("docker") ||
      skillsStr.includes("kubernetes") ||
      skillsStr.includes("cloudflare")
    ) {
      return "devops_cloud";
    }
    if (
      lower.includes("backend") ||
      lower.includes("systems") ||
      skillsStr.includes("rust") ||
      skillsStr.includes("go") ||
      skillsStr.includes("elixir") ||
      skillsStr.includes("python") ||
      skillsStr.includes("ruby")
    ) {
      return "backend_systems";
    }
    if (
      lower.includes("frontend") ||
      lower.includes("ui") ||
      lower.includes("ux") ||
      skillsStr.includes("react") ||
      skillsStr.includes("next.js") ||
      skillsStr.includes("tailwind") ||
      skillsStr.includes("vue")
    ) {
      return "frontend_ui";
    }
    if (
      lower.includes("designer") ||
      lower.includes("design") ||
      skillsStr.includes("figma") ||
      skillsStr.includes("ui/ux")
    ) {
      return "product_design";
    }
    return "fullstack";
  }

  private isTechnicalJob(title: string, text: string, skills: string[]): boolean {
    const lower = title.toLowerCase();
    if (
      lower.includes("account executive") ||
      lower.includes("sales development") ||
      lower.includes("office manager") ||
      lower.includes("receptionist") ||
      lower.includes("administrative") ||
      lower.includes("recruiter") ||
      lower.includes("hr generalist") ||
      lower.includes("accountant")
    ) {
      return false;
    }

    if (skills.length > 0) return true;

    const techKeywords = [
      "engineer", "developer", "architect", "programmer", "coder",
      "designer", "devops", "sre", "data", "ai", "cloud", "systems",
      "qa", "test", "devrel"
    ];
    return techKeywords.some((kw) => lower.includes(kw));
  }

  private isLikelyJobTitle(text: string): boolean {
    if (!text || text.length < 4 || text.length > 80) return false;
    const lower = text.toLowerCase();

    // False positives
    if (
      lower.includes("about us") ||
      lower.includes("values") ||
      lower.includes("benefits") ||
      lower.includes("how we work") ||
      lower.includes("our culture") ||
      lower.includes("interview process") ||
      lower.includes("perks") ||
      lower.includes("faq")
    ) {
      return false;
    }

    const jobKeywords = [
      "engineer", "developer", "designer", "manager", "lead", "architect",
      "specialist", "intern", "founder", "writer", "marketing", "devrel",
      "frontend", "backend", "fullstack", "full-stack", "mobile", "ios", "android"
    ];

    return jobKeywords.some((kw) => lower.includes(kw));
  }

  private detectIsRemote(text: string): boolean {
    const lower = text.toLowerCase();
    return (
      lower.includes("remote") ||
      lower.includes("anywhere") ||
      lower.includes("work from home") ||
      lower.includes("telecommute") ||
      lower.includes("distributed")
    );
  }

  private detectRemoteScope(text: string): string {
    const lower = text.toLowerCase();
    if (
      lower.includes("midwest") ||
      lower.includes("chicago") ||
      lower.includes("illinois") ||
      lower.includes("minnesota") ||
      lower.includes("michigan") ||
      lower.includes("indiana") ||
      lower.includes("ohio") ||
      lower.includes("wisconsin") ||
      lower.includes("missouri")
    ) {
      return "us_midwest";
    }
    if (lower.includes("vietnam")) return "vietnam_only";
    if (lower.includes("us only") || lower.includes("united states only") || lower.includes("north america")) return "us_only";
    if (lower.includes("apac") || lower.includes("asia")) return "apac";
    if (lower.includes("eu only") || lower.includes("europe")) return "eu_only";
    return "worldwide";
  }

  private detectEmploymentType(text: string): EmploymentType {
    const lower = text.toLowerCase();
    if (lower.includes("part-time") || lower.includes("part time")) return "part-time";
    if (lower.includes("contract") || lower.includes("freelance")) return "contract";
    if (lower.includes("intern")) return "internship";
    return "full-time";
  }

  private extractSalary(text: string): {
    salaryMin?: number;
    salaryMax?: number;
    salaryCurrency?: string;
  } {
    // Look for $XXk - $YYk or $XX,000 - $YY,000
    const dollarMatch = text.match(
      /\$([0-9]{2,3})(?:,([0-9]{3}))?\s*(?:k|K)?\s*[-–—to]+\s*\$([0-9]{2,3})(?:,([0-9]{3}))?\s*(?:k|K)?/
    );

    if (dollarMatch) {
      const minRaw = dollarMatch[1];
      const maxRaw = dollarMatch[3];
      if (minRaw && maxRaw) {
        let min = parseInt(minRaw, 10);
        let max = parseInt(maxRaw, 10);
        if (min < 1000) min *= 1000;
        if (max < 1000) max *= 1000;
        return { salaryMin: min, salaryMax: max, salaryCurrency: "USD" };
      }
    }

    return {};
  }

  private extractSkills(text: string): string[] {
    const matched = new Set<string>();
    for (const skill of TECH_SKILLS) {
      const escaped = skill.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const boundaryStart = /^\w/.test(skill) ? "\\b" : "";
      const boundaryEnd = /\w$/.test(skill) ? "\\b" : "(?:\\s|[.,;!?]|$)";
      const regex = new RegExp(`${boundaryStart}${escaped}${boundaryEnd}`, "i");
      if (regex.test(text)) {
        matched.add(skill);
      }
    }
    return Array.from(matched);
  }

  private inferDepartment(title: string): string {
    const lower = title.toLowerCase();
    if (
      lower.includes("engineer") ||
      lower.includes("developer") ||
      lower.includes("architect") ||
      lower.includes("backend") ||
      lower.includes("frontend") ||
      lower.includes("fullstack") ||
      lower.includes("full stack") ||
      lower.includes("devops") ||
      lower.includes("sre") ||
      lower.includes("infrastructure") ||
      lower.includes("data engineer") ||
      lower.includes("machine learning") ||
      lower.includes("ml engineer") ||
      lower.includes("ai ") ||
      lower.includes("security") ||
      lower.includes("firmware") ||
      lower.includes("qa") ||
      lower.includes("quality assurance") ||
      lower.includes("test")
    ) {
      return "Engineering";
    }
    if (
      lower.includes("designer") ||
      lower.includes("design") ||
      lower.includes("ui") ||
      lower.includes("ux") ||
      lower.includes("product manager") ||
      lower.includes("product lead") ||
      lower.includes("product owner")
    ) {
      return "Product & Design";
    }
    if (
      lower.includes("marketing") ||
      lower.includes("growth") ||
      lower.includes("seo") ||
      lower.includes("content") ||
      lower.includes("brand") ||
      lower.includes("social media")
    ) {
      return "Growth & Marketing";
    }
    if (
      lower.includes("sales") ||
      lower.includes("account executive") ||
      lower.includes("bdr") ||
      lower.includes("sdr") ||
      lower.includes("business development") ||
      lower.includes("partnership")
    ) {
      return "Sales";
    }
    if (
      lower.includes("operation") ||
      lower.includes("support") ||
      lower.includes("customer success") ||
      lower.includes("customer service") ||
      lower.includes("logistics") ||
      lower.includes("supply chain")
    ) {
      return "Operations & Support";
    }
    if (
      lower.includes("finance") ||
      lower.includes("accounting") ||
      lower.includes("legal") ||
      lower.includes("compliance") ||
      lower.includes("controller")
    ) {
      return "Finance & Legal";
    }
    if (
      lower.includes("recruiter") ||
      lower.includes("talent") ||
      lower.includes("people ops") ||
      lower.includes("human resources") ||
      lower.includes("hr ")
    ) {
      return "People & HR";
    }
    return "General";
  }

  /**
   * Deterministic SHA-256 fingerprint for deduplication
   */
  private async generateContentHash(
    companyId: string,
    title: string,
    applyTarget: string
  ): Promise<string> {
    const raw = `${companyId}:${title.trim().toLowerCase()}:${applyTarget.trim().toLowerCase()}`;
    const encoder = new TextEncoder();
    const data = encoder.encode(raw);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  }
}
