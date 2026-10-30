/** Public hostname -> origin workers.dev hostname. Unknown hosts are not proxied. */
export class HostRouteTable {
  constructor(private readonly routes: ReadonlyMap<string, string>) {}

  resolve(host: string): string | undefined {
    return this.routes.get(host.trim().toLowerCase());
  }
}

export const productionHostRoutes = new HostRouteTable(
  new Map([
    ["ai-kit.net", "ai-kit-net.tuannx87.workers.dev"],
    ["jobs.ai-kit.net", "off-radar-jobs.tuannx87.workers.dev"],
    ["data.ai-kit.net", "nhtsa-edge-api.tuannx87.workers.dev"],
  ]),
);
