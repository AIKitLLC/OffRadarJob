const API_ORIGIN = "https://api.cloudflare.com";

interface CloudflareError {
  code?: number;
  message?: string;
}

export interface CloudflareEnvelope {
  result: unknown;
  resultInfo: { totalPages: number };
}

function errorDetail(errors: CloudflareError[], status: number): string {
  const text = errors
    .map((error) => [error.code, error.message].filter((part) => part !== undefined && part !== "").join(" "))
    .filter((line) => line.length > 0)
    .join("; ");
  return text.length > 0 ? text : `HTTP ${status}`;
}

function parseEnvelope(status: number, payload: unknown): CloudflareEnvelope {
  if (!payload || typeof payload !== "object") {
    throw new Error(`Cloudflare API returned an unreadable response (HTTP ${status})`);
  }
  const body = payload as Record<string, unknown>;
  const errors: CloudflareError[] = [];
  if (Array.isArray(body.errors)) {
    for (const entry of body.errors) {
      if (!entry || typeof entry !== "object") continue;
      const error = entry as Record<string, unknown>;
      const parsed: CloudflareError = {};
      if (typeof error.code === "number") parsed.code = error.code;
      if (typeof error.message === "string") parsed.message = error.message;
      errors.push(parsed);
    }
  }
  if (body.success !== true) {
    throw new Error(`Cloudflare API request failed: ${errorDetail(errors, status)}`);
  }

  let totalPages = 1;
  if (body.result_info && typeof body.result_info === "object") {
    const info = body.result_info as Record<string, unknown>;
    if (typeof info.total_pages === "number") totalPages = info.total_pages;
  }
  return { result: body.result, resultInfo: { totalPages } };
}

/** Minimal Cloudflare REST client. Redirects are refused so the token stays on api.cloudflare.com. */
export class CloudflareApi {
  constructor(
    private readonly token: string,
    private readonly fetchImpl: typeof fetch,
  ) {}

  async get(pathAndQuery: string): Promise<CloudflareEnvelope> {
    return this.request(pathAndQuery, "GET");
  }

  async delete(pathAndQuery: string): Promise<void> {
    await this.request(pathAndQuery, "DELETE");
  }

  private async request(pathAndQuery: string, method: "GET" | "DELETE"): Promise<CloudflareEnvelope> {
    const url = new URL(pathAndQuery, API_ORIGIN);
    if (url.origin !== API_ORIGIN || !url.pathname.startsWith("/client/v4/")) {
      throw new Error("Refusing a non-Cloudflare API URL");
    }
    const response = await this.fetchImpl(url, {
      method,
      redirect: "manual",
      cache: "no-store",
      headers: {
        Authorization: `Bearer ${this.token}`,
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(20_000),
    });
    if (response.status >= 300 && response.status < 400) {
      throw new Error(`Cloudflare API redirect refused (HTTP ${response.status})`);
    }
    const text = await response.text();
    let payload: unknown;
    try {
      payload = text.length === 0 ? null : JSON.parse(text);
    } catch {
      throw new Error(`Cloudflare API returned non-JSON (HTTP ${response.status})`);
    }
    return parseEnvelope(response.status, payload);
  }
}
