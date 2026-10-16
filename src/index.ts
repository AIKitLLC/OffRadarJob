import { renderDashboardHtml } from "./ui/dashboard.js";
import { renderAdminDashboardHtml, renderAdminLoginHtml } from "./ui/admin-dashboard.js";
import { ID1Database } from "./db/types.js";
import {
  CompanyRepository,
  CareerPageRepository,
  JobRepository,
  LogRepository,
  CrawlTaskRepository,
  UserRepository,
  CvRepository,
  AuthSessionRepository,
  SystemSettingsRepository,
  LlmFeedbackRepository,
  UserSubscriptionRepository,
} from "./db/repositories.js";
import { McpServerHandler } from "./mcp/mcp-server.js";
import {
  AdminAuthLimiter,
  ADMIN_AUTH_MAX_FAILURES,
  ADMIN_AUTH_WINDOW_MS,
  type LimiterNamespaceLike,
} from "./durable/admin-auth-limiter.js";

export { AdminAuthLimiter, ADMIN_AUTH_MAX_FAILURES, ADMIN_AUTH_WINDOW_MS };
import { PipelineOrchestrator } from "./orchestrator/dispatcher.js";
import {
  DiscoveryMessage,
  ProfileMessage,
  HuntMessage,
  ExtractMessage,
} from "./types/queues.js";
import {
  CrawlTaskStatus,
  User,
  CvVersion,
  Job,
  LlmFeedback,
  FeedbackStatus,
  UserSubscription,
  TargetGroup,
  TARGET_GROUPS,
} from "./types/domain.js";
import { CURATED_SEEDS } from "./seeds/seed-catalogue.js";
import { PublicSourceManager } from "./harvesters/public-source-harvester.js";
import { NewGradHarvester } from "./harvesters/newgrad-harvester.js";
import { SmbHarvester, SMB_CATALOGUE } from "./harvesters/smb-harvester.js";
import { JdRerankerService } from "./services/jd-reranker.js";
import { DecisionApiService } from "./services/decision-api.js";
import { CvTagCloudService } from "./services/cv-tag-cloud.js";

export interface KvNamespace {
  get(key: string, type?: "text" | "json"): Promise<any>;
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
  delete(key: string): Promise<void>;
}

export interface Env {
  DB: ID1Database;
  CACHE?: KvNamespace;
  AI?: {
    run(model: string, inputs: Record<string, unknown>): Promise<any>;
  };
  ADMIN_TOKEN?: string;
  /** Dedicated HMAC key for admin session cookies (>= 32 chars). Sessions fail closed without it. */
  ADMIN_SESSION_SECRET?: string;
  /** SQLite-backed Durable Object namespace that stores failed admin auth attempts. */
  ADMIN_AUTH_LIMITER?: LimiterNamespaceLike;
  TELEGRAM_BOT_TOKEN?: string;
  TELEGRAM_BOT_USERNAME?: string;
  /** Comma-separated numeric Telegram user IDs that have bot admin rights. */
  TELEGRAM_ADMIN_IDS?: string;
  TELEGRAM_ADMIN_CHAT_ID?: string;
  /** Secret Telegram echoes in X-Telegram-Bot-Api-Secret-Token on every webhook call. Required. */
  TELEGRAM_WEBHOOK_SECRET?: string;
  /** Max age (seconds) of a Telegram Login Widget auth_date. Default 86400. */
  TELEGRAM_AUTH_MAX_AGE_SECONDS?: string;
  /** "true" re-enables the deprecated /mcp?token= query auth. Default off. */
  MCP_ALLOW_QUERY_TOKEN?: string;
  /** "true" enables the demo-only /api/auth/telegram/confirm-session endpoint. Default off. */
  ENABLE_DEMO_CONFIRM_SESSION?: string;
  DISCOVERY_QUEUE?: {
    send(message: unknown): Promise<void>;
  };
  PROFILE_QUEUE?: {
    send(message: unknown): Promise<void>;
  };
  HUNT_QUEUE?: {
    send(message: unknown): Promise<void>;
  };
  EXTRACT_QUEUE?: {
    send(message: unknown): Promise<void>;
  };
  DLQ?: {
    send(message: unknown): Promise<void>;
  };
}

// In-memory session store fallback for development / tests or KV fallback
export const memoryAuthSessions = new Map<string, {
  status: "pending" | "authenticated";
  user?: User;
  apiToken?: string;
  createdAt?: number;
  authenticatedAt?: number;
}>();

async function getOrSetKvCache<T>(
  env: Env,
  key: string,
  ttlSeconds: number,
  fetcher: () => Promise<T>
): Promise<T> {
  if (env.CACHE && typeof env.CACHE.get === "function") {
    try {
      const cached = await env.CACHE.get(key, "json");
      if (cached !== null && cached !== undefined) {
        return cached as T;
      }
    } catch (err) {
      console.warn(`[KV Cache] Failed reading key ${key}:`, err);
    }
  }

  const data = await fetcher();

  if (env.CACHE && typeof env.CACHE.put === "function" && data !== null && data !== undefined) {
    try {
      await env.CACHE.put(key, JSON.stringify(data), { expirationTtl: ttlSeconds });
    } catch (err) {
      console.warn(`[KV Cache] Failed writing key ${key}:`, err);
    }
  }

  return data;
}

/**
 * SHA-256 of the admin token that used to be hardcoded (and public in git history).
 * It is rejected even if someone sets it as the ADMIN_TOKEN secret again.
 */
export const LEAKED_ADMIN_TOKEN_SHA256 = "8def82a2adab551529187ce033d1da734c0483c2cb4c6756110957314cabfbb1";

export const ADMIN_COOKIE_NAME = "admin_session";

async function sha256Bytes(value: string): Promise<Uint8Array> {
  return new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)));
}

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

/** Constant-time comparison: both sides are hashed to 32 bytes, then XOR-compared. */
export async function timingSafeEqualStr(a: string, b: string): Promise<boolean> {
  const [ha, hb] = await Promise.all([sha256Bytes(a), sha256Bytes(b)]);
  let diff = 0;
  for (let i = 0; i < ha.length; i++) diff |= ha[i]! ^ hb[i]!;
  return diff === 0;
}

/** The configured admin secret, or null when admin must stay closed (unset, too short, or the leaked value). */
export async function getAdminSecret(env?: Pick<Env, "ADMIN_TOKEN">): Promise<string | null> {
  const secret = (env?.ADMIN_TOKEN ?? "").trim();
  if (secret.length < 32) return null;
  if (toHex(await sha256Bytes(secret)) === LEAKED_ADMIN_TOKEN_SHA256) return null;
  return secret;
}

export async function isAdminConfigured(env?: Pick<Env, "ADMIN_TOKEN">): Promise<boolean> {
  return (await getAdminSecret(env)) !== null;
}

/** Validate a candidate token against the ADMIN_TOKEN secret. Fails closed. */
export async function verifyAdminToken(env: Pick<Env, "ADMIN_TOKEN"> | undefined, candidate: string | null | undefined): Promise<boolean> {
  const secret = await getAdminSecret(env);
  if (!secret || !candidate) return false;
  return timingSafeEqualStr(candidate, secret);
}

export const ADMIN_SESSION_TTL_SECONDS = 8 * 60 * 60;

function b64urlEncode(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function b64urlDecode(value: string): Uint8Array | null {
  try {
    const norm = value.replace(/-/g, "+").replace(/_/g, "/");
    const bin = atob(norm + "=".repeat((4 - (norm.length % 4)) % 4));
    return Uint8Array.from(bin, (c) => c.charCodeAt(0));
  } catch {
    return null;
  }
}

export const ADMIN_SESSION_SECRET_MIN_LENGTH = 32;

/** The dedicated session signing secret, or null (fail closed) when unset, too short, or equal to ADMIN_TOKEN. */
export function getAdminSessionSecret(env?: Pick<Env, "ADMIN_SESSION_SECRET" | "ADMIN_TOKEN">): string | null {
  const secret = (env?.ADMIN_SESSION_SECRET ?? "").trim();
  if (secret.length < ADMIN_SESSION_SECRET_MIN_LENGTH) return null;
  if (secret === (env?.ADMIN_TOKEN ?? "").trim()) return null;
  return secret;
}

async function adminSessionKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
}

/** Create a signed admin session value `<b64url(payload)>.<b64url(hmac)>` with payload {iat, exp} (seconds). */
export async function createAdminSession(env: Pick<Env, "ADMIN_TOKEN" | "ADMIN_SESSION_SECRET"> | undefined, nowMs = Date.now()): Promise<string | null> {
  if (!(await getAdminSecret(env))) return null;
  const secret = getAdminSessionSecret(env);
  if (!secret) return null;
  const iat = Math.floor(nowMs / 1000);
  const payload = b64urlEncode(new TextEncoder().encode(JSON.stringify({ iat, exp: iat + ADMIN_SESSION_TTL_SECONDS })));
  const sig = new Uint8Array(await crypto.subtle.sign("HMAC", await adminSessionKey(secret), new TextEncoder().encode(payload)));
  return `${payload}.${b64urlEncode(sig)}`;
}

/** Verify a signed admin session (constant-time signature check, expiry enforced). Fails closed. */
export async function verifyAdminSession(env: Pick<Env, "ADMIN_TOKEN" | "ADMIN_SESSION_SECRET"> | undefined, value: string | null | undefined, nowMs = Date.now()): Promise<boolean> {
  if (!(await getAdminSecret(env))) return false;
  const secret = getAdminSessionSecret(env);
  if (!secret || !value) return false;
  const parts = value.split(".");
  if (parts.length !== 2 || !parts[0] || !parts[1]) return false;
  const given = b64urlDecode(parts[1]);
  if (!given) return false;
  const expected = new Uint8Array(await crypto.subtle.sign("HMAC", await adminSessionKey(secret), new TextEncoder().encode(parts[0])));
  let diff = given.length ^ expected.length;
  for (let i = 0; i < expected.length; i++) diff |= expected[i]! ^ (given[i] ?? 0);
  if (diff !== 0) return false;
  try {
    const raw = b64urlDecode(parts[0]);
    if (!raw) return false;
    const payload = JSON.parse(new TextDecoder().decode(raw)) as { iat?: unknown; exp?: unknown };
    if (typeof payload.iat !== "number" || typeof payload.exp !== "number") return false;
    const now = Math.floor(nowMs / 1000);
    if (payload.exp <= now) return false;
    if (payload.iat > now + 60) return false;
    if (payload.exp - payload.iat > ADMIN_SESSION_TTL_SECONDS) return false;
    return true;
  } catch {
    return false;
  }
}

export interface EffectiveConfig {
  telegramBotToken: string;
  telegramBotUsername: string;
  telegramAdminIds: string;
  telegramAdminChatId: string;
  adminToken: string;
}

export async function getEffectiveConfig(env: Env, settingsRepo?: SystemSettingsRepository): Promise<EffectiveConfig> {
  const dynamicMap = settingsRepo ? await settingsRepo.getAll() : {};
  return {
    telegramBotToken: dynamicMap["telegram_bot_token"] || env.TELEGRAM_BOT_TOKEN || "",
    telegramBotUsername: dynamicMap["telegram_bot_username"] || env.TELEGRAM_BOT_USERNAME || "OffRadarJobBot",
    // Bot admin identity comes only from the TELEGRAM_ADMIN_IDS secret/var (numeric IDs), never D1 settings.
    telegramAdminIds: env.TELEGRAM_ADMIN_IDS || "",
    telegramAdminChatId: dynamicMap["telegram_admin_chat_id"] || env.TELEGRAM_ADMIN_CHAT_ID || "",
    // Admin token comes ONLY from the ADMIN_TOKEN Cloudflare secret (never D1 settings, never a default).
    adminToken: "",
  };
}

/**
 * Admin auth: `x-admin-token` / `Authorization: Bearer` header, or the HttpOnly
 * session cookie set by POST /admin/login. Query-string tokens are not accepted.
 * Returns false whenever the ADMIN_TOKEN secret is unset (fail closed).
 */
/**
 * Rate limit on failed admin auth attempts, keyed per client IP.
 * ADMIN_AUTH_MAX_FAILURES failures inside ADMIN_AUTH_WINDOW_MS => 429 until the window expires.
 * Production state lives in the ADMIN_AUTH_LIMITER Durable Object (SQLite). The in-memory map is only
 * used when that binding is absent (unit tests / bare local runs).
 */
const memoryAuthFailures = new Map<string, { count: number; resetAt: number }>();

/** Client IP as reported by Cloudflare. Returns null when CF-Connecting-IP is absent. */
export function clientIp(request: Request): string | null {
  const ip = request.headers.get("CF-Connecting-IP")?.trim();
  return ip ? ip : null;
}

async function limiterCall(env: Pick<Env, "ADMIN_AUTH_LIMITER"> | undefined, op: "check" | "fail", key: string): Promise<boolean> {
  const ns = env?.ADMIN_AUTH_LIMITER;
  if (ns) {
    try {
      const stub = ns.get(ns.idFromName(key));
      const res = await stub.fetch("https://admin-auth-limiter/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ op, key }),
      });
      if (!res.ok) return true;
      return Boolean(((await res.json()) as { limited?: unknown }).limited);
    } catch (err) {
      console.warn("[AdminAuthLimiter] unavailable, failing closed:", (err as Error)?.message);
      return true; // fail closed
    }
  }
  const now = Date.now();
  const entry = memoryAuthFailures.get(key);
  if (op === "check") {
    if (!entry) return false;
    if (now >= entry.resetAt) {
      memoryAuthFailures.delete(key);
      return false;
    }
    return entry.count >= ADMIN_AUTH_MAX_FAILURES;
  }
  if (!entry || now >= entry.resetAt) memoryAuthFailures.set(key, { count: 1, resetAt: now + ADMIN_AUTH_WINDOW_MS });
  else entry.count++;
  if (memoryAuthFailures.size > 10_000) {
    for (const [k, v] of memoryAuthFailures) if (now >= v.resetAt) memoryAuthFailures.delete(k);
  }
  return (memoryAuthFailures.get(key)?.count ?? 0) >= ADMIN_AUTH_MAX_FAILURES;
}

export function isAdminAuthRateLimited(request: Request, env?: Pick<Env, "ADMIN_AUTH_LIMITER">): Promise<boolean> {
  const ip = clientIp(request);
  if (!ip) return Promise.resolve(true);
  return limiterCall(env, "check", `ip:${ip}`);
}

export function recordAdminAuthFailure(request: Request, env?: Pick<Env, "ADMIN_AUTH_LIMITER">): Promise<boolean> {
  const ip = clientIp(request);
  if (!ip) return Promise.resolve(true);
  return limiterCall(env, "fail", `ip:${ip}`);
}

/** Test helper: clears the in-memory fallback store. */
export function resetAdminAuthRateLimit(): void {
  memoryAuthFailures.clear();
}

/** Routes that require admin auth (and get the CSRF origin check on writes). */
export function isAdminRoute(path: string): boolean {
  return path.startsWith("/admin") || path.startsWith("/api/admin/") || path === "/api/telegram/setup-webhook" || path === "/api/crawl/seed";
}

/**
 * CSRF guard for state-changing admin requests. Browsers send Sec-Fetch-Site and/or Origin on
 * POST/PUT/PATCH/DELETE; anything cross-site is rejected. Requests with neither header (non-browser
 * clients) are allowed only when authenticated by an explicit header token, never by the cookie alone.
 */
export function isCrossSiteAdminWrite(request: Request, url: URL): boolean {
  const method = request.method.toUpperCase();
  if (method === "GET" || method === "HEAD" || method === "OPTIONS") return false;
  const site = request.headers.get("Sec-Fetch-Site");
  if (site && site !== "same-origin" && site !== "none") return true;
  const origin = request.headers.get("Origin");
  if (origin && origin !== url.origin) return true;
  if (!site && !origin) {
    const auth = request.headers.get("Authorization") ?? "";
    const hasHeaderToken = !!request.headers.get("x-admin-token") || auth.startsWith("Bearer ");
    const hasCookie = new RegExp(`(?:^|;\\s*)${ADMIN_COOKIE_NAME}=`).test(request.headers.get("Cookie") || "");
    if (hasCookie && !hasHeaderToken) return true;
  }
  return false;
}

function rateLimitedResponse(): Response {
  return Response.json(
    { error: "Too many failed admin auth attempts. Try again later." },
    { status: 429, headers: { "Retry-After": String(Math.ceil(ADMIN_AUTH_WINDOW_MS / 1000)) } }
  );
}

export async function isAuthorized(request: Request, _url?: URL, env?: Env): Promise<boolean> {
  const auth = request.headers.get("Authorization") ?? "";
  const tokenHeader = request.headers.get("x-admin-token") || (auth.startsWith("Bearer ") ? auth.slice(7) : "");
  const cookieHeader = request.headers.get("Cookie") || "";
  const matchCookie = cookieHeader.match(new RegExp(`(?:^|;\\s*)${ADMIN_COOKIE_NAME}=([^;]+)`));
  const tokenCookie = matchCookie ? decodeURIComponent(matchCookie[1]!) : "";
  const provided = tokenHeader || tokenCookie;
  const ok = tokenHeader ? await verifyAdminToken(env, tokenHeader) : await verifyAdminSession(env, tokenCookie);
  // Only count attempts that actually presented a credential.
  if (!ok && provided) await recordAdminAuthFailure(request, env);
  return ok;
}

