// Never let tests reach the real Telegram API: answer api.telegram.org calls locally.
const realFetch = globalThis.fetch;
globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
  const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
  if (url.startsWith("https://api.telegram.org/")) return Response.json({ ok: true, result: true });
  return realFetch(input as any, init);
}) as typeof fetch;
