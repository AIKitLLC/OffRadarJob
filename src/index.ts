import { renderDashboardHtml } from "./ui/dashboard.js";
import { renderAdminDashboardHtml } from "./ui/admin-dashboard.js";
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
} from "./db/repositories.js";
import { McpServerHandler } from "./mcp/mcp-server.js";
import { PipelineOrchestrator } from "./orchestrator/dispatcher.js";
import {
  DiscoveryMessage,
  ProfileMessage,
  HuntMessage,
  ExtractMessage,
} from "./types/queues.js";
import { CrawlTaskStatus, User, CvVersion } from "./types/domain.js";
import { CURATED_SEEDS } from "./seeds/seed-catalogue.js";
import { PublicSourceManager } from "./harvesters/public-source-harvester.js";
import { NewGradHarvester } from "./harvesters/newgrad-harvester.js";

export interface KvNamespace {
  get(key: string, type?: "text" | "json"): Promise<any>;
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
  delete(key: string): Promise<void>;
}

export interface Env {
  DB: ID1Database;
  CACHE?: KvNamespace;
  ADMIN_TOKEN?: string;
  TELEGRAM_BOT_TOKEN?: string;
  TELEGRAM_BOT_USERNAME?: string;
  TELEGRAM_ADMIN_USERNAMES?: string;
  TELEGRAM_ADMIN_IDS?: string;
  TELEGRAM_ADMIN_CHAT_ID?: string;
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

export const DEFAULT_ADMIN_TOKEN = "offradar-admin-2026";

export function isAuthorized(request: Request, url: URL, env?: Env): boolean {
  const tokenHeader = request.headers.get("x-admin-token") || request.headers.get("Authorization")?.replace("Bearer ", "");
  const tokenQuery = url.searchParams.get("token");
  const cookieHeader = request.headers.get("Cookie") || "";
  const matchCookie = cookieHeader.match(/admin_token=([^;]+)/);
  const tokenCookie = matchCookie ? matchCookie[1] : null;

  const validToken = env?.ADMIN_TOKEN || DEFAULT_ADMIN_TOKEN;
  const provided = tokenHeader || tokenQuery || tokenCookie;
  return provided === validToken;
}

export function isTelegramAdmin(
  env: Env,
  from: { id: number | string; username?: string },
  userRole?: string
): boolean {
  if (userRole === "admin") return true;

  const adminIds = (env.TELEGRAM_ADMIN_IDS || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  if (adminIds.includes(String(from.id).toLowerCase())) return true;

  if (from.username) {
    const rawUsername = from.username.replace(/^@/, "").toLowerCase().trim();
    const adminUsernames = (env.TELEGRAM_ADMIN_USERNAMES || "tuannx87")
      .split(",")
      .map((s) => s.replace(/^@/, "").toLowerCase().trim())
      .filter(Boolean);
    if (adminUsernames.includes(rawUsername)) return true;
  }

  return false;
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

export async function notifyTelegramAdmin(env: Env, text: string): Promise<void> {
  if (!env.TELEGRAM_BOT_TOKEN) return;
  const adminChatIds = [
    env.TELEGRAM_ADMIN_CHAT_ID,
    ...(env.TELEGRAM_ADMIN_IDS ? env.TELEGRAM_ADMIN_IDS.split(",") : []),
  ].filter(Boolean);

  for (const chatId of adminChatIds) {
    if (chatId) {
      await sendTelegramMessage(env.TELEGRAM_BOT_TOKEN, chatId.trim(), text);
    }
  }
}

async function verifyTelegramAuth(data: Record<string, string>, botToken: string): Promise<boolean> {
  const checkHash = data["hash"];
  if (!checkHash) return false;

  const dataCheckArr: string[] = [];
  for (const key of Object.keys(data).sort()) {
    if (key !== "hash" && data[key] !== undefined && data[key] !== null) {
      dataCheckArr.push(`${key}=${data[key]}`);
    }
  }
  const dataCheckString = dataCheckArr.join("\n");

  const enc = new TextEncoder();
  const secretKeyHash = await crypto.subtle.digest("SHA-256", enc.encode(botToken));

  const hmacKey = await crypto.subtle.importKey(
    "raw",
    secretKeyHash,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", hmacKey, enc.encode(dataCheckString));
  const hex = Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return hex === checkHash;
}

async function getAuthenticatedUser(request: Request, userRepo: UserRepository): Promise<User | null> {
  const authHeader = request.headers.get("Authorization") || request.headers.get("x-api-token");
  let token = authHeader ? authHeader.replace("Bearer ", "").trim() : null;

  if (!token) {
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
    const mcpHandler = new McpServerHandler(jobRepo, companyRepo, cvRepo);

    // 1. Public Dashboard UI
    if (path === "/" || path === "/index.html") {
      return new Response(renderDashboardHtml(), {
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }

    // 2. Admin Control Center UI
    if (path === "/admin" || path === "/admin/") {
      return new Response(renderAdminDashboardHtml(), {
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Set-Cookie": `admin_token=${DEFAULT_ADMIN_TOKEN}; Path=/; HttpOnly; SameSite=Lax`,
        },
      });
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
      const search = url.searchParams.get("search") ?? url.searchParams.get("q") ?? undefined;
      const techOnlyParam = url.searchParams.get("tech_only");
      const techOnly = techOnlyParam === "false" ? false : true;

      const cacheKey = `api:jobs:v5:p${page}:l${limit}:g${grade || "all"}:tc${techCategory || "all"}:r${region || "all"}:s${search || ""}:to${techOnly ? 1 : 0}:paged${paged ? 1 : 0}`;

      const data = await getOrSetKvCache(env, cacheKey, 120, async () => {
        if (paged) {
          return await jobRepo.listPaged({
            page,
            limit,
            grade,
            techCategory,
            region,
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

    // 4. API: List Micro-Companies (Supports Paging & KV Caching)
    if (path === "/api/companies" && request.method === "GET") {
      const pageParam = url.searchParams.get("page");
      const paged = pageParam !== null || url.searchParams.get("paged") === "true";
      const page = pageParam ? Math.max(1, parseInt(pageParam, 10)) : 1;
      const limit = Math.min(parseInt(url.searchParams.get("limit") ?? (paged ? "30" : "50"), 10), 100);
      const search = url.searchParams.get("search") ?? url.searchParams.get("q") ?? undefined;
      const region = url.searchParams.get("region") ?? undefined;

      const cacheKey = `api:companies:v6:p${page}:l${limit}:r${region || "all"}:s${search || ""}:paged${paged ? 1 : 0}`;

      const data = await getOrSetKvCache(env, cacheKey, 300, async () => {
        if (paged) {
          return await companyRepo.listPaged({ page, limit, search, region });
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
      const data = await getOrSetKvCache(env, "api:stats:v6", 60, async () => {
        const [companiesCount, jobsCount, jobSummary, recentLogs] = await Promise.all([
          companyRepo.count(),
          jobRepo.count(),
          jobRepo.getStatsSummary(),
          logRepo.getRecent(30),
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

    // 6a. Telegram Bot Auth: Create or Poll Auth Session
    if (path === "/api/auth/telegram/session" && request.method === "GET") {
      const token = url.searchParams.get("token");
      const botUsername = env.TELEGRAM_BOT_USERNAME || "OffRadarJobBot";

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
        const isAdmin = isTelegramAdmin(env, from, existingUser?.role);

        // A. /start command (with or without login_<token>)
        if (text.startsWith("/start")) {
          const payload = text.replace(/^\/start\s*/i, "").trim().replace(/^login_/i, "");

          const now = Date.now();
          const apiToken = existingUser?.apiToken || `orp_${crypto.randomUUID().replace(/-/g, "")}`;
          const role = isAdmin ? "admin" : (existingUser?.role || "user");

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
          if (env.TELEGRAM_BOT_TOKEN && chatId) {
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

            await sendTelegramMessage(env.TELEGRAM_BOT_TOKEN, chatId, welcomeLines.join("\n"));
          }

          return Response.json({ ok: true, authenticated: true, isAdmin });
        }

        // B. /admin auth <token> - Authorize and promote user to admin
        if (text.startsWith("/admin auth") && chatId) {
          const providedToken = text.replace(/^\/admin\s+auth\s*/i, "").trim();
          const validToken = env.ADMIN_TOKEN || DEFAULT_ADMIN_TOKEN;
          if (providedToken === validToken) {
            const now = Date.now();
            const apiToken = existingUser?.apiToken || `orp_${crypto.randomUUID().replace(/-/g, "")}`;
            const userRecord: User = {
              id: existingUser?.id || `usr_${tgId}`,
              telegramId: tgId,
              username: from.username ? String(from.username) : undefined,
              firstName: String(from.first_name || from.username || "Telegram User"),
              apiToken,
              role: "admin",
              createdAt: existingUser?.createdAt || now,
              updatedAt: now,
            };
            await userRepo.upsert(userRecord);
            await userRepo.setRole(tgId, "admin");

            if (env.TELEGRAM_BOT_TOKEN) {
              await sendTelegramMessage(
                env.TELEGRAM_BOT_TOKEN,
                chatId,
                `✅ *Xác thực Admin thành công!*\n` +
                `Chào mừng Quản trị viên *${from.first_name || "Admin"}* (@${from.username || tgId}).\n` +
                `Tài khoản của bạn đã được cấp quyền Quản trị viên vĩnh viễn trên D1.\n\n` +
                `👉 Gõ \`/admin\` để bắt đầu điều khiển hệ thống.`
              );
            }
            return Response.json({ ok: true, adminGranted: true });
          } else {
            if (env.TELEGRAM_BOT_TOKEN) {
              await sendTelegramMessage(
                env.TELEGRAM_BOT_TOKEN,
                chatId,
                `❌ *Xác thực thất bại!*\nAdmin Token không chính xác. Vui lòng kiểm tra lại.`
              );
            }
            return Response.json({ ok: false, error: "Invalid admin token" });
          }
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
                `• \`/mcp\` - Lấy MCP Endpoint & Personal API Token`,
                `• \`/stats\` - Xem thống kê nhanh số lượng jobs & companies`,
                `• Quản trị viên: Gõ \`/admin auth <admin_token>\` để kích hoạt quyền quản trị.`,
              ].join("\n");
              if (env.TELEGRAM_BOT_TOKEN) await sendTelegramMessage(env.TELEGRAM_BOT_TOKEN, chatId, helpText);
              return Response.json({ ok: true });
            } else {
              const deniedText = [
                `⛔ *Quyền truy cập bị từ chối*`,
                `Tài khoản Telegram của bạn (@${from.username || tgId}) chưa được cấp quyền Admin.`,
                ``,
                `🔑 *Nếu bạn là chủ sở hữu hệ thống:*`,
                `Hãy dùng lệnh: \`/admin auth <admin_token>\` để xác thực quyền quản trị.`,
              ].join("\n");
              if (env.TELEGRAM_BOT_TOKEN) await sendTelegramMessage(env.TELEGRAM_BOT_TOKEN, chatId, deniedText);
              return Response.json({ ok: true });
            }
          }

          const menuText = [
            `🛡️ *OFFRADAR JOB - BẢNG ĐIỀU KHIỂN QUẢN TRỊ VIÊN*`,
            `Xin chào Admin *${from.first_name || "Admin"}* (@${from.username || tgId})!`,
            ``,
            `📋 *Các lệnh quản trị trực tiếp trên Telegram:*`,
            `🎓 \`/newgrad [midwest|remote]\` - Tra cứu các vị trí New Grad / Entry-level`,
            `📊 \`/stats\` - Báo cáo realtime (Jobs, Companies, Tỷ lệ Midwest & các vùng US)`,
            `🕷️ \`/crawl <url>\` - Kích hoạt crawl ngay 1 career page URL`,
            `⚡ \`/sweep\` - Quét đồng loạt danh sách seed companies`,
            `🌾 \`/harvest [hn|github|newgrad|all]\` - Thu thập jobs từ HackerNews, GitHub, hoặc New Grad 2025/2026`,
            `👥 \`/users\` - Thống kê users & danh sách tài khoản MCP`,
            `🔗 \`/adminlink\` - Lấy link 1-click vào thẳng Web Admin Control Center`,
            `🔔 \`/testalert\` - Kiểm tra hệ thống gửi thông báo khẩn cấp`,
            `❓ \`/admin help\` - Xem lại menu này`,
          ].join("\n");

          if (env.TELEGRAM_BOT_TOKEN) await sendTelegramMessage(env.TELEGRAM_BOT_TOKEN, chatId, menuText);
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
            ].join("\n");
            if (env.TELEGRAM_BOT_TOKEN) await sendTelegramMessage(env.TELEGRAM_BOT_TOKEN, chatId, noJobsMsg);
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
          ].join("\n");

          if (env.TELEGRAM_BOT_TOKEN) await sendTelegramMessage(env.TELEGRAM_BOT_TOKEN, chatId, responseText);
          return Response.json({ ok: true, count: newGradJobs.length });
        }

        // D. /stats - Telemetry and region metrics
        if (text === "/stats" && chatId) {
          const [companiesCount, jobsCount, jobSummary, usersCount, adminsCount, recentTasks] = await Promise.all([
            companyRepo.count(),
            jobRepo.count(),
            jobRepo.getStatsSummary(),
            userRepo.count(),
            userRepo.count("admin"),
            taskRepo.list({ limit: 3 }),
          ]);

          const midwestPct = jobSummary.total > 0 ? Math.round((jobSummary.midwestCount / jobSummary.total) * 100) : 100;

          const taskSnippets = recentTasks.length > 0
            ? recentTasks.map((t) => `• \`${t.id.slice(-8)}\`: *${t.status.toUpperCase()}* (${t.jobsFound} jobs)`).join("\n")
            : "Chưa có task nào gần đây";

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
            ``,
            `⚙️ *Crawl Tasks gần nhất:*`,
            taskSnippets,
            ``,
            `🌐 *Dashboard:* https://off-radar-jobs.tuannx87.workers.dev`,
          ].join("\n");

          if (env.TELEGRAM_BOT_TOKEN) await sendTelegramMessage(env.TELEGRAM_BOT_TOKEN, chatId, statsText);
          return Response.json({ ok: true });
        }

        // E. /crawl <url> - Admin trigger crawl task
        if (text.startsWith("/crawl") && chatId) {
          if (!isAdmin) {
            if (env.TELEGRAM_BOT_TOKEN) {
              await sendTelegramMessage(env.TELEGRAM_BOT_TOKEN, chatId, "⛔ Bạn cần có quyền Admin để kích hoạt lệnh /crawl.");
            }
            return Response.json({ ok: false, error: "Unauthorized" });
          }

          let rawUrl = text.replace(/^\/crawl\s*/i, "").trim();
          if (!rawUrl) {
            if (env.TELEGRAM_BOT_TOKEN) {
              await sendTelegramMessage(env.TELEGRAM_BOT_TOKEN, chatId, "⚠️ Vui lòng nhập URL cần crawl:\nVí dụ: `/crawl https://careers.example.com`");
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

          if (env.TELEGRAM_BOT_TOKEN) {
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
            await sendTelegramMessage(env.TELEGRAM_BOT_TOKEN, chatId, replyMsg);
          }

          return Response.json({ ok: true, taskId });
        }

        // F. /sweep - Admin trigger bulk sweep across seeds
        if (text === "/sweep" && chatId) {
          if (!isAdmin) {
            if (env.TELEGRAM_BOT_TOKEN) await sendTelegramMessage(env.TELEGRAM_BOT_TOKEN, chatId, "⛔ Bạn cần quyền Admin để dùng /sweep.");
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

          if (env.TELEGRAM_BOT_TOKEN) {
            await sendTelegramMessage(
              env.TELEGRAM_BOT_TOKEN,
              chatId,
              `⚡ *Đã kích hoạt Sweep ${count} công ty seed đồng loạt!*\nCác tasks đang chạy trong background queue. Kiểm tra tiến độ tại Web Admin.`
            );
          }
          return Response.json({ ok: true, tasksCount: count });
        }

        // G. /harvest [hn|github|all] - Admin trigger public harvest
        if (text.startsWith("/harvest") && chatId) {
          if (!isAdmin) {
            if (env.TELEGRAM_BOT_TOKEN) await sendTelegramMessage(env.TELEGRAM_BOT_TOKEN, chatId, "⛔ Bạn cần quyền Admin để dùng /harvest.");
            return Response.json({ ok: false, error: "Unauthorized" });
          }

          const sub = text.replace(/^\/harvest\s*/i, "").trim().toLowerCase();

          if (sub === "newgrad") {
            if (env.TELEGRAM_BOT_TOKEN) {
              await sendTelegramMessage(
                env.TELEGRAM_BOT_TOKEN,
                chatId,
                `🎓 *Đang thu thập và nạp hơn 400+ vị trí New Grad từ SimplifyJobs & Midwest Tech Hubs...*`
              );
            }
            try {
              const newGradHarvester = new NewGradHarvester();
              const result = await newGradHarvester.importNewGradRoles(env.DB);
              if (env.TELEGRAM_BOT_TOKEN) {
                const harvestMsg = [
                  `🎓 *Thu thập việc làm New Grad hoàn tất!*`,
                  ``,
                  `• *Tổng số jobs đã parse:* \`${result.totalParsed}\``,
                  `• *Jobs đã nạp vào D1:* \`${result.importedJobs}\``,
                  `• *Jobs thuộc vùng Midwest:* \`${result.midwestJobs}\``,
                  ``,
                  `👉 Gõ \`/newgrad\` để xem ngay các vị trí mới nhất!`,
                ].join("\n");
                await sendTelegramMessage(env.TELEGRAM_BOT_TOKEN, chatId, harvestMsg);
              }
              return Response.json({ ok: true, result });
            } catch (err: any) {
              if (env.TELEGRAM_BOT_TOKEN) {
                await sendTelegramMessage(env.TELEGRAM_BOT_TOKEN, chatId, `❌ Lỗi khi harvest newgrad: ${err?.message}`);
              }
              return Response.json({ ok: false, error: err?.message });
            }
          }

          const source = (sub === "hn" || sub === "github") ? sub : "all";

          if (env.TELEGRAM_BOT_TOKEN) {
            await sendTelegramMessage(env.TELEGRAM_BOT_TOKEN, chatId, `⏳ *Đang kích hoạt thu thập từ nguồn [${source.toUpperCase()}]...*`);
          }

          try {
            const manager = new PublicSourceManager(env.DB);
            const orchestrator = new PipelineOrchestrator(env.DB);
            const res = await manager.harvestAndGatherAsync(source as any, 15, orchestrator);

            if (env.TELEGRAM_BOT_TOKEN) {
              const totalJobs = res.directJobsCount + res.crawledJobsCount;
              const harvestMsg = [
                `🌾 *Thu thập dữ liệu nguồn mở hoàn tất!*`,
                ``,
                `• *Nguồn:* ${source.toUpperCase()}`,
                `• *Công ty thu thập:* \`${res.companiesHarvested}\``,
                `• *Jobs tìm thấy:* \`${totalJobs}\``,
                `• *Crawl Tasks tạo:* \`${res.taskIds.length}\``,
              ].join("\n");
              await sendTelegramMessage(env.TELEGRAM_BOT_TOKEN, chatId, harvestMsg);
            }
            return Response.json({ ok: true, result: res });
          } catch (err: any) {
            if (env.TELEGRAM_BOT_TOKEN) {
              await sendTelegramMessage(env.TELEGRAM_BOT_TOKEN, chatId, `❌ Lỗi khi harvest: ${err?.message}`);
            }
            return Response.json({ ok: false, error: err?.message });
          }
        }

        // H. /users - Admin list users & MCP connections
        if (text === "/users" && chatId) {
          if (!isAdmin) {
            if (env.TELEGRAM_BOT_TOKEN) await sendTelegramMessage(env.TELEGRAM_BOT_TOKEN, chatId, "⛔ Bạn cần quyền Admin để dùng /users.");
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

          if (env.TELEGRAM_BOT_TOKEN) await sendTelegramMessage(env.TELEGRAM_BOT_TOKEN, chatId, reply);
          return Response.json({ ok: true });
        }

        // I. /adminlink - Admin magic login link generator
        if (text === "/adminlink" && chatId) {
          if (!isAdmin) {
            if (env.TELEGRAM_BOT_TOKEN) await sendTelegramMessage(env.TELEGRAM_BOT_TOKEN, chatId, "⛔ Bạn cần quyền Admin để lấy magic link.");
            return Response.json({ ok: false, error: "Unauthorized" });
          }

          const validToken = env.ADMIN_TOKEN || DEFAULT_ADMIN_TOKEN;
          const magicUrl = `https://off-radar-jobs.tuannx87.workers.dev/admin?token=${validToken}`;

          const msg = [
            `🔑 *Magic Link Đăng Nhập Web Admin Control Center:*`,
            ``,
            `🔗 [Mở Web Admin Dashboard](${magicUrl})`,
            `\`${magicUrl}\``,
            ``,
            `*(Link đã bao gồm token bảo mật, có thể mở trực tiếp không cần mật khẩu)*`,
          ].join("\n");

          if (env.TELEGRAM_BOT_TOKEN) await sendTelegramMessage(env.TELEGRAM_BOT_TOKEN, chatId, msg);
          return Response.json({ ok: true });
        }

        // J. /testalert - Admin test alert notification
        if (text === "/testalert" && chatId) {
          if (!isAdmin) {
            if (env.TELEGRAM_BOT_TOKEN) await sendTelegramMessage(env.TELEGRAM_BOT_TOKEN, chatId, "⛔ Bạn cần quyền Admin.");
            return Response.json({ ok: false, error: "Unauthorized" });
          }

          if (env.TELEGRAM_BOT_TOKEN) {
            await sendTelegramMessage(
              env.TELEGRAM_BOT_TOKEN,
              chatId,
              `🔔 *[TEST ALERT] OffRadarJob System Notification*\n` +
              `Hệ thống thông báo Telegram Bot hoạt động hoàn hảo! Đã kết nối với Admin @${from.username || tgId}.`
            );
          }
          return Response.json({ ok: true });
        }

        // K. /mcp - MCP Token helper
        if (text.startsWith("/mcp") && chatId && env.TELEGRAM_BOT_TOKEN) {
          const user = await userRepo.findByTelegramId(tgId);
          const reply = user
            ? `🔌 *MCP Endpoint:* \`https://off-radar-jobs.tuannx87.workers.dev/mcp\`\n🔑 *Token:* \`${user.apiToken}\``
            : "Vui lòng mở web OffRadarJob và đăng nhập để kích hoạt token.";
          await sendTelegramMessage(env.TELEGRAM_BOT_TOKEN, chatId, reply);
          return Response.json({ ok: true });
        }

        return Response.json({ ok: true });
      } catch (err: any) {
        return Response.json({ ok: false, error: err?.message }, { status: 500 });
      }
    }

    // 6c. Quick Confirm Session (for 1-click testing or local demo without Telegram app)
    if (path === "/api/auth/telegram/confirm-session" && request.method === "POST") {
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

    // 6d. Telegram Webhook Setup Helper
    if (path === "/api/telegram/setup-webhook" && request.method === "GET") {
      if (!env.TELEGRAM_BOT_TOKEN) {
        return Response.json({ error: "TELEGRAM_BOT_TOKEN not configured in Worker environment" }, { status: 400 });
      }
      const webhookUrl = `${url.origin}/api/telegram/webhook`;
      const res = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/setWebhook?url=${encodeURIComponent(webhookUrl)}`);
      const data = await res.json();
      return Response.json({ webhookUrl, result: data });
    }

    // 6e. Legacy Telegram Auth: Login via Telegram WebApp / Widget
    if (path === "/api/auth/telegram" && request.method === "POST") {
      try {
        const body = (await request.json()) as Record<string, any>;
        const tgId = String(body.id || body.telegram_id || (body.username ? `tg_${body.username}` : ""));
        if (!tgId) {
          return Response.json({ error: "Missing Telegram ID or username" }, { status: 400 });
        }

        if (env.TELEGRAM_BOT_TOKEN && body.hash) {
          const isValid = await verifyTelegramAuth(body, env.TELEGRAM_BOT_TOKEN);
          if (!isValid) {
            return Response.json({ error: "Invalid Telegram authentication signature" }, { status: 403 });
          }
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

    if (path.startsWith("/api/user/cvs/") && path !== "/api/user/cvs/tailor") {
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

    // 10. MCP (Model Context Protocol) Endpoints for AI Agents (Cursor, Claude Desktop, Antigravity)
    if (path === "/mcp" && request.method === "POST") {
      const user = await getAuthenticatedUser(request, userRepo);
      if (!user) {
        return Response.json(
          {
            jsonrpc: "2.0",
            id: null,
            error: {
              code: -32000,
              message: "Unauthorized. Please authenticate with Telegram or provide ?token=orp_... in MCP URL.",
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
      const user = await getAuthenticatedUser(request, userRepo);
      if (!user) {
        return new Response("Unauthorized. Please provide ?token=orp_... query parameter for MCP SSE.", { status: 401 });
      }

      const endpointUrl = `/mcp?token=${encodeURIComponent(user.apiToken)}`;
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
      if (!isAuthorized(request, url, env)) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
      }
      const [companiesCount, jobsCount, recentLogs, tasksStats] = await Promise.all([
        companyRepo.count(),
        jobRepo.count(),
        logRepo.getRecent(30),
        taskRepo.getStats(),
      ]);
      return Response.json({
        companiesCount,
        jobsCount,
        logsCount: recentLogs.length,
        recentLogs,
        tasks: tasksStats,
      });
    }

    // 7. Admin API: List Crawl Tasks
    if (path === "/api/admin/tasks" && request.method === "GET") {
      if (!isAuthorized(request, url, env)) {
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
      if (!isAuthorized(request, url, env)) {
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
      if (!isAuthorized(request, url, env)) {
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
      if (!isAuthorized(request, url, env)) {
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
      if (!isAuthorized(request, url, env)) {
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
      if (!isAuthorized(request, url, env)) {
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

    // 12. Admin API: Moderation - Update Job Status
    const jobStatusMatch = path.match(/^\/api\/admin\/jobs\/([^/]+)\/status$/);
    if (jobStatusMatch && request.method === "PATCH") {
      if (!isAuthorized(request, url, env)) {
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
      if (!isAuthorized(request, url, env)) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
      }
      const jobId = jobDeleteMatch[1]!;
      await jobRepo.delete(jobId);
      return Response.json({ success: true, id: jobId, deleted: true });
    }

    // 13. Admin API: Harvest from Hacker News "Who is Hiring"
    if (path === "/api/admin/harvest/hn" && request.method === "POST") {
      if (!isAuthorized(request, url, env)) {
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
      if (!isAuthorized(request, url, env)) {
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
      if (!isAuthorized(request, url, env)) {
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
      if (!isAuthorized(request, url, env)) {
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

    // 15a. Admin API: Telegram Bot Status & Config
    if (path === "/api/admin/telegram/status" && request.method === "GET") {
      if (!isAuthorized(request, url, env)) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
      }
      const [totalUsers, totalAdmins] = await Promise.all([
        userRepo.count(),
        userRepo.count("admin"),
      ]);
      const configuredAdmins = (env.TELEGRAM_ADMIN_USERNAMES || "tuannx87")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const configuredAdminIds = (env.TELEGRAM_ADMIN_IDS || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      return Response.json({
        botUsername: env.TELEGRAM_BOT_USERNAME || "OffRadarJobBot",
        hasBotToken: !!env.TELEGRAM_BOT_TOKEN,
        configuredAdmins,
        configuredAdminIds,
        adminChatId: env.TELEGRAM_ADMIN_CHAT_ID || null,
        totalUsers,
        totalAdmins,
      });
    }

    // 15b. Admin API: List Users & MCP Tokens
    if (path === "/api/admin/users" && request.method === "GET") {
      if (!isAuthorized(request, url, env)) {
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
      if (!isAuthorized(request, url, env)) {
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
      if (!isAuthorized(request, url, env)) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
      }
      if (!env.TELEGRAM_BOT_TOKEN) {
        return Response.json({ error: "TELEGRAM_BOT_TOKEN not configured in Worker environment" }, { status: 400 });
      }
      const body = (await request.json().catch(() => ({}))) as { message?: string; chatId?: string };
      const alertMsg = body.message || "🔔 *[OffRadarJob Alert]* Test notification from Admin Control Center!";
      const targetChatId = body.chatId || env.TELEGRAM_ADMIN_CHAT_ID;

      if (targetChatId) {
        const ok = await sendTelegramMessage(env.TELEGRAM_BOT_TOKEN, targetChatId, alertMsg);
        return Response.json({ success: ok, targetChatId });
      } else {
        await notifyTelegramAdmin(env, alertMsg);
        return Response.json({ success: true, broadcast: true });
      }
    }

    // 16. API: Trigger Ingest / Crawl Seed (Public)
    if (path === "/api/crawl/seed" && request.method === "POST") {
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

        // Harvest new companies daily from public sources (HN + GitHub)
        const harvestManager = new PublicSourceManager(env.DB);
        await harvestManager.harvestAndGatherAsync("all", 5, orchestrator).catch((err) => {
          console.error(`[DailyCronTrigger] Public source daily harvest failed:`, err);
        });

        await logRepo.log({
          id: `log_daily_cron_${Date.now()}`,
          agentName: "daily_cron_scheduler",
          targetUrl: "cron://daily-sweep",
          status: "success",
          durationMs: 0,
          message: `Daily scheduled sweep successfully initiated ${dailySeeds.length} candidate scans and public sources sweep. Tracking ${count} companies.`,
          metadata: { dayOfMonth, seeds: dailySeeds.map((s) => s.name) },
          createdAt: Date.now(),
        });
      })()
    );
  },
};