/** Parse TELEGRAM_ADMIN_IDS into numeric Telegram user IDs; non-numeric entries are ignored. */
export function parseTelegramAdminIds(raw: string | undefined): Set<string> {
  return new Set(
    (raw || "")
      .split(",")
      .map((s) => s.trim())
      .filter((s) => /^\d{1,20}$/.test(s))
  );
}

/**
 * Bot admin check: numeric Telegram user ID listed in TELEGRAM_ADMIN_IDS only. D1 role=admin is not
 * trusted, and usernames are never used (they can be changed/claimed).
 */
export function isTelegramAdmin(
  env: Env,
  from: { id: number | string; username?: string },
  userRole?: string,
  config?: EffectiveConfig
): boolean {
  // role=admin stored in D1 is deliberately ignored: bot admin comes only from TELEGRAM_ADMIN_IDS.
  void userRole;
  const id = String(from.id ?? "").trim();
  if (!/^\d{1,20}$/.test(id)) return false;
  return parseTelegramAdminIds(config?.telegramAdminIds || env.TELEGRAM_ADMIN_IDS).has(id);
}

/** Constant-time check of the X-Telegram-Bot-Api-Secret-Token header. Fails closed when unset. */
export async function verifyTelegramWebhookSecret(request: Request, env: Pick<Env, "TELEGRAM_WEBHOOK_SECRET">): Promise<boolean> {
  const expected = (env.TELEGRAM_WEBHOOK_SECRET ?? "").trim();
  if (expected.length < 16) return false;
  const provided = request.headers.get("X-Telegram-Bot-Api-Secret-Token");
  if (!provided) return false;
  return timingSafeEqualStr(provided, expected);
}

export async function sendTelegramMessage(
  botToken: string,
  chatId: string | number,
  text: string
): Promise<boolean> {
  try {
    const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "Markdown",
        disable_web_page_preview: true,
      }),
    });
    return res.ok;
  } catch (err) {
    console.warn("[Telegram Send] Error:", err);
    return false;
  }
}

export async function notifyTelegramAdmin(
  env: Env,
  text: string,
  config?: EffectiveConfig
): Promise<void> {
  const botToken = config?.telegramBotToken || env.TELEGRAM_BOT_TOKEN;
  if (!botToken) return;

  const adminChatId = config?.telegramAdminChatId || env.TELEGRAM_ADMIN_CHAT_ID;
  const adminIdsStr = config?.telegramAdminIds || env.TELEGRAM_ADMIN_IDS || "";
  const adminChatIds = [
    adminChatId,
    ...(adminIdsStr ? adminIdsStr.split(",") : []),
  ].filter(Boolean);

  for (const chatId of adminChatIds) {
    if (chatId) {
      await sendTelegramMessage(botToken, chatId.trim(), text);
    }
  }
}

export const TELEGRAM_AUTH_DEFAULT_MAX_AGE_SECONDS = 24 * 60 * 60;

/**
 * Verify Telegram Login Widget data: HMAC-SHA256(data_check_string, key = SHA256(bot_token)),
 * compared in constant time, plus auth_date freshness. Always requires hash and auth_date.
 */
