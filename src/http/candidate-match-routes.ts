import { ID1Database } from "../db/types.js";
import { LogRepository } from "../db/repositories.js";
import { User } from "../types/domain.js";
import { CandidateMatchService, MatchRequestError } from "../pipeline/candidate-match-service.js";
import { WorkersAiBinding } from "../quality/quality-judge.js";
import { Job } from "../types/domain.js";

export async function handleCandidateMatchRoutes(input: {
  request: Request;
  path: string;
  db: ID1Database;
  ai?: WorkersAiBinding | undefined;
  getUser: () => Promise<User | null>;
  authorizeAdmin: () => Promise<boolean>;
  logRepo: LogRepository;
  listJobs: () => Promise<Job[]>;
}): Promise<Response | null> {
  const { path, request } = input;
  const handled =
    path === "/api/match" ||
    path.startsWith("/api/user/candidate-profiles") ||
    path.startsWith("/api/user/job-filters") ||
    path.startsWith("/api/user/match-alerts") ||
    path === "/api/admin/quality/run";
  if (!handled) return null;

  const service = CandidateMatchService.fromDatabase(input.db, input.ai);
  try {
    if (path === "/api/admin/quality/run" && request.method === "POST") {
      if (!(await input.authorizeAdmin())) return Response.json({ error: "Unauthorized" }, { status: 401 });
      const body = (await request.json().catch(() => ({}))) as { limit?: number; maxAiCalls?: number };
      const jobs = await input.listJobs();
      const report = await service.runPass(jobs, {
        maxAiCalls: Math.max(0, Math.min(5, body.maxAiCalls ?? 5)),
        jobLimit: Math.max(1, Math.min(40, body.limit ?? 20)),
      });
      await input.logRepo.log({
        id: `log_quality_${crypto.randomUUID()}`,
        agentName: "job_quality",
        targetUrl: "admin://quality/run",
        status: "success",
        durationMs: 0,
        message: `Judged ${report.judged} jobs, reused ${report.reused}, created ${report.alertsCreated} match alerts.`,
        metadata: { ...report },
        createdAt: Date.now(),
      });
      return Response.json({ success: true, report });
    }

    const user = await input.getUser();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    if (path === "/api/user/candidate-profiles" && request.method === "GET") {
      return Response.json({ items: await service.listProfiles(user.id) });
    }
    if (path === "/api/user/candidate-profiles" && request.method === "POST") {
      const saved = await service.saveProfile(user.id, await request.json());
      return Response.json({ success: true, profile: saved }, { status: 201 });
    }
    if (path === "/api/user/candidate-profiles" && request.method === "DELETE") {
      const id = new URL(request.url).searchParams.get("id") ?? "";
      await service.deleteProfile(user.id, id);
      return Response.json({ success: true, id });
    }

    if (path === "/api/user/job-filters" && request.method === "GET") {
      return Response.json({ items: await service.listFilters(user.id) });
    }
    if (path === "/api/user/job-filters" && request.method === "POST") {
      const saved = await service.saveFilter(user.id, await request.json());
      return Response.json({ success: true, filter: saved }, { status: 201 });
    }
    if (path === "/api/user/job-filters" && request.method === "DELETE") {
      const id = new URL(request.url).searchParams.get("id") ?? "";
      await service.deleteFilter(user.id, id);
      return Response.json({ success: true, id });
    }

    if (path === "/api/user/match-alerts" && request.method === "GET") {
      return Response.json({ items: await service.listAlerts(user.id) });
    }
    if (path === "/api/user/match-alerts/scan" && request.method === "POST") {
      const jobs = await input.listJobs();
      const report = await service.runPass(jobs, { userId: user.id, maxAiCalls: 0, jobLimit: 40 });
      return Response.json({ success: true, report, alerts: await service.listAlerts(user.id) });
    }

    if (path === "/api/match" && request.method === "POST") {
      const ranked = await service.rank(user.id, await request.json());
      return Response.json({
        profile: ranked.profile,
        matches: ranked.matches.map((entry) => ({
          job: {
            id: entry.job.id,
            title: entry.job.title,
            companyName: entry.job.companyName ?? null,
            location: entry.job.location ?? null,
            isRemote: entry.job.isRemote,
            seniorityLevel: entry.job.seniorityLevel,
            skills: entry.job.skills,
            applyTarget: entry.job.applyTarget,
          },
          score: entry.match.total,
          factors: entry.match.factors,
          reasons: entry.match.reasons,
        })),
      });
    }

    return Response.json({ error: "Method not allowed" }, { status: 405 });
  } catch (error) {
    if (error instanceof MatchRequestError) return Response.json({ error: error.message }, { status: error.status });
    const message = error instanceof Error ? error.message : String(error);
    console.error("[CandidateMatch] request failed:", message);
    return Response.json({ error: "Candidate match request failed" }, { status: 500 });
  }
}
