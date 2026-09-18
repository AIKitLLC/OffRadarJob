import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { InMemoryD1Database } from "../src/db/in-memory-db.js";
import {
  UserRepository,
  JobRepository,
  UserSubscriptionRepository,
  CompanyRepository,
} from "../src/db/repositories.js";
import { McpServerHandler } from "../src/mcp/mcp-server.js";
import worker from "../src/index.js";

describe("Candidate Subscriptions & Automated Notifications Suite", () => {
  let db: InMemoryD1Database;
  let userRepo: UserRepository;
  let jobRepo: JobRepository;
  let subRepo: UserSubscriptionRepository;
  let companyRepo: CompanyRepository;
  let testToken: string;
  let testUserId: string;
  const originalFetch = globalThis.fetch;

  const mockCtx = {
    waitUntil: (p: Promise<unknown>) => p,
    passThroughOnException: () => {},
  } as any;

  beforeEach(async () => {
    db = new InMemoryD1Database();
    userRepo = new UserRepository(db);
    jobRepo = new JobRepository(db);
    subRepo = new UserSubscriptionRepository(db);
    companyRepo = new CompanyRepository(db);

    // Mock fetch for telegram messages and public APIs
    globalThis.fetch = async (input: RequestInfo | URL): Promise<Response> => {
      const urlStr = typeof input === "string" ? input : input.toString();
      if (urlStr.includes("api.telegram.org")) {
        return new Response(JSON.stringify({ ok: true, result: { message_id: 123 } }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ hits: [], items: [] }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    };

    // Create company & seed jobs with locationHint & Midwest match
    await companyRepo.upsert({
      id: "comp_basecamp",
      name: "37signals",
      domain: "37signals.com",
      websiteUrl: "https://37signals.com",
      source: "manual",
      isMidwest: true,
      usRegion: "midwest",
      stateCode: "IL",
      metroArea: "Chicago",
      locationHint: "Chicago, IL",
    });

    await jobRepo.upsert({
      id: "job_ruby_chicago",
      companyId: "comp_basecamp",
      companyName: "37signals",
      careerPageId: "page_37s",
      title: "Senior Rails Engineer",
      descriptionSummary: "Work on Basecamp and HEY core features.",
      applyType: "url",
      applyTarget: "https://37signals.com/jobs/rails",
      employmentType: "full-time",
      location: "Chicago, IL",
      locationCity: "Chicago",
      locationState: "IL",
      isRemote: true,
      remoteScope: "us-only",
      isMidwest: true,
      usRegion: "midwest",
      isTechRole: true,
      seniorityLevel: "senior",
      techCategory: "fullstack",
      skills: ["Ruby", "Rails", "Hotwire"],
      salaryMin: 150000,
      salaryMax: 190000,
      salaryCurrency: "USD",
      firstSeenAt: Date.now(),
      lastSeenAt: Date.now(),
      status: "open",
      contentHash: "hash_rails_1",
    });

    // Create test user
    const authRes = await worker.fetch(
      new Request("http://localhost/api/auth/telegram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: "subscriber_alex",
          first_name: "Alex",
          id: 7771234,
        }),
      }),
      { DB: db } as any,
      mockCtx
    );
    const authData = (await authRes.json()) as any;
    testToken = authData.user.apiToken;
    testUserId = authData.user.id;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  describe("1. UserSubscriptionRepository", () => {
    it("should upsert and retrieve subscriptions by userId and telegramId", async () => {
      const created = await subRepo.upsert({
        userId: testUserId,
        telegramId: "7771234",
        isActive: true,
        frequency: "daily",
        targetRoles: ["Rails Engineer", "Fullstack"],
        regions: ["midwest", "remote"],
      });

      expect(created.id).toBeDefined();
      expect(created.userId).toBe(testUserId);
      expect(created.telegramId).toBe("7771234");
      expect(created.isActive).toBe(true);
      expect(created.targetRoles).toEqual(["Rails Engineer", "Fullstack"]);
      expect(created.regions).toEqual(["midwest", "remote"]);

      const fetchedByUser = await subRepo.getByUserId(testUserId);
      expect(fetchedByUser).not.toBeNull();
      expect(fetchedByUser?.id).toBe(created.id);

      const fetchedByTg = await subRepo.getByTelegramId("7771234");
      expect(fetchedByTg).not.toBeNull();
      expect(fetchedByTg?.id).toBe(created.id);
    });

    it("should filter active subscribers and support frequency queries", async () => {
      await subRepo.upsert({
        userId: testUserId,
        telegramId: "7771234",
        isActive: true,
        frequency: "daily",
      });

      await subRepo.upsert({
        userId: "user_inactive_2",
        telegramId: "9998887",
        isActive: false,
        frequency: "daily",
      });

      const activeDaily = await subRepo.listActive("daily");
      expect(activeDaily.length).toBe(1);
      expect(activeDaily[0].userId).toBe(testUserId);

      const counts = await subRepo.countSubscribers();
      expect(counts.total).toBe(2);
      expect(counts.active).toBe(1);

      // Toggle active
      await subRepo.toggleActive(testUserId, false);
      const afterToggle = await subRepo.listActive("daily");
      expect(afterToggle.length).toBe(0);

      const newCounts = await subRepo.countSubscribers();
      expect(newCounts.active).toBe(0);
    });

    it("should update lastNotifiedAt timestamp", async () => {
      const sub = await subRepo.upsert({
        userId: testUserId,
        telegramId: "7771234",
      });

      const notifyTime = Date.now();
      await subRepo.updateLastNotified(sub.id, notifyTime);

      const updated = await subRepo.getByUserId(testUserId);
      expect(updated?.lastNotifiedAt).toBe(notifyTime);
    });
  });

  describe("2. Candidate REST APIs: /api/user/subscription", () => {
    it("should require authentication for GET and POST", async () => {
      const unauthGet = await worker.fetch(
        new Request("http://localhost/api/user/subscription"),
        { DB: db } as any,
        mockCtx
      );
      expect(unauthGet.status).toBe(401);

      const unauthPost = await worker.fetch(
        new Request("http://localhost/api/user/subscription", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ is_active: true }),
        }),
        { DB: db } as any,
        mockCtx
      );
      expect(unauthPost.status).toBe(401);
    });

    it("should return null for new user and allow subscribing via POST", async () => {
      // 1. Initial GET returns null subscription
      const res1 = await worker.fetch(
        new Request("http://localhost/api/user/subscription", {
          headers: { Authorization: `Bearer ${testToken}` },
        }),
        { DB: db } as any,
        mockCtx
      );
      expect(res1.status).toBe(200);
      const data1 = (await res1.json()) as any;
      expect(data1.success).toBe(true);
      expect(data1.subscription).toBeNull();

      // 2. POST to subscribe
      const res2 = await worker.fetch(
        new Request("http://localhost/api/user/subscription", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${testToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            target_role: "Rails Developer",
            target_region: "midwest",
            frequency: "daily",
            is_active: true,
          }),
        }),
        { DB: db } as any,
        mockCtx
      );
      expect(res2.status).toBe(200);
      const data2 = (await res2.json()) as any;
      expect(data2.success).toBe(true);
      expect(data2.subscription.isActive).toBe(true);
      expect(data2.subscription.targetRoles).toContain("Rails Developer");
      expect(data2.subscription.regions).toContain("midwest");

      // 3. Subsequent GET returns active subscription
      const res3 = await worker.fetch(
        new Request("http://localhost/api/user/subscription", {
          headers: { Authorization: `Bearer ${testToken}` },
        }),
        { DB: db } as any,
        mockCtx
      );
      const data3 = (await res3.json()) as any;
      expect(data3.subscription.id).toBe(data2.subscription.id);
      expect(data3.subscription.isActive).toBe(true);
    });
  });

  describe("3. MCP Server: get_daily_digest & manage_job_subscription", () => {
    let mcpHandler: McpServerHandler;

    beforeEach(() => {
      mcpHandler = new McpServerHandler(jobRepo, companyRepo, undefined, undefined, undefined, subRepo);
    });

    it("should list get_daily_digest and manage_job_subscription in tools/list", async () => {
      const user = await userRepo.findById(testUserId);
      const res = await mcpHandler.handleJsonRpc({
        jsonrpc: "2.0",
        id: 1,
        method: "tools/list",
      }, user!);

      const toolNames = res.result.tools.map((t: any) => t.name);
      expect(toolNames).toContain("get_daily_digest");
      expect(toolNames).toContain("manage_job_subscription");
      expect(toolNames.length).toBe(9);
    });

    it("should execute get_daily_digest tool and return curated openings", async () => {
      const user = await userRepo.findById(testUserId);
      const res = await mcpHandler.handleJsonRpc({
        jsonrpc: "2.0",
        id: 2,
        method: "tools/call",
        params: {
          name: "get_daily_digest",
          arguments: {
            region: "midwest",
            limit: 5,
          },
        },
      }, user!);

      const parsed = JSON.parse(res.result.content[0].text);
      expect(parsed.success).toBe(true);
      expect(parsed.total_matching_openings).toBeGreaterThanOrEqual(1);
      expect(parsed.daily_digest[0].title).toBe("Senior Rails Engineer");
      expect(parsed.guidance_for_ai).toBeDefined();
    });

    it("should manage subscription status via manage_job_subscription tool", async () => {
      const user = await userRepo.findById(testUserId);

      // Update preferences
      const res1 = await mcpHandler.handleJsonRpc({
        jsonrpc: "2.0",
        id: 3,
        method: "tools/call",
        params: {
          name: "manage_job_subscription",
          arguments: {
            action: "update",
            target_roles: ["Staff Engineer"],
            regions: ["midwest"],
            frequency: "daily",
          },
        },
      }, user!);

      const parsed1 = JSON.parse(res1.result.content[0].text);
      expect(parsed1.success).toBe(true);
      expect(parsed1.subscription.targetRoles).toContain("Staff Engineer");

      // Toggle off
      const res2 = await mcpHandler.handleJsonRpc({
        jsonrpc: "2.0",
        id: 4,
        method: "tools/call",
        params: {
          name: "manage_job_subscription",
          arguments: { action: "toggle" },
        },
      }, user!);

      const parsed2 = JSON.parse(res2.result.content[0].text);
      expect(parsed2.success).toBe(true);
      expect(parsed2.is_active).toBe(false);
    });

    it("should provide daily_job_briefing prompt in prompts/list", async () => {
      const user = await userRepo.findById(testUserId);
      const listRes = await mcpHandler.handleJsonRpc({
        jsonrpc: "2.0",
        id: 5,
        method: "prompts/list",
      }, user!);

      const promptNames = listRes.result.prompts.map((p: any) => p.name);
      expect(promptNames).toContain("daily_job_briefing");

      const getRes = await mcpHandler.handleJsonRpc({
        jsonrpc: "2.0",
        id: 6,
        method: "prompts/get",
        params: {
          name: "daily_job_briefing",
          arguments: { target_role: "Rails Engineer" },
        },
      }, user!);

      expect(getRes.result.messages.length).toBeGreaterThan(0);
      expect(getRes.result.messages[0].content.text).toContain("get_daily_digest");
    });
  });

  describe("4. Telegram Webhook: /subscribe, /unsubscribe, /digest, and /stats", () => {
    it("should subscribe user via /subscribe with preferences", async () => {
      const tgReq = new Request("http://localhost/api/telegram/webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: {
            message_id: 101,
            from: {
              id: 7771234,
              first_name: "Alex",
              username: "subscriber_alex",
            },
            chat: { id: 7771234 },
            text: "/subscribe Rails Engineer",
          },
        }),
      });

      const res = await worker.fetch(tgReq, { DB: db, TELEGRAM_BOT_TOKEN: "mock_token" } as any, mockCtx);
      expect(res.status).toBe(200);

      const sub = await subRepo.getByTelegramId("7771234");
      expect(sub).not.toBeNull();
      expect(sub?.isActive).toBe(true);
      expect(sub?.targetRoles.map((r) => r.toLowerCase())).toContain("rails engineer");
    });

    it("should unsubscribe user via /unsubscribe", async () => {
      await subRepo.upsert({
        userId: testUserId,
        telegramId: "7771234",
        isActive: true,
      });

      const tgReq = new Request("http://localhost/api/telegram/webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: {
            message_id: 102,
            from: { id: 7771234, first_name: "Alex" },
            chat: { id: 7771234 },
            text: "/unsubscribe",
          },
        }),
      });

      const res = await worker.fetch(tgReq, { DB: db, TELEGRAM_BOT_TOKEN: "mock_token" } as any, mockCtx);
      expect(res.status).toBe(200);

      const sub = await subRepo.getByTelegramId("7771234");
      expect(sub?.isActive).toBe(false);
    });

    it("should return daily digest via /digest", async () => {
      const tgReq = new Request("http://localhost/api/telegram/webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: {
            message_id: 103,
            from: { id: 7771234, first_name: "Alex" },
            chat: { id: 7771234 },
            text: "/digest",
          },
        }),
      });

      const res = await worker.fetch(tgReq, { DB: db, TELEGRAM_BOT_TOKEN: "mock_token" } as any, mockCtx);
      expect(res.status).toBe(200);
      const data = (await res.json()) as any;
      expect(data.ok).toBe(true);
      expect(data.count).toBeGreaterThanOrEqual(1);
    });

    it("should display subscriber metrics in /stats", async () => {
      await subRepo.upsert({
        userId: testUserId,
        telegramId: "7771234",
        isActive: true,
      });

      const tgReq = new Request("http://localhost/api/telegram/webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: {
            message_id: 104,
            from: { id: 7771234, first_name: "Alex" },
            chat: { id: 7771234 },
            text: "/stats",
          },
        }),
      });

      const res = await worker.fetch(tgReq, { DB: db, TELEGRAM_BOT_TOKEN: "mock_token" } as any, mockCtx);
      expect(res.status).toBe(200);
      const data = (await res.json()) as any;
      expect(data.ok).toBe(true);
    });
  });

  describe("5. Admin Stats & Scheduled Notification Dispatch", () => {
    it("should include subscriber counts in /api/admin/stats", async () => {
      await subRepo.upsert({
        userId: testUserId,
        telegramId: "7771234",
        isActive: true,
      });

      const res = await worker.fetch(
        new Request("http://localhost/api/admin/stats?token=test_admin_token"),
        { DB: db, ADMIN_TOKEN: "test_admin_token" } as any,
        mockCtx
      );
      expect(res.status).toBe(200);
      const data = (await res.json()) as any;
      expect(data.subscribers).toBeDefined();
      expect(data.subscribers.total).toBe(1);
      expect(data.subscribers.active).toBe(1);
    });

    it("should run scheduled() without throwing and dispatch alerts", async () => {
      await subRepo.upsert({
        userId: testUserId,
        telegramId: "7771234",
        isActive: true,
        frequency: "daily",
        regions: ["midwest"],
      });

      // Scheduled execution with mock execution context and mock queue
      let waitUntilPromise: Promise<void> | null = null;
      const ctx = {
        waitUntil: (p: Promise<void>) => {
          waitUntilPromise = p;
        },
        passThroughOnException: () => {},
      };

      await worker.scheduled(
        { cron: "0 2 * * *" },
        {
          DB: db,
          TELEGRAM_BOT_TOKEN: "mock_token",
          DISCOVERY_QUEUE: { send: async () => {} },
        } as any,
        ctx as any
      );

      if (waitUntilPromise) {
        await waitUntilPromise;
      }

      // Check lastNotifiedAt updated
      const sub = await subRepo.getByUserId(testUserId);
      expect(sub?.lastNotifiedAt).toBeDefined();
      expect(sub?.lastNotifiedAt).toBeGreaterThan(0);
    });
  });
});