export async function verifyTelegramAuth(
  data: Record<string, unknown>,
  botToken: string,
  maxAgeSeconds = TELEGRAM_AUTH_DEFAULT_MAX_AGE_SECONDS,
  nowMs = Date.now()
): Promise<boolean> {
  if (!botToken) return false;
  const checkHash = typeof data["hash"] === "string" ? (data["hash"] as string).toLowerCase() : "";
  if (!/^[0-9a-f]{64}$/.test(checkHash)) return false;

  const authDate = Number(data["auth_date"]);
  if (!Number.isFinite(authDate) || authDate <= 0) return false;
  const nowSec = Math.floor(nowMs / 1000);
  if (nowSec - authDate > maxAgeSeconds || authDate - nowSec > 60) return false;

  const dataCheckArr: string[] = [];
  for (const key of Object.keys(data).sort()) {
    const v = data[key];
    if (key === "hash" || v === undefined || v === null) continue;
    if (typeof v !== "string" && typeof v !== "number" && typeof v !== "boolean") return false;
    dataCheckArr.push(`${key}=${v}`);
  }
  const enc = new TextEncoder();
  const secretKeyHash = await crypto.subtle.digest("SHA-256", enc.encode(botToken));
  const hmacKey = await crypto.subtle.importKey("raw", secretKeyHash, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signature = await crypto.subtle.sign("HMAC", hmacKey, enc.encode(dataCheckArr.join("\n")));
  return timingSafeEqualStr(toHex(new Uint8Array(signature)), checkHash);
}

function telegramAuthMaxAge(env: Env): number {
  const n = Number(env.TELEGRAM_AUTH_MAX_AGE_SECONDS);
  return Number.isFinite(n) && n > 0 ? n : TELEGRAM_AUTH_DEFAULT_MAX_AGE_SECONDS;
}

async function getAuthenticatedUser(
  request: Request,
  userRepo: UserRepository,
  opts: { allowQueryToken?: boolean } = {}
): Promise<User | null> {
  const authHeader = request.headers.get("Authorization") || request.headers.get("x-api-token");
  let token = authHeader ? authHeader.replace(/^Bearer\s+/i, "").trim() : null;

  // Deprecated: ?token= in the URL (leaks into logs/history). Only when explicitly enabled.
  if (!token && opts.allowQueryToken) {
    const url = new URL(request.url);
    token = url.searchParams.get("token");
  }

  if (!token) {
    const cookie = request.headers.get("Cookie") || "";
    const match = cookie.match(/user_token=([^;]+)/);
    if (match && match[1]) token = match[1];
  }

  if (!token) return null;
  return await userRepo.findByApiToken(token);
}

export default {
  /**
   * HTTP Request Handler: Web Dashboard & REST API
   */
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    const companyRepo = new CompanyRepository(env.DB);
    const jobRepo = new JobRepository(env.DB);
    const logRepo = new LogRepository(env.DB);
    const taskRepo = new CrawlTaskRepository(env.DB);
    const userRepo = new UserRepository(env.DB);
    const cvRepo = new CvRepository(env.DB);
    const sessionRepo = new AuthSessionRepository(env.DB);
    const settingsRepo = new SystemSettingsRepository(env.DB);
    const feedbackRepo = new LlmFeedbackRepository(env.DB);
    const subscriptionRepo = new UserSubscriptionRepository(env.DB);
    const effectiveConfig = await getEffectiveConfig(env, settingsRepo);
    const decisionApi = new DecisionApiService({ ai: env.AI });
    const rerankerService = new JdRerankerService();
    const cvTagCloudService = new CvTagCloudService();
    const mcpHandler = new McpServerHandler(
      jobRepo,
      companyRepo,
      cvRepo,
      feedbackRepo,
      async (feedback, u) => {
        const isCriticalOrBroken = feedback.sentiment === "critical" || feedback.feedbackType === "broken_link";
        const icon = isCriticalOrBroken ? "🚨" : "💡";
        const alertLines = [
          `${icon} *OFFRADARJOB - PHẢN HỒI MỚI TỪ LLM (MCP)*`,
          `👤 *User:* ${u.firstName} (@${u.username || u.telegramId})`,
          `🏷️ *Loại:* \`${feedback.feedbackType}\` | *Mức độ:* \`${feedback.sentiment}\``,
          feedback.jobId ? `💼 *Job ID:* \`${feedback.jobId}\`` : "",
          feedback.companyId ? `🏢 *Company ID:* \`${feedback.companyId}\`` : "",
          `📝 *Nội dung:* ${feedback.comment}`,
          feedback.suggestedAction ? `🎯 *Hành động đề xuất:* ${feedback.suggestedAction}` : "",
        ].filter(Boolean);

        await notifyTelegramAdmin(env, alertLines.join("\n"), effectiveConfig);
      },
      subscriptionRepo,
      decisionApi,
      rerankerService
    );

    // Rate limit admin auth attempts per IP (applies to /admin*, /api/admin/*, and admin-gated APIs).
    if (isAdminRoute(path)) {
      if (isCrossSiteAdminWrite(request, url)) {
        return Response.json({ error: "Cross-site request rejected" }, { status: 403 });
      }
      if (await isAdminAuthRateLimited(request, env)) return rateLimitedResponse();
    }

    // 1. Public Dashboard UI
    if (path === "/" || path === "/index.html") {
      return new Response(renderDashboardHtml(), {
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }

    // 2. Admin Control Center UI
    // Never sets a cookie on GET. 404 when the ADMIN_TOKEN secret is not configured.
    if (path === "/admin" || path === "/admin/") {
      if (!(await isAdminConfigured(env))) return new Response("Not Found", { status: 404 });
      if (!(await isAuthorized(request, url, env))) {
        return new Response(renderAdminLoginHtml(), {
          status: 401,
          headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
        });
      }
      return new Response(renderAdminDashboardHtml(), {
        headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
      });
    }

    // Explicit admin login: POST the token; on success set a strict HttpOnly session cookie.
    if (path === "/admin/login" && request.method === "POST") {
      if (!(await isAdminConfigured(env))) return new Response("Not Found", { status: 404 });
      let candidate = "";
      const ct = request.headers.get("Content-Type") ?? "";
      try {
        if (ct.includes("application/json")) {
          candidate = String(((await request.json()) as { token?: unknown }).token ?? "");
        } else {
          candidate = String((await request.formData()).get("token") ?? "");
        }
      } catch {
        candidate = "";
      }
      if (!(await verifyAdminToken(env, candidate))) {
        if (await recordAdminAuthFailure(request, env)) return rateLimitedResponse();
        return new Response(renderAdminLoginHtml("Invalid token."), {
          status: 401,
          headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
        });
      }
      const session = await createAdminSession(env);
      if (!session) {
        return new Response(renderAdminLoginHtml("Admin sessions are not configured (ADMIN_SESSION_SECRET)."), {
          status: 503,
          headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
        });
      }
      return new Response(null, {
        status: 303,
        headers: {
          Location: "/admin",
          "Cache-Control": "no-store",
          "Set-Cookie": `${ADMIN_COOKIE_NAME}=${session}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${ADMIN_SESSION_TTL_SECONDS}`,
        },
      });
    }

    if (path === "/admin/logout" && request.method === "POST") {
      return new Response(null, {
        status: 303,
        headers: {
          Location: "/",
          "Set-Cookie": `${ADMIN_COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`,
        },
      });
    }

    // Lets the public dashboard decide whether to render admin-only controls.
    if (path === "/api/admin/session" && request.method === "GET") {
      return Response.json({ admin: await isAuthorized(request, url, env) }, { headers: { "Cache-Control": "no-store" } });
    }

    // 3. API: List Gathered Jobs (Supports Paging & KV Caching)
    if (path === "/api/jobs" && request.method === "GET") {
      const pageParam = url.searchParams.get("page");
      const paged = pageParam !== null || url.searchParams.get("paged") === "true";
      const page = pageParam ? Math.max(1, parseInt(pageParam, 10)) : 1;
      const limit = Math.min(parseInt(url.searchParams.get("limit") ?? (paged ? "30" : "50"), 10), 100);
      const grade = url.searchParams.get("grade") ?? url.searchParams.get("seniority") ?? undefined;
      const techCategory = url.searchParams.get("tech_category") ?? undefined;
      const region = url.searchParams.get("region") ?? undefined;
      const state = url.searchParams.get("state") ?? undefined;
      const search = url.searchParams.get("search") ?? url.searchParams.get("q") ?? undefined;
      const techOnlyParam = url.searchParams.get("tech_only");
      const techOnly = techOnlyParam === "false" ? false : true;

      const cacheKey = `api:jobs:v6:p${page}:l${limit}:g${grade || "all"}:tc${techCategory || "all"}:r${region || "all"}:st${state || "all"}:s${search || ""}:to${techOnly ? 1 : 0}:paged${paged ? 1 : 0}`;

      const data = await getOrSetKvCache(env, cacheKey, 120, async () => {
        if (paged) {
          return await jobRepo.listPaged({
            page,
            limit,
            grade,
            techCategory,
            region,
            state,
            techOnly,
            search,
          });
        }
        return await jobRepo.list({
          limit,
          grade,
          techCategory,
          region,
          techOnly,
          search,
        });
      });

      return Response.json(data, {
        headers: {
          "Cache-Control": "public, max-age=60, s-maxage=300, stale-while-revalidate=600",
        },
      });
    }

    // 4. API: List Micro-Companies (Supports Paging & Stage/Department/State Filters & KV Caching)
    if (path === "/api/companies" && request.method === "GET") {
      const pageParam = url.searchParams.get("page");
      const paged = pageParam !== null || url.searchParams.get("paged") === "true";
      const page = pageParam ? Math.max(1, parseInt(pageParam, 10)) : 1;
      const limit = Math.min(parseInt(url.searchParams.get("limit") ?? (paged ? "30" : "50"), 10), 100);
      const search = url.searchParams.get("search") ?? url.searchParams.get("q") ?? undefined;
      const region = url.searchParams.get("region") ?? undefined;
      const state = url.searchParams.get("state") ?? undefined;
      const fundingStage = url.searchParams.get("funding_stage") ?? url.searchParams.get("stage") ?? undefined;
      const primaryDepartment = url.searchParams.get("primary_department") ?? url.searchParams.get("department") ?? undefined;

      const cacheKey = `api:companies:v9:p${page}:l${limit}:r${region || "all"}:st${state || "all"}:fs${fundingStage || "all"}:pd${primaryDepartment || "all"}:s${search || ""}:paged${paged ? 1 : 0}`;

      const data = await getOrSetKvCache(env, cacheKey, 300, async () => {
        if (paged) {
          return await companyRepo.listPaged({ page, limit, search, region, state, fundingStage, primaryDepartment });
        }
        return await companyRepo.list(limit, region);
      });

      return Response.json(data, {
        headers: {
          "Cache-Control": "public, max-age=120, s-maxage=600, stale-while-revalidate=1200",
        },
      });
    }

    // 5. API: Stats & Telemetry Logs
    if (path === "/api/stats" && request.method === "GET") {
      const data = await getOrSetKvCache(env, "api:stats:v7", 60, async () => {
        const [companiesCount, jobsCount, jobSummary, recentLogs, freshness] = await Promise.all([
          companyRepo.count(),
          jobRepo.count(),
          jobRepo.getStatsSummary(),
          logRepo.getRecent(30),
          jobRepo.getFreshnessMetrics(),
        ]);
        const midwestPct = jobSummary.total > 0 ? Math.round((jobSummary.midwestCount / jobSummary.total) * 100) : 100;
        return {
          companiesCount,
          jobsCount,
          seniorCount: jobSummary.seniorCount,
          midwestPercent: midwestPct,
          regionalBreakdown: {
            midwest: jobSummary.midwestCount,
            west: jobSummary.westCount,
            northeast: jobSummary.northeastCount,
            south: jobSummary.southCount,
            mountain: jobSummary.mountainCount,
          },
          freshness: {
            ...freshness,
            cronSchedule: "Daily 02:00 UTC & Weekly Mon 03:00 UTC",
          },
          logsCount: recentLogs.length,
          recentLogs,
        };
      });

      return Response.json(data, {
        headers: {
          "Cache-Control": "public, max-age=30, s-maxage=120, stale-while-revalidate=300",
        },
      });
    }

    // 5b. API: Real-time Continuous JD Reranking Report
    if (path === "/api/reports/realtime-jd-ranking" && request.method === "GET") {
      const targetGroup = url.searchParams.get("target_group") || "all";
      const limit = Math.min(Math.max(1, parseInt(url.searchParams.get("limit") || "20")), 100);

      const cacheKey = `report:rerank:live:${targetGroup}:${limit}`;
      const data = await getOrSetKvCache(env, cacheKey, 180, async () => {
        const jobsRes = await jobRepo.listPaged({ page: 1, limit: 200, techOnly: true });
        const compRes = await companyRepo.listPaged({ page: 1, limit: 150 });
        const companiesMap = new Map<string, any>();
        for (const c of compRes.items) companiesMap.set(c.id, c);

        const report = rerankerService.generateRealtimeReport(jobsRes.items, companiesMap);
        let topJobs = report.topRankedJobs;
        if (targetGroup !== "all") {
          topJobs = topJobs.filter(
            (j) => j.rerank.primaryTargetGroup === targetGroup || (j.rerank.targetGroupFit[targetGroup as TargetGroup] || 0) >= 60
          );
        }

        return {
          generatedAt: report.generatedAt,
          totalJdsAnalyzed: report.totalJdsAnalyzed,
          marketSummary: report.marketSummary,
          targetGroupBreakdown: report.targetGroupBreakdown,
          trendingSkills: report.trendingSkills,
          topRankedJobs: topJobs.slice(0, limit),
        };
      });

      return Response.json(data, {
        headers: {
          "Cache-Control": "public, max-age=60, s-maxage=180, stale-while-revalidate=300",
        },
      });
    }

    // 5c. API: Market-wide Tag Cloud Analysis (All Live JDs)
    if (path === "/api/reports/tag-cloud-market" && request.method === "GET") {
      const jobsRes = await jobRepo.listPaged({ page: 1, limit: 150, techOnly: true });
      const allText = jobsRes.items
        .map((j) => `${j.title} ${(j.skills || []).join(" ")} ${j.descriptionSummary || ""}`)
        .join(" ");
      const marketTags = cvTagCloudService.extractTagCloudFromText(allText);
      const topSkills = marketTags.slice(0, 15).map((t) => t.name);
      const categories: Record<string, number> = {};
      for (const t of marketTags) {
        categories[t.category] = (categories[t.category] || 0) + 1;
      }

      return Response.json({
        success: true,
        totalJdsAnalyzed: jobsRes.items.length,
        marketTags,
        marketTagCloud: {
          totalJobsSampled: jobsRes.items.length,
          topSkills,
          categories,
          tags: marketTags,
        },
      }, {
        headers: {
          "Cache-Control": "public, max-age=120, s-maxage=300",
        },
      });
    }

    // 5c. API: Target Groups Directory
    if (path === "/api/target-groups" && request.method === "GET") {
      return Response.json({
        total: Object.keys(TARGET_GROUPS).length,
        groups: Object.values(TARGET_GROUPS),
      });
    }

    // 6a. Telegram Bot Auth: Create or Poll Auth Session
    if (path === "/api/auth/telegram/session" && request.method === "GET") {
      const token = url.searchParams.get("token");
      const botUsername = effectiveConfig.telegramBotUsername || env.TELEGRAM_BOT_USERNAME || "OffRadarJobBot";

      if (token) {
        // Check session status (poll)
        let sessionData: any = memoryAuthSessions.get(token);

        // If not found or status is still pending in memory, query strongly-consistent D1 database
        if (!sessionData || sessionData.status === "pending") {
          try {
            const dbSession = await sessionRepo.findByToken(token);
            if (dbSession) {
              sessionData = {
                status: dbSession.status,
                user: dbSession.userJson ? JSON.parse(dbSession.userJson) : undefined,
                apiToken: dbSession.apiToken,
                createdAt: dbSession.createdAt,
              };
              memoryAuthSessions.set(token, sessionData);
            }
          } catch (err) {
            console.warn("[Session D1] Failed polling session:", err);
          }
        }

        // Fallback to KV if needed
        if (!sessionData && env.CACHE && typeof env.CACHE.get === "function") {
          try {
            sessionData = await env.CACHE.get(`tg_session:${token}`, "json");
            if (sessionData) {
              memoryAuthSessions.set(token, sessionData);
            }
          } catch {}
        }

        if (!sessionData) {
          return Response.json({ status: "expired" }, { status: 404 });
        }

        if (sessionData.status === "authenticated" && sessionData.user) {
          const apiToken = sessionData.apiToken || sessionData.user.apiToken;
          return Response.json(
            { status: "authenticated", user: sessionData.user, token: apiToken },
            {
              headers: {
                "Set-Cookie": `user_token=${apiToken}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000`,
              },
            }
          );
        }

        return Response.json({ status: "pending" });
      }

      // Generate new session token
      const sessionToken = "auth_" + crypto.randomUUID().replace(/-/g, "").slice(0, 12);
      const sessionRecord = {
        status: "pending" as const,
        createdAt: Date.now(),
      };

      memoryAuthSessions.set(sessionToken, sessionRecord);
      try {
        await sessionRepo.create(sessionToken, sessionRecord.createdAt);
      } catch (err) {
        console.warn("[Session D1] Failed creating session:", err);
      }
      if (env.CACHE && typeof env.CACHE.put === "function") {
        try {
          await env.CACHE.put(`tg_session:${sessionToken}`, JSON.stringify(sessionRecord), { expirationTtl: 600 });
        } catch (err) {
          console.warn("[Session KV] Failed storing session:", err);
        }
      }

      const deepLink = `https://t.me/${botUsername}?start=login_${sessionToken}`;
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(deepLink)}`;

      return Response.json({
        sessionToken,
        botUsername,
        deepLink,
        qrUrl,
        expiresIn: 600,
      });
    }

    // 6b. Telegram Bot Webhook: Handles user auth, deep-linking & Admin operations
    if (path === "/api/telegram/webhook" && request.method === "POST") {
      if (!(await verifyTelegramWebhookSecret(request, env))) {
        return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
      }
      try {
        const update = (await request.json()) as Record<string, any>;
        const msg = update.message;
        if (!msg || !msg.from) {
          return Response.json({ ok: true });
        }

        const from = msg.from;
        const text = String(msg.text || "").trim();
        const chatId = msg.chat?.id;
        const tgId = String(from.id);
        const existingUser = await userRepo.findByTelegramId(tgId);
        const isAdmin = isTelegramAdmin(env, from, existingUser?.role, effectiveConfig);
        const botToken = effectiveConfig.telegramBotToken;
        const botUsername = effectiveConfig.telegramBotUsername || "OffRadarJobBot";

        // A. /start command (with or without login_<token>)
        if (text.startsWith("/start")) {
          const payload = text.replace(/^\/start\s*/i, "").trim().replace(/^login_/i, "");

          const now = Date.now();
          const apiToken = existingUser?.apiToken || `orp_${crypto.randomUUID().replace(/-/g, "")}`;
          // /start never grants admin; admin is TELEGRAM_ADMIN_IDS only (evaluated live).
          const role = existingUser?.role || "user";

          const userRecord: User = {
            id: existingUser?.id || `usr_${tgId}`,
            telegramId: tgId,
            username: from.username ? String(from.username) : undefined,
            firstName: String(from.first_name || from.username || "Telegram User"),
            apiToken,
            role,
            createdAt: existingUser?.createdAt || now,
            updatedAt: now,
          };

          await userRepo.upsert(userRecord);

          if (payload) {
            const authData = {
              status: "authenticated" as const,
              user: userRecord,
              apiToken,
              authenticatedAt: now,
            };

            memoryAuthSessions.set(payload, authData);
            try {
              await sessionRepo.markAuthenticated(payload, userRecord, apiToken, now);
            } catch (err) {
              console.warn("[Session D1] Failed updating session in webhook:", err);
            }
            if (env.CACHE && typeof env.CACHE.put === "function") {
              try {
                await env.CACHE.put(`tg_session:${payload}`, JSON.stringify(authData), { expirationTtl: 600 });
              } catch (err) {
                console.warn("[Session KV] Failed updating session:", err);
              }
            }
          }

          // Reply back to user via Telegram Bot API if configured
          if (botToken && chatId) {
            const welcomeLines = [
              `🎉 *Xin chào ${from.first_name || "bạn"}!*`,
              `Tài khoản Telegram của bạn đã được kết nối với *OffRadarJob* 🚀`,
              ``,
              `🔑 *Personal MCP API Token của bạn:*`,
              `\`${apiToken}\``,
              ``,
              `🌐 *Trình duyệt web của bạn sẽ tự động đăng nhập ngay lập tức!*`,
              `Bạn có thể đóng cửa sổ này hoặc dùng token trên để kết nối Cursor, Claude Desktop, Antigravity qua MCP.`,
            ];

            if (isAdmin) {
              welcomeLines.push(
                ``,
                `👑 *Bạn đã được xác thực với quyền Quản trị viên (Admin)!*`,
                `Gõ \`/admin\` để mở menu điều khiển crawl, quản lý jobs và hệ thống.`
              );
            }

            welcomeLines.push(
              ``,
              `🔔 *Nhận thông báo việc làm mới mỗi sáng:*`,
              `Gõ \`/subscribe\` để đăng ký nhận bản tin việc làm tech boutique tự động qua Telegram!`
            );

            await sendTelegramMessage(botToken, chatId, welcomeLines.join("\n"));
          }

          return Response.json({ ok: true, authenticated: true, isAdmin });
        }

        // B. /admin auth <token> - retired. Admin tokens are never accepted over chat and D1 roles do not
        // grant bot admin; bot admins are configured only via the TELEGRAM_ADMIN_IDS secret/var.
        if (text.startsWith("/admin auth") && chatId) {
          if (botToken) {
            await sendTelegramMessage(
              botToken,
              chatId,
              `ℹ️ /admin auth is no longer supported. Bot admins are configured by numeric Telegram user ID (TELEGRAM_ADMIN_IDS). Your ID: \`${tgId}\``
            );
          }
          return Response.json({ ok: false, error: "admin_auth_disabled" });
        }

        // C. /admin or /admin help or /help
        if ((text === "/admin" || text === "/admin help" || text === "/help") && chatId) {
          if (!isAdmin) {
            if (text === "/help") {
              const helpText = [
                `ℹ️ *Hướng dẫn sử dụng OffRadarJob Bot*`,
                ``,
                `• Để đăng nhập web: Bấm nút "Đăng nhập Telegram" trên website hoặc quét mã QR.`,
                `• \`/newgrad\` - Tra cứu việc làm New Grad 2025/2026 mới nhất (gõ \`/newgrad midwest\` để lọc vùng Midwest)`,
                `• \`/subscribe [midwest|remote|all]\` - Đăng ký nhận bản tin việc làm mới mỗi sáng qua Telegram`,
                `• \`/unsubscribe\` - Tạm dừng nhận bản tin hàng ngày`,
                `• \`/digest\` - Xem ngay bản tin việc làm tuyển chọn hôm nay`,
                `• \`/mcp\` - Lấy MCP Endpoint & Personal API Token`,
                `• \`/stats\` - Xem thống kê nhanh số lượng jobs & companies`,
                `• Admins are configured by numeric Telegram user ID (TELEGRAM_ADMIN_IDS).`,
              ].join("\n");
              if (botToken) await sendTelegramMessage(botToken, chatId, helpText);
              return Response.json({ ok: true });
            } else {
              const deniedText = [
                `⛔ *Quyền truy cập bị từ chối*`,
                `Tài khoản Telegram của bạn (@${from.username || tgId}) chưa được cấp quyền Admin.`,
                ``,
                `🔑 *Nếu bạn là chủ sở hữu hệ thống:*`,
                `Add your numeric Telegram user ID (${tgId}) to TELEGRAM_ADMIN_IDS.`,
              ].join("\n");
              if (botToken) await sendTelegramMessage(botToken, chatId, deniedText);
              return Response.json({ ok: true });
            }
          }

          const menuText = [
            `🛡️ *OFFRADAR JOB - BẢNG ĐIỀU KHIỂN QUẢN TRỊ VIÊN*`,
            `Xin chào Admin *${from.first_name || "Admin"}* (@${from.username || tgId})!`,
            ``,
            `📋 *Các lệnh quản trị trực tiếp trên Telegram:*`,
            `🎓 \`/newgrad [midwest|remote]\` - Tra cứu các vị trí New Grad / Entry-level`,
            `🌅 \`/digest\` - Xem nhanh bản tin việc làm hôm nay`,
            `🔔 \`/subscribe [midwest|remote|all]\` - Đăng ký nhận Daily Job Digest tự động`,
            `🔕 \`/unsubscribe\` - Tạm dừng nhận Daily Digest`,
            `📊 \`/stats\` - Báo cáo realtime (Jobs, Companies, Tỷ lệ Midwest & các vùng US)`,
            `🕷️ \`/crawl <url>\` - Kích hoạt crawl ngay 1 career page URL`,
            `⚡ \`/sweep\` - Quét đồng loạt danh sách seed companies`,
            `🌾 \`/harvest [hn|github|newgrad|all]\` - Thu thập jobs từ HackerNews, GitHub, hoặc New Grad 2025/2026`,
            `👥 \`/users\` - Thống kê users & danh sách tài khoản MCP`,
            `💡 \`/feedbacks\` - Xem danh sách phản hồi từ LLM & Người dùng qua MCP`,
            `🔗 \`/adminlink\` - Lấy link 1-click vào thẳng Web Admin Control Center`,
            `🔔 \`/testalert\` - Kiểm tra hệ thống gửi thông báo khẩn cấp`,
            `❓ \`/admin help\` - Xem lại menu này`,
          ].join("\n");

          if (botToken) await sendTelegramMessage(botToken, chatId, menuText);
          return Response.json({ ok: true });
        }

        // C.1 /newgrad [midwest|west|northeast|south|mountain|remote|keyword] - Query new grad roles
        if (text.startsWith("/newgrad") && chatId) {
          const arg = text.replace(/^\/newgrad\s*/i, "").trim().toLowerCase();
          const region = (arg === "midwest" || arg === "west" || arg === "northeast" || arg === "south" || arg === "mountain" || arg === "remote") ? arg : undefined;
          const search = (!region && arg.length > 1) ? arg : undefined;

          const newGradJobs = await jobRepo.list({
            grade: "new_grad",
            region,
            search,
            limit: 5,
          });

          if (newGradJobs.length === 0) {
            const noJobsMsg = [
              `🎓 *OFFRADARJOB - VIỆC LÀM NEW GRAD / ENTRY-LEVEL*`,
              ``,
              `Hiện chưa tìm thấy việc làm New Grad nào phù hợp với bộ lọc: \`${arg || "tất cả"}\`.`,
              ``,
              `💡 *Gợi ý:* Admin có thể gõ lệnh \`/harvest newgrad\` để nạp ngay hơn 400+ vị trí New Grad 2025/2026 từ SimplifyJobs và các trung tâm công nghệ Midwest!`,
              ``,
              `🔔 Gõ \`/subscribe\` để nhận thông báo việc làm mới mỗi sáng!`,
            ].join("\n");
            if (botToken) await sendTelegramMessage(botToken, chatId, noJobsMsg);
            return Response.json({ ok: true, count: 0 });
          }

          const jobItems = newGradJobs.map((j, idx) => {
            const locText = j.isMidwest ? "📍 *Midwest*" : `🌐 ${j.location || "US / Remote"}`;
            const comp = j.companyName || "Tech Company";
            const salary = j.salaryMin && j.salaryMax ? ` | 💰 $${Math.round(j.salaryMin / 1000)}k-$${Math.round(j.salaryMax / 1000)}k` : "";
            return [
              `*${idx + 1}. ${j.title}*`,
              `🏢 *${comp}* | ${locText}${salary}`,
              `🔗 [Ứng tuyển trực tiếp trên ATS](${j.applyTarget})`,
            ].join("\n");
          }).join("\n\n");

          const responseText = [
            `🎓 *OFFRADARJOB - VIỆC LÀM NEW GRAD 2025/2026 MỚI NHẤT*`,
            region ? `*(Khu vực: ${region.toUpperCase()})*` : `*(Ưu tiên Midwest & US National)*`,
            ``,
            jobItems,
            ``,
            `🌐 *Xem đầy đủ danh sách & lọc chi tiết tại:*`,
            `https://off-radar-jobs.tuannx87.workers.dev/?grade=new_grad`,
            ``,
            `🔔 *Nhận thông báo việc làm mới mỗi sáng:* Gõ \`/subscribe\`!`,
          ].join("\n");

          if (botToken) await sendTelegramMessage(botToken, chatId, responseText);
          return Response.json({ ok: true, count: newGradJobs.length });
        }

        // C.2 /subscribe [midwest|remote|all|keyword] - Activate daily alerts
        if (text.startsWith("/subscribe") && chatId) {
          const arg = text.replace(/^\/subscribe\s*/i, "").trim().toLowerCase();
          const region = (arg === "midwest" || arg === "west" || arg === "northeast" || arg === "south" || arg === "mountain" || arg === "remote" || arg === "all")
            ? arg
            : "midwest";
          const targetRoles = (!["midwest", "west", "northeast", "south", "mountain", "remote", "all", ""].includes(arg))
            ? [arg]
            : [];

          const userId = existingUser?.id || `usr_${tgId}`;
          const sub = await subscriptionRepo.upsert({
            userId,
            telegramId: tgId,
            isActive: true,
            frequency: "daily",
            regions: region === "all" ? ["midwest", "remote", "west", "northeast", "south"] : [region, "remote"],
            targetRoles,
          });

          const subConfirmLines = [
            `🔔 *ĐĂNG KÝ BẢN TIN VIỆC LÀM HÀNG NGÀY THÀNH CÔNG!*`,
            ``,
            `Xin chào *${from.first_name || "bạn"}*! Bạn sẽ tự động nhận danh sách các việc làm tech boutique mới nhất mỗi sáng qua Telegram.`,
            ``,
            `📋 *Thiết lập của bạn:*`,
            `• Trạng thái: 🟢 *Đang kích hoạt*`,
            `• Tần suất: *Hàng ngày (Mỗi sáng)*`,
            `• Khu vực ưu tiên: *${sub.regions.map((r) => r.toUpperCase()).join(", ")}*`,
            targetRoles.length > 0 ? `• Vị trí mong muốn: *${targetRoles.join(", ")}*` : `• Lĩnh vực: *Tất cả vị trí Tech (Đã lọc bỏ tin rác)*`,
            ``,
            `👉 Gõ \`/digest\` để nhận ngay bản tin việc làm hôm nay.`,
            `👉 Gõ \`/unsubscribe\` bất kỳ lúc nào để tạm dừng nhận thông báo.`,
          ];

          if (botToken) await sendTelegramMessage(botToken, chatId, subConfirmLines.join("\n"));
          return Response.json({ ok: true, subscribed: true, subscription: sub });
        }

        // C.3 /unsubscribe - Pause daily alerts
        if (text.startsWith("/unsubscribe") && chatId) {
          const userId = existingUser?.id || `usr_${tgId}`;
          await subscriptionRepo.toggleActive(userId, false);

          const unsubLines = [
            `🔕 *ĐÃ TẠM DỪNG THÔNG BÁO HÀNG NGÀY*`,
            ``,
            `Tài khoản của bạn đã được chuyển sang chế độ tạm dừng nhận Daily Digest.`,
            `Bạn vẫn có thể truy cập dashboard hoặc dùng MCP bất cứ lúc nào.`,
            ``,
            `💡 Để kích hoạt lại, bạn chỉ cần gõ: \`/subscribe\`.`,
          ];

          if (botToken) await sendTelegramMessage(botToken, chatId, unsubLines.join("\n"));
          return Response.json({ ok: true, unsubscribed: true });
        }

        // C.4 /digest - Manually trigger daily digest briefing immediately
        if (text.startsWith("/digest") && chatId) {
          const userId = existingUser?.id || `usr_${tgId}`;
          const sub = await subscriptionRepo.getByUserId(userId);
          const region = sub && sub.regions.length > 0 ? sub.regions[0] : "midwest";
          const targetRole = sub && sub.targetRoles.length > 0 ? sub.targetRoles[0] : undefined;

          const digestJobs = await jobRepo.listPaged({
            page: 1,
            limit: 5,
            region: region === "all" ? undefined : region,
            search: targetRole,
            techOnly: true,
          });

          if (digestJobs.items.length === 0) {
            const emptyMsg = `🌅 *OFFRADARJOB - BẢN TIN HÔM NAY*\n\nHiện chưa có vị trí mới nào khớp với tiêu chí của bạn. Hãy thử xem toàn bộ danh sách tại: https://off-radar-jobs.tuannx87.workers.dev`;
            if (botToken) await sendTelegramMessage(botToken, chatId, emptyMsg);
            return Response.json({ ok: true, count: 0 });
          }

          const jobItems = digestJobs.items.map((j, idx) => {
            const locText = j.isMidwest ? "📍 *Midwest*" : `🌐 ${j.location || "Remote"}`;
            const comp = j.companyName || "Tech Boutique";
            const salary = j.salaryMin && j.salaryMax ? ` | 💰 $${Math.round(j.salaryMin / 1000)}k-$${Math.round(j.salaryMax / 1000)}k` : "";
            return [
              `*${idx + 1}. ${j.title}*`,
              `🏢 *${comp}* | ${locText}${salary}`,
              `🔗 [Ứng tuyển trực tiếp trên ATS](${j.applyTarget})`,
            ].join("\n");
          }).join("\n\n");

          const digestText = [
            `🌅 *OFFRADARJOB - BẢN TIN VIỆC LÀM HÔM NAY*`,
            `Dành cho *${from.first_name || "bạn"}* (Ưu tiên: ${(region || "midwest").toUpperCase()}):`,
            ``,
            jobItems,
            ``,
            `🌐 *Xem đầy đủ cơ hội & Tối ưu CV:*`,
            `https://off-radar-jobs.tuannx87.workers.dev`,
            ``,
            `💡 Để nhận tự động mỗi sáng, gõ: \`/subscribe\``,
          ].join("\n");

          if (botToken) await sendTelegramMessage(botToken, chatId, digestText);
          return Response.json({ ok: true, count: digestJobs.items.length });
        }

        // D. /stats - Telemetry and region metrics
        if (text === "/stats" && chatId) {
          const [companiesCount, jobsCount, jobSummary, usersCount, adminsCount, recentTasks, freshness, subscriberStats] = await Promise.all([
            companyRepo.count(),
            jobRepo.count(),
            jobRepo.getStatsSummary(),
            userRepo.count(),
            userRepo.count("admin"),
            taskRepo.list({ limit: 3 }),
            jobRepo.getFreshnessMetrics(),
            subscriptionRepo.countSubscribers(),
          ]);

          const midwestPct = jobSummary.total > 0 ? Math.round((jobSummary.midwestCount / jobSummary.total) * 100) : 100;

          const taskSnippets = recentTasks.length > 0
            ? recentTasks.map((t) => `• \`${t.id.slice(-8)}\`: *${t.status.toUpperCase()}* (${t.jobsFound} jobs)`).join("\n")
            : "Chưa có task nào gần đây";

          let freshnessSnippet = "• Trạng thái: Đang theo dõi";
          if (freshness.latestLastSeen) {
            const minsAgo = Math.max(0, Math.round((Date.now() - freshness.latestLastSeen) / 60000));
            const timeAgoStr = minsAgo < 60 ? `${minsAgo} phút trước` : `${Math.round(minsAgo / 60)} giờ trước`;
            const dateStr = new Date(freshness.latestLastSeen).toISOString().replace("T", " ").substring(0, 16) + " UTC";
            freshnessSnippet = [
              `⏱️ *Lần quét gần nhất:* ${timeAgoStr} (${dateStr})`,
              `🔄 *Jobs cập nhật 24h:* \`${freshness.updatedLast24h}\` jobs (mới: \`${freshness.createdLast24h}\`)`,
              `⏰ *Cron tự động:* Daily 02:00 UTC | Weekly Mon 03:00 UTC`,
            ].join("\n");
          }

          const statsText = [
            `📊 *HỆ THỐNG OFFRADARJOB - BÁO CÁO REALTIME*`,
            ``,
            `💼 *Tổng số Jobs:* \`${jobsCount.toLocaleString()}\``,
            `🏢 *Tổng số Công ty:* \`${companiesCount.toLocaleString()}\``,
            `🌽 *Midwest Focus:* \`${jobSummary.midwestCount}\` jobs (*${midwestPct}%*)`,
            `🌲 *West Coast:* \`${jobSummary.westCount}\` jobs`,
            `🗽 *Northeast:* \`${jobSummary.northeastCount}\` jobs`,
            `☀️ *South:* \`${jobSummary.southCount}\` jobs`,
            `🏔️ *Mountain:* \`${jobSummary.mountainCount}\` jobs`,
            `👥 *Users đã kết nối:* \`${usersCount}\` (Admins: \`${adminsCount}\`)`,
            `🔔 *Subscribers nhận tin:* \`${subscriberStats.active}\` active (\`${subscriberStats.total}\` tổng)`,
            ``,
            `🕒 *Độ tươi mới dữ liệu & Tần suất:*`,
            freshnessSnippet,
            ``,
            `⚙️ *Crawl Tasks gần nhất:*`,
            taskSnippets,
            ``,
            `🌐 *Dashboard:* https://off-radar-jobs.tuannx87.workers.dev`,
          ].join("\n");

          if (botToken) await sendTelegramMessage(botToken, chatId, statsText);
          return Response.json({ ok: true });
        }

        // E. /crawl <url> - Admin trigger crawl task
        if (text.startsWith("/crawl") && chatId) {
          if (!isAdmin) {
            if (botToken) {
              await sendTelegramMessage(botToken, chatId, "⛔ Bạn cần có quyền Admin để kích hoạt lệnh /crawl.");
            }
            return Response.json({ ok: false, error: "Unauthorized" });
          }

          let rawUrl = text.replace(/^\/crawl\s*/i, "").trim();
          if (!rawUrl) {
            if (botToken) {
              await sendTelegramMessage(botToken, chatId, "⚠️ Vui lòng nhập URL cần crawl:\nVí dụ: `/crawl https://careers.example.com`");
            }
            return Response.json({ ok: false });
          }
          if (!rawUrl.startsWith("http://") && !rawUrl.startsWith("https://")) {
            rawUrl = "https://" + rawUrl;
          }

          const taskId = `tsk_tg_${crypto.randomUUID().replace(/-/g, "").slice(0, 8)}`;
          await taskRepo.create({
            id: taskId,
            targetUrl: rawUrl,
            sourceType: "telegram_admin",
            status: "pending",
            jobsFound: 0,
            metadata: { triggeredBy: from.username || String(from.id) },
            createdAt: Date.now(),
          });

          if (env.DISCOVERY_QUEUE) {
            try {
              await env.DISCOVERY_QUEUE.send({ taskId, url: rawUrl, depth: 0, source: "telegram_admin" });
            } catch (err) {
              console.warn("[Telegram Crawl Queue] Failed:", err);
            }
          }

          if (botToken) {
            const replyMsg = [
              `🚀 *Đã kích hoạt Crawl Task thành công!*`,
              ``,
              `📋 *Task ID:* \`${taskId}\``,
              `🔗 *Target URL:* \`${rawUrl}\``,
              `👤 *Admin:* @${from.username || tgId}`,
              ``,
              `Theo dõi trạng thái tại:`,
              `https://off-radar-jobs.tuannx87.workers.dev/admin`,
            ].join("\n");
            await sendTelegramMessage(botToken, chatId, replyMsg);
          }

          return Response.json({ ok: true, taskId });
        }

        // F. /sweep - Admin trigger bulk sweep across seeds
        if (text === "/sweep" && chatId) {
          if (!isAdmin) {
            if (botToken) await sendTelegramMessage(botToken, chatId, "⛔ Bạn cần quyền Admin để dùng /sweep.");
            return Response.json({ ok: false, error: "Unauthorized" });
          }

          const seeds = CURATED_SEEDS.slice(0, 20);
          let count = 0;
          for (const s of seeds) {
            const taskId = `tsk_sw_${crypto.randomUUID().replace(/-/g, "").slice(0, 8)}`;
            await taskRepo.create({
              id: taskId,
              targetUrl: s.url,
              sourceType: "telegram_admin_sweep",
              status: "pending",
              jobsFound: 0,
              metadata: { companyName: s.name, triggeredBy: from.username || String(from.id) },
              createdAt: Date.now(),
            });
            if (env.DISCOVERY_QUEUE) {
              try {
                await env.DISCOVERY_QUEUE.send({ taskId, url: s.url, depth: 0, source: "telegram_admin_sweep" });
              } catch {}
            }
            count++;
          }

          if (botToken) {
            await sendTelegramMessage(
              botToken,
              chatId,
              `⚡ *Đã kích hoạt Sweep ${count} công ty seed đồng loạt!*\nCác tasks đang chạy trong background queue. Kiểm tra tiến độ tại Web Admin.`
            );
          }
          return Response.json({ ok: true, tasksCount: count });
        }

        // G. /harvest [hn|github|all] - Admin trigger public harvest
        if (text.startsWith("/harvest") && chatId) {
          if (!isAdmin) {
            if (botToken) await sendTelegramMessage(botToken, chatId, "⛔ Bạn cần quyền Admin để dùng /harvest.");
            return Response.json({ ok: false, error: "Unauthorized" });
          }

          const sub = text.replace(/^\/harvest\s*/i, "").trim().toLowerCase();

          if (sub === "newgrad") {
            if (botToken) {
              await sendTelegramMessage(
                botToken,
                chatId,
                `🎓 *Đang thu thập và nạp hơn 400+ vị trí New Grad từ SimplifyJobs & Midwest Tech Hubs...*`
              );
            }
            try {
              const newGradHarvester = new NewGradHarvester();
              const result = await newGradHarvester.importNewGradRoles(env.DB);
              if (botToken) {
                const harvestMsg = [
                  `🎓 *Thu thập việc làm New Grad hoàn tất!*`,
                  ``,
                  `• *Tổng số jobs đã parse:* \`${result.totalParsed}\``,
                  `• *Jobs đã nạp vào D1:* \`${result.importedJobs}\``,
                  `• *Jobs thuộc vùng Midwest:* \`${result.midwestJobs}\``,
                  ``,
                  `👉 Gõ \`/newgrad\` để xem ngay các vị trí mới nhất!`,
                ].join("\n");
                await sendTelegramMessage(botToken, chatId, harvestMsg);
              }
              return Response.json({ ok: true, result });
            } catch (err: any) {
              if (botToken) {
                await sendTelegramMessage(botToken, chatId, `❌ Lỗi khi harvest newgrad: ${err?.message}`);
              }
              return Response.json({ ok: false, error: err?.message });
            }
          }

          const source = (sub === "hn" || sub === "github") ? sub : "all";

          if (botToken) {
            await sendTelegramMessage(botToken, chatId, `⏳ *Đang kích hoạt thu thập từ nguồn [${source.toUpperCase()}]...*`);
          }

          try {
            const manager = new PublicSourceManager(env.DB);
            const orchestrator = new PipelineOrchestrator(env.DB);
            const res = await manager.harvestAndGatherAsync(source as any, 15, orchestrator);

            if (botToken) {
              const totalJobs = res.directJobsCount + res.crawledJobsCount;
              const harvestMsg = [
                `🌾 *Thu thập dữ liệu nguồn mở hoàn tất!*`,
                ``,
                `• *Nguồn:* ${source.toUpperCase()}`,
                `• *Công ty thu thập:* \`${res.companiesHarvested}\``,
                `• *Jobs tìm thấy:* \`${totalJobs}\``,
                `• *Crawl Tasks tạo:* \`${res.taskIds.length}\``,
              ].join("\n");
              await sendTelegramMessage(botToken, chatId, harvestMsg);
            }
            return Response.json({ ok: true, result: res });
          } catch (err: any) {
            if (botToken) {
              await sendTelegramMessage(botToken, chatId, `❌ Lỗi khi harvest: ${err?.message}`);
            }
            return Response.json({ ok: false, error: err?.message });
          }
        }

        // H. /users - Admin list users & MCP connections
        if (text === "/users" && chatId) {
          if (!isAdmin) {
            if (botToken) await sendTelegramMessage(botToken, chatId, "⛔ Bạn cần quyền Admin để dùng /users.");
            return Response.json({ ok: false, error: "Unauthorized" });
          }

          const [users, total, admins] = await Promise.all([
            userRepo.list(5),
            userRepo.count(),
            userRepo.count("admin"),
          ]);

          const userRows = users.map((u) => `• ${u.role === "admin" ? "👑" : "👤"} *${u.firstName}* (@${u.username || u.telegramId})`).join("\n");

          const reply = [
            `👥 *QUẢN LÝ NGƯỜI DÙNG & TOKENS*`,
            ``,
            `• *Tổng số người dùng:* \`${total}\``,
            `• *Quản trị viên (Admins):* \`${admins}\``,
            ``,
            `*5 người dùng mới nhất:*`,
            userRows || "Chưa có người dùng nào",
            ``,
            `Quản lý chi tiết tại Web Admin: https://off-radar-jobs.tuannx87.workers.dev/admin`,
          ].join("\n");

          if (botToken) await sendTelegramMessage(botToken, chatId, reply);
          return Response.json({ ok: true });
        }

        // I. /adminlink - Admin magic login link generator
        if (text === "/adminlink" && chatId) {
          if (!isAdmin) {
            if (botToken) await sendTelegramMessage(botToken, chatId, "⛔ Bạn cần quyền Admin để lấy magic link.");
            return Response.json({ ok: false, error: "Unauthorized" });
          }

          // No token in links: tokens in URLs leak via chat history, logs and Referer.
          const msg = [
            `🔑 *Web Admin Control Center*`,
            ``,
            `Open https://jobs.ai-kit.net/admin and sign in with the admin token (the ADMIN_TOKEN Cloudflare secret).`,
          ].join("\n");

          if (botToken) await sendTelegramMessage(botToken, chatId, msg);
          return Response.json({ ok: true });
        }

        // J. /testalert - Admin test alert notification
        if (text === "/testalert" && chatId) {
          if (!isAdmin) {
            if (botToken) await sendTelegramMessage(botToken, chatId, "⛔ Bạn cần quyền Admin.");
            return Response.json({ ok: false, error: "Unauthorized" });
          }

          if (botToken) {
            await sendTelegramMessage(
              botToken,
              chatId,
              `🔔 *[TEST ALERT] OffRadarJob System Notification*\n` +
              `Hệ thống thông báo Telegram Bot hoạt động hoàn hảo! Đã kết nối với Admin @${from.username || tgId}.`
            );
          }
          return Response.json({ ok: true });
        }

        // K. /mcp - MCP Token helper
        if (text.startsWith("/mcp") && chatId && botToken) {
          const user = await userRepo.findByTelegramId(tgId);
          const reply = user
            ? `🔌 *MCP Endpoint:* \`https://off-radar-jobs.tuannx87.workers.dev/mcp\`\n🔑 *Token:* \`${user.apiToken}\``
            : "Vui lòng mở web OffRadarJob và đăng nhập để kích hoạt token.";
          await sendTelegramMessage(botToken, chatId, reply);
          return Response.json({ ok: true });
        }

        // L. /feedbacks - Admin list recent LLM feedbacks
        if (text === "/feedbacks" && chatId) {
          if (!isAdmin) {
            if (botToken) await sendTelegramMessage(botToken, chatId, "⛔ Bạn cần quyền Admin để xem /feedbacks.");
            return Response.json({ ok: false, error: "Unauthorized" });
          }
          const stats = await feedbackRepo.getStats();
          const listRes = await feedbackRepo.listPaged({ limit: 5 });
          const items = listRes.items;

          const snippet = items.length > 0
            ? items.map((f, i) => {
                const statusIcon = f.status === "actioned" ? "✅" : (f.status === "reviewed" ? "👀" : "🆕");
                const sentimentIcon = f.sentiment === "critical" ? "🚨" : (f.sentiment === "positive" ? "⭐" : "💬");
                const userStr = f.username ? `@${f.username}` : f.userId.slice(-6);
                const shortComment = f.comment.length > 90 ? f.comment.slice(0, 90) + "..." : f.comment;
                return `${i + 1}. ${statusIcon} ${sentimentIcon} *[${f.feedbackType.toUpperCase()}]* (${userStr})\n   📝 "${shortComment}"${f.suggestedAction ? `\n   🎯 *Đề xuất:* ${f.suggestedAction}` : ""}`;
              }).join("\n\n")
            : "Chưa có phản hồi nào.";

          const reply = [
            `💡 *OFFRADARJOB - PHẢN HỒI TỪ LLM & NGƯỜI DÙNG*`,
            ``,
            `📊 *Thống kê:*`,
            `• Tổng số: \`${stats.total}\` | Mới: \`${stats.newCount}\``,
            `• Sự cố khẩn cấp (Critical): \`${stats.criticalCount}\``,
            `• Link hỏng (Broken links): \`${stats.brokenLinkCount}\``,
            `• Tín hiệu nhu cầu (Preferences): \`${stats.userPrefCount}\``,
            ``,
            `*5 phản hồi gần nhất:*`,
            snippet,
            ``,
            `🌐 Xem & xử lý chi tiết tại Web Admin Dashboard.`,
          ].join("\n");

          if (botToken) await sendTelegramMessage(botToken, chatId, reply);
          return Response.json({ ok: true });
        }

        return Response.json({ ok: true });
      } catch (err: any) {
        return Response.json({ ok: false, error: err?.message }, { status: 500 });
      }
    }

    // 6c. Quick Confirm Session (for 1-click testing or local demo without Telegram app)
    if (path === "/api/auth/telegram/confirm-session" && request.method === "POST") {
      if (env.ENABLE_DEMO_CONFIRM_SESSION !== "true") return new Response("Not Found", { status: 404 });
      try {
        const body = (await request.json()) as Record<string, any>;
        const token = String(body.token || "").trim();
        if (!token) {
          return Response.json({ error: "Missing session token" }, { status: 400 });
        }

        const username = body.username ? String(body.username) : "telegram_user";
        const firstName = body.first_name ? String(body.first_name) : "Telegram User";
        const tgId = String(body.id || `tg_${username}`);

        const now = Date.now();
        const existingUser = await userRepo.findByTelegramId(tgId);
        const apiToken = existingUser?.apiToken || `orp_${crypto.randomUUID().replace(/-/g, "")}`;

        const userRecord: User = {
          id: existingUser?.id || `usr_${tgId}`,
          telegramId: tgId,
          username,
          firstName,
          apiToken,
          createdAt: existingUser?.createdAt || now,
          updatedAt: now,
        };

        await userRepo.upsert(userRecord);

        const authData = {
          status: "authenticated" as const,
          user: userRecord,
          apiToken,
          authenticatedAt: now,
        };

        memoryAuthSessions.set(token, authData);
        try {
          await sessionRepo.markAuthenticated(token, userRecord, apiToken, now);
        } catch (err) {
          console.warn("[Session D1] Failed updating session in confirm-session:", err);
        }
        if (env.CACHE && typeof env.CACHE.put === "function") {
          try {
            await env.CACHE.put(`tg_session:${token}`, JSON.stringify(authData), { expirationTtl: 600 });
          } catch {}
        }

        return Response.json(
          { success: true, user: userRecord, token: apiToken },
          {
            headers: {
              "Set-Cookie": `user_token=${apiToken}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000`,
            },
          }
        );
      } catch (err: any) {
        return Response.json({ error: err?.message || "Failed to confirm session" }, { status: 500 });
      }
    }

    // 6d. Telegram Webhook Setup Helper (admin only; registers the webhook secret with Telegram)
    if (path === "/api/telegram/setup-webhook" && request.method !== "POST") {
      return Response.json({ error: "Method Not Allowed" }, { status: 405, headers: { Allow: "POST" } });
    }
    if (path === "/api/telegram/setup-webhook" && request.method === "POST") {
      if (!(await isAuthorized(request, url, env))) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
      }
      const botToken = effectiveConfig.telegramBotToken;
      if (!botToken) {
        return Response.json({ error: "TELEGRAM_BOT_TOKEN not configured yet." }, { status: 400 });
      }
      const webhookSecret = (env.TELEGRAM_WEBHOOK_SECRET ?? "").trim();
      if (webhookSecret.length < 16) {
        return Response.json({ error: "TELEGRAM_WEBHOOK_SECRET secret is not configured (min 16 chars)." }, { status: 400 });
      }
      const webhookUrl = `${url.origin}/api/telegram/webhook`;
      const res = await fetch(`https://api.telegram.org/bot${botToken}/setWebhook`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: webhookUrl, secret_token: webhookSecret }),
      });
      const data = await res.json();
      return Response.json({ webhookUrl, result: data });
    }

    // 6e. Legacy Telegram Auth: Login via Telegram WebApp / Widget
    if (path === "/api/auth/telegram" && request.method === "POST") {
      try {
        const body = (await request.json()) as Record<string, any>;
        const botToken = effectiveConfig.telegramBotToken;
        if (!botToken) {
          return Response.json({ error: "Telegram login is not configured" }, { status: 503 });
        }
        if (!body || typeof body.hash !== "string" || !body.hash) {
          return Response.json({ error: "Missing Telegram authentication hash" }, { status: 401 });
        }
        if (!(await verifyTelegramAuth(body, botToken, telegramAuthMaxAge(env)))) {
          return Response.json({ error: "Invalid or expired Telegram authentication" }, { status: 403 });
        }
        const tgId = String(body.id ?? "");
        if (!/^\d{1,20}$/.test(tgId)) {
          return Response.json({ error: "Missing Telegram ID" }, { status: 400 });
        }

        const now = Date.now();
        const existingUser = await userRepo.findByTelegramId(tgId);
        const apiToken = existingUser?.apiToken || `orp_${crypto.randomUUID().replace(/-/g, "")}`;

        const userRecord: User = {
          id: existingUser?.id || `usr_${tgId}`,
          telegramId: tgId,
          username: body.username ? String(body.username) : undefined,
          firstName: String(body.first_name || body.username || "Telegram User"),
          photoUrl: body.photo_url ? String(body.photo_url) : undefined,
          apiToken,
          createdAt: existingUser?.createdAt || now,
          updatedAt: now,
        };

        await userRepo.upsert(userRecord);

        return Response.json(
          { success: true, user: userRecord },
          {
            headers: {
              "Set-Cookie": `user_token=${apiToken}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000`,
            },
          }
        );
      } catch (err: any) {
        return Response.json({ error: err?.message || "Telegram authentication failed" }, { status: 500 });
      }
    }

    // 7. Auth: Get Current Authenticated User & MCP Details
    if (path === "/api/user/me" && request.method === "GET") {
      const user = await getAuthenticatedUser(request, userRepo);
      if (!user) return Response.json({ error: "Unauthorized", user: null }, { status: 401 });
      return Response.json({ user });
    }

    // 8. Auth: Logout
    if (path === "/api/auth/logout" && request.method === "POST") {
      return Response.json(
        { success: true },
        {
          headers: {
            "Set-Cookie": `user_token=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT`,
          },
        }
      );
    }

    // 9. CV Versions Management API
    if (path === "/api/user/cvs" && request.method === "GET") {
      const user = await getAuthenticatedUser(request, userRepo);
      if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
      const cvs = await cvRepo.listByUser(user.id);
      return Response.json({ items: cvs });
    }

    if (path === "/api/user/cvs" && request.method === "POST") {
      const user = await getAuthenticatedUser(request, userRepo);
      if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

      const body = (await request.json()) as Record<string, any>;
      const now = Date.now();
      const newCv: CvVersion = {
        id: `cv_${now}_${Math.random().toString(36).slice(2, 7)}`,
        userId: user.id,
        jobId: body.job_id || body.jobId || undefined,
        title: String(body.title || "New CV Version"),
        targetRole: body.target_role || body.targetRole || undefined,
        content: String(body.content || ""),
        skills: Array.isArray(body.skills) ? body.skills : [],
        matchScore: body.match_score !== undefined ? Number(body.match_score) : (body.matchScore !== undefined ? Number(body.matchScore) : undefined),
        tailoredNotes: body.tailored_notes || body.tailoredNotes || undefined,
        createdAt: now,
        updatedAt: now,
      };

      await cvRepo.create(newCv);
      const saved = await cvRepo.getById(newCv.id, user.id);
      return Response.json({ success: true, cv: saved }, { status: 201 });
    }

    // 9a. User CV: Import Document & Parse Tag Cloud
    if (path === "/api/user/cvs/import" && request.method === "POST") {
      const user = await getAuthenticatedUser(request, userRepo);
      if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

      let fileName = "uploaded-cv.md";
      let fileContent = "";
      let contentType = "text/plain";
      let saveAsVersion = true;
      let versionTitle: string | undefined = undefined;
      let targetRole: string | undefined = undefined;
      let targetGroup: TargetGroup | undefined = undefined;

      const reqContentType = request.headers.get("content-type") || "";
      if (reqContentType.includes("multipart/form-data")) {
        const formData = await request.formData();
        const file = formData.get("file");
        saveAsVersion = formData.get("save_as_version") !== "false";
        versionTitle = (formData.get("version_title") as string) || undefined;
        targetRole = (formData.get("target_role") as string) || undefined;
        targetGroup = ((formData.get("target_group") as string) || undefined) as TargetGroup | undefined;

        if (file && typeof file === "object" && "name" in file) {
          fileName = (file as File).name;
          contentType = (file as File).type || contentType;
          fileContent = await (file as File).text();
        } else if (typeof file === "string") {
          fileContent = file;
        }
      } else {
        const body = (await request.json().catch(() => ({}))) as Record<string, any>;
        fileName = body.file_name || body.fileName || "uploaded-cv.md";
        fileContent = body.file_content || body.fileContent || body.content || "";
        contentType = body.content_type || body.contentType || "text/plain";
        saveAsVersion = body.save_as_version !== false && body.saveAsVersion !== false;
        versionTitle = body.version_title || body.versionTitle || undefined;
        targetRole = body.target_role || body.targetRole || undefined;
        targetGroup = (body.target_group || body.targetGroup) as TargetGroup | undefined;
      }

      if (!fileContent || !fileContent.trim()) {
        return Response.json({ error: "No CV file content received" }, { status: 400 });
      }

      const parsed = cvTagCloudService.parseUploadedDocument(fileName, fileContent, contentType);
      const title = versionTitle || parsed.title;
      const role = targetRole || parsed.targetRole;
      const primaryGroup = targetGroup || parsed.tagCloud.primaryTargetGroup;

      let savedCv: CvVersion | null = null;
      if (saveAsVersion) {
        const now = Date.now();
        const newCvId = `cv_${now}_${Math.random().toString(36).slice(2, 7)}`;
        const cvRecord: CvVersion = {
          id: newCvId,
          userId: user.id,
          title,
          targetRole: role,
          targetGroup: primaryGroup,
          content: parsed.content,
          skills: parsed.skills,
          matchScore: 85,
          tailoredNotes: `Imported from ${fileName}. Primary Archetype: ${TARGET_GROUPS[primaryGroup]?.name || primaryGroup}.`,
          decisionSuggestions: { tagCloud: parsed.tagCloud },
          createdAt: now,
          updatedAt: now,
        };
        await cvRepo.create(cvRecord);
        savedCv = await cvRepo.getById(newCvId, user.id);
      }

      return Response.json({
        success: true,
        cv: savedCv,
        parsed: {
          ...parsed,
          title,
          targetRole: role,
          primaryTargetGroup: primaryGroup,
          totalTags: parsed.tagCloud.totalTags,
        },
      }, { status: 201 });
    }

    // 9b. User CV: Synchronized Tag Cloud Comparison (CV vs. JD / Market)
    if (path === "/api/user/cvs/compare-tags" && request.method === "POST") {
      const user = await getAuthenticatedUser(request, userRepo);
      const body = (await request.json().catch(() => ({}))) as Record<string, any>;

      let cvContent = body.cv_content || body.cvContent || "";
      let cvId = body.cv_id || body.cvId;

      if (!cvContent && cvId && user) {
        const cv = await cvRepo.getById(cvId, user.id);
        if (cv) cvContent = cv.content;
      }
      if (!cvContent && user) {
        const cvs = await cvRepo.listByUser(user.id);
        if (cvs.length > 0 && cvs[0]) {
          cvContent = cvs[0].content;
          cvId = cvs[0].id;
        }
      }
      if (!cvContent) {
        cvContent = `# Software Engineer\n\n## Skills\nTypeScript, Node.js, Python, PostgreSQL, Docker, React, Cloudflare Workers`;
      }

      let job: Job | undefined = undefined;
      const jobId = body.job_id || body.jobId;
      if (jobId) {
        const found = await jobRepo.getById(jobId);
        if (found) job = found;
      }

      const targetGroup = (body.target_group || body.targetGroup) as TargetGroup | undefined;

      const jobsRes = await jobRepo.listPaged({ page: 1, limit: 80, techOnly: true });
      const report = rerankerService.generateRealtimeReport(jobsRes.items);

      const comparison = cvTagCloudService.compareCvWithJd(cvContent, {
        job,
        targetGroup,
        report,
      });

      return Response.json({
        success: true,
        cvId,
        comparison,
      });
    }

    // 9c. User CV: Get Tag Cloud for Specific Stored CV
    if (path.startsWith("/api/user/cvs/") && path.endsWith("/tag-cloud") && request.method === "GET") {
      const user = await getAuthenticatedUser(request, userRepo);
      if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

      const cvId = path.replace("/api/user/cvs/", "").replace("/tag-cloud", "").trim();
      const cv = await cvRepo.getById(cvId, user.id);
      if (!cv) return Response.json({ error: "CV not found" }, { status: 404 });

      const tagCloud = cvTagCloudService.analyzeCv(cv.content, { cvId: cv.id, title: cv.title });
      return Response.json({ success: true, cvId: cv.id, tagCloud, analysis: tagCloud });
    }

    if (
      path.startsWith("/api/user/cvs/") &&
      !["/api/user/cvs/tailor", "/api/user/cvs/import", "/api/user/cvs/compare-tags", "/api/user/cvs/optimize-decision"].includes(path) &&
      !path.endsWith("/tag-cloud")
    ) {
      const cvId = path.replace("/api/user/cvs/", "").trim();
      const user = await getAuthenticatedUser(request, userRepo);
      if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

      if (request.method === "GET") {
        const cv = await cvRepo.getById(cvId, user.id);
        if (!cv) return Response.json({ error: "CV not found" }, { status: 404 });
        return Response.json({ success: true, cv });
      }

      if (request.method === "PUT") {
        const body = (await request.json()) as Record<string, any>;
        await cvRepo.update(cvId, user.id, {
          title: body.title !== undefined ? String(body.title) : undefined,
          targetRole: body.target_role !== undefined ? String(body.target_role) : (body.targetRole !== undefined ? String(body.targetRole) : undefined),
          content: body.content !== undefined ? String(body.content) : undefined,
          skills: Array.isArray(body.skills) ? body.skills : undefined,
          matchScore: body.match_score !== undefined ? Number(body.match_score) : (body.matchScore !== undefined ? Number(body.matchScore) : undefined),
          tailoredNotes: body.tailored_notes !== undefined ? String(body.tailored_notes) : (body.tailoredNotes !== undefined ? String(body.tailoredNotes) : undefined),
          jobId: body.job_id !== undefined ? String(body.job_id) : (body.jobId !== undefined ? String(body.jobId) : undefined),
        });
        const updated = await cvRepo.getById(cvId, user.id);
        return Response.json({ success: true, cv: updated });
      }

      if (request.method === "DELETE") {
        const deleted = await cvRepo.delete(cvId, user.id);
        return Response.json({ success: deleted });
      }
    }

    if (path === "/api/user/cvs/tailor" && request.method === "POST") {
      const user = await getAuthenticatedUser(request, userRepo);
      if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

      const body = (await request.json()) as Record<string, any>;
      const jobId = String(body.job_id || body.jobId || "");
      if (!jobId) {
        return Response.json({ error: "Missing jobId" }, { status: 400 });
      }

      const result = await mcpHandler.handleJsonRpc(
        {
          jsonrpc: "2.0",
          id: 1,
          method: "tools/call",
          params: {
            name: "tailor_cv_for_job",
            arguments: {
              job_id: jobId,
              base_cv_id: body.base_cv_id || body.baseCvId,
              custom_cv_content: body.custom_cv_content || body.customCvContent,
            },
          },
        },
        user
      );

      const parsed = JSON.parse(result.result.content[0].text);
      if (parsed.error) {
        return Response.json({ error: parsed.error }, { status: 400 });
      }
      return Response.json({ success: true, analysis: parsed });
    }

    // 9a2. User CV: Optimize via Cloudflare Decision API for Target Groups
    if (path === "/api/user/cvs/optimize-decision" && request.method === "POST") {
      const user = await getAuthenticatedUser(request, userRepo);
      if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

      const body = (await request.json().catch(() => ({}))) as Record<string, any>;
      const targetGroup = (body.target_group || body.targetGroup || "early_stage_startups") as TargetGroup;
      if (!TARGET_GROUPS[targetGroup]) {
        return Response.json({ error: `Invalid targetGroup '${targetGroup}'` }, { status: 400 });
      }

      let baseContent = body.custom_cv_content || body.customCvContent;
      if (!baseContent && (body.base_cv_id || body.baseCvId)) {
        const baseCv = await cvRepo.getById(body.base_cv_id || body.baseCvId, user.id);
        if (baseCv) baseContent = baseCv.content;
      }
      if (!baseContent) {
        const userCvs = await cvRepo.listByUser(user.id);
        if (userCvs.length > 0 && userCvs[0]) {
          baseContent = userCvs[0].content;
        }
      }
      if (!baseContent) {
        baseContent = `# ${user.firstName} - Software Engineer\n\n## Experience\n- Full Stack Software Engineer.\n\n## Skills\nTypeScript, Node.js, Python, PostgreSQL`;
      }

      const jobsRes = await jobRepo.listPaged({ page: 1, limit: 120, techOnly: true });
      const report = rerankerService.generateRealtimeReport(jobsRes.items);
      const decision = await decisionApi.optimizeCvForTargetGroup(baseContent, targetGroup, report);

      let savedCv = null;
      if (body.save_as_version || body.saveAsVersion) {
        const id = `cv_dec_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
        const title = body.version_title || body.versionTitle || `${user.firstName} - ${decision.targetGroupName} CV`;
        const now = Date.now();
        const cvRecord = {
          id,
          userId: user.id,
          title,
          targetRole: decision.targetGroupName,
          targetGroup,
          content: decision.optimizedCvContent,
          skills: decision.topDemandedSkillsInSegment,
          matchScore: decision.projectedMatchScore,
          tailoredNotes: decision.targetGroupStrategy,
          decisionSuggestions: decision,
          createdAt: now,
          updatedAt: now,
        };
        await cvRepo.create(cvRecord);
        savedCv = await cvRepo.getById(id, user.id);
      }

      return Response.json({
        success: true,
        decision,
        savedCv,
      });
    }

    // 9b. User Feedbacks API (View & Submit Feedbacks directly or from extensions)
    if (path === "/api/user/feedbacks" && request.method === "GET") {
      const user = await getAuthenticatedUser(request, userRepo);
      if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
      const items = await feedbackRepo.listByUser(user.id, 50);
      return Response.json({ success: true, items });
    }

    if (path === "/api/user/feedbacks" && request.method === "POST") {
      const user = await getAuthenticatedUser(request, userRepo);
      if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

      const body = (await request.json().catch(() => ({}))) as Record<string, any>;
      const comment = String(body.comment || "").trim();
      if (!comment) {
        return Response.json({ error: "Missing required 'comment'" }, { status: 400 });
      }

      const id = `fb_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const now = Date.now();

      const feedbackRecord: LlmFeedback = {
        id,
        userId: user.id,
        feedbackType: body.feedback_type || body.feedbackType || "general_suggestion",
        sentiment: body.sentiment || "neutral",
        rating: body.rating != null ? Number(body.rating) : undefined,
        comment,
        jobId: body.job_id || body.jobId || undefined,
        companyId: body.company_id || body.companyId || undefined,
        contextSummary: body.context_summary || body.contextSummary || undefined,
        suggestedAction: body.suggested_action || body.suggestedAction || undefined,
        metadata: typeof body.metadata === "object" && body.metadata !== null ? body.metadata : { client: "WebDashboard" },
        status: "new",
        createdAt: now,
        updatedAt: now,
      };

      await feedbackRepo.create(feedbackRecord);

      // Notify Telegram admin if critical or broken link
      if (feedbackRecord.sentiment === "critical" || feedbackRecord.feedbackType === "broken_link") {
        const alertMsg = [
          `🚨 *OFFRADARJOB - PHẢN HỒI KHẨN CẤP TỪ WEB USER*`,
          `👤 *User:* ${user.firstName} (@${user.username || user.telegramId})`,
          `🏷️ *Loại:* \`${feedbackRecord.feedbackType}\` | *Mức độ:* \`${feedbackRecord.sentiment}\``,
          `📝 *Nội dung:* ${feedbackRecord.comment}`,
          feedbackRecord.suggestedAction ? `🎯 *Đề xuất:* ${feedbackRecord.suggestedAction}` : "",
        ].filter(Boolean).join("\n");
        await notifyTelegramAdmin(env, alertMsg, effectiveConfig);
      }

      return Response.json({ success: true, feedback: feedbackRecord });
    }

    // 9c. Candidate Job Alert Subscription API (Get and Update user subscriptions)
    if (path === "/api/user/subscription" && request.method === "GET") {
      const user = await getAuthenticatedUser(request, userRepo);
      if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
      const sub = await subscriptionRepo.getByUserId(user.id);
      return Response.json({ success: true, subscription: sub || null });
    }

    if (path === "/api/user/subscription" && request.method === "POST") {
      const user = await getAuthenticatedUser(request, userRepo);
      if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

      const body = (await request.json().catch(() => ({}))) as Record<string, any>;
      const existing = await subscriptionRepo.getByUserId(user.id);

      const targetRole = body.target_role !== undefined ? body.target_role : (body.targetRole !== undefined ? body.targetRole : undefined);
      const targetRoles = Array.isArray(body.target_roles)
        ? (body.target_roles as string[])
        : (targetRole ? [String(targetRole).trim()] : (existing?.targetRoles ?? []));

      const targetRegion = body.target_region !== undefined ? body.target_region : (body.targetRegion !== undefined ? body.targetRegion : undefined);
      const regions = Array.isArray(body.regions)
        ? (body.regions as string[])
        : (targetRegion ? [String(targetRegion).trim()] : (existing?.regions ?? ["midwest", "remote"]));

      const frequency = body.frequency || existing?.frequency || "daily";
      const isActive = body.is_active !== undefined ? Boolean(body.is_active) : (body.isActive !== undefined ? Boolean(body.isActive) : (existing ? existing.isActive : true));

      const updatedSub = await subscriptionRepo.upsert({
        userId: user.id,
        telegramId: user.telegramId || (existing?.telegramId ?? ""),
        targetRoles,
        regions,
        frequency: frequency as any,
        isActive,
      });

      return Response.json({ success: true, subscription: updatedSub });
    }

    // 10. MCP (Model Context Protocol) Endpoints for AI Agents (Cursor, Claude Desktop, Antigravity)
    if (path === "/mcp" && request.method === "POST") {
      const user = await getAuthenticatedUser(request, userRepo, { allowQueryToken: env.MCP_ALLOW_QUERY_TOKEN === "true" });
      if (!user) {
        return Response.json(
          {
            jsonrpc: "2.0",
            id: null,
            error: {
              code: -32000,
              message: "Unauthorized. Send your token as an Authorization: Bearer orp_... header.",
            },
          },
          { status: 401 }
        );
      }

      const body = (await request.json()) as any;
      const res = await mcpHandler.handleJsonRpc(body, user);
      return Response.json(res);
    }

    if (path === "/mcp/sse" && request.method === "GET") {
      const user = await getAuthenticatedUser(request, userRepo, { allowQueryToken: env.MCP_ALLOW_QUERY_TOKEN === "true" });
      if (!user) {
        return new Response("Unauthorized. Send your token as an Authorization: Bearer orp_... header.", { status: 401 });
      }

      // The client keeps sending its Authorization header; the token is never placed in a URL.
      const endpointUrl = `/mcp`;
      return new Response(`event: endpoint\ndata: ${endpointUrl}\n\n`, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          "Connection": "keep-alive",
        },
      });
    }

    // 11. Admin API: Stats & Task Metrics
    if (path === "/api/admin/stats" && request.method === "GET") {
      if (!(await isAuthorized(request, url, env))) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
      }
      const [companiesCount, jobsCount, recentLogs, tasksStats, freshness, subscriberStats] = await Promise.all([
        companyRepo.count(),
        jobRepo.count(),
        logRepo.getRecent(30),
        taskRepo.getStats(),
        jobRepo.getFreshnessMetrics(),
        subscriptionRepo.countSubscribers(),
      ]);
      return Response.json({
        companiesCount,
        jobsCount,
        logsCount: recentLogs.length,
        recentLogs,
        tasks: tasksStats,
        subscribers: subscriberStats,
        freshness: {
          ...freshness,
          cronSchedule: "Daily 02:00 UTC (Rotating Seeds + Public Sources) & Weekly Mon 03:00 UTC (Full Re-crawl)",
        },
      });
    }

    // 7. Admin API: List Crawl Tasks
    if (path === "/api/admin/tasks" && request.method === "GET") {
      if (!(await isAuthorized(request, url, env))) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
      }
      const statusParam = url.searchParams.get("status");
      const status = statusParam && statusParam !== "all" ? (statusParam as CrawlTaskStatus) : undefined;
      const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "50", 10), 100);

      const tasks = await taskRepo.list({ status, limit });
      return Response.json(tasks);
    }

    // 8. Admin API: Dispatch Single Crawl Task
    if (path === "/api/admin/tasks/create" && request.method === "POST") {
      if (!(await isAuthorized(request, url, env))) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
      }
      try {
        const body = (await request.json()) as { url?: string; source?: string };
        if (!body.url) {
          return Response.json({ error: "Missing 'url'" }, { status: 400 });
        }

        const taskId = `task_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        await taskRepo.create({
          id: taskId,
          targetUrl: body.url,
          sourceType: body.source ?? "manual",
          status: "pending",
          jobsFound: 0,
          metadata: {},
          createdAt: Date.now(),
        });

        if (env.DISCOVERY_QUEUE) {
          await env.DISCOVERY_QUEUE.send({
            type: "DISCOVER_SEED",
            traceId: taskId,
            source: body.source ?? "manual",
            sourceUrl: body.url,
            timestamp: Date.now(),
            retryCount: 0,
          });
        } else {
          const orchestrator = new PipelineOrchestrator(env.DB);
          ctx.waitUntil(
            orchestrator.processSeedAsync(body.url, body.source ?? "manual", taskId).catch((err) => {
              console.error("[AdminTask] Background crawl failed:", err);
            })
          );
        }

        return Response.json({ success: true, taskId, status: "dispatched" });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        return Response.json({ error: msg }, { status: 500 });
      }
    }

    // 9. Admin API: Dispatch Batch Crawl Tasks
    if (path === "/api/admin/tasks/batch" && request.method === "POST") {
      if (!(await isAuthorized(request, url, env))) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
      }
      try {
        const body = (await request.json()) as { urls?: string[]; source?: string };
        if (!body.urls || !Array.isArray(body.urls) || body.urls.length === 0) {
          return Response.json({ error: "Missing or invalid 'urls' array" }, { status: 400 });
        }

        const orchestrator = new PipelineOrchestrator(env.DB);
        const taskIds: string[] = [];

        const urls = body.urls;
        const source = body.source ?? "batch_admin";

        for (const rawUrl of urls) {
          const cleanUrl = rawUrl.trim();
          if (!cleanUrl) continue;
          const taskId = `task_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
          taskIds.push(taskId);

          await taskRepo.create({
            id: taskId,
            targetUrl: cleanUrl,
            sourceType: source,
            status: "pending",
            jobsFound: 0,
            metadata: {},
            createdAt: Date.now(),
          });
        }

        ctx.waitUntil(
          (async () => {
            for (let i = 0; i < urls.length; i++) {
              const u = urls[i]?.trim();
              const tId = taskIds[i];
              if (u && tId) {
                await orchestrator.processSeedAsync(u, source, tId).catch((err) => {
                  console.error(`[BatchAdmin] Failed for ${u}:`, err);
                });
              }
            }
          })()
        );

        return Response.json({ success: true, dispatchedCount: taskIds.length, taskIds });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        return Response.json({ error: msg }, { status: 500 });
      }
    }

    // 10. Admin API: Trigger Preset Sweeps
    if (path === "/api/admin/tasks/preset" && request.method === "POST") {
      if (!(await isAuthorized(request, url, env))) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
      }
      try {
        const body = (await request.json()) as { preset?: string };
        const preset = body.preset ?? "midwest";

        let presetUrls: string[] = [];
        if (preset === "midwest") {
          presetUrls = CURATED_SEEDS.filter((s) => s.category === "midwest_boutique").map((s) => s.url);
        } else if (preset === "texas_southwest") {
          presetUrls = CURATED_SEEDS.filter((s) => s.category === "texas_southwest").map((s) => s.url);
        } else if (preset === "east_coast") {
          presetUrls = CURATED_SEEDS.filter((s) => s.category === "east_coast").map((s) => s.url);
        } else if (preset === "west_coast") {
          presetUrls = CURATED_SEEDS.filter((s) => s.category === "west_coast").map((s) => s.url);
        } else if (preset === "ai_ml") {
          presetUrls = CURATED_SEEDS.filter((s) => s.category === "ai_ml").map((s) => s.url);
        } else if (preset === "systems") {
          presetUrls = CURATED_SEEDS.filter((s) => s.category === "systems_infra").map((s) => s.url);
        } else if (preset === "all_us") {
          presetUrls = CURATED_SEEDS.map((s) => s.url);
        } else {
          presetUrls = CURATED_SEEDS.slice(0, 10).map((s) => s.url);
        }

        const orchestrator = new PipelineOrchestrator(env.DB);
        const taskIds: string[] = [];

        for (const u of presetUrls) {
          const taskId = `task_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
          taskIds.push(taskId);

          await taskRepo.create({
            id: taskId,
            targetUrl: u,
            sourceType: `${preset}_preset`,
            status: "pending",
            jobsFound: 0,
            metadata: { preset },
            createdAt: Date.now(),
          });
        }

        ctx.waitUntil(
          (async () => {
            for (let i = 0; i < presetUrls.length; i++) {
              const u = presetUrls[i];
              const tId = taskIds[i];
              if (u && tId) {
                await orchestrator.processSeedAsync(u, `${preset}_preset`, tId).catch((err) => {
                  console.error(`[PresetSweep] Failed for ${u}:`, err);
                });
              }
            }
          })()
        );

        return Response.json({ success: true, preset, count: presetUrls.length, taskIds });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        return Response.json({ error: msg }, { status: 500 });
      }
    }

    // 11. Admin API: Bulk Heavy Seeder (Enqueues full curated catalogue into Cloudflare Queues/Runner)
    if (path === "/api/admin/tasks/bulk-seed" && request.method === "POST") {
      if (!(await isAuthorized(request, url, env))) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
      }
      try {
        const body = (await request.json().catch(() => ({}))) as { category?: string; limit?: number };
        let targets = CURATED_SEEDS;
        if (body.category) {
          targets = targets.filter((s) => s.category === body.category);
        }
        if (body.limit && body.limit > 0) {
          targets = targets.slice(0, body.limit);
        }

        const taskIds: string[] = [];
        const orchestrator = new PipelineOrchestrator(env.DB);

        for (const seed of targets) {
          const taskId = `task_bulk_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
          taskIds.push(taskId);

          await taskRepo.create({
            id: taskId,
            targetUrl: seed.url,
            sourceType: "bulk_catalogue",
            status: "pending",
            jobsFound: 0,
            metadata: { name: seed.name, region: seed.region, category: seed.category },
            createdAt: Date.now(),
          });

          if (env.DISCOVERY_QUEUE) {
            await env.DISCOVERY_QUEUE.send({
              type: "DISCOVER_SEED",
              traceId: taskId,
              source: "bulk_catalogue",
              sourceUrl: seed.url,
              timestamp: Date.now(),
              retryCount: 0,
            });
          }
        }

        // If no queue binding, process asynchronously in background
        if (!env.DISCOVERY_QUEUE) {
          ctx.waitUntil(
            (async () => {
              for (let i = 0; i < targets.length; i++) {
                const s = targets[i];
                const tId = taskIds[i];
                if (s && tId) {
                  await orchestrator.processSeedAsync(s.url, "bulk_catalogue", tId).catch((err) => {
                    console.error(`[BulkCatalogue] Failed for ${s.url}:`, err);
                  });
                }
              }
            })()
          );
        }

        return Response.json({
          success: true,
          totalEnqueued: taskIds.length,
          seeds: targets.map((t) => t.name),
          message: env.DISCOVERY_QUEUE
            ? "Dispatched to Cloudflare Queues for serverless multi-hour processing"
            : "Dispatched to background runner",
        });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        return Response.json({ error: msg }, { status: 500 });
      }
    }

    // 11b. Admin API: Massive Simultaneous Bulk Sweep across all tracked companies
    if (path === "/api/admin/tasks/bulk-sweep-all" && request.method === "POST") {
      if (!(await isAuthorized(request, url, env))) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
      }
      try {
        const body = (await request.json().catch(() => ({}))) as { limit?: number };
        const limit = Math.min(Math.max(body.limit ?? 200, 1), 500);

        const allCompanies = await companyRepo.list(limit);
        const orchestrator = new PipelineOrchestrator(env.DB);
        const taskIds: string[] = [];

        for (const comp of allCompanies) {
          const taskId = `task_bulk_all_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
          taskIds.push(taskId);

          await taskRepo.create({
            id: taskId,
            targetUrl: comp.websiteUrl,
            sourceType: "bulk_all_companies",
            status: "pending",
            companyId: comp.id,
            jobsFound: 0,
            metadata: { companyName: comp.name, domain: comp.domain },
            createdAt: Date.now(),
          });

          if (env.DISCOVERY_QUEUE) {
            await env.DISCOVERY_QUEUE.send({
              type: "DISCOVER_SEED",
              traceId: taskId,
              source: "seed_list",
              sourceUrl: comp.websiteUrl,
              timestamp: Date.now(),
              retryCount: 0,
            });
          }
        }

        if (!env.DISCOVERY_QUEUE) {
          ctx.waitUntil(
            (async () => {
              for (let i = 0; i < allCompanies.length; i++) {
                const c = allCompanies[i];
                const tId = taskIds[i];
                if (c && tId) {
                  await orchestrator.processSeedAsync(c.websiteUrl, "bulk_all_companies", tId).catch((err) => {
                    console.error(`[BulkAllCompanies] Failed for ${c.websiteUrl}:`, err);
                  });
                }
              }
            })()
          );
        }

        return Response.json({
          success: true,
          totalCompanies: allCompanies.length,
          dispatchedTasks: taskIds.length,
          message: `Dispatched simultaneous sweep across all ${allCompanies.length} tracked companies.`,
        });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        return Response.json({ error: msg }, { status: 500 });
      }
    }

    // 11c. Admin API: Weekly Continuous Sweep across tracked companies & ATS boards
    if (path === "/api/admin/tasks/weekly-sweep" && request.method === "POST") {
      if (!(await isAuthorized(request, url, env))) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
      }
      try {
        const body = (await request.json().catch(() => ({}))) as { limit?: number };
        const limit = Math.min(Math.max(body.limit ?? 250, 10), 1000);

        const allCompanies = await companyRepo.list(limit);
        const taskIds: string[] = [];

        for (const comp of allCompanies) {
          const taskId = `task_weekly_manual_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
          taskIds.push(taskId);

          await taskRepo.create({
            id: taskId,
            targetUrl: comp.websiteUrl,
            sourceType: "weekly_scheduled_manual",
            status: "pending",
            companyId: comp.id,
            jobsFound: 0,
            metadata: { companyName: comp.name, domain: comp.domain },
            createdAt: Date.now(),
          });

          if (env.DISCOVERY_QUEUE) {
            await env.DISCOVERY_QUEUE.send({
              type: "DISCOVER_SEED",
              traceId: taskId,
              source: "weekly_scheduled_manual",
              sourceUrl: comp.websiteUrl,
              timestamp: Date.now(),
              retryCount: 0,
            });
          }
        }

        // Also sweep direct ATS boards in background
        const smbHarvester = new SmbHarvester();
        ctx.waitUntil(
          smbHarvester.syncWithDatabase(env.DB).then(async (res) => {
            await logRepo.log({
              id: `log_weekly_sweep_${Date.now()}`,
              agentName: "weekly_sweep_orchestrator",
              targetUrl: "cron://weekly-sweep-manual",
              status: "success",
              durationMs: 0,
              message: `Weekly sweep successfully synchronized ${res.jobsAdded} jobs and dispatched ${taskIds.length} company re-crawls.`,
              metadata: { dispatched: taskIds.length, jobsAdded: res.jobsAdded },
              createdAt: Date.now(),
            });
          }).catch((err) => {
            console.error("[WeeklySweep] Direct ATS sweep error:", err);
          })
        );

        return Response.json({
          success: true,
          totalCompanies: allCompanies.length,
          dispatchedTasks: taskIds.length,
          atsBoardsCount: SMB_CATALOGUE.length,
          schedule: "0 3 * * 1 (Mondays 03:00 UTC) + Daily 1/7th partition",
          message: `Dispatched weekly sweep across ${allCompanies.length} tracked companies and ${SMB_CATALOGUE.length} direct ATS boards.`,
        });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        return Response.json({ error: msg }, { status: 500 });
      }
    }

    // 11d. Admin API: Backfill Department Hiring Weights & Primary Departments
    if (path === "/api/admin/companies/backfill-weights" && request.method === "POST") {
      if (!(await isAuthorized(request, url, env))) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
      }
      try {
        const result = await companyRepo.backfillAllDepartmentWeights();
        return Response.json({
          success: true,
          message: `Successfully recalculated hiring department weights for ${result.updatedCount} companies.`,
          updatedCount: result.updatedCount,
        });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        return Response.json({ error: msg }, { status: 500 });
      }
    }

    // 11e. Admin API: Weekly Schedule Status
    if (path === "/api/admin/weekly-schedule/status" && request.method === "GET") {
      const now = new Date();
      const currentDay = now.getUTCDay(); // 0=Sunday, 1=Monday
      const daysUntilMonday = (8 - currentDay) % 7 || 7;
      const nextMonday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + daysUntilMonday, 3, 0, 0));
      const totalCount = await companyRepo.count();

      return Response.json({
        cronSchedule: "0 3 * * 1 (Every Monday at 03:00 UTC)",
        nextScheduledRunUtc: nextMonday.toISOString(),
        currentDayOfWeek: currentDay,
        trackedCompanies: totalCount,
        rollingPartitionDailyLimit: Math.ceil(totalCount / 7),
        rollingCoverageStrategy: "1/7th partition swept daily (100% refreshed every 7 days) + Monday Full Priority Sweep",
        supportedDirectAtsBoards: SMB_CATALOGUE.length,
      });
    }

    // 12. Admin API: Moderation - Update Job Status
    const jobStatusMatch = path.match(/^\/api\/admin\/jobs\/([^/]+)\/status$/);
    if (jobStatusMatch && request.method === "PATCH") {
      if (!(await isAuthorized(request, url, env))) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
      }
      const jobId = jobStatusMatch[1]!;
      const body = (await request.json()) as { status?: "open" | "closed" };
      if (body.status !== "open" && body.status !== "closed") {
        return Response.json({ error: "Invalid status, must be 'open' or 'closed'" }, { status: 400 });
      }

      await jobRepo.updateStatus(jobId, body.status);
      return Response.json({ success: true, id: jobId, status: body.status });
    }

    // 12. Admin API: Moderation - Delete Job
    const jobDeleteMatch = path.match(/^\/api\/admin\/jobs\/([^/]+)$/);
    if (jobDeleteMatch && request.method === "DELETE") {
      if (!(await isAuthorized(request, url, env))) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
      }
      const jobId = jobDeleteMatch[1]!;
      await jobRepo.delete(jobId);
      return Response.json({ success: true, id: jobId, deleted: true });
    }

    // 12b. Admin API: Continuous JD Reranker Trigger
    if (path === "/api/admin/rerank" && request.method === "POST") {
      if (!(await isAuthorized(request, url, env))) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
      }

      const jobsRes = await jobRepo.listPaged({ page: 1, limit: 250, techOnly: true });
      const compRes = await companyRepo.listPaged({ page: 1, limit: 150 });
      const companiesMap = new Map<string, any>();
      for (const c of compRes.items) companiesMap.set(c.id, c);

      const report = rerankerService.generateRealtimeReport(jobsRes.items, companiesMap);

      if (env.CACHE && typeof env.CACHE.put === "function") {
        await env.CACHE.put("cache_realtime_jd_ranking_report", JSON.stringify(report), { expirationTtl: 600 });
      }

      return Response.json({
        success: true,
        message: "Continuous JD Reranker executed successfully.",
        totalAnalyzed: report.totalJdsAnalyzed,
        topJob: report.topRankedJobs[0]?.job.title || "None",
        trendingSkillsCount: report.trendingSkills.length,
        targetGroupBreakdown: report.targetGroupBreakdown,
      });
    }

    // 13. Admin API: Harvest from Hacker News "Who is Hiring"
    if (path === "/api/admin/harvest/hn" && request.method === "POST") {
      if (!(await isAuthorized(request, url, env))) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
      }
      try {
        const body = (await request.json().catch(() => ({}))) as { limit?: number };
        const limit = Math.min(Math.max(body.limit ?? 20, 1), 50);

        const manager = new PublicSourceManager(env.DB);
        const orchestrator = new PipelineOrchestrator(env.DB);

        ctx.waitUntil(
          manager.harvestAndGatherAsync("hn", limit, orchestrator).catch((err) => {
            console.error("[AdminHarvestHN] Background harvest failed:", err);
          })
        );

        return Response.json({
          success: true,
          source: "hn",
          limit,
          status: "harvest_started",
          message: `Harvesting up to ${limit} companies from Hacker News 'Who is hiring' thread in the background. Check Tasks tab for progress.`,
        });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        return Response.json({ error: msg }, { status: 500 });
      }
    }

    // 14. Admin API: Harvest from GitHub Open Directories (remoteintech & established-remote)
    if (path === "/api/admin/harvest/github" && request.method === "POST") {
      if (!(await isAuthorized(request, url, env))) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
      }
      try {
        const body = (await request.json().catch(() => ({}))) as { limit?: number };
        const limit = Math.min(Math.max(body.limit ?? 20, 1), 50);

        const manager = new PublicSourceManager(env.DB);
        const orchestrator = new PipelineOrchestrator(env.DB);

        ctx.waitUntil(
          manager.harvestAndGatherAsync("github", limit, orchestrator).catch((err) => {
            console.error("[AdminHarvestGitHub] Background harvest failed:", err);
          })
        );

        return Response.json({
          success: true,
          source: "github",
          limit,
          status: "harvest_started",
          message: `Harvesting up to ${limit} companies from GitHub Open Directories in the background. Check Tasks tab for progress.`,
        });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        return Response.json({ error: msg }, { status: 500 });
      }
    }

    // 15. Admin API: Harvest from All Public Sources
    if (path === "/api/admin/harvest/all" && request.method === "POST") {
      if (!(await isAuthorized(request, url, env))) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
      }
      try {
        const body = (await request.json().catch(() => ({}))) as { limit?: number };
        const limit = Math.min(Math.max(body.limit ?? 30, 1), 60);

        const manager = new PublicSourceManager(env.DB);
        const orchestrator = new PipelineOrchestrator(env.DB);

        ctx.waitUntil(
          manager.harvestAndGatherAsync("all", limit, orchestrator).catch((err) => {
            console.error("[AdminHarvestAll] Background harvest failed:", err);
          })
        );

        return Response.json({
          success: true,
          source: "all",
          limit,
          status: "harvest_started",
          message: `Harvesting up to ${limit} companies from Hacker News and GitHub Open Directories in the background. Check Tasks tab for progress.`,
        });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        return Response.json({ error: msg }, { status: 500 });
      }
    }

    // 15b. Admin API: Harvest New Grad Roles (SimplifyJobs & Midwest programs)
    if (path === "/api/admin/harvest/newgrad" && request.method === "POST") {
      if (!(await isAuthorized(request, url, env))) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
      }
      try {
        const body = (await request.json().catch(() => ({}))) as { limit?: number };
        const limit = Math.min(Math.max(body.limit ?? 350, 10), 500);

        const harvester = new NewGradHarvester();
        const result = await harvester.importNewGradRoles(env.DB, limit);

        return Response.json({
          success: true,
          source: "new_grad_positions",
          limit,
          ...result,
          message: `Successfully harvested ${result.importedJobs} New Grad positions (${result.midwestJobs} Midwest US roles).`,
        });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        return Response.json({ error: msg }, { status: 500 });
      }
    }

    // 15c. Admin API: Harvest Cross-Industry US SMBs
    if (path === "/api/admin/harvest/smb" && request.method === "POST") {
      if (!(await isAuthorized(request, url, env))) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
      }
      try {
        const body = (await request.json().catch(() => ({}))) as { targetsCount?: number };
        const count = Math.min(Math.max(body.targetsCount ?? SMB_CATALOGUE.length, 1), SMB_CATALOGUE.length);
        const selectedTargets = SMB_CATALOGUE.slice(0, count);

        const smbHarvester = new SmbHarvester();
        ctx.waitUntil(
          smbHarvester.syncWithDatabase(env.DB, selectedTargets).then(async (res) => {
            await logRepo.log({
              id: `log_admin_smb_${Date.now()}`,
              agentName: "admin_smb_gatherer",
              targetUrl: "admin://harvest-smb",
              status: "success",
              durationMs: 0,
              message: `Admin triggered SMB harvest synchronized ${res.jobsAdded} positions across ${selectedTargets.length} US companies.`,
              metadata: { targetsCount: selectedTargets.length, jobsAdded: res.jobsAdded },
              createdAt: Date.now(),
            });
          }).catch((err) => {
            console.error("[AdminHarvestSmb] Background harvest failed:", err);
          })
        );

        return Response.json({
          success: true,
          source: "smb_cross_industry",
          targetsCount: selectedTargets.length,
          status: "harvest_started",
          message: `Dispatched scheduled gather for ${selectedTargets.length} US SMBs across 9 industries in background.`,
        });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        return Response.json({ error: msg }, { status: 500 });
      }
    }

    // 15a. Admin API: Telegram Bot Status & Config
    if (path === "/api/admin/telegram/status" && request.method === "GET") {
      if (!(await isAuthorized(request, url, env))) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
      }
      const [totalUsers, totalAdmins] = await Promise.all([
        userRepo.count(),
        userRepo.count("admin"),
      ]);
      const configuredAdminIds = [...parseTelegramAdminIds(effectiveConfig.telegramAdminIds)];
      const configuredAdmins = configuredAdminIds;

      return Response.json({
        botUsername: effectiveConfig.telegramBotUsername || "OffRadarJobBot",
        hasBotToken: !!effectiveConfig.telegramBotToken,
        configuredAdmins,
        configuredAdminIds,
        adminChatId: effectiveConfig.telegramAdminChatId || null,
        totalUsers,
        totalAdmins,
      });
    }

    // 15a2. Admin API: Full Telegram & System Config (Masked Sensitive Data)
    if (path === "/api/admin/telegram/config" && request.method === "GET") {
      if (!(await isAuthorized(request, url, env))) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
      }
      const token = effectiveConfig.telegramBotToken;
      const maskedToken = token
        ? (token.length > 10 ? `${token.slice(0, 6)}...${token.slice(-4)}` : "******")
        : "";
      const adminToken = effectiveConfig.adminToken;
      const maskedAdminToken = adminToken
        ? (adminToken.length > 6 ? `${adminToken.slice(0, 4)}...${adminToken.slice(-3)}` : "******")
        : "";

      return Response.json({
        hasBotToken: !!token,
        botTokenMasked: maskedToken,
        botUsername: effectiveConfig.telegramBotUsername || "OffRadarJobBot",
        adminUsernames: "",
        adminIds: effectiveConfig.telegramAdminIds || "",
        adminChatId: effectiveConfig.telegramAdminChatId || "",
        adminTokenMasked: maskedAdminToken,
      });
    }

    // 15a3. Admin API: Save Telegram & System Config to D1
    if (path === "/api/admin/telegram/config" && request.method === "POST") {
      if (!(await isAuthorized(request, url, env))) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
      }
      const body = (await request.json().catch(() => ({}))) as {
        botToken?: string;
        botUsername?: string;
        adminUsernames?: string;
        adminIds?: string;
        adminChatId?: string;
        adminToken?: string;
      };

      const toSave: Record<string, string> = {};
      if (body.botToken !== undefined) {
        const trimmed = body.botToken.trim();
        if (trimmed && !trimmed.includes("...")) {
          toSave["telegram_bot_token"] = trimmed;
        }
      }
      if (body.botUsername !== undefined) {
        toSave["telegram_bot_username"] = body.botUsername.trim().replace(/^@/, "");
      }
      // Admin usernames/IDs are not stored in D1: bot admins come only from the TELEGRAM_ADMIN_IDS secret/var.
      if (body.adminChatId !== undefined) {
        toSave["telegram_admin_chat_id"] = body.adminChatId.trim();
      }
      // body.adminToken is ignored: the admin token is only the ADMIN_TOKEN Cloudflare secret.

      if (Object.keys(toSave).length > 0) {
        await settingsRepo.setMany(toSave);
      }

      return Response.json({
        success: true,
        message: "Telegram configuration saved successfully to D1 database.",
        updatedKeys: Object.keys(toSave),
      });
    }

    // 15a4. Admin API: Telegram Webhook Live Status & Diagnostic
    if (path === "/api/telegram/webhook-info" && request.method === "GET") {
      if (!(await isAuthorized(request, url, env))) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
      }
      const botToken = effectiveConfig.telegramBotToken;
      if (!botToken) {
        return Response.json({ ok: false, error: "Bot token not configured yet" }, { status: 400 });
      }
      try {
        const tgRes = await fetch(`https://api.telegram.org/bot${botToken}/getWebhookInfo`);
        const tgData = await tgRes.json();
        return Response.json(tgData);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        return Response.json({ ok: false, error: msg || "Failed to contact Telegram API" }, { status: 500 });
      }
    }

    // 15b. Admin API: List Users & MCP Tokens
    if (path === "/api/admin/users" && request.method === "GET") {
      if (!(await isAuthorized(request, url, env))) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
      }
      const role = url.searchParams.get("role") || undefined;
      const limit = Math.min(parseInt(url.searchParams.get("limit") || "50", 10), 100);
      const users = await userRepo.list(limit, role);
      return Response.json({ users });
    }

    // 15c. Admin API: Update User Role (Grant / Revoke Admin)
    const userRoleMatch = path.match(/^\/api\/admin\/users\/([^/]+)\/role$/);
    if (userRoleMatch && request.method === "POST") {
      if (!(await isAuthorized(request, url, env))) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
      }
      const userId = decodeURIComponent(userRoleMatch[1]!);
      const body = (await request.json().catch(() => ({}))) as { role?: string };
      const newRole = body.role === "admin" ? "admin" : "user";
      await userRepo.setRole(userId, newRole);
      return Response.json({ success: true, userId, role: newRole });
    }

    // 15d. Admin API: Send Test Alert via Telegram Bot
    if (path === "/api/admin/telegram/test-notify" && request.method === "POST") {
      if (!(await isAuthorized(request, url, env))) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
      }
      const botToken = effectiveConfig.telegramBotToken;
      if (!botToken) {
        return Response.json({ error: "TELEGRAM_BOT_TOKEN not configured yet. Please configure it in the Telegram Bot tab." }, { status: 400 });
      }
      const body = (await request.json().catch(() => ({}))) as { message?: string; chatId?: string };
      const alertMsg = body.message || "🔔 *[OffRadarJob Alert]* Test notification from Admin Control Center!";
      const targetChatId = body.chatId || effectiveConfig.telegramAdminChatId;

      if (targetChatId) {
        const ok = await sendTelegramMessage(botToken, targetChatId, alertMsg);
        return Response.json({ success: ok, targetChatId });
      } else {
        await notifyTelegramAdmin(env, alertMsg, effectiveConfig);
        return Response.json({ success: true, broadcast: true });
      }
    }

    // 15e. Admin API: LLM Feedbacks Moderation & Analysis
    if (path === "/api/admin/feedbacks" && request.method === "GET") {
      if (!(await isAuthorized(request, url, env))) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
      }
      const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
      const limit = Math.min(parseInt(url.searchParams.get("limit") || "20", 10), 100);
      const type = url.searchParams.get("type") || undefined;
      const sentiment = url.searchParams.get("sentiment") || undefined;
      const status = url.searchParams.get("status") || undefined;
      const search = url.searchParams.get("search") || undefined;

      const [feedbacksData, stats] = await Promise.all([
        feedbackRepo.listPaged({ page, limit, type, sentiment, status, search }),
        feedbackRepo.getStats(),
      ]);

      return Response.json({
        success: true,
        ...feedbacksData,
        stats,
      });
    }

    if (path === "/api/admin/feedbacks/status" && request.method === "POST") {
      if (!(await isAuthorized(request, url, env))) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
      }
      const body = (await request.json().catch(() => ({}))) as { id?: string; status?: FeedbackStatus };
      if (!body.id || !body.status) {
        return Response.json({ error: "Missing 'id' or 'status'" }, { status: 400 });
      }
      const ok = await feedbackRepo.updateStatus(body.id, body.status);
      return Response.json({ success: ok, id: body.id, status: body.status });
    }

    if ((path === "/api/admin/feedbacks/delete" && request.method === "POST") || (path === "/api/admin/feedbacks" && request.method === "DELETE")) {
      if (!(await isAuthorized(request, url, env))) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
      }
      let id = url.searchParams.get("id");
      if (!id) {
        const body = (await request.json().catch(() => ({}))) as { id?: string };
        id = body.id || null;
      }
      if (!id) {
        return Response.json({ error: "Missing 'id'" }, { status: 400 });
      }
      const ok = await feedbackRepo.delete(id);
      return Response.json({ success: ok, id });
    }

    // 16. API: Trigger Ingest / Crawl Seed (Public)
    if (path === "/api/crawl/seed" && request.method === "POST") {
      if (!(await isAuthorized(request, url, env))) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
      }
      try {
        const body = (await request.json()) as { url?: string; source?: string };
        if (!body.url) {
          return Response.json({ error: "Missing 'url' in request body" }, { status: 400 });
        }

        const traceId = `tr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        const seedMsg: DiscoveryMessage = {
          type: "DISCOVER_SEED",
          traceId,
          source: "manual",
          sourceUrl: body.url,
          timestamp: Date.now(),
          retryCount: 0,
        };

        if (env.DISCOVERY_QUEUE) {
          await env.DISCOVERY_QUEUE.send(seedMsg);
          return Response.json({
            status: "queued",
            traceId,
            message: "Dispatched to Cloudflare Queue: discovery-queue",
          });
        } else {
          const orchestrator = new PipelineOrchestrator(env.DB);
          ctx.waitUntil(
            orchestrator.processSeedAsync(body.url, "manual").catch((err) => {
              console.error("[API] Background crawl failed:", err);
            })
          );
          return Response.json({
            status: "processing_async",
            traceId,
            message: "Dispatched to async background runner",
          });
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        return Response.json({ error: msg }, { status: 500 });
      }
    }

    return new Response("Not Found", { status: 404 });
  },

  /**
   * Cloudflare Queue Consumer Handler
   */
  async queue(
    batch: {
      queue: string;
      messages: Array<{
        id: string;
        body: unknown;
        ack(): void;
        retry(): void;
      }>;
    },
    env: Env
  ): Promise<void> {
    const orchestrator = new PipelineOrchestrator(env.DB);

    for (const msg of batch.messages) {
      try {
        const body = msg.body as Record<string, unknown>;
        const msgType = body["type"] as string;

        switch (msgType) {
          case "DISCOVER_SEED": {
            const discMsg = body as unknown as DiscoveryMessage;
            const res = await orchestrator.discoveryAgent.process(discMsg);
            if (res.ok && res.value.length > 0 && env.PROFILE_QUEUE) {
              for (const profileMsg of res.value) {
                await env.PROFILE_QUEUE.send(profileMsg);
              }
            }
            msg.ack();
            break;
          }

          case "PROFILE_COMPANY": {
            const profMsg = body as unknown as ProfileMessage;
            const res = await orchestrator.profilerAgent.process(profMsg);
            if (res.ok && env.HUNT_QUEUE) {
              await env.HUNT_QUEUE.send(res.value);
            }
            msg.ack();
            break;
          }

          case "HUNT_CAREERS": {
            const huntMsg = body as unknown as HuntMessage;
            const res = await orchestrator.hunterAgent.process(huntMsg);
            if (res.ok && env.EXTRACT_QUEUE) {
              for (const extMsg of res.value) {
                await env.EXTRACT_QUEUE.send(extMsg);
              }
            }
            msg.ack();
            break;
          }

          case "EXTRACT_JOBS": {
            const extMsg = body as unknown as ExtractMessage;
            const res = await orchestrator.extractorAgent.process(extMsg);
            if (res.ok) {
              msg.ack();
            } else {
              msg.retry();
            }
            break;
          }

          default:
            console.warn(`[QueueHandler] Unrecognized message type: ${msgType}`);
            msg.ack();
        }
      } catch (err) {
        console.error(`[QueueHandler] Message processing failed:`, err);
        if (env.DLQ) {
          await env.DLQ.send({
            failedQueue: batch.queue,
            message: msg.body,
            error: String(err),
            timestamp: Date.now(),
          });
        }
        msg.ack();
      }
    }
  },

  /**
   * Cloudflare Cron Trigger Handler: Runs daily at 02:00 UTC (0 2 * * *)
   * Automatically sweeps active companies and new rotating candidate seeds.
   */
  async scheduled(_event: unknown, env: Env, ctx: ExecutionContext): Promise<void> {
    const companyRepo = new CompanyRepository(env.DB);
    const taskRepo = new CrawlTaskRepository(env.DB);
    const logRepo = new LogRepository(env.DB);
    const jobRepo = new JobRepository(env.DB);
    const subscriptionRepo = new UserSubscriptionRepository(env.DB);
    const settingsRepo = new SystemSettingsRepository(env.DB);
    const orchestrator = new PipelineOrchestrator(env.DB);

    ctx.waitUntil(
      (async () => {
        const count = await companyRepo.count();
        const cronPattern = typeof _event === "object" && _event !== null && "cron" in _event ? String((_event as any).cron) : "";
        const isWeeklyMonday = cronPattern === "0 3 * * 1" || new Date().getUTCDay() === 1;

        // 1. Weekly Full Sweep (Triggered every Monday at 03:00 UTC)
        if (isWeeklyMonday) {
          console.log(`[WeeklyCronTrigger] Starting full weekly re-crawl across all ${count} tracked companies.`);
          const allCompanies = await companyRepo.list(500);

          for (const comp of allCompanies) {
            const taskId = `task_weekly_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
            await taskRepo.create({
              id: taskId,
              targetUrl: comp.websiteUrl,
              sourceType: "weekly_scheduled",
              status: "pending",
              companyId: comp.id,
              jobsFound: 0,
              metadata: { companyName: comp.name, domain: comp.domain },
              createdAt: Date.now(),
            });

            if (env.DISCOVERY_QUEUE) {
              await env.DISCOVERY_QUEUE.send({
                type: "DISCOVER_SEED",
                traceId: taskId,
                source: "seed_list",
                sourceUrl: comp.websiteUrl,
                timestamp: Date.now(),
                retryCount: 0,
              });
            } else {
              await orchestrator.processSeedAsync(comp.websiteUrl, "weekly_scheduled", taskId).catch((err) => {
                console.error(`[WeeklyCron] Failed for ${comp.websiteUrl}:`, err);
              });
            }
          }

          await logRepo.log({
            id: `log_weekly_cron_${Date.now()}`,
            agentName: "weekly_cron_scheduler",
            targetUrl: "cron://weekly-sweep",
            status: "success",
            durationMs: 0,
            message: `Weekly scheduled sweep successfully re-crawled all ${allCompanies.length} tracked companies.`,
            metadata: { totalTracked: allCompanies.length },
            createdAt: Date.now(),
          });
        }

        // 2. Daily Rotating Sweep & Public Source Ingestion
        console.log(`[DailyCronTrigger] Starting daily sweep. Currently tracking ${count} micro-companies.`);

        // Pick a daily rotating batch of 6 seeds from CURATED_SEEDS based on current day of month
        const dayOfMonth = new Date().getUTCDate();
        const batchSize = 6;
        const startIndex = (dayOfMonth * batchSize) % CURATED_SEEDS.length;
        const dailySeeds = CURATED_SEEDS.slice(startIndex, startIndex + batchSize);

        for (const seed of dailySeeds) {
          const taskId = `task_daily_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
          await taskRepo.create({
            id: taskId,
            targetUrl: seed.url,
            sourceType: "daily_scheduled",
            status: "pending",
            jobsFound: 0,
            metadata: { name: seed.name, region: seed.region, category: seed.category },
            createdAt: Date.now(),
          });

          if (env.DISCOVERY_QUEUE) {
            await env.DISCOVERY_QUEUE.send({
              type: "DISCOVER_SEED",
              traceId: taskId,
              source: "daily_scheduled",
              sourceUrl: seed.url,
              timestamp: Date.now(),
              retryCount: 0,
            });
          } else {
            await orchestrator.processSeedAsync(seed.url, "daily_scheduled", taskId).catch((err) => {
              console.error(`[DailyCronTrigger] Failed for ${seed.url}:`, err);
            });
          }
        }

        // Harvest new companies daily from public sources (HN + GitHub + YC)
        const harvestManager = new PublicSourceManager(env.DB);
        await harvestManager.harvestAndGatherAsync("all", 15, orchestrator).catch((err) => {
          console.error(`[DailyCronTrigger] Public source daily harvest failed:`, err);
        });

        // Cross-Industry US SMB Harvester Sweep (Healthcare, CleanTech, Robotics, FinTech, etc.)
        try {
          const smbHarvester = new SmbHarvester();
          const smbBatchSize = 8;
          const smbStartIndex = (dayOfMonth * smbBatchSize) % SMB_CATALOGUE.length;
          const dailySmbTargets = SMB_CATALOGUE.slice(smbStartIndex, smbStartIndex + smbBatchSize);
          const smbSyncResult = await smbHarvester.syncWithDatabase(env.DB, dailySmbTargets);

          await logRepo.log({
            id: `log_smb_cron_${Date.now()}`,
            agentName: "smb_cron_scheduler",
            targetUrl: "cron://smb-sweep",
            status: "success",
            durationMs: 0,
            message: `Daily SMB sweep gathered ${smbSyncResult.jobsAdded} open positions across ${dailySmbTargets.length} cross-industry businesses.`,
            metadata: { targets: dailySmbTargets.map((t) => t.name), jobsAdded: smbSyncResult.jobsAdded },
            createdAt: Date.now(),
          });
        } catch (smbErr) {
          console.error("[DailyCronTrigger] SMB cross-industry harvest failed:", smbErr);
        }

        // 2b. Daily 1/7th Rolling Cohort Sweep (Weekly Continuous Scan across all companies)
        // Ensures 100% of tracked companies are refreshed every 7 days without CPU spikes
        const dayOfWeek = new Date().getUTCDay(); // 0=Sunday, 1=Monday, ..., 6=Saturday
        try {
          const partitionQuery = `SELECT id, name, domain, website_url FROM companies WHERE (rowid % 7) = ? LIMIT 600`;
          const partitionResult = await env.DB.prepare(partitionQuery).bind(dayOfWeek).all<{ id: string; name: string; domain: string; website_url: string }>();
          const partitionCompanies = partitionResult.results || [];

          for (const comp of partitionCompanies) {
            const taskId = `task_weekly_cohort_${dayOfWeek}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
            if (env.DISCOVERY_QUEUE) {
              await env.DISCOVERY_QUEUE.send({
                type: "DISCOVER_SEED",
                traceId: taskId,
                source: "weekly_rolling_cohort",
                sourceUrl: comp.website_url,
                timestamp: Date.now(),
                retryCount: 0,
              });
            }
          }

          console.log(`[RollingWeeklyTrigger] Dispatched ${partitionCompanies.length} companies for weekly cohort day ${dayOfWeek}/7`);
        } catch (rollingErr) {
          console.error("[RollingWeeklyTrigger] Rolling weekly cohort sweep failed:", rollingErr);
        }

        // 2c. Daily Job Alert Dispatch to Active Telegram Subscribers
        try {
          const effectiveConfig = await getEffectiveConfig(env, settingsRepo);
          const botToken = effectiveConfig.telegramBotToken;
          if (botToken) {
            const activeSubscribers = await subscriptionRepo.listActive("daily");
            let sentCount = 0;
            for (const sub of activeSubscribers) {
              if (!sub.telegramId) continue;

              const region = sub.regions.length > 0 && sub.regions[0] !== "all" ? sub.regions[0] : undefined;
              const targetRole = sub.targetRoles.length > 0 ? sub.targetRoles[0] : undefined;

              const digestJobs = await jobRepo.listPaged({
                page: 1,
                limit: 5,
                region,
                search: targetRole,
                techOnly: true,
              });

              if (digestJobs.items.length === 0) continue;

              const jobItems = digestJobs.items.map((j, idx) => {
                const locText = j.isMidwest ? "📍 *Midwest*" : `🌐 ${j.location || "Remote"}`;
                const comp = j.companyName || "Off-Radar Employer";
                const salary = (j.salaryMin && j.salaryMax) ? ` | 💰 $${Math.round(j.salaryMin / 1000)}k-$${Math.round(j.salaryMax / 1000)}k` : "";
                return [
                  `*${idx + 1}. ${j.title}*`,
                  `🏢 *${comp}* | ${locText}${salary}`,
                  `🔗 [Ứng tuyển trực tiếp trên ATS](${j.applyTarget})`,
                ].join("\n");
              }).join("\n\n");

              const targetDisplay = [targetRole || "All Roles", (region || "All Regions").toUpperCase()].join(" / ");
              const digestMsg = [
                `🌅 *OFFRADARJOB - BẢN TIN VIỆC LÀM HÀNG NGÀY*`,
                `Kính gửi bạn, đây là top ${digestJobs.items.length} việc làm mới khớp nguyện vọng (${targetDisplay}):`,
                ``,
                jobItems,
                ``,
                `🌐 *Xem đầy đủ cơ hội & Tối ưu CV:*`,
                `https://off-radar-jobs.tuannx87.workers.dev`,
                ``,
                `⚙️ Đổi tuỳ chọn: \`/subscribe <role>\` | Dừng nhận tin: \`/unsubscribe\``,
              ].join("\n");

              await sendTelegramMessage(botToken, sub.telegramId, digestMsg);
              await subscriptionRepo.updateLastNotified(sub.id, Date.now());
              sentCount++;
              // Sleep 100ms between telegram dispatches to respect Telegram rate limits
              await new Promise((r) => setTimeout(r, 100));
            }

            if (sentCount > 0) {
              console.log(`[DailyCronTrigger] Successfully dispatched job digest to ${sentCount} subscribers.`);
            }
          }
        } catch (notifyErr) {
          console.error("[DailyCronTrigger] Daily subscriber notification dispatch failed:", notifyErr);
        }

        await logRepo.log({
          id: `log_daily_cron_${Date.now()}`,
          agentName: "daily_cron_scheduler",
          targetUrl: "cron://daily-sweep",
          status: "success",
          durationMs: 0,
          message: `Daily scheduled sweep successfully initiated ${dailySeeds.length} candidate scans, public sources, and weekly cohort day ${dayOfWeek}/7. Tracking ${count} companies.`,
          metadata: { dayOfMonth, dayOfWeek, seeds: dailySeeds.map((s) => s.name) },
          createdAt: Date.now(),
        });
      })()
    );
  },
};
