/**
 * Fetches one apply URL with redirects handled by the caller.
 * Every hop is validated with the same policy as the original URL before it is requested.
 */
import { validateApplyUrl, type StaticValidation } from "./apply-url-guard.js";

export type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

export const MAX_APPLY_REDIRECTS = 5;

const REDIRECT_STATUSES = new Set([301, 302, 303, 307, 308]);
const UA = "Mozilla/5.0 (compatible; OffRadarJobsLinkChecker/1.0; +https://jobs.ai-kit.net)";

export interface GuardedFetchOptions {
  timeoutMs: number;
  maxRedirects?: number;
  /** Return false to refuse another outbound request (caller budget). */
  allowSubrequest?: () => boolean;
}

export type GuardedFetchResult =
  | { outcome: "response"; response: Response; finalUrl: string; subrequests: number }
  | { outcome: "rejected"; reason: NonNullable<StaticValidation["reason"]>; finalUrl: string; subrequests: number }
  | { outcome: "network"; finalUrl: string; subrequests: number }
  | { outcome: "budget"; finalUrl: string; subrequests: number };

function methodAfterRedirect(status: number, method: "HEAD" | "GET"): "HEAD" | "GET" {
  if (status === 303) return "GET";
  return method;
}

function resolveRedirect(current: string, location: string): string | null {
  try {
    return new URL(location, current).href;
  } catch {
    return null;
  }
}

async function timedFetch(fetchFn: FetchLike, url: string, method: "HEAD" | "GET", timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetchFn(url, {
      method,
      redirect: "manual",
      signal: controller.signal,
      headers: { "user-agent": UA },
    });
  } finally {
    clearTimeout(timer);
  }
}

function observedUrl(response: Response, current: string): string {
  return response.url || current;
}

/**
 * Request `startUrl`. Redirect responses are not followed until the next URL
 * passes validateApplyUrl. A rejected hop is never requested.
 */
export async function fetchValidatedApplyUrl(
  startUrl: string,
  fetchFn: FetchLike,
  method: "HEAD" | "GET",
  opts: GuardedFetchOptions
): Promise<GuardedFetchResult> {
  const maxRedirects = opts.maxRedirects ?? MAX_APPLY_REDIRECTS;
  let current = startUrl;
  let hopMethod = method;
  let subrequests = 0;
  let redirectsFollowed = 0;
  const seen = new Set<string>();

  while (true) {
    if (seen.has(`${hopMethod} ${current}`)) {
      return { outcome: "network", finalUrl: current, subrequests };
    }
    seen.add(`${hopMethod} ${current}`);

    const verdict = validateApplyUrl(current);
    if (!verdict.ok) {
      return { outcome: "rejected", reason: verdict.reason ?? "malformed", finalUrl: current, subrequests };
    }
    if (opts.allowSubrequest && !opts.allowSubrequest()) {
      return { outcome: "budget", finalUrl: current, subrequests };
    }

    subrequests++;
    let response: Response;
    try {
      response = await timedFetch(fetchFn, current, hopMethod, opts.timeoutMs);
    } catch {
      return { outcome: "network", finalUrl: current, subrequests };
    }

    const finalUrl = observedUrl(response, current);
    if (finalUrl !== current) {
      const observed = validateApplyUrl(finalUrl);
      if (!observed.ok && observed.reason === "blocked_host") {
        return { outcome: "rejected", reason: "blocked_host", finalUrl, subrequests };
      }
    }

    const location = REDIRECT_STATUSES.has(response.status) ? response.headers.get("location")?.trim() ?? "" : "";
    if (!location) {
      return { outcome: "response", response, finalUrl, subrequests };
    }

    const next = resolveRedirect(current, location);
    if (!next) {
      return { outcome: "rejected", reason: "malformed", finalUrl: current, subrequests };
    }
    const nextVerdict = validateApplyUrl(next);
    if (!nextVerdict.ok) {
      return { outcome: "rejected", reason: nextVerdict.reason ?? "malformed", finalUrl: next, subrequests };
    }
    if (response.body) await response.body.cancel().catch(() => {});
    redirectsFollowed++;
    if (redirectsFollowed > maxRedirects) {
      return { outcome: "network", finalUrl: next, subrequests };
    }
    hopMethod = methodAfterRedirect(response.status, hopMethod);
    current = next;
  }
}
