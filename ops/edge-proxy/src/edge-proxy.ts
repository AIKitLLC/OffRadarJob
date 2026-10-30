import { HostRouteTable } from "./host-route-table.js";
import { LocationRewriter } from "./location-rewriter.js";
import { SetCookieRewriter } from "./set-cookie-rewriter.js";
import { UpstreamHeaderBuilder } from "./upstream-headers.js";
import { UpstreamResponseRewriter } from "./upstream-response.js";

const NOT_FOUND = () =>
  new Response("Not Found", {
    status: 404,
    headers: {
      "cache-control": "no-store",
      "content-type": "text/plain; charset=utf-8",
    },
  });

function requestMayHaveBody(method: string): boolean {
  const normalized = method.toUpperCase();
  return normalized !== "GET" && normalized !== "HEAD";
}

export class EdgeProxy {
  private readonly headers = new UpstreamHeaderBuilder();
  private readonly responses: UpstreamResponseRewriter;

  constructor(
    private readonly routes: HostRouteTable,
    locations = new LocationRewriter(),
    cookies = new SetCookieRewriter(),
    private readonly fetchImpl: typeof fetch = fetch,
  ) {
    this.responses = new UpstreamResponseRewriter(locations, cookies);
  }

  async handle(request: Request): Promise<Response> {
    const incoming = new URL(request.url);
    const publicHost = incoming.hostname.toLowerCase();
    const upstreamHost = this.routes.resolve(publicHost);
    if (!upstreamHost) return NOT_FOUND();

    const upstreamUrl = new URL(`https://${upstreamHost}`);
    upstreamUrl.pathname = incoming.pathname;
    upstreamUrl.search = incoming.search;

    const init: RequestInit & { cf?: { cacheTtl: number } } = {
      method: request.method,
      headers: this.headers.build(request.headers, publicHost),
      redirect: "manual",
      cache: "no-store",
      cf: { cacheTtl: 0 },
    };
    if (requestMayHaveBody(request.method)) init.body = request.body;

    const upstream = await this.fetchImpl(upstreamUrl.toString(), init);
    return this.responses.rewrite(upstream, upstreamHost, publicHost);
  }
}
