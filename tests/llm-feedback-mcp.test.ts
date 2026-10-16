import { tgEnv, signTelegramLogin, TG_WEBHOOK_HEADERS, TEST_BOT_TOKEN, TEST_WEBHOOK_SECRET } from "./helpers/telegram.js";
import { describe, it, expect, beforeEach } from "vitest";
import { InMemoryD1Database } from "../src/db/in-memory-db.js";
import {
  UserRepository,
  JobRepository,
  LlmFeedbackRepository,
} from "../src/db/repositories.js";
import worker from "../src/index.js";

describe("Proactive LLM Feedback & MCP Prompts Suite", () => {
  let db: InMemoryD1Database;
  let userRepo: UserRepository;
  let jobRepo: JobRepository;
  let feedbackRepo: LlmFeedbackRepository;
  let testToken: string;
  let testUserId: string;

  const mockCtx = {
    waitUntil: (p: Promise<unknown>) => p,
    passThroughOnException: () => {},
  } as any;

  beforeEach(async () => {
    db = new InMemoryD1Database();
    userRepo = new UserRepository(db);
    jobRepo = new JobRepository(db);
    feedbackRepo = new LlmFeedbackRepository(db);

    // Create authenticated test user
    const authRes = await worker.fetch(
      new Request("http://localhost/api/auth/telegram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(signTelegramLogin({
          username: "ai_career_user",
          first_name: "Dev",
          id: 888999,
        })),
      }),
      tgEnv({ DB: db }),
      mockCtx
    );
    const authData = (await authRes.json()) as any;
    testToken = authData.user.apiToken;
    testUserId = authData.user.id;

    // Seed test job
    await jobRepo.upsert({
      id: "job_chicago_rust",
      companyId: "comp_flyio",
      companyName: "Fly.io",
      careerPageId: "page_flyio_1",
      title: "Distributed Systems Rust Engineer",
      descriptionSummary: "Build high-throughput global edge proxy in Rust.",
      applyType: "url",
      applyTarget: "https://fly.io/jobs/rust-systems",
      employmentType: "full-time",
      isRemote: true,
      remoteScope: "us-only",
      isMidwest: true,
      usRegion: "midwest",
      isTechRole: true,
      seniorityLevel: "senior",
      techCategory: "devops_cloud",
      skills: ["Rust", "Linux", "Networking"],
      firstSeenAt: Date.now(),
      lastSeenAt: Date.now(),
      status: "open",
      contentHash: "hash_chicago_rust_1",
    });
  });

  describe("MCP Prompts Protocol (prompts/list & prompts/get)", () => {
    it("should advertise prompts capability during initialize", async () => {
      const req = new Request("http://localhost/mcp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${testToken}`,
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "initialize",
          params: {
            protocolVersion: "2024-11-05",
            clientInfo: { name: "antigravity", version: "1.0.0" },
          },
        }),
      });

      const res = await worker.fetch(req, tgEnv({ DB: db }), mockCtx);
      expect(res.status).toBe(200);

      const data = (await res.json()) as any;
      expect(data.result.capabilities.prompts).toBeDefined();
      expect(data.result.capabilities.tools).toBeDefined();
    });

    it("should list available prompts via prompts/list", async () => {
      const req = new Request("http://localhost/mcp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${testToken}`,
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 2,
          method: "prompts/list",
        }),
      });

      const res = await worker.fetch(req, tgEnv({ DB: db }), mockCtx);
      expect(res.status).toBe(200);

      const data = (await res.json()) as any;
      expect(data.result.prompts).toBeDefined();
      expect(Array.isArray(data.result.prompts)).toBe(true);

      const promptNames = data.result.prompts.map((p: any) => p.name);
      expect(promptNames).toContain("proactive_job_advisor");
      expect(promptNames).toContain("llm_feedback_collector");
    });

    it("should retrieve proactive_job_advisor prompt via prompts/get with arguments", async () => {
      const req = new Request("http://localhost/mcp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${testToken}`,
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 3,
          method: "prompts/get",
          params: {
            name: "proactive_job_advisor",
            arguments: {
              target_role: "Senior Distributed Systems",
              preferred_region: "US-Midwest",
            },
          },
        }),
      });

      const res = await worker.fetch(req, tgEnv({ DB: db }), mockCtx);
      expect(res.status).toBe(200);

      const data = (await res.json()) as any;
      expect(data.result.messages).toBeDefined();
      expect(data.result.messages.length).toBeGreaterThan(0);

      const promptContent = data.result.messages[0].content.text;
      expect(promptContent).toContain("Senior Distributed Systems");
      expect(promptContent).toContain("US-Midwest");
      expect(promptContent).toContain("submit_llm_feedback");
    });

    it("should retrieve llm_feedback_collector prompt via prompts/get", async () => {
      const req = new Request("http://localhost/mcp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${testToken}`,
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 4,
          method: "prompts/get",
          params: {
            name: "llm_feedback_collector",
          },
        }),
      });

      const res = await worker.fetch(req, tgEnv({ DB: db }), mockCtx);
      expect(res.status).toBe(200);

      const data = (await res.json()) as any;
      expect(data.result.messages[0].content.text).toContain("submit_llm_feedback");
      expect(data.result.messages[0].content.text).toContain("broken_link");
    });

    it("should return error for unknown prompt in prompts/get", async () => {
      const req = new Request("http://localhost/mcp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${testToken}`,
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 5,
          method: "prompts/get",
          params: {
            name: "non_existent_prompt",
          },
        }),
      });

      const res = await worker.fetch(req, tgEnv({ DB: db }), mockCtx);
      const data = (await res.json()) as any;
      expect(data.error).toBeDefined();
      expect(data.error.code).toBe(-32602);
    });
  });

  describe("MCP Tool: submit_llm_feedback", () => {
    it("should include submit_llm_feedback in tools/list", async () => {
      const req = new Request("http://localhost/mcp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${testToken}`,
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 6,
          method: "tools/list",
        }),
      });

      const res = await worker.fetch(req, tgEnv({ DB: db }), mockCtx);
      const data = (await res.json()) as any;
      const tool = data.result.tools.find((t: any) => t.name === "submit_llm_feedback");
      expect(tool).toBeDefined();
      expect(tool.description).toContain("PROACTIVELY submit insights");
      expect(tool.inputSchema.properties.feedback_type).toBeDefined();
      expect(tool.inputSchema.properties.comment).toBeDefined();
    });

    it("should execute tools/call submit_llm_feedback for broken link signal", async () => {
      const req = new Request("http://localhost/mcp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${testToken}`,
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 7,
          method: "tools/call",
          params: {
            name: "submit_llm_feedback",
            arguments: {
              feedback_type: "broken_link",
              sentiment: "critical",
              job_id: "job_chicago_rust",
              company_id: "comp_flyio",
              comment: "Candidate attempted to open apply URL but received HTTP 404.",
              suggested_action: "Trigger immediate re-crawl for Fly.io career page.",
              context_summary: "User was tailoring CV for Rust position.",
            },
          },
        }),
      });

      const res = await worker.fetch(req, tgEnv({ DB: db }), mockCtx);
      expect(res.status).toBe(200);

      const data = (await res.json()) as any;
      expect(data.result).toBeDefined();
      expect(data.result.content[0].text).toContain("Feedback proactively recorded");
      expect(data.result.content[0].text).toContain("broken_link");

      // Verify stored in D1
      const paged = await feedbackRepo.listPaged({ limit: 10 });
      expect(paged.items.length).toBe(1);
      const fb = paged.items[0]!;
      expect(fb.feedbackType).toBe("broken_link");
      expect(fb.sentiment).toBe("critical");
      expect(fb.jobId).toBe("job_chicago_rust");
      expect(fb.userId).toBe(testUserId);
      expect(fb.suggestedAction).toContain("Trigger immediate re-crawl");
    });

    it("should execute tools/call submit_llm_feedback for candidate preference signal", async () => {
      const req = new Request("http://localhost/mcp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${testToken}`,
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 8,
          method: "tools/call",
          params: {
            name: "submit_llm_feedback",
            arguments: {
              feedback_type: "user_preference",
              sentiment: "neutral",
              comment: "User repeatedly asked for Elixir / Phoenix openings in Chicago or remote.",
              suggested_action: "Expand crawler keywords for Elixir / Erlang ecosystem.",
              metadata: { desired_stack: ["Elixir", "Phoenix"], location: "Chicago" },
            },
          },
        }),
      });

      const res = await worker.fetch(req, tgEnv({ DB: db }), mockCtx);
      expect(res.status).toBe(200);

      const paged = await feedbackRepo.listPaged({ type: "user_preference" });
      expect(paged.items.length).toBe(1);
      const item = paged.items[0]!;
      expect(item.feedbackType).toBe("user_preference");
      expect(item.metadata?.desired_stack).toContain("Elixir");
    });
  });

  describe("User Feedback REST APIs (/api/user/feedbacks)", () => {
    it("should require auth to get or post user feedbacks", async () => {
      const getRes = await worker.fetch(
        new Request("http://localhost/api/user/feedbacks"),
        tgEnv({ DB: db }),
        mockCtx
      );
      expect(getRes.status).toBe(401);

      const postRes = await worker.fetch(
        new Request("http://localhost/api/user/feedbacks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ comment: "Test feedback" }),
        }),
        tgEnv({ DB: db }),
        mockCtx
      );
      expect(postRes.status).toBe(401);
    });

    it("should allow user to submit and list their feedbacks", async () => {
      // POST feedback
      const postRes = await worker.fetch(
        new Request("http://localhost/api/user/feedbacks", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${testToken}`,
          },
          body: JSON.stringify({
            feedback_type: "general_suggestion",
            sentiment: "positive",
            rating: 5,
            comment: "Love the focus on Midwest remote boutique startups!",
            suggested_action: "Add RSS feed for daily digests",
          }),
        }),
        tgEnv({ DB: db }),
        mockCtx
      );
      expect([200, 201]).toContain(postRes.status);
      const postData = (await postRes.json()) as any;
      expect(postData.success).toBe(true);
      expect(postData.feedback.id).toBeDefined();

      // GET user feedbacks
      const getRes = await worker.fetch(
        new Request("http://localhost/api/user/feedbacks", {
          headers: { Authorization: `Bearer ${testToken}` },
        }),
        tgEnv({ DB: db }),
        mockCtx
      );
      expect(getRes.status).toBe(200);
      const getData = (await getRes.json()) as any;
      expect(getData.items.length).toBe(1);
      expect(getData.items[0].comment).toContain("Midwest remote boutique");
    });
  });

  describe("Admin Feedback Moderation Endpoints", () => {
    const adminToken = "test_admin_secret_token";
    const adminEnv = {
      ADMIN_TOKEN: adminToken,
      TELEGRAM_BOT_TOKEN: "fake_telegram_token",
      TELEGRAM_ADMIN_CHAT_ID: "998877",
      TELEGRAM_ADMIN_IDS: "998877",
      TELEGRAM_ADMIN_USERNAMES: "admin_boss",
    };

    beforeEach(async () => {
      // Create test feedbacks
      await feedbackRepo.create({
        feedbackType: "broken_link",
        sentiment: "critical",
        status: "new",
        comment: "Apply link 404 for Chicago role",
        suggestedAction: "Check company career page",
        userId: testUserId,
      });

      await feedbackRepo.create({
        feedbackType: "user_preference",
        sentiment: "positive",
        status: "new",
        comment: "High interest in AI Engineering",
        userId: testUserId,
      });
    });

    it("should reject unauthorized requests to /api/admin/feedbacks", async () => {
      const res = await worker.fetch(
        new Request("http://localhost/api/admin/feedbacks"),
        tgEnv({ DB: db, ...adminEnv }),
        mockCtx
      );
      expect(res.status).toBe(401);
    });

    it("should allow admin to list feedbacks with stats", async () => {
      const res = await worker.fetch(
        new Request("http://localhost/api/admin/feedbacks", { headers: { "x-admin-token": adminToken } }),
        tgEnv({ DB: db, ...adminEnv }),
        mockCtx
      );
      expect(res.status).toBe(200);
      const data = (await res.json()) as any;
      expect(data.stats).toBeDefined();
      expect(data.stats.total).toBe(2);
      expect(data.stats.criticalCount).toBe(1);
      expect(data.items.length).toBe(2);
    });

    it("should allow admin to update feedback status and delete feedback", async () => {
      const list = await feedbackRepo.listPaged({ limit: 10 });
      const targetId = list.items[0]!.id;

      // Update status to 'actioned'
      const statusRes = await worker.fetch(
        new Request("http://localhost/api/admin/feedbacks/status", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${adminToken}`,
          },
          body: JSON.stringify({ id: targetId, status: "actioned" }),
        }),
        tgEnv({ DB: db, ...adminEnv }),
        mockCtx
      );
      expect(statusRes.status).toBe(200);

      const updated = await feedbackRepo.getById(targetId);
      expect(updated?.status).toBe("actioned");

      // Delete feedback
      const deleteRes = await worker.fetch(
        new Request("http://localhost/api/admin/feedbacks/delete", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${adminToken}`,
          },
          body: JSON.stringify({ id: targetId }),
        }),
        tgEnv({ DB: db, ...adminEnv }),
        mockCtx
      );
      expect(deleteRes.status).toBe(200);

      const deleted = await feedbackRepo.getById(targetId);
      expect(deleted).toBeNull();
    });

    it("should respond to Telegram /feedbacks admin command", async () => {
      let sentTelegramText = "";
      (globalThis as any).fetch = async (url: string, init?: RequestInit) => {
        if (url.includes("api.telegram.org") && url.includes("sendMessage")) {
          const body = JSON.parse((init?.body as string) || "{}");
          sentTelegramText = body.text || "";
          return new Response(JSON.stringify({ ok: true, result: {} }));
        }
        return new Response("ok");
      };

      const webhookReq = new Request("http://localhost/api/telegram/webhook", {
        method: "POST",
        headers: TG_WEBHOOK_HEADERS,
        body: JSON.stringify({
          update_id: 1001,
          message: {
            message_id: 2002,
            from: { id: 998877, username: "admin_boss" },
            chat: { id: 998877, type: "private" },
            text: "/feedbacks",
          },
        }),
      });

      const res = await worker.fetch(
        webhookReq,
        tgEnv({ DB: db, ...adminEnv }),
        mockCtx
      );
      expect(res.status).toBe(200);
      expect(sentTelegramText).toContain("PHẢN HỒI TỪ LLM & NGƯỜI DÙNG");
      expect(sentTelegramText).toContain("Apply link 404");
    });
  });
});
