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

export interface KvNamespace {
  get(key: string, type?: "text" | "json"): Promise<any>;
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
  delete(key: string): Promise<void>;
}

export interface Env {
  DB: ID1Database;
  CACHE?: KvNamespace;
  TELEGRAM_BOT_TOKEN?: string;
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

const DEFAULT_ADMIN_TOKEN = "offradar-admin-2026";

function isAuthorized(request: Request, url: URL): boolean {
  const tokenHeader = request.headers.get("x-admin-token") || request.headers.get("Authorization")?.replace("Bearer ", "");
  const tokenQuery = url.searchParams.get("token");
  const cookieHeader = request.headers.get("Cookie") || "";
  const matchCookie = cookieHeader.match(/admin_token=([^;]+)/);
  const tokenCookie = matchCookie ? matchCookie[1] : null;

  const provided = tokenHeader || tokenQuery || tokenCookie;
  return provided === DEFAULT_ADMIN_TOKEN;
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

      const cacheKey = `api:jobs:v2:p${page}:l${limit}:g${grade || "all"}:tc${techCategory || "all"}:r${region || "all"}:s${search || ""}:to${techOnly ? 1 : 0}:paged${paged ? 1 : 0}`;

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

      const cacheKey = `api:companies:v2:p${page}:l${limit}:s${search || ""}:paged${paged ? 1 : 0}`;

      const data = await getOrSetKvCache(env, cacheKey, 300, async () => {
        if (paged) {
          return await companyRepo.listPaged({ page, limit, search });
        }
        return await companyRepo.list(limit);
      });

      return Response.json(data, {
        headers: {
          "Cache-Control": "public, max-age=120, s-maxage=600, stale-while-revalidate=1200",
        },
      });
    }

    // 5. API: Stats & Telemetry Logs
    if (path === "/api/stats" && request.method === "GET") {
      const data = await getOrSetKvCache(env, "api:stats:v2", 60, async () => {
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

    // 6. Telegram Auth: Login via Telegram WebApp / Widget
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
      if (!isAuthorized(request, url)) {
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
      if (!isAuthorized(request, url)) {
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
      if (!isAuthorized(request, url)) {
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
      if (!isAuthorized(request, url)) {
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
      if (!isAuthorized(request, url)) {
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
      if (!isAuthorized(request, url)) {
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
      if (!isAuthorized(request, url)) {
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
      if (!isAuthorized(request, url)) {
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
      if (!isAuthorized(request, url)) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
      }
      const jobId = jobDeleteMatch[1]!;
      await jobRepo.delete(jobId);
      return Response.json({ success: true, id: jobId, deleted: true });
    }

    // 13. Admin API: Harvest from Hacker News "Who is Hiring"
    if (path === "/api/admin/harvest/hn" && request.method === "POST") {
      if (!isAuthorized(request, url)) {
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
      if (!isAuthorized(request, url)) {
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
      if (!isAuthorized(request, url)) {
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
