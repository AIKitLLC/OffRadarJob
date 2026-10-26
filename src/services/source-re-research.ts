import * as cheerio from "cheerio";
import {
  decodeCloudflareEmailProtection,
  isAcceptableApplyTarget,
  isBlockedApplyHost,
  isCloudflareEmailProtectionUrl,
  validateApplyUrl,
  type FetchLike,
} from "./link-checker.js";

export interface RecoveredApplyTarget {
  applyType: string;
  applyTarget: string;
}

const IGNORED_EMAIL_DOMAINS = ["example.com", "sentry.io", "w3.org"];
const CAREER_KEYWORDS = ["career", "careers", "jobs", "join-us", "join", "hiring", "openings", "positions", "work-with-us"];
const ATS_HOSTS = ["ashbyhq.com", "greenhouse.io", "lever.co", "workable.com", "smartrecruiters.com", "recruitee.com", "breezy.hr"];

function isUsableEmail(email: string | null): email is string {
  if (!email) return false;
  return !IGNORED_EMAIL_DOMAINS.some((domain) => email.endsWith(`@${domain}`) || email.includes(domain));
}

export function extractEmailFromHtml(html: string): string | null {
  const $ = cheerio.load(html);

  let found: string | null = null;
  $('a[href^="mailto:"]').each((_, el) => {
    if (found) return;
    const email = ($(el).attr("href") ?? "").replace(/^mailto:/i, "").split("?")[0]?.trim().toLowerCase();
    if (email && isUsableEmail(email)) found = email;
  });
  if (found) return found;

  $("[data-cfemail], a[href*='/cdn-cgi/l/email-protection']").each((_, el) => {
    if (found) return;
    const decoded = decodeCloudflareEmailProtection($(el).attr("data-cfemail") || $(el).attr("href") || "");
    if (isUsableEmail(decoded)) found = decoded;
  });
  if (found) return found;

  const match = html.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
  const regexEmail = match?.[1]?.toLowerCase() ?? null;
  return isUsableEmail(regexEmail) ? regexEmail : null;
}

function resolveHttpUrl(href: string, baseUrl: string): string | null {
  try {
    const url = new URL(href, baseUrl);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    if (isBlockedApplyHost(url.hostname)) return null;
    return url.toString();
  } catch {
    return null;
  }
}

export function extractApplyTargetFromHtml(html: string, baseUrl: string): RecoveredApplyTarget | null {
  const email = extractEmailFromHtml(html);
  if (email) return { applyType: "email", applyTarget: email };

  const $ = cheerio.load(html);
  const candidates: Array<{ target: RecoveredApplyTarget; score: number }> = [];

  $("a[href]").each((_, el) => {
    const href = ($(el).attr("href") ?? "").trim();
    if (!href || isCloudflareEmailProtectionUrl(href)) return;
    const resolved = resolveHttpUrl(href, baseUrl);
    if (!resolved || isCloudflareEmailProtectionUrl(resolved)) return;
    if (!isAcceptableApplyTarget("url", resolved)) return;

    const text = $(el).text().toLowerCase();
    const hrefLower = href.toLowerCase();
    let score = 0;
    if (text.includes("apply")) score += 4;
    if (text.includes("view job") || text.includes("job details") || text.includes("see role")) score += 3;
    if (hrefLower.includes("/apply") || hrefLower.includes("gh_jid") || hrefLower.includes("job_id")) score += 3;
    if (hrefLower.includes("/jobs/") || hrefLower.includes("/job/") || hrefLower.includes("opening") || hrefLower.includes("position")) score += 2;
    if (score === 0) return;

    candidates.push({ target: { applyType: "url", applyTarget: resolved }, score });
  });

  candidates.sort((a, b) => b.score - a.score);
  return candidates[0]?.target ?? null;
}

