import { describe, it, expect, beforeEach } from "vitest";
import { InMemoryD1Database } from "../src/db/in-memory-db.js";
import { UserRepository, JobRepository, CompanyRepository, CrawlTaskRepository } from "../src/db/repositories.js";
import worker, { isTelegramAdmin, DEFAULT_ADMIN_TOKEN } from "../src/index.js";

describe("Telegram Bot Admin Suite - RBAC & Command Engine", () => {
  let db: InMemoryD1Database;
  let userRepo: UserRepository;
  let jobRepo: JobRepository;
  let companyRepo: CompanyRepository;
  let taskRepo: CrawlTaskRepository;

  const mockEnv = {
    DB: undefined as any,
    TELEGRAM_BOT_USERNAME: "OffRadarJobBot",
    TELEGRAM_ADMIN_USERNAMES: "tuannx87,lead_dev",
    TELEGRAM_ADMIN_IDS: "99887766,11223344",
    ADMIN_TOKEN: "offradar-admin-2026",
  };

  const mockCtx = {
    waitUntil: (p: Promise<unknown>) => p,
    passThroughOnException: () => {},
  } as any;

  beforeEach(() => {
    db = new InMemoryD1Database();
    userRepo = new UserRepository(db);
    jobRepo = new JobRepository(db);
    companyRepo = new CompanyRepository(db);
    taskRepo = new CrawlTaskRepository(db);
    mockEnv.DB = db;
  });

  describe("isTelegramAdmin Authorization Function", () => {
    it("should authorize users matching configured usernames (case-insensitive and with @)", () => {
      expect(isTelegramAdmin(mockEnv as any, { id: 1, username: "tuannx87" })).toBe(true);
      expect(isTelegramAdmin(mockEnv as any, { id: 1, username: "@tuannx87" })).toBe(true);
      expect(isTelegramAdmin(mockEnv as any, { id: 1, username: "TUANNX87" })).toBe(true);
      expect(isTelegramAdmin(mockEnv as any, { id: 1, username: "lead_dev" })).toBe(true);
      expect(isTelegramAdmin(mockEnv as any, { id: 1, username: "random_guy" })).toBe(false);
    });

    it("should authorize users matching configured numeric Telegram IDs", () => {
      expect(isTelegramAdmin(mockEnv as any, { id: 99887766, username: "unknown" })).toBe(true);
      expect(isTelegramAdmin(mockEnv as any, { id: "11223344" })).toBe(true);
      expect(isTelegramAdmin(mockEnv as any, { id: 55555555 })).toBe(false);
    });

    it("should authorize any user having admin role in database", () => {
      expect(isTelegramAdmin(mockEnv as any, { id: 999999, username: "guest" }, "admin")).toBe(true);
      expect(isTelegramAdmin(mockEnv as any, { id: 999999, username: "guest" }, "user")).toBe(false);
    });
  });

  describe("Telegram Webhook - /start and Admin Recognition", () => {
    it("should automatically assign admin role to configured admin upon /start", async () => {
      const payload = {
        message: {
          from: { id: 77777, first_name: "Tuan", username: "tuannx87" },
          chat: { id: 77777 },
          text: "/start",
        },
      };

      const res = await worker.fetch(
        new Request("http://localhost/api/telegram/webhook", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }),
        mockEnv as any,
        mockCtx
      );

      expect(res.status).toBe(200);
      const data = (await res.json()) as any;
      expect(data.isAdmin).toBe(true);

      const stored = await userRepo.findByTelegramId("77777");
      expect(stored).toBeDefined();
      expect(stored?.role).toBe("admin");
    });

    it("should assign user role to normal users", async () => {
      const payload = {
        message: {
          from: { id: 88888, first_name: "John", username: "johndoe" },
          chat: { id: 88888 },
          text: "/start",
        },
      };

      const res = await worker.fetch(
        new Request("http://localhost/api/telegram/webhook", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }),
        mockEnv as any,
        mockCtx
      );

      expect(res.status).toBe(200);
      const data = (await res.json()) as any;
      expect(data.isAdmin).toBe(false);

      const stored = await userRepo.findByTelegramId("88888");
      expect(stored?.role).toBe("user");
    });
  });

  describe("Telegram Webhook - /admin auth elevation", () => {
    it("should reject invalid admin token", async () => {
      const payload = {
        message: {
          from: { id: 333444, first_name: "Attacker", username: "hacker" },
          chat: { id: 333444 },
          text: "/admin auth wrong_token_123",
        },
      };

      const res = await worker.fetch(
        new Request("http://localhost/api/telegram/webhook", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }),
        mockEnv as any,
        mockCtx
      );

      const data = (await res.json()) as any;
      expect(data.ok).toBe(false);
      expect(data.error).toBe("Invalid admin token");
    });

    it("should promote user to admin in D1 upon valid admin token", async () => {
      const payload = {
        message: {
          from: { id: 333444, first_name: "New Admin", username: "newadmin" },
          chat: { id: 333444 },
          text: `/admin auth ${DEFAULT_ADMIN_TOKEN}`,
        },
      };

      const res = await worker.fetch(
        new Request("http://localhost/api/telegram/webhook", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }),
        mockEnv as any,
        mockCtx
      );

      expect(res.status).toBe(200);
      const data = (await res.json()) as any;
      expect(data.ok).toBe(true);
      expect(data.adminGranted).toBe(true);

      const user = await userRepo.findByTelegramId("333444");
      expect(user?.role).toBe("admin");
    });
  });

  describe("Telegram Webhook - Admin Commands (/crawl, /stats, /users, /adminlink)", () => {
    it("should reject /crawl command from non-admin user", async () => {
      const payload = {
        message: {
          from: { id: 555111, first_name: "Guest", username: "guest" },
          chat: { id: 555111 },
          text: "/crawl https://example.com/careers",
        },
      };

      const res = await worker.fetch(
        new Request("http://localhost/api/telegram/webhook", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }),
        mockEnv as any,
        mockCtx
      );

      const data = (await res.json()) as any;
      expect(data.ok).toBe(false);
      expect(data.error).toBe("Unauthorized");
    });

    it("should execute /crawl command from admin user and insert task into D1", async () => {
      const payload = {
        message: {
          from: { id: 77777, first_name: "Tuan", username: "tuannx87" },
          chat: { id: 77777 },
          text: "/crawl https://basecamp.com/about/jobs",
        },
      };

      const res = await worker.fetch(
        new Request("http://localhost/api/telegram/webhook", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }),
        mockEnv as any,
        mockCtx
      );

      expect(res.status).toBe(200);
      const data = (await res.json()) as any;
      expect(data.ok).toBe(true);
      expect(data.taskId).toMatch(/^tsk_tg_[a-f0-9]{8}$/);

      const task = await taskRepo.findById(data.taskId);
      expect(task).toBeDefined();
      expect(task?.targetUrl).toBe("https://basecamp.com/about/jobs");
      expect(task?.sourceType).toBe("telegram_admin");
      expect(task?.status).toBe("pending");
    });

    it("should respond to /stats command", async () => {
      const payload = {
        message: {
          from: { id: 77777, first_name: "Tuan", username: "tuannx87" },
          chat: { id: 77777 },
          text: "/stats",
        },
      };

      const res = await worker.fetch(
        new Request("http://localhost/api/telegram/webhook", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }),
        mockEnv as any,
        mockCtx
      );

      expect(res.status).toBe(200);
      const data = (await res.json()) as any;
      expect(data.ok).toBe(true);
    });

    it("should respond to /users command for admin", async () => {
      const payload = {
        message: {
          from: { id: 77777, first_name: "Tuan", username: "tuannx87" },
          chat: { id: 77777 },
          text: "/users",
        },
      };

      const res = await worker.fetch(
        new Request("http://localhost/api/telegram/webhook", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }),
        mockEnv as any,
        mockCtx
      );

      expect(res.status).toBe(200);
      const data = (await res.json()) as any;
      expect(data.ok).toBe(true);
    });

    it("should generate admin magic link via /adminlink for admin", async () => {
      const payload = {
        message: {
          from: { id: 77777, first_name: "Tuan", username: "tuannx87" },
          chat: { id: 77777 },
          text: "/adminlink",
        },
      };

      const res = await worker.fetch(
        new Request("http://localhost/api/telegram/webhook", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }),
        mockEnv as any,
        mockCtx
      );

      expect(res.status).toBe(200);
      const data = (await res.json()) as any;
      expect(data.ok).toBe(true);
    });
  });

  describe("Admin REST APIs for Telegram & User Management", () => {
    beforeEach(async () => {
      await userRepo.upsert({
        id: "usr_tuannx87",
        telegramId: "77777",
        username: "tuannx87",
        firstName: "Tuan Nguyen",
        apiToken: "orp_tuan123",
        role: "admin",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      await userRepo.upsert({
        id: "usr_alice",
        telegramId: "88888",
        username: "alice_dev",
        firstName: "Alice",
        apiToken: "orp_alice123",
        role: "user",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    });

    it("should return Telegram bot status and configured admins via GET /api/admin/telegram/status", async () => {
      const res = await worker.fetch(
        new Request("http://localhost/api/admin/telegram/status", {
          headers: { "x-admin-token": DEFAULT_ADMIN_TOKEN },
        }),
        mockEnv as any,
        mockCtx
      );

      expect(res.status).toBe(200);
      const data = (await res.json()) as any;
      expect(data.botUsername).toBe("OffRadarJobBot");
      expect(data.configuredAdmins).toContain("tuannx87");
      expect(data.configuredAdmins).toContain("lead_dev");
      expect(data.configuredAdminIds).toContain("99887766");
      expect(data.totalUsers).toBe(2);
      expect(data.totalAdmins).toBe(1);
    });

    it("should list users via GET /api/admin/users", async () => {
      const res = await worker.fetch(
        new Request("http://localhost/api/admin/users", {
          headers: { "x-admin-token": DEFAULT_ADMIN_TOKEN },
        }),
        mockEnv as any,
        mockCtx
      );

      expect(res.status).toBe(200);
      const data = (await res.json()) as any;
      expect(data.users).toBeDefined();
      expect(data.users.length).toBe(2);
    });

    it("should promote a user to admin via POST /api/admin/users/:id/role", async () => {
      const res = await worker.fetch(
        new Request("http://localhost/api/admin/users/usr_alice/role", {
          method: "POST",
          headers: {
            "x-admin-token": DEFAULT_ADMIN_TOKEN,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ role: "admin" }),
        }),
        mockEnv as any,
        mockCtx
      );

      expect(res.status).toBe(200);
      const data = (await res.json()) as any;
      expect(data.success).toBe(true);
      expect(data.role).toBe("admin");

      const alice = await userRepo.findById("usr_alice");
      expect(alice?.role).toBe("admin");
    });
  });
});
