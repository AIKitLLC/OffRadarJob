import { gatewayFailureResponse, reportGatewayFailure } from "./gateway-failure-response.js";
import { HostRouteTable } from "./host-route-table.js";
import { LocationRewriter } from "./location-rewriter.js";
import { SetCookieRewriter } from "./set-cookie-rewriter.js";
import { buildUpstreamFetchInit, dispatchUpstream } from "./upstream-fetch-init.js";
import { UpstreamHeaderBuilder } from "./upstream-headers.js";
import { UpstreamResponseRewriter } from "./upstream-response.js";

/** Upstream must send response headers within this time, or the proxy answers 503. */
export const UPSTREAM_TIMEOUT_MS = 10_000;

const NOT_FOUND = () =>
  new Response("Not Found", {
    status: 404,
    headers: {
      "cache-control": "no-store",
      "content-type": "text/plain; charset=utf-8",
    },
  });

export class EdgeProxy {
  private readonly headers = new UpstreamHeaderBuilder();
  private readonly responses: UpstreamResponseRewriter;

  constructor(
    private readonly routes: HostRouteTable,
    locations = new LocationRewriter(),
    cookies = new SetCookieRewriter(),
    private readonly fetchImpl: typeof fetch = fetch,
    private readonly timeoutMs: number = UPSTREAM_TIMEOUT_MS,
  ) {
    this.responses = new UpstreamResponseRewriter(locations, cookies);
  }

  async handle(request: Request): Promise<Response> {
    try {
      return await this.forward(request);
    } catch (error) {
      reportGatewayFailure(error);
      return gatewayFailureResponse();
    }
  }

  private async forward(request: Request): Promise<Response> {
    const incoming = new URL(request.url);
    const publicHost = incoming.hostname.toLowerCase();
    const upstreamHost = this.routes.resolve(publicHost);
    if (!upstreamHost) return NOT_FOUND();

    const upstreamUrl = new URL(`https://${upstreamHost}`);
    upstreamUrl.pathname = incoming.pathname;
    upstreamUrl.search = incoming.search;

    const init = buildUpstreamFetchInit(request, this.headers.build(request.headers, publicHost));
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(new DOMException("upstream timeout", "TimeoutError")), this.timeoutMs);
    let upstream: Response;
    try {
      upstream = await dispatchUpstream(this.fetchImpl, upstreamUrl.toString(), { ...init, signal: controller.signal });
    } finally {
      // Headers arrived (or fetch failed): the body may keep streaming without the deadline.
      clearTimeout(timer);
    }
    return this.responses.rewrite(upstream, upstreamHost, publicHost);
  }
}
