/** Public hostname -> canonical public hostname. Matched hosts get a 301, never proxied. */
export class HostRedirectTable {
  constructor(private readonly redirects: ReadonlyMap<string, string>) {}

  resolve(host: string): string | undefined {
    return this.redirects.get(host.trim().toLowerCase());
  }

  /** Same path and query on the canonical host, always https. */
  locationFor(incoming: URL): string | undefined {
    const target = this.resolve(incoming.hostname);
    if (!target) return undefined;
    return `https://${target}${incoming.pathname}${incoming.search}`;
  }
}

export const noHostRedirects = new HostRedirectTable(new Map());

export const productionHostRedirects = new HostRedirectTable(new Map([["www.ai-kit.net", "ai-kit.net"]]));
