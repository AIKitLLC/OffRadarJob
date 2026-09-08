import * as cheerio from "cheerio";
import { BaseAgent } from "./base.js";
import { Result, Ok, Err, Company } from "../types/domain.js";
import { ProfileMessage, HuntMessage } from "../types/queues.js";
import { CompanyRepository, LogRepository } from "../db/repositories.js";

export class CompanyProfilerAgent extends BaseAgent {
  public readonly name = "profiler_agent";

  constructor(
    private readonly companyRepo: CompanyRepository,
    logRepo?: LogRepository
  ) {
    super(logRepo);
  }

  public async process(
    msg: ProfileMessage
  ): Promise<Result<HuntMessage, Error>> {
    const startTime = Date.now();
    const targetUrl = msg.originUrl;

    try {
      const fetchResult = await this.safeFetch(targetUrl, { timeoutMs: 10000 });
      if (!fetchResult.ok) {
        await this.recordLog(
          targetUrl,
          "error",
          Date.now() - startTime,
          `Failed to fetch homepage: ${fetchResult.error.message}`
        );
        return Err(fetchResult.error);
      }

      const html = fetchResult.value;
      const $ = cheerio.load(html);

      // Extract Company Metadata
      const name = this.extractCompanyName($, msg.domain);
      const tagline = this.extractTagline($);
      const description = this.extractDescription($);
      const logoUrl = this.extractLogo($, targetUrl);
      const socialLinks = this.extractSocials($);
      const contactEmail = this.extractEmail($, html);
      const techStack = this.detectTechStack($, html);
      const headcountEstimate = this.estimateHeadcount($, html);

      // Reuse existing company ID if already present in DB to avoid FOREIGN KEY constraint failures
      const existingCompany = await this.companyRepo.findByDomain(msg.domain);
      const companyId = existingCompany?.id ?? `comp_${msg.domain.replace(/[^a-z0-9]/g, "_")}`;
      const now = Date.now();

      const company: Company = {
        id: companyId,
        domain: msg.domain,
        name,
        tagline: tagline ?? undefined,
        description: description ?? undefined,
        websiteUrl: targetUrl,
        logoUrl: logoUrl ?? undefined,
        industry: this.inferIndustry($, html),
        techStack,
        socialLinks,
        contactEmail: contactEmail ?? undefined,
        headcountEstimate,
        locationHint: this.detectLocationHint(html),
        discoverySource: msg.discoverySource,
        createdAt: now,
        updatedAt: now,
      };

      await this.companyRepo.upsert(company);

      // Extract candidate links for career hunting
      const candidateLinks = this.extractCandidateCareerLinks($, targetUrl);

      await this.recordLog(
        targetUrl,
        "success",
        Date.now() - startTime,
        `Enriched company profile for ${company.name} (${msg.domain}) with ${candidateLinks.length} career links`,
        { techStackCount: techStack.length, candidateLinksCount: candidateLinks.length }
      );

      const huntMsg: HuntMessage = {
        type: "HUNT_CAREERS",
        traceId: msg.traceId,
        companyId: company.id,
        domain: msg.domain,
        baseUrl: targetUrl,
        candidateLinks,
        timestamp: Date.now(),
        retryCount: 0,
      };

      return Ok(huntMsg);
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error(String(err));
      await this.recordLog(
        targetUrl,
        "error",
        Date.now() - startTime,
        `Profiler agent failed: ${error.message}`
      );
      return Err(error);
    }
  }

  private extractCompanyName($: cheerio.CheerioAPI, domain: string): string {
    const ogSiteName = $('meta[property="og:site_name"]').attr("content")?.trim();
    if (ogSiteName && ogSiteName.length < 50) return ogSiteName;

    const title = $("title").text().trim();
    if (title) {
      // Clean "Title | Subtitle" or "Title - Tagline"
      const clean = title.split(/[|\-–•:]/)[0]?.trim();
      if (clean && clean.length > 1 && clean.length < 50) return clean;
    }

    const h1 = $("h1").first().text().trim();
    if (h1 && h1.length > 2 && h1.length < 40) return h1;

    // Fallback: capitalize domain name
    const domainPrefix = domain.split(".")[0] ?? domain;
    return domainPrefix.charAt(0).toUpperCase() + domainPrefix.slice(1);
  }

  private extractTagline($: cheerio.CheerioAPI): string | null {
    const ogTitle = $('meta[property="og:title"]').attr("content")?.trim();
    if (ogTitle && ogTitle.length > 5 && ogTitle.length < 120) return ogTitle;
    return null;
  }

