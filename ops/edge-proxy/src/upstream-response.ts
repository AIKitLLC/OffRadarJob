import { LocationRewriter } from "./location-rewriter.js";
import { SetCookieRewriter } from "./set-cookie-rewriter.js";

const NULL_BODY_STATUSES = new Set([101, 204, 205, 304]);

function readSetCookies(headers: Headers): string[] {
  if (typeof headers.getSetCookie === "function") {
    const values = headers.getSetCookie();
    if (values.length > 0) return values;
  }
  const single = headers.get("set-cookie");
  return single ? [single] : [];
}

function bodyForStatus(upstream: Response): BodyInit | null {
  if (NULL_BODY_STATUSES.has(upstream.status)) return null;
  return upstream.body;
}

function usableStatusText(statusText: string): string | undefined {
  if (statusText.length === 0) return undefined;
  for (const char of statusText) {
    if (char.charCodeAt(0) < 0x20) return undefined;
  }
  return statusText;
}

function appendSetCookie(headers: Headers, cookie: string): void {
  try {
    headers.append("set-cookie", cookie);
  } catch {
    return;
  }
}

/** Pass the origin response through, with public-host redirects, cookies, and no cache. */
export class UpstreamResponseRewriter {
  constructor(
    private readonly locations: LocationRewriter,
    private readonly cookies: SetCookieRewriter,
  ) {}

  rewrite(upstream: Response, upstreamHost: string, publicHost: string): Response {
    const headers = new Headers(upstream.headers);
    const location = headers.get("location");
    if (location !== null) {
      headers.set("location", this.locations.rewrite(location, upstreamHost, publicHost));
    }

    const rewrittenCookies = readSetCookies(headers).map((cookie) => this.cookies.rewrite(cookie, publicHost));
    headers.delete("set-cookie");
    for (const cookie of rewrittenCookies) appendSetCookie(headers, cookie);

    headers.set("cache-control", "no-store");
    headers.set("cdn-cache-control", "no-store");

    const init: ResponseInit = {
      status: upstream.status,
      headers,
    };
    const statusText = usableStatusText(upstream.statusText);
    if (statusText !== undefined) init.statusText = statusText;
    return new Response(bodyForStatus(upstream), init);
  }
}
