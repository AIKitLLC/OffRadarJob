import { describe, expect, it, vi } from "vitest";
import { EdgeProxy, UPSTREAM_TIMEOUT_MS } from "../src/edge-proxy.js";
import { productionHostRoutes } from "../src/host-route-table.js";

describe("upstream timeout", () => {
  it("defaults to 10 seconds", () => {
    expect(UPSTREAM_TIMEOUT_MS).toBe(10_000);
  });

  it("aborts a hanging upstream and answers 503 with Retry-After, logging the timeout", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    let seen: AbortSignal | undefined;
    const fetchImpl = vi.fn<typeof fetch>((_url, init) => {
      seen = init?.signal ?? undefined;
      return new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener("abort", () => reject(init.signal!.reason));
      });
    });
    try {
      const proxy = new EdgeProxy(productionHostRoutes, undefined, undefined, fetchImpl, 20);
      const response = await proxy.handle(new Request("https://ai-kit.net/"));
      expect(seen?.aborted).toBe(true);
      expect(response.status).toBe(503);
      expect(response.headers.get("retry-after")).toBe("30");
      expect(JSON.parse(errorSpy.mock.calls.flat().join(" "))).toEqual({ event: "edge_proxy_request_failed", name: "TimeoutError" });
    } finally {
      errorSpy.mockRestore();
    }
  });

  it("does not abort a response that arrives in time", async () => {
    let seen: AbortSignal | undefined;
    const fetchImpl = vi.fn<typeof fetch>(async (_url, init) => {
      seen = init?.signal ?? undefined;
      return new Response("ok", { status: 200 });
    });
    const proxy = new EdgeProxy(productionHostRoutes, undefined, undefined, fetchImpl, 20);
    const response = await proxy.handle(new Request("https://ai-kit.net/"));
    await new Promise((r) => setTimeout(r, 40));
    expect(response.status).toBe(200);
    expect(seen?.aborted).toBe(false);
    expect(await response.text()).toBe("ok");
  });
});
