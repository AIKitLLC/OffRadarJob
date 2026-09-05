import { Result, Ok, Err, CrawlLog } from "../types/domain.js";
import { LogRepository } from "../db/repositories.js";

export interface FetchOptions {
  timeoutMs?: number;
  headers?: Record<string, string>;
}

export abstract class BaseAgent {
  public abstract readonly name: string;

  constructor(protected readonly logRepo?: LogRepository) {}

  /**
   * Polite, safe HTTP fetch with bounded timeout and descriptive headers
   */
  protected async safeFetch(
    url: string,
    options: FetchOptions = {}
  ): Promise<Result<string, Error>> {
    const timeoutMs = options.timeoutMs ?? 8000;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36",
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9",
          "Sec-Ch-Ua": '"Not(A:Brand";v="99", "Google Chrome";v="133", "Chromium";v="133"',
          "Sec-Ch-Ua-Mobile": "?0",
          "Sec-Ch-Ua-Platform": '"macOS"',
          "Upgrade-Insecure-Requests": "1",
          ...options.headers,
        },
      });

      if (!response.ok) {
        return Err(
          new Error(`HTTP ${response.status} ${response.statusText} for URL: ${url}`)
        );
      }

      const html = await response.text();
      return Ok(html);
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") {
        return Err(new Error(`Timeout after ${timeoutMs}ms fetching: ${url}`));
      }
      return Err(err instanceof Error ? err : new Error(String(err)));
    } finally {
      clearTimeout(timer);
    }
  }

  /**
   * Record telemetry & crawl execution log
   */
  protected async recordLog(
    targetUrl: string,
    status: "success" | "warning" | "error",
    durationMs: number,
    message: string,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    if (!this.logRepo) return;

    const logEntry: CrawlLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      agentName: this.name,
      targetUrl,
      status,
      durationMs,
      message,
      metadata,
      createdAt: Date.now(),
    };

    try {
      await this.logRepo.log(logEntry);
    } catch (err) {
      console.error(`[BaseAgent] Failed to write log for ${this.name}:`, err);
    }
  }

  /**
   * Polite delay with jitter between consecutive network requests
   */
  protected async politeDelay(minMs = 300, maxMs = 700): Promise<void> {
    const jitter = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
    await new Promise((resolve) => setTimeout(resolve, jitter));
  }
}
