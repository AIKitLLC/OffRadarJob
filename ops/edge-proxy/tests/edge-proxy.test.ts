import { describe, expect, it, vi } from "vitest";
import { EdgeProxy } from "../src/edge-proxy.js";
import { productionHostRoutes } from "../src/host-route-table.js";
import worker from "../src/index.js";
import { UpstreamHeaderBuilder } from "../src/upstream-headers.js";

function proxyWith(fetchImpl: typeof fetch): EdgeProxy {
  return new EdgeProxy(productionHostRoutes, undefined, undefined, fetchImpl);
}

describe("upstream headers", () => {
  it("drops Host and sends CF-Connecting-IP as X-Forwarded-For", () => {
    const source = new Headers({
      "content-type": "text/plain",
      "cf-connecting-ip": "203.0.113.10",
    });
    const headers = new UpstreamHeaderBuilder().build(source, "ai-kit.net");
    expect(headers.get("host")).toBeNull();
    expect(headers.get("x-forwarded-host")).toBe("ai-kit.net");
    expect(headers.get("x-forwarded-for")).toBe("203.0.113.10");
    expect(headers.get("content-type")).toBe("text/plain");
  });
});

describe("edge proxy", () => {
  it("returns 404 for an unknown host and does not call origin", async () => {
    const fetchImpl = vi.fn<typeof fetch>();
    const response = await proxyWith(fetchImpl).handle(new Request("https://www.ai-kit.net/secret"));
    expect(response.status).toBe(404);
    expect(await response.text()).toBe("Not Found");
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("returns 404 from the Worker entrypoint for an unknown host", async () => {
    const response = await worker.fetch(new Request("https://evil.example/"));
    expect(response.status).toBe(404);
  });

  it("forwards method, path, query, and the body stream without the Host header", async () => {
    const chunks: Uint8Array[] = [];
    const fetchImpl = vi.fn<typeof fetch>(async (_input, init) => {
      const reader = (init?.body as ReadableStream<Uint8Array>).getReader();
      for (;;) {
        const next = await reader.read();
        if (next.done) break;
        chunks.push(next.value);
      }
      return new Response("ok", { status: 201 });
    });

    const request = new Request("https://AI-KIT.NET/cloudflare/audit?check=1", {
      method: "POST",
      headers: {
        "content-type": "text/plain",
        "cf-connecting-ip": "203.0.113.10",
        "x-request-id": "req-1",
      },
      body: "hello",
    });
    expect(request.body).toBeInstanceOf(ReadableStream);

    const response = await proxyWith(fetchImpl).handle(request);
    expect(response.status).toBe(201);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(fetchImpl).toHaveBeenCalledOnce();
    const [url, init] = fetchImpl.mock.calls[0]!;
    expect(url).toBe("https://ai-kit-net.tuannx87.workers.dev/cloudflare/audit?check=1");
    expect(init?.method).toBe("POST");
    expect(init?.redirect).toBe("manual");
    expect(init?.cache).toBe("no-store");
    expect(init?.body).toBeInstanceOf(ReadableStream);
    const headers = new Headers(init?.headers);
    expect(headers.get("host")).toBeNull();
    expect(headers.get("x-forwarded-host")).toBe("ai-kit.net");
    expect(headers.get("x-forwarded-for")).toBe("203.0.113.10");
    expect(headers.get("x-request-id")).toBe("req-1");
    expect(headers.get("content-type")).toBe("text/plain");
    expect(new TextDecoder().decode(chunks[0])).toBe("hello");
  });

  it("rewrites Location and every Set-Cookie from the upstream response", async () => {
    const fetchImpl = vi.fn<typeof fetch>(async () => {
      const headers = new Headers();
      headers.set("location", "https://off-radar-jobs.tuannx87.workers.dev/admin?next=/");
      headers.append("set-cookie", "sid=1; Domain=off-radar-jobs.tuannx87.workers.dev; Path=/; Secure");
      headers.append("set-cookie", "pref=1; Path=/");
      headers.set("cache-control", "public, max-age=86400");
      return new Response(null, { status: 302, headers });
    });

    const response = await proxyWith(fetchImpl).handle(new Request("https://jobs.ai-kit.net/admin"));
    expect(response.status).toBe(302);
    expect(response.headers.get("location")).toBe("https://jobs.ai-kit.net/admin?next=/");
    expect(response.headers.getSetCookie()).toEqual([
      "sid=1; Domain=jobs.ai-kit.net; Path=/; Secure",
      "pref=1; Path=/",
    ]);
    expect(response.headers.get("cache-control")).toBe("no-store");
    const [, init] = fetchImpl.mock.calls[0]!;
    expect(init?.redirect).toBe("manual");
    expect(init?.body).toBeUndefined();
  });
});
