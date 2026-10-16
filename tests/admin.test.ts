import { describe, it, expect, beforeEach } from "vitest";
import { InMemoryD1Database } from "../src/db/in-memory-db.js";
import {
  CrawlTaskRepository,
  JobRepository,
  CompanyRepository,
  LogRepository,
} from "../src/db/repositories.js";
import { PipelineOrchestrator } from "../src/orchestrator/dispatcher.js";
import { MOCK_FIXTURES } from "../src/demo/mock-seed.js";
import { renderAdminDashboardHtml } from "../src/ui/admin-dashboard.js";
import { renderDashboardHtml } from "../src/ui/dashboard.js";
import vm from "vm";
import worker from "../src/index.js";

// Test-only admin secret (never a real token).
const TEST_ADMIN_TOKEN = "test-admin-secret-0123456789abcdef";

describe("Admin Control Center Suite", () => {
  let db: InMemoryD1Database;
  let taskRepo: CrawlTaskRepository;
  let jobRepo: JobRepository;
  let companyRepo: CompanyRepository;
  let logRepo: LogRepository;

  beforeEach(() => {
    db = new InMemoryD1Database();
    taskRepo = new CrawlTaskRepository(db);
    jobRepo = new JobRepository(db);
    companyRepo = new CompanyRepository(db);
    logRepo = new LogRepository(db);

    globalThis.fetch = async (input: RequestInfo | URL): Promise<Response> => {
      const urlStr = typeof input === "string" ? input : input.toString();

      for (const fix of MOCK_FIXTURES) {
        if (urlStr === fix.url || urlStr === `${fix.url}/`) {
          return new Response(fix.homepageHtml, {
            status: 200,
            headers: { "Content-Type": "text/html" },
          });
        }
        if (fix.careerPages[urlStr]) {
          return new Response(fix.careerPages[urlStr]!, {
            status: 200,
            headers: { "Content-Type": "text/html" },
          });
        }
      }
      return new Response("Not found", { status: 404 });
    };
  });

  describe("CrawlTaskRepository", () => {
    it("should create, list, and update crawl tasks", async () => {
      const now = Date.now();
      await taskRepo.create({
        id: "task_test_1",
        targetUrl: "https://midweststudio.io",
        sourceType: "midwest_preset",
        status: "pending",
        jobsFound: 0,
        metadata: { region: "midwest" },
        createdAt: now,
      });

      const tasks = await taskRepo.list();
      expect(tasks.length).toBe(1);
      expect(tasks[0]?.id).toBe("task_test_1");
      expect(tasks[0]?.status).toBe("pending");

      // Update to running then completed
      await taskRepo.update("task_test_1", { status: "running" });
      let updated = await taskRepo.getById("task_test_1");
      expect(updated?.status).toBe("running");

      await taskRepo.update("task_test_1", {
        status: "completed",
        jobsFound: 2,
        completedAt: now + 500,
      });
      updated = await taskRepo.getById("task_test_1");
      expect(updated?.status).toBe("completed");
      expect(updated?.jobsFound).toBe(2);

      // Verify stats
      const stats = await taskRepo.getStats();
      expect(stats.total).toBe(1);
      expect(stats.completed).toBe(1);
      expect(stats.jobsFound).toBe(2);
    });
  });

  describe("JobRepository Moderation", () => {
    it("should update job status and delete jobs", async () => {
      const testJob = {
        id: "job_mod_1",
        companyId: "comp_1",
        careerPageId: "page_1",
        title: "Senior Rust Engineer",
        seniorityLevel: "senior" as const,
        techCategory: "backend_systems" as const,
        isTechRole: true,
        employmentType: "full-time" as const,
        isRemote: true,
        remoteScope: "us_midwest",
        skills: ["Rust", "Distributed Systems"],
        applyType: "email" as const,
        applyTarget: "founders@midweststudio.io",
        status: "open" as const,
        contentHash: "hash_mod_1",
        firstSeenAt: Date.now(),
        lastSeenAt: Date.now(),
      };

      await jobRepo.upsert(testJob);
      let job = await jobRepo.getById("job_mod_1");
      expect(job).not.toBeNull();
      expect(job?.status).toBe("open");

      // Toggle status to closed
      await jobRepo.updateStatus("job_mod_1", "closed");
      job = await jobRepo.getById("job_mod_1");
      expect(job?.status).toBe("closed");

      // Delete job
      await jobRepo.delete("job_mod_1");
      job = await jobRepo.getById("job_mod_1");
      expect(job).toBeNull();
    });

    it("should filter jobs by new_grad grade", async () => {
      await jobRepo.upsert({
        id: "job_ng_test",
        companyId: "comp_1",
        careerPageId: "page_1",
        title: "New Grad Software Engineer (2025)",
        seniorityLevel: "new_grad",
        techCategory: "fullstack",
        isTechRole: true,
        employmentType: "full-time",
        isRemote: true,
        remoteScope: "us_midwest",
        skills: ["TypeScript", "React"],
        applyType: "email",
        applyTarget: "careers@test.com",
        status: "open",
        contentHash: "hash_ng_1",
        firstSeenAt: Date.now(),
        lastSeenAt: Date.now(),
      });

      const newGradJobs = await jobRepo.list({ grade: "new_grad" });
      expect(newGradJobs.length).toBe(1);
      expect(newGradJobs[0]?.seniorityLevel).toBe("new_grad");
    });
  });

  describe("PipelineOrchestrator Task Tracking", () => {
    it("should automatically track crawl task lifecycle in D1", async () => {
      const orchestrator = new PipelineOrchestrator(db);
      const res = await orchestrator.processSeedAsync(
        "https://tinysaas.dev",
        "manual_test"
      );

      expect(res.taskId).toBeDefined();
      expect(res.companies.length).toBeGreaterThan(0);

      const task = await taskRepo.getById(res.taskId);
      expect(task).not.toBeNull();
      expect(task?.status).toBe("completed");
      expect(task?.jobsFound).toBeGreaterThan(0);
      expect(task?.completedAt).toBeDefined();
    });
  });

  describe("Worker Admin Endpoints & Security", () => {
    const mockCtx = {
      waitUntil: (p: Promise<unknown>) => p,
      passThroughOnException: () => {},
    } as any;

    it("should deny unauthorized access to /api/admin/* without token", async () => {
      const req = new Request("http://localhost/api/admin/tasks");
      const res = await worker.fetch(req, { DB: db, ADMIN_TOKEN: TEST_ADMIN_TOKEN } as any, mockCtx);
      expect(res.status).toBe(401);
    });

    it("should allow authorized access to /api/admin/stats with header token", async () => {
      const req = new Request("http://localhost/api/admin/stats", { headers: { "x-admin-token": TEST_ADMIN_TOKEN } });
      const res = await worker.fetch(req, { DB: db, ADMIN_TOKEN: TEST_ADMIN_TOKEN } as any, mockCtx);
      expect(res.status).toBe(200);
      const data = await res.json() as any;
      expect(data.tasks).toBeDefined();
      expect(data.companiesCount).toBeDefined();
    });

    it("should render admin UI on /admin", async () => {
      const req = new Request("http://localhost/admin", { headers: { "x-admin-token": TEST_ADMIN_TOKEN } });
      const res = await worker.fetch(req, { DB: db, ADMIN_TOKEN: TEST_ADMIN_TOKEN } as any, mockCtx);
      expect(res.status).toBe(200);
      const html = await res.text();
      expect(html).toContain("OffRadarJob Control Center");
      expect(html).toContain("Crawl Tasks Monitor");
      expect(html).toContain("Job Moderation");
    });

    it("should dispatch a crawl task via POST /api/admin/tasks/create", async () => {
      const req = new Request("http://localhost/api/admin/tasks/create", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-token": TEST_ADMIN_TOKEN },
        body: JSON.stringify({ url: "https://boutiquestudio.design", source: "admin_test" }),
      });

      const res = await worker.fetch(req, { DB: db, ADMIN_TOKEN: TEST_ADMIN_TOKEN } as any, mockCtx);
      expect(res.status).toBe(200);
      const body = await res.json() as any;
      expect(body.success).toBe(true);
      expect(body.taskId).toBeDefined();

      const createdTask = await taskRepo.getById(body.taskId);
      expect(createdTask).not.toBeNull();
      expect(createdTask?.targetUrl).toBe("https://boutiquestudio.design");
    });

    it("should dispatch public source harvest tasks via POST /api/admin/harvest/hn and /github", async () => {
      // Test HN Harvest endpoint
      const reqHn = new Request("http://localhost/api/admin/harvest/hn", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-token": TEST_ADMIN_TOKEN },
        body: JSON.stringify({ limit: 5 }),
      });
      const resHn = await worker.fetch(reqHn, { DB: db, ADMIN_TOKEN: TEST_ADMIN_TOKEN } as any, mockCtx);
      expect(resHn.status).toBe(200);
      const dataHn = await resHn.json() as any;
      expect(dataHn.success).toBe(true);
      expect(dataHn.source).toBe("hn");
      expect(dataHn.status).toBe("harvest_started");

      // Test GitHub Harvest endpoint
      const reqGh = new Request("http://localhost/api/admin/harvest/github", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-token": TEST_ADMIN_TOKEN },
        body: JSON.stringify({ limit: 5 }),
      });
      const resGh = await worker.fetch(reqGh, { DB: db, ADMIN_TOKEN: TEST_ADMIN_TOKEN } as any, mockCtx);
      expect(resGh.status).toBe(200);
      const dataGh = await resGh.json() as any;
      expect(dataGh.success).toBe(true);
      expect(dataGh.source).toBe("github");
      expect(dataGh.status).toBe("harvest_started");
    });

    it("should return paged jobs with metadata via GET /api/jobs?paged=true", async () => {
      const req = new Request("http://localhost/api/jobs?page=1&limit=2&paged=true");
      const res = await worker.fetch(req, { DB: db, ADMIN_TOKEN: TEST_ADMIN_TOKEN } as any, mockCtx);
      expect(res.status).toBe(200);
      expect(res.headers.get("Cache-Control")).toContain("max-age=60");
      const data = await res.json() as any;
      expect(data.items).toBeDefined();
      expect(Array.isArray(data.items)).toBe(true);
      expect(data.pagination).toBeDefined();
      expect(data.pagination.page).toBe(1);
      expect(data.pagination.limit).toBe(2);
      expect(typeof data.pagination.total).toBe("number");
      expect(typeof data.pagination.totalPages).toBe("number");
    });

    it("should return paged companies via GET /api/companies?paged=true", async () => {
      const req = new Request("http://localhost/api/companies?page=1&limit=5&paged=true");
      const res = await worker.fetch(req, { DB: db, ADMIN_TOKEN: TEST_ADMIN_TOKEN } as any, mockCtx);
      expect(res.status).toBe(200);
      const data = await res.json() as any;
      expect(data.items).toBeDefined();
      expect(data.pagination).toBeDefined();
      expect(data.pagination.page).toBe(1);
    });

    it("should support search filter in listPaged for jobs and companies", async () => {
      const pagedJobs = await jobRepo.listPaged({ search: "Engineer", page: 1, limit: 10 });
      expect(pagedJobs.pagination).toBeDefined();
      expect(Array.isArray(pagedJobs.items)).toBe(true);

      const pagedComps = await companyRepo.listPaged({ search: "tech", page: 1, limit: 10 });
      expect(pagedComps.pagination).toBeDefined();
      expect(Array.isArray(pagedComps.items)).toBe(true);
    });

    it("should compute and return data freshness metrics", async () => {
      const now = Date.now();
      await jobRepo.upsert({
        id: "job_fresh_1",
        companyId: "comp_test_fresh",
        careerPageId: "page_test_fresh",
        title: "Staff Systems Engineer",
        seniorityLevel: "senior",
        techCategory: "backend_systems",
        isTechRole: true,
        employmentType: "full-time",
        location: "Chicago, IL",
        isRemote: true,
        remoteScope: "midwest",
        skills: ["Rust", "Distributed Systems"],
        applyType: "email",
        applyTarget: "jobs@fresh.io",
        status: "open",
        contentHash: "hash_fresh_test_1",
        firstSeenAt: now - 3600000,
        lastSeenAt: now - 1800000,
      });

      const freshness = await jobRepo.getFreshnessMetrics();
      expect(freshness.latestLastSeen).toBeGreaterThan(0);
      expect(freshness.updatedLast24h).toBeGreaterThanOrEqual(1);
      expect(freshness.createdLast24h).toBeGreaterThanOrEqual(1);

      // Verify /api/admin/stats endpoint returns freshness
      const req = new Request("http://localhost/api/admin/stats", {
        headers: { Authorization: `Bearer ${TEST_ADMIN_TOKEN}` },
      });
      const ctx = {
        waitUntil: () => {},
        passThroughOnException: () => {},
      };
      const res = await worker.fetch(
        req,
        {
          DB: db,
          ADMIN_TOKEN: TEST_ADMIN_TOKEN,
        } as any,
        ctx as any
      );
      expect(res.status).toBe(200);
      const data = await res.json() as any;
      expect(data.freshness).toBeDefined();
      expect(data.freshness.cronSchedule).toContain("Daily 02:00 UTC");
      expect(data.freshness.updatedLast24h).toBeGreaterThanOrEqual(1);
    });

    it("should render client-side JavaScript without syntax errors in Admin and Public Dashboards", () => {
      // 1. Admin Dashboard HTML Script Validation
      const adminHtml = renderAdminDashboardHtml();
      const adminScriptMatch = adminHtml.match(/<script>([\s\S]*?)<\/script>/);
      expect(adminScriptMatch).toBeTruthy();
      expect(() => {
        new vm.Script(adminScriptMatch![1]!, { filename: "admin-dashboard.js" });
      }).not.toThrow();

      // 2. Public Dashboard HTML Script Validation
      const publicHtml = renderDashboardHtml();
      const publicScriptMatch = publicHtml.match(/<script>([\s\S]*?)<\/script>/);
      expect(publicScriptMatch).toBeTruthy();
      expect(() => {
        new vm.Script(publicScriptMatch![1]!, { filename: "dashboard.js" });
      }).not.toThrow();

      expect(publicScriptMatch![1]!).toContain("function escapeHtml");
      expect(adminScriptMatch![1]!).toContain("function escapeHtml");
    });
  });
});


