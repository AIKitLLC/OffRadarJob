import { describe, expect, it, vi } from "vitest";
import { EdgeProxy } from "../src/edge-proxy.js";
import { productionHostRoutes } from "../src/host-route-table.js";

function proxyWith(fetchImpl: typeof fetch): EdgeProxy {
  return new EdgeProxy(productionHostRoutes, undefined, undefined, fetchImpl);
}

describe("response construction guards", () => {
  it("drops a body on a null-body status and ignores a control character in statusText", async () => {
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new TextEncoder().encode("stale"));
        controller.close();
      },
    });
    const headers = new Headers({ etag: '"abc"' });
    const upstream = {
      status: 304,
      statusText: "Not Modified\r\nX-Injected: 1",
      headers,
      body: stream,
    } as Response;
    const fetchImpl = vi.fn<typeof fetch>(async () => upstream);
    const response = await proxyWith(fetchImpl).handle(new Request("https://ai-kit.net/app.css"));
    expect(response.status).toBe(304);
    expect(response.body).toBeNull();
    expect(response.statusText).not.toContain("Injected");
    expect(response.headers.get("etag")).toBe('"abc"');
    expect(response.headers.get("cache-control")).toBe("no-store");
  });

  it("skips a Set-Cookie the Headers object refuses instead of failing the response", async () => {
    const headers = new Headers({ "content-type": "text/html" });
    headers.getSetCookie = () => ["sid=1\r\nX-Injected: 1; Domain=ai-kit-net.tuannx87.workers.dev; Path=/"];
    const fetchImpl = vi.fn<typeof fetch>(async () => new Response("ok", { status: 200, headers }));
    const response = await proxyWith(fetchImpl).handle(new Request("https://ai-kit.net/"));
    expect(response.status).toBe(200);
    expect(await response.text()).toBe("ok");
    expect(response.headers.getSetCookie()).toEqual([]);
  });
});