export function extractCareerPageUrlFromHtml(html: string, baseUrl: string): string | null {
  const $ = cheerio.load(html);
  const candidates: Array<{ url: string; score: number }> = [];

  $("a[href]").each((_, el) => {
    const href = ($(el).attr("href") ?? "").trim();
    if (!href || isCloudflareEmailProtectionUrl(href)) return;
    const resolved = resolveHttpUrl(href, baseUrl);
    if (!resolved || isCloudflareEmailProtectionUrl(resolved)) return;
    if (!validateApplyUrl(resolved).ok && !CAREER_KEYWORDS.some((kw) => resolved.toLowerCase().includes(kw))) return;

    const text = $(el).text().toLowerCase();
    const urlLower = resolved.toLowerCase();
    let score = 0;
    if (ATS_HOSTS.some((host) => urlLower.includes(host))) score += 4;
    if (CAREER_KEYWORDS.some((kw) => urlLower.includes(`/${kw}`))) score += 3;
    if (CAREER_KEYWORDS.some((kw) => text.includes(kw))) score += 2;
    if (score === 0) return;

    candidates.push({ url: resolved, score });
  });

  candidates.sort((a, b) => b.score - a.score);
  return candidates[0]?.url ?? null;
}

export interface SourceReResearchOptions {
  maxFetches?: number;
  timeoutMs?: number;
  maxBodyBytes?: number;
}

export class SourceReResearcher {
  private readonly cache = new Map<string, Promise<string | null>>();
  private fetches = 0;

  constructor(
    private readonly fetchFn: FetchLike,
    private readonly opts: SourceReResearchOptions = {}
  ) {}

  public get fetchesUsed(): number {
    return this.fetches;
  }

  public fetchHtml(url: string): Promise<string | null> {
    const cached = this.cache.get(url);
    if (cached) return cached;
    const pending = this.fetchHtmlUncached(url);
    this.cache.set(url, pending);
    return pending;
  }

  private async fetchHtmlUncached(url: string): Promise<string | null> {
    const maxFetches =
      typeof this.opts.maxFetches === "number" && Number.isFinite(this.opts.maxFetches) && this.opts.maxFetches >= 0
        ? Math.trunc(this.opts.maxFetches)
        : 20;
    if (this.fetches >= maxFetches) return null;
    if (isCloudflareEmailProtectionUrl(url)) return null;

    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      return null;
    }
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
    if (isBlockedApplyHost(parsed.hostname)) return null;

    this.fetches++;
    const timeoutMs = this.opts.timeoutMs ?? 8000;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await this.fetchFn(url, {
        method: "GET",
        redirect: "follow",
        signal: controller.signal,
        headers: { "user-agent": "Mozilla/5.0 (compatible; OffRadarJobsRecovery/1.0)" },
      });
      if (!res.ok) return null;
      const text = await res.text();
      return text.slice(0, this.opts.maxBodyBytes ?? 256 * 1024);
    } catch {
      return null;
    } finally {
      clearTimeout(timer);
    }
  }

  public async findApplyTargetOnPage(url: string): Promise<RecoveredApplyTarget | null> {
    const html = await this.fetchHtml(url);
    if (!html) return null;
    return extractApplyTargetFromHtml(html, url);
  }

  public async findEmailOnPage(url: string): Promise<string | null> {
    const target = await this.findApplyTargetOnPage(url);
    return target?.applyType === "email" ? target.applyTarget : null;
  }

  public async findCareerPageUrlOnPage(url: string): Promise<string | null> {
    const html = await this.fetchHtml(url);
    if (!html) return null;
    return extractCareerPageUrlFromHtml(html, url);
  }

  public async findApplyTargetViaCompanySite(careerPageUrl: string | null, websiteUrl: string | null): Promise<RecoveredApplyTarget | null> {
    if (careerPageUrl && !isCloudflareEmailProtectionUrl(careerPageUrl)) {
      const direct = await this.findApplyTargetOnPage(careerPageUrl);
      if (direct) return direct;
    }

    if (websiteUrl && !isCloudflareEmailProtectionUrl(websiteUrl)) {
      const fromHomepage = await this.findApplyTargetOnPage(websiteUrl);
      if (fromHomepage) return fromHomepage;

      const discoveredCareerUrl = await this.findCareerPageUrlOnPage(websiteUrl);
      if (discoveredCareerUrl && discoveredCareerUrl !== careerPageUrl) {
        return this.findApplyTargetOnPage(discoveredCareerUrl);
      }
    }

    return null;
  }
}
