import { BaseAgent } from "./base.js";
import { Result, Ok, Err } from "../types/domain.js";
import { DiscoveryMessage, ProfileMessage } from "../types/queues.js";
import { LogRepository } from "../db/repositories.js";

// Blocklist for megacorps & generic job boards - focus only on off-radar micro-companies
const IGNORED_DOMAINS = new Set([
  "google.com",
  "facebook.com",
  "meta.com",
  "microsoft.com",
  "apple.com",
  "amazon.com",
  "linkedin.com",
  "indeed.com",
  "glassdoor.com",
  "monster.com",
  "upwork.com",
  "fiverr.com",
  "topcv.vn",
  "vietnamworks.com",
  "itviec.com",
  "github.com",
  "twitter.com",
  "x.com",
  "youtube.com",
  "wikipedia.org",
  "reddit.com",
]);

export class DiscoveryAgent extends BaseAgent {
  public readonly name = "discovery_agent";

  constructor(logRepo?: LogRepository) {
    super(logRepo);
  }

  /**
   * Process a discovery seed message and yield a normalized ProfileMessage
   */
  public async process(
    msg: DiscoveryMessage
  ): Promise<Result<ProfileMessage[], Error>> {
    const startTime = Date.now();
    try {
      const candidates: ProfileMessage[] = [];
      const extractedDomain = this.extractDomain(msg.sourceUrl);

      if (!extractedDomain) {
        await this.recordLog(
          msg.sourceUrl,
          "warning",
          Date.now() - startTime,
          "Invalid or unparseable URL for discovery"
        );
        return Ok([]);
      }

      if (IGNORED_DOMAINS.has(extractedDomain)) {
        await this.recordLog(
          msg.sourceUrl,
          "warning",
          Date.now() - startTime,
          `Ignored mainstream platform or giant: ${extractedDomain}`
        );
        return Ok([]);
      }

      const originUrl = `https://${extractedDomain}`;
      const profileMsg: ProfileMessage = {
        type: "PROFILE_COMPANY",
        traceId: msg.traceId,
        domain: extractedDomain,
        originUrl,
        discoverySource: msg.source,
        timestamp: Date.now(),
        retryCount: 0,
      };

      candidates.push(profileMsg);

      await this.recordLog(
        originUrl,
        "success",
        Date.now() - startTime,
        `Discovered candidate micro-company domain: ${extractedDomain}`,
        { source: msg.source }
      );

      return Ok(candidates);
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error(String(err));
      await this.recordLog(
        msg.sourceUrl,
        "error",
        Date.now() - startTime,
        `Discovery failed: ${error.message}`
      );
      return Err(error);
    }
  }

  /**
   * Helper to parse domains from raw URL or domain string
   */
  public extractDomain(input: string): string | null {
    try {
      let raw = input.trim();
      if (!raw.startsWith("http://") && !raw.startsWith("https://")) {
        raw = "https://" + raw;
      }
      const parsed = new URL(raw);
      let host = parsed.hostname.toLowerCase();
      if (host.startsWith("www.")) {
        host = host.substring(4);
      }
      return host.length > 3 && host.includes(".") ? host : null;
    } catch {
      return null;
    }
  }
}
