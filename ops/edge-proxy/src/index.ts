import { EdgeProxy } from "./edge-proxy.js";
import { productionHostRoutes } from "./host-route-table.js";

/**
 * Zone ai-kit.net is on a different Cloudflare account than the origin Workers.
 * Custom domains cannot cross accounts, so this Worker only forwards traffic:
 *   ai-kit.net       -> ai-kit-net.tuannx87.workers.dev
 *   jobs.ai-kit.net  -> off-radar-jobs.tuannx87.workers.dev
 *   data.ai-kit.net  -> nhtsa-edge-api.tuannx87.workers.dev
 * It has no bindings and stores nothing.
 */
const proxy = new EdgeProxy(productionHostRoutes);

export default {
  fetch(request: Request): Promise<Response> {
    return proxy.handle(request);
  },
} satisfies ExportedHandler;
