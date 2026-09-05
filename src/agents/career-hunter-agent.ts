import * as cheerio from "cheerio";
import { BaseAgent } from "./base.js";
import { Result, Ok, Err, CareerPage, CareerPageType } from "../types/domain.js";
import { HuntMessage, ExtractMessage } from "../types/queues.js";
import { CareerPageRepository, LogRepository } from "../db/repositories.js";

const STANDARD_CAREER_PATHS = [
  "/careers",
  "/jobs",
  "/join",
  "/join-us",
  "/work-with-us",
  "/hiring",
  "/about",
];

const HIRING_KEYWORDS = [
  "open position",
  "open role",
  "we are hiring",
  "we're hiring",
  "join our team",
  "join us",
  "work with us",
  "job opening",
  "current openings",
  "career opportunity",
  "apply now",
  "send your resume",
  "send us your cv",
];

export class CareerHunterAgent extends BaseAgent {
  public readonly name = "career_hunter_agent";

  constructor(
    private readonly careerPageRepo: CareerPageRepository,
    logRepo?: LogRepository
  ) {
    super(logRepo);
  }

  public async process(
    msg: HuntMessage
  ): Promise<Result<ExtractMessage[], Error>> {
    const startTime = Date.now();
    const extractMessages: ExtractMessage[] = [];

    try {
      // 1. Compile target URLs to inspect
      const targets = new Set<string>(msg.candidateLinks);

      // If no candidate links found from homepage, add standard fallback paths
      if (targets.size === 0) {
        for (const path of STANDARD_CAREER_PATHS) {
          try {
            targets.add(new URL(path, msg.baseUrl).toString());
          } catch {
            // ignore malformed URLs
          }
        }
      }

      let foundPagesCount = 0;

      for (const targetUrl of targets) {
        try {
          const parsed = new URL(targetUrl);
          if (
            (parsed.hostname.includes("ashbyhq.com") && parsed.pathname.length <= 1) ||
            (parsed.hostname.includes("forms.gle") && parsed.pathname.length <= 1) ||
            (parsed.hostname.includes("linkedin.com") && !targetUrl.includes("/jobs/view/"))
          ) {
            continue;
          }
        } catch {
          continue;
        }

        await this.politeDelay(200, 400);

        const pageType = this.determinePageType(targetUrl);
        const fetchResult = await this.safeFetch(targetUrl, { timeoutMs: 6000 });

        if (!fetchResult.ok) {
          continue; // 404 or unreachable, move to next candidate
        }

        const html = fetchResult.value;
        const hasHiringSignals = this.verifyHiringSignals(html);

        if (hasHiringSignals || pageType !== "internal_page") {
          const now = Date.now();
          const existing = await this.careerPageRepo.findByUrl(targetUrl);
          const pageId = existing?.id ?? `page_${msg.companyId}_${Math.random().toString(36).substring(2, 8)}`;

          const careerPage: CareerPage = {
            id: pageId,
            companyId: msg.companyId,
            url: targetUrl,
            pageType,
            status: "active",
            lastCheckedAt: now,
            createdAt: existing?.createdAt ?? now,
          };

          await this.careerPageRepo.upsert(careerPage);
          foundPagesCount++;

          extractMessages.push({
            type: "EXTRACT_JOBS",
            traceId: msg.traceId,
            companyId: msg.companyId,
            careerPageId: pageId,
            careerPageUrl: targetUrl,
            pageType,
            timestamp: now,
            retryCount: 0,
          });

          // Break early if we found a verified career page to avoid redundant scans
          if (pageType === "internal_page" && targetUrl.includes("/careers")) {
            break;
          }
        }
      }

      await this.recordLog(
        msg.baseUrl,
        "success",
        Date.now() - startTime,
        `Career hunter finished for ${msg.domain}. Found ${foundPagesCount} verified career targets.`,
        { verifiedPages: foundPagesCount }
      );

      return Ok(extractMessages);
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error(String(err));
      await this.recordLog(
        msg.baseUrl,
        "error",
        Date.now() - startTime,
        `Career hunter failed: ${error.message}`
      );
      return Err(error);
    }
  }

  private determinePageType(url: string): CareerPageType {
    const lower = url.toLowerCase();
    if (lower.includes("notion.site") || lower.includes("notion.so")) return "notion";
    if (lower.includes("airtable.com")) return "airtable";
    if (lower.includes("typeform.com")) return "typeform";
    if (
      lower.includes("ashbyhq.com") ||
      lower.includes("lever.co") ||
      lower.includes("greenhouse.io") ||
      lower.includes("workable.com")
    ) {
      return "ats_embed";
    }
    if (lower.includes("/blog/") || lower.includes("/news/")) return "blog_post";
    return "internal_page";
  }

  private verifyHiringSignals(html: string): boolean {
    const lower = html.toLowerCase();
    return HIRING_KEYWORDS.some((kw) => lower.includes(kw));
  }
}