  private extractDescription($: cheerio.CheerioAPI): string | null {
    const desc =
      $('meta[name="description"]').attr("content")?.trim() ||
      $('meta[property="og:description"]').attr("content")?.trim();
    return desc && desc.length > 5 ? desc.substring(0, 500) : null;
  }

  private extractLogo($: cheerio.CheerioAPI, baseUrl: string): string | null {
    const ogImg = $('meta[property="og:image"]').attr("content");
    if (ogImg) return this.resolveUrl(ogImg, baseUrl);

    const icon =
      $('link[rel="apple-touch-icon"]').attr("href") ||
      $('link[rel="icon"]').attr("href") ||
      $('link[rel="shortcut icon"]').attr("href");
    if (icon) return this.resolveUrl(icon, baseUrl);

    return null;
  }

  private extractSocials($: cheerio.CheerioAPI): Record<string, string> {
    const socials: Record<string, string> = {};
    $("a[href]").each((_, el) => {
      const href = $(el).attr("href")?.trim();
      if (!href) return;

      if ((href.includes("twitter.com/") || href.includes("x.com/")) && !socials["twitter"]) {
        socials["twitter"] = href;
      } else if (href.includes("github.com/") && !href.includes("/issues") && !socials["github"]) {
        socials["github"] = href;
      } else if (href.includes("linkedin.com/company/") && !socials["linkedin"]) {
        socials["linkedin"] = href;
      } else if (href.includes("discord.gg/") && !socials["discord"]) {
        socials["discord"] = href;
      } else if (href.includes("t.me/") && !socials["telegram"]) {
        socials["telegram"] = href;
      }
    });
    return socials;
  }

  private extractEmail($: cheerio.CheerioAPI, html: string): string | null {
    // 1. Mailto links
    const mailto = $('a[href^="mailto:"]').first().attr("href");
    if (mailto) {
      const email = mailto.replace(/^mailto:/i, "").split("?")[0]?.trim();
      if (email && email.includes("@")) return email.toLowerCase();
    }

    // 2. Regex search in footer or contact sections
    const match = html.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
    if (match && match[1]) {
      const found = match[1].toLowerCase();
      // Filter out common dummy or asset emails
      if (!found.includes("example.com") && !found.includes("sentry.io") && !found.includes("w3.org")) {
        return found;
      }
    }
    return null;
  }

  private detectTechStack($: cheerio.CheerioAPI, html: string): string[] {
    const stack = new Set<string>();
    const lower = html.toLowerCase();

    // Frontend
    if (lower.includes("__next_data__") || lower.includes("/_next/")) stack.add("Next.js");
    if (lower.includes("react") || $('script[src*="react"]').length > 0) stack.add("React");
    if (lower.includes("astro") || $('meta[name="generator"][content*="Astro"]').length > 0) stack.add("Astro");
    if (lower.includes("vue") || lower.includes("nuxt")) stack.add("Vue.js");
    if (lower.includes("svelte") || lower.includes("sveltekit")) stack.add("Svelte");
    if (lower.includes("tailwind") || $('link[href*="tailwind"]').length > 0) stack.add("Tailwind CSS");

    // Backend / Cloud
    if (lower.includes("cloudflare") || lower.includes("cf-ray")) stack.add("Cloudflare");
    if (lower.includes("supabase")) stack.add("Supabase");
    if (lower.includes("firebase")) stack.add("Firebase");
    if (lower.includes("stripe.com/v3")) stack.add("Stripe");
    if (lower.includes("rubyonrails") || lower.includes("csrf-param")) stack.add("Ruby on Rails");
    if (lower.includes("django")) stack.add("Django");
    if (lower.includes("laravel")) stack.add("Laravel");
    if (lower.includes("golang") || lower.includes("go ")) stack.add("Go");
    if (lower.includes("rust")) stack.add("Rust");
    if (lower.includes("typescript")) stack.add("TypeScript");
    if (lower.includes("python")) stack.add("Python");

    return Array.from(stack);
  }

  private estimateHeadcount($: cheerio.CheerioAPI, html: string): string {
    const lower = html.toLowerCase();
    if (lower.includes("solo founder") || lower.includes("built by one person") || lower.includes("indie hacker")) {
      return "1";
    }
    if (lower.includes("small team of") || lower.includes("boutique team") || lower.includes("under 10 people")) {
      return "1-10";
    }
    return "1-20"; // Default micro-company range
  }

