function requestMayHaveBody(method: string): boolean {
  const normalized = method.toUpperCase();
  return normalized !== "GET" && normalized !== "HEAD";
}

export function buildUpstreamFetchInit(request: Request, headers: Headers): RequestInit & { cf: { cacheTtl: number } } {
  const init: RequestInit & { cf: { cacheTtl: number } } = {
    method: request.method,
    headers,
    redirect: "manual",
    cf: { cacheTtl: 0 },
  };
  if (requestMayHaveBody(request.method)) init.body = request.body;
  return init;
}

export function dispatchUpstream(fetchImpl: typeof fetch, url: string, init: RequestInit): Promise<Response> {
  return fetchImpl.call(globalThis, url, init);
}
