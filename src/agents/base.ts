import { Result, Ok, Err, CrawlLog } from "../types/domain.js";
import { LogRepository } from "../db/repositories.js";
import { isBlockedApplyHost } from "../services/apply-url-guard.js";

const MAX_REDIRECT_HOPS = 5;
const MAX_RESPONSE_BYTES = 2 * 1024 * 1024; // 2 MB cap per fetched page

export interface FetchOptions {
  timeoutMs?: number;
  headers?: Record<string, string>;
}

function validateSafeFetchUrl(rawUrl: string): { ok: true; url: URL } | { ok: false; error: string } {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return { ok: false, error: `Invalid URL: ${rawUrl}` };
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return { ok: false, error: `Unsupported protocol ${parsed.protocol} for URL: ${rawUrl}` };
  }
  if (parsed.username || parsed.password) {
    return { ok: false, error: `Blocked URL with embedded credentials: ${rawUrl}` };
  }
  if (isBlockedApplyHost(parsed.hostname)) {
    return { ok: false, error: `Blocked private or internal host ${parsed.hostname} for URL: ${rawUrl}` };
  }
  return { ok: true, url: parsed };
}

async function readBoundedResponseText(response: Response, url: string): Promise<Result<string, Error>> {
  const contentLengthRaw = response.headers?.get("content-length");
  if (contentLengthRaw) {
    const contentLength = Number(contentLengthRaw);
    if (Number.isFinite(contentLength) && contentLength > MAX_RESPONSE_BYTES) {
      await response.body?.cancel?.().catch(() => {});
      return Err(new Error(`Response size ${contentLength} exceeds ${MAX_RESPONSE_BYTES} bytes for URL: ${url}`));
    }
  }

  if (response.body && typeof response.body.getReader === "function") {
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    const chunks: string[] = [];
    let totalBytes = 0;
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (!value) continue;
        totalBytes += value.byteLength;
        if (totalBytes > MAX_RESPONSE_BYTES) {
          await reader.cancel().catch(() => {});
          return Err(new Error(`Response body exceeds ${MAX_RESPONSE_BYTES} byte limit for URL: ${url}`));
        }
        chunks.push(decoder.decode(value, { stream: true }));
      }
      chunks.push(decoder.decode());
      return Ok(chunks.join(""));
    } finally {
      reader.releaseLock();
    }
  }

  const text = await response.text();
  if (new TextEncoder().encode(text).byteLength > MAX_RESPONSE_BYTES) {
    return Err(new Error(`Response body exceeds ${MAX_RESPONSE_BYTES} byte limit for URL: ${url}`));
  }
  return Ok(text);
}

export abstract class BaseAgent {
  public abstract readonly name: string;

  constructor(protected readonly logRepo?: LogRepository) {}

  /**
   * Polite, SSRF-guarded HTTP fetch with bounded timeout, manual redirects, and 2 MB body cap
   */
  protected async safeFetch(
    url: string,
    options: FetchOptions = {}
  ): Promise<Result<string, Error>> {
    const initialCheck = validateSafeFetchUrl(url);
    if (!initialCheck.ok) {
      return Err(new Error(initialCheck.error));
    }

    const timeoutMs = options.timeoutMs ?? 8000;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const requestHeaders = {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
      "Sec-Ch-Ua": '"Not(A:Brand";v="99", "Google Chrome";v="133", "Chromium";v="133"',
      "Sec-Ch-Ua-Mobile": "?0",
      "Sec-Ch-Ua-Platform": '"macOS"',
      "Upgrade-Insecure-Requests": "1",
      ...options.headers,
    };

    try {
      let currentUrl = initialCheck.url.toString();

      for (let hop = 0; hop <= MAX_REDIRECT_HOPS; hop++) {
        const response = await fetch(currentUrl, {
          signal: controller.signal,
          redirect: "manual",
          headers: requestHeaders,
        });

        if (response.status >= 300 && response.status < 400) {
          const locationHeader = response.headers?.get("location");
          await response.body?.cancel?.().catch(() => {});
          if (!locationHeader) {
            return Err(new Error(`Redirect HTTP ${response.status} without Location header for URL: ${currentUrl}`));
          }
          if (hop === MAX_REDIRECT_HOPS) {
            return Err(new Error(`Exceeded maximum redirects (${MAX_REDIRECT_HOPS}) for URL: ${url}`));
          }
          let nextUrl: string;
          try {
            nextUrl = new URL(locationHeader, currentUrl).toString();
          } catch {
            return Err(new Error(`Invalid redirect target ${locationHeader} for URL: ${currentUrl}`));
          }
          const hopCheck = validateSafeFetchUrl(nextUrl);
          if (!hopCheck.ok) {
            return Err(new Error(`Blocked redirect target: ${hopCheck.error}`));
          }
          currentUrl = hopCheck.url.toString();
          continue;
        }

        if (!response.ok) {
          await response.body?.cancel?.().catch(() => {});
          return Err(new Error(`HTTP ${response.status} ${response.statusText} for URL: ${currentUrl}`));
        }

        return await readBoundedResponseText(response, currentUrl);
      }

      return Err(new Error(`Exceeded maximum redirects (${MAX_REDIRECT_HOPS}) for URL: ${url}`));
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
