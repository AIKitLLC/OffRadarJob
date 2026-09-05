import { renderDashboardHtml } from "./ui/dashboard.js";
import { renderAdminDashboardHtml } from "./ui/admin-dashboard.js";
import { ID1Database } from "./db/types.js";
import {
  CompanyRepository,
  CareerPageRepository,
  JobRepository,
  LogRepository,
  CrawlTaskRepository,
} from "./db/repositories.js";
import { PipelineOrchestrator } from "./orchestrator/dispatcher.js";
import {
  DiscoveryMessage,
  ProfileMessage,
  HuntMessage,
  ExtractMessage,
} from "./types/queues.js";
import { CrawlTaskStatus } from "./types/domain.js";
import { CURATED_SEEDS } from "./seeds/seed-catalogue.js";
import { PublicSourceManager } from "./harvesters/public-source-harvester.js";

export interface Env {
  DB: ID1Database;
  CACHE?: unknown;
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

    // 3. API: List Gathered Jobs
    if (path === "/api/jobs" && request.method === "GET") {
      const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "50", 10), 100);
      const grade = url.searchParams.get("grade") ?? undefined;
      const techCategory = url.searchParams.get("tech_category") ?? undefined;
      const techOnlyParam = url.searchParams.get("tech_only");
      const techOnly = techOnlyParam === "false" ? false : true;

      const jobs = await jobRepo.list({ limit, grade, techCategory, techOnly });
      return Response.json(jobs);
    }

    // 4. API: List Micro-Companies
    if (path === "/api/companies" && request.method === "GET") {
      const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "50", 10), 100);
      const companies = await companyRepo.list(limit);
      return Response.json(companies);
    }

    // 5. API: Stats & Telemetry Logs
    if (path === "/api/stats" && request.method === "GET") {
      const [companiesCount, jobsCount, recentLogs] = await Promise.all([
        companyRepo.count(),
        jobRepo.count(),
        logRepo.getRecent(30),
      ]);
      return Response.json({
        companiesCount,
        jobsCount,
        logsCount: recentLogs.length,
        recentLogs,
      });
    }

    // 6. Admin API: Stats & Task Metrics
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
