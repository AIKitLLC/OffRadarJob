import { LocationRewriter } from "./location-rewriter.js";
import { SetCookieRewriter } from "./set-cookie-rewriter.js";

function readSetCookies(headers: Headers): string[] {
  if (typeof headers.getSetCookie === "function") {
    const values = headers.getSetCookie();
    if (values.length > 0) return values;
  }
  const single = headers.get("set-cookie");
  return single ? [single] : [];
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
    for (const cookie of rewrittenCookies) headers.append("set-cookie", cookie);

    headers.set("cache-control", "no-store");
    headers.set("cdn-cache-control", "no-store");

    return new Response(upstream.body, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers,
    });
  }
}
