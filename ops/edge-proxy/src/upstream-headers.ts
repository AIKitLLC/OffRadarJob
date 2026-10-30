const HOP_BY_HOP = ["host", "connection", "keep-alive", "transfer-encoding", "upgrade", "proxy-connection", "te", "trailer"];

export class UpstreamHeaderBuilder {
  build(source: Headers, publicHost: string): Headers {
    const headers = new Headers(source);
    for (const name of HOP_BY_HOP) headers.delete(name);
    headers.set("X-Forwarded-Host", publicHost);
    const clientIp = source.get("CF-Connecting-IP");
    if (clientIp) headers.set("X-Forwarded-For", clientIp);
    return headers;
  }
}
