import { describe, expect, it, vi } from "vitest";
import { EdgeProxy } from "../src/edge-proxy.js";
import { productionHostRedirects } from "../src/host-redirect-table.js";
import { productionHostRoutes } from "../src/host-route-table.js";
import worker from "../src/index.js";

describe("host redirects", () => {
  it("sends www to the apex, keeping path and query", () => {
    const location = productionHostRedirects.locationFor(new URL("http://WWW.ai-kit.net/pricing?ref=x"));
    expect(location).toBe("https://ai-kit.net/pricing?ref=x");
  });

  it("leaves proxied and unknown hosts alone", () => {
    expect(productionHostRedirects.locationFor(new URL("https://ai-kit.net/"))).toBeUndefined();
    expect(productionHostRedirects.locationFor(new URL("https://evil.example/"))).toBeUndefined();
  });

  it("answers 301 at the edge without calling any origin", async () => {
    const fetchImpl = vi.fn<typeof fetch>();
    const proxy = new EdgeProxy(productionHostRoutes, undefined, undefined, fetchImpl, productionHostRedirects);
    const response = await proxy.handle(new Request("https://www.ai-kit.net/a/b?c=1", { method: "POST" }));
    expect(response.status).toBe(301);
    expect(response.headers.get("location")).toBe("https://ai-kit.net/a/b?c=1");
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("is wired into the Worker entrypoint", async () => {
    const response = await worker.fetch(new Request("https://www.ai-kit.net/"));
    expect(response.status).toBe(301);
    expect(response.headers.get("location")).toBe("https://ai-kit.net/");
  });
});
