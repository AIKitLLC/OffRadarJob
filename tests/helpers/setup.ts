// Never let tests reach the real Telegram API: answer api.telegram.org calls locally.
const realFetch = globalThis.fetch;
globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
  const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
  if (url.startsWith("https://api.telegram.org/")) return Response.json({ ok: true, result: true });
  return realFetch(input as any, init);
}) as typeof fetch;

// Worker requests in production always carry CF-Connecting-IP (set by Cloudflare's edge). Give test
// requests a default so admin routes see a client IP; tests that need it absent delete the header.
const RealRequest = globalThis.Request;
class TestRequest extends RealRequest {
  constructor(input: RequestInfo | URL, init?: RequestInit) {
    super(input as any, init);
    if (!this.headers.has("CF-Connecting-IP")) this.headers.set("CF-Connecting-IP", "192.0.2.1");
  }
}
globalThis.Request = TestRequest as typeof Request;