  private inferIndustry($: cheerio.CheerioAPI, html: string): string {
    const lower = html.toLowerCase();
    if (lower.includes("developer tool") || lower.includes("api for") || lower.includes("sdk")) return "DevTools";
    if (lower.includes("ai") || lower.includes("artificial intelligence") || lower.includes("llm")) return "AI / Machine Learning";
    if (lower.includes("saas") || lower.includes("b2b")) return "B2B SaaS";
    if (lower.includes("design agency") || lower.includes("creative studio") || lower.includes("development studio")) return "Digital Agency / Studio";
    if (lower.includes("crypto") || lower.includes("web3") || lower.includes("blockchain")) return "Web3 / Crypto";
    if (lower.includes("ecommerce") || lower.includes("shopify")) return "E-Commerce";
    return "Software & Tech";
  }

  private detectLocationHint(html: string): string {
    const lower = html.toLowerCase();
    // US Midwest region prioritization
    if (lower.includes("chicago") || lower.includes("illinois") || lower.includes(", il")) {
      return "US-Midwest (Chicago, IL)";
    }
    if (lower.includes("minneapolis") || lower.includes("st. paul") || lower.includes("minnesota") || lower.includes(", mn")) {
      return "US-Midwest (Minneapolis, MN)";
    }
    if (lower.includes("detroit") || lower.includes("ann arbor") || lower.includes("grand rapids") || lower.includes("michigan") || lower.includes(", mi")) {
      return "US-Midwest (Ann Arbor / Detroit, MI)";
    }
    if (lower.includes("indianapolis") || lower.includes("carmel") || lower.includes("indiana") || lower.includes(", in")) {
      return "US-Midwest (Indianapolis, IN)";
    }
    if (lower.includes("columbus") || lower.includes("cincinnati") || lower.includes("cleveland") || lower.includes("ohio") || lower.includes(", oh")) {
      return "US-Midwest (Ohio)";
    }
    if (lower.includes("madison") || lower.includes("milwaukee") || lower.includes("wisconsin") || lower.includes(", wi")) {
      return "US-Midwest (Madison / Milwaukee, WI)";
    }
    if (lower.includes("kansas city") || lower.includes("st. louis") || lower.includes("missouri") || lower.includes(", mo")) {
      return "US-Midwest (Missouri)";
    }
    if (lower.includes("midwest") || lower.includes("mid-west")) {
      return "US-Midwest";
    }
    if (lower.includes("united states") || lower.includes("usa") || lower.includes("u.s.")) {
      return "United States (Remote/Hybrid)";
    }
    if (lower.includes("vietnam") || lower.includes("việt nam") || lower.includes("saigon") || lower.includes("hanoi")) {
      return "Vietnam / APAC";
    }
    if (lower.includes("remote-first") || lower.includes("100% remote") || lower.includes("fully remote")) {
      return "Remote-First";
    }
    return "Global / Remote";
  }

  private extractCandidateCareerLinks($: cheerio.CheerioAPI, baseUrl: string): string[] {
    const candidates = new Set<string>();
    const careerKeywords = ["career", "job", "join", "work-with-us", "hiring", "team", "positions", "openings"];

    $("a[href]").each((_, el) => {
      const href = $(el).attr("href")?.trim();
      const text = $(el).text().toLowerCase().trim();
      if (!href) return;

      const fullUrl = this.resolveUrl(href, baseUrl);
      if (!fullUrl) return;

      const hrefLower = href.toLowerCase();

      // Check URL patterns
      const isCareerKeyword = careerKeywords.some(
        (kw) => hrefLower.includes(`/${kw}`) || hrefLower.includes(`-${kw}`) || text.includes(kw)
      );

      // Check external embeds (Notion, Airtable, Typeform, Ashby, Lever, Greenhouse)
      const isExternalAts =
        hrefLower.includes("notion.site") ||
        hrefLower.includes("notion.so") ||
        hrefLower.includes("airtable.com") ||
        hrefLower.includes("typeform.com") ||
        hrefLower.includes("jobs.ashbyhq.com") ||
        hrefLower.includes("lever.co") ||
        hrefLower.includes("greenhouse.io") ||
        hrefLower.includes("workable.com");

      if (isCareerKeyword || isExternalAts) {
        candidates.add(fullUrl);
      }
    });

    return Array.from(candidates);
  }

  private resolveUrl(href: string, baseUrl: string): string | null {
    try {
      return new URL(href, baseUrl).toString();
    } catch {
      return null;
    }
  }
}
