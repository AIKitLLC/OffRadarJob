import { gatewayFailureResponse, reportGatewayFailure } from "./gateway-failure-response.js";
import { HostRouteTable } from "./host-route-table.js";
import { LocationRewriter } from "./location-rewriter.js";
import { SetCookieRewriter } from "./set-cookie-rewriter.js";
import { buildUpstreamFetchInit, dispatchUpstream } from "./upstream-fetch-init.js";
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
    const upstream = await dispatchUpstream(this.fetchImpl, upstreamUrl.toString(), init);
    return this.responses.rewrite(upstream, upstreamHost, publicHost);
  }
}
