import { EdgeProxy } from "./edge-proxy.js";
import { productionHostRedirects } from "./host-redirect-table.js";
import { productionHostRoutes } from "./host-route-table.js";

/**
 * Zone ai-kit.net is on a different Cloudflare account than the origin Workers.
 * Custom domains cannot cross accounts, so this Worker only forwards traffic:
 *   ai-kit.net       -> ai-kit-net.tuannx87.workers.dev
 *   jobs.ai-kit.net  -> off-radar-jobs.tuannx87.workers.dev
 *   data.ai-kit.net  -> nhtsa-edge-api.tuannx87.workers.dev
 *   www.ai-kit.net   -> 301 to https://ai-kit.net (same path and query)
 * It has no bindings and stores nothing.
 */
const proxy = new EdgeProxy(productionHostRoutes, undefined, undefined, fetch, productionHostRedirects);

export default {
  fetch(request: Request): Promise<Response> {
    return proxy.handle(request);
  },
} satisfies ExportedHandler;
