import { tgEnv, signTelegramLogin, TG_WEBHOOK_HEADERS, TEST_BOT_TOKEN, TEST_WEBHOOK_SECRET } from "./helpers/telegram.js";
import { describe, it, expect, beforeEach } from "vitest";
import { inferSeniority } from "../src/harvesters/public-source-harvester.js";
import { JobExtractorAgent } from "../src/agents/job-extractor-agent.js";
import { NewGradHarvester } from "../src/harvesters/newgrad-harvester.js";
import { NEW_GRAD_MIDWEST_SEEDS } from "../src/demo/newgrad-seeds.js";
import { InMemoryD1Database } from "../src/db/in-memory-db.js";
import { JobRepository, UserRepository } from "../src/db/repositories.js";
import worker from "../src/index.js";
import { Env } from "../src/index.js";

describe("New Grad & Early Career Expansion Suite", () => {
  describe("1. Seniority Inference & Title Precedence", () => {
    it("should classify diverse new grad and entry-level titles as new_grad", () => {
      expect(inferSeniority("Software Engineer - New Grad 2026")).toBe("new_grad");
      expect(inferSeniority("Associate Software Engineer")).toBe("new_grad");
      expect(inferSeniority("Entry Level Software Engineer")).toBe("new_grad");
      expect(inferSeniority("University Graduate - Software Developer")).toBe("new_grad");
      expect(inferSeniority("College Grad Software Engineer 1")).toBe("new_grad");
      expect(inferSeniority("Software Engineer I")).toBe("new_grad");
      expect(inferSeniority("SWE 1 - Backend Services")).toBe("new_grad");
      expect(inferSeniority("Campus Hire - Full Stack Developer")).toBe("new_grad");
      expect(inferSeniority("Engineering Resident (Class of 2025)")).toBe("new_grad");
      expect(inferSeniority("Rotational Software Engineer")).toBe("new_grad");
    });

    it("should give title precedence over body text mentioning senior in JobExtractorAgent", () => {
      const agent = new JobExtractorAgent({} as any, {} as any);
      const level = (agent as any).detectSeniorityLevel(
        "Software Engineer (New Grad 2026)",
        "You will work alongside Senior Engineers, Staff Architects, and Directors to build distributed systems. Requirements: BS or MS graduating in 2025/2026."
      );
      expect(level).toBe("new_grad");
    });
  });

  describe("2. NewGradHarvester Parsing & Midwest Detection", () => {
    const harvester = new NewGradHarvester();

    it("should correctly identify Midwest US locations", () => {
      expect(harvester.isMidwestLocation(["Arden Hills, MN"])).toBe(true);
      expect(harvester.isMidwestLocation(["Chicago, IL", "San Jose, CA"])).toBe(true);
      expect(harvester.isMidwestLocation(["Lakewood, OH"])).toBe(true);
      expect(harvester.isMidwestLocation(["Madison, WI"])).toBe(true);
      expect(harvester.isMidwestLocation(["Indianapolis, IN"])).toBe(true);
      expect(harvester.isMidwestLocation(["San Francisco, CA"])).toBe(false);
      expect(harvester.isMidwestLocation(["New York, NY", "Austin, TX"])).toBe(false);
      expect(harvester.isMidwestLocation(["Seattle, WA"])).toBe(false);
    });

    it("should parse table rows, skip closed positions, and extract direct ATS URLs", () => {
      const sampleHtml = `
        <table>
          <thead>
            <tr><th>Company</th><th>Role</th><th>Location</th><th>Application</th><th>Age</th></tr>
          </thead>
          <tbody>
            <tr>
              <td><strong><a href="https://simplify.jobs/c/Epic">Epic Systems</a></strong></td>
              <td>Software Developer - New Grad 2026</td>
              <td>Verona, WI</td>
              <td><a href="https://epic.avature.net/careers/job123">Apply</a> <a href="https://simplify.jobs/p/123">Simplify</a></td>
              <td>1d</td>
            </tr>
            <tr>
              <td><strong>🔥 PayPal</strong></td>
              <td>Software Engineer 1</td>
              <td>Chicago, IL</br>San Jose, CA</td>
              <td><a href="https://paypal.eightfold.ai/careers/job456">Apply</a></td>
              <td>2d</td>
            </tr>
            <tr>
              <td><strong>🔒 ClosedCorp</strong></td>
              <td>Closed SWE Role</td>
              <td>Remote</td>
              <td><a href="https://example.com/closed">Apply</a></td>
              <td>10d</td>
            </tr>
          </tbody>
        </table>
      `;

      const rows = harvester.parseTableRows(sampleHtml);
      expect(rows.length).toBe(2);

      const epic = rows.find((r) => r.companyName.includes("Epic"));
      expect(epic).toBeDefined();
      expect(epic?.roleTitle).toBe("Software Developer - New Grad 2026");
      expect(epic?.locations).toContain("Verona, WI");
      expect(epic?.applyUrl).toBe("https://epic.avature.net/careers/job123");

      const paypal = rows.find((r) => r.companyName.includes("PayPal"));
      expect(paypal).toBeDefined();
      expect(paypal?.locations.length).toBe(2);
      expect(paypal?.locations).toContain("Chicago, IL");
      expect(paypal?.applyUrl).toBe("https://paypal.eightfold.ai/careers/job456");
    });
  });

  describe("3. Database Ingestion & Midwest Priority Listing", () => {
    let db: InMemoryD1Database;
    let jobRepo: JobRepository;

    beforeEach(async () => {
      db = new InMemoryD1Database();
      jobRepo = new JobRepository(db);

      const harvester = new NewGradHarvester();
      // Import curated Midwest seeds
      await harvester.importNewGradRoles(db, 10);
    });

    it("should have seeded Midwest flagship new grad programs", async () => {
      const newGradJobs = await jobRepo.list({ grade: "new_grad", limit: 20 });
      expect(newGradJobs.length).toBeGreaterThanOrEqual(NEW_GRAD_MIDWEST_SEEDS.length);

      const epicJob = newGradJobs.find((j) => j.companyName === "Epic Systems");
      expect(epicJob).toBeDefined();
      expect(epicJob?.seniorityLevel).toBe("new_grad");
      expect(epicJob?.isMidwest).toBe(true);
      expect(epicJob?.location).toContain("Verona, WI");

      const morningstarJob = newGradJobs.find((j) => j.companyName === "Morningstar");
      expect(morningstarJob).toBeDefined();
      expect(morningstarJob?.isMidwest).toBe(true);
    });

    it("should prioritize Midwest positions in new_grad listing", async () => {
      const jobs = await jobRepo.list({ grade: "new_grad", limit: 5 });
      expect(jobs.length).toBeGreaterThan(0);
      // All top returned items should be Midwest priority
      expect(jobs[0]?.isMidwest).toBe(true);
    });
  });

  describe("4. Telegram Webhook: /newgrad and /harvest newgrad", () => {
    let db: InMemoryD1Database;
    let env: Env;

    beforeEach(async () => {
      db = new InMemoryD1Database();
      env = {
        DB: db,
        ADMIN_TOKEN: "test-admin-secret",
        TELEGRAM_BOT_TOKEN: "test-bot-token",
        TELEGRAM_ADMIN_IDS: "999",
        TELEGRAM_WEBHOOK_SECRET: TEST_WEBHOOK_SECRET,
      };

      const harvester = new NewGradHarvester();
      await harvester.importNewGradRoles(db, 10);
    });

    it("should respond to /newgrad with top new grad opportunities", async () => {
      const req = new Request("http://localhost/api/telegram/webhook", {
        method: "POST",
        headers: TG_WEBHOOK_HEADERS,
        body: JSON.stringify({
          message: {
            from: { id: 112233, first_name: "FreshGrad", username: "fresh_dev" },
            chat: { id: 112233 },
            text: "/newgrad",
          },
        }),
      });

      const res = await worker.fetch(req, env, {} as any);
      expect(res.status).toBe(200);
      const data = (await res.json()) as { ok: boolean; count: number };
      expect(data.ok).toBe(true);
      expect(data.count).toBeGreaterThan(0);
    });

    it("should filter by /newgrad midwest", async () => {
      const req = new Request("http://localhost/api/telegram/webhook", {
        method: "POST",
        headers: TG_WEBHOOK_HEADERS,
        body: JSON.stringify({
          message: {
            from: { id: 112233, first_name: "FreshGrad", username: "fresh_dev" },
            chat: { id: 112233 },
            text: "/newgrad midwest",
          },
        }),
      });

      const res = await worker.fetch(req, env, {} as any);
      expect(res.status).toBe(200);
      const data = (await res.json()) as { ok: boolean; count: number };
      expect(data.ok).toBe(true);
      expect(data.count).toBeGreaterThan(0);
    });

    it("should allow admin to trigger /harvest newgrad", async () => {
      const req = new Request("http://localhost/api/telegram/webhook", {
        method: "POST",
        headers: TG_WEBHOOK_HEADERS,
        body: JSON.stringify({
          message: {
            from: { id: 999, first_name: "Tuan", username: "tuannx87" },
            chat: { id: 999 },
            text: "/harvest newgrad",
          },
        }),
      });

      const res = await worker.fetch(req, env, {} as any);
      expect(res.status).toBe(200);
      const data = (await res.json()) as { ok: boolean; result?: any };
      expect(data.ok).toBe(true);
      expect(data.result).toBeDefined();
      expect(data.result.importedJobs).toBeGreaterThan(0);
    });
  });

  describe("5. MCP Server: search_jobs with is_new_grad & CV Tailoring", () => {
    let db: InMemoryD1Database;
    let userRepo: UserRepository;
    let testToken: string;

    beforeEach(async () => {
      db = new InMemoryD1Database();
      userRepo = new UserRepository(db);

      const harvester = new NewGradHarvester();
      await harvester.importNewGradRoles(db, 10);

      testToken = "orp_test_newgrad_12345";
      await userRepo.upsert({
        id: "usr_ng_tester",
        telegramId: "123456",
        username: "ng_tester",
        firstName: "NewGrad Tester",
        apiToken: testToken,
        role: "user",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    });

    it("should search exclusively for new grad roles when is_new_grad is true", async () => {
      const req = new Request("http://localhost/mcp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${testToken}`,
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "tools/call",
          params: {
            name: "search_jobs",
            arguments: {
              is_new_grad: true,
              limit: 10,
            },
          },
        }),
      });

      const res = await worker.fetch(req, tgEnv({ DB: db }), {} as any);
      expect(res.status).toBe(200);
      const data = (await res.json()) as any;
      expect(data.result?.content).toBeDefined();
      const parsed = JSON.parse(data.result.content[0].text);
      expect(parsed.returned).toBeGreaterThan(0);
      for (const j of parsed.jobs) {
        expect(j.seniority).toBe("new_grad");
      }
    });

    it("should specialize CV suggestions for new_grad job in generate_cv_variant", async () => {
      const searchReq = new Request("http://localhost/mcp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${testToken}`,
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 2,
          method: "tools/call",
          params: {
            name: "search_jobs",
            arguments: {
              is_new_grad: true,
              limit: 1,
            },
          },
        }),
      });

      const searchRes = await worker.fetch(searchReq, tgEnv({ DB: db }), {} as any);
      const searchData = (await searchRes.json()) as any;
      const firstJob = JSON.parse(searchData.result.content[0].text).jobs[0];

      const cvReq = new Request("http://localhost/mcp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${testToken}`,
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 3,
          method: "tools/call",
          params: {
            name: "tailor_cv_for_job",
            arguments: {
              job_id: firstJob.id,
            },
          },
        }),
      });

      const cvRes = await worker.fetch(cvReq, tgEnv({ DB: db }), {} as any);
      expect(cvRes.status).toBe(200);
      const cvData = (await cvRes.json()) as any;
      const parsedCv = JSON.parse(cvData.result.content[0].text);
      expect(parsedCv.suggestedSummary).toContain("early-career");
      expect(parsedCv.tailoringSuggestions.some((s: string) => s.includes("New Grad") || s.includes("capstone"))).toBe(true);
    });
  });
});
