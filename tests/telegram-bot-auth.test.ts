import { describe, it, expect, beforeEach } from "vitest";
import { InMemoryD1Database } from "../src/db/in-memory-db.js";
import { UserRepository } from "../src/db/repositories.js";
import worker, { memoryAuthSessions } from "../src/index.js";

describe("Telegram Bot Seamless Deep-Link Authentication Suite", () => {
  let db: InMemoryD1Database;
  let userRepo: UserRepository;

  const mockCtx = {
    waitUntil: (p: Promise<unknown>) => p,
    passThroughOnException: () => {},
  } as any;

  beforeEach(() => {
    db = new InMemoryD1Database();
    userRepo = new UserRepository(db);
    memoryAuthSessions.clear();
  });

  it("should initialize a new authentication session with deep link and QR code", async () => {
    const req = new Request("http://localhost/api/auth/telegram/session");
    const res = await worker.fetch(req, { DB: db, TELEGRAM_BOT_USERNAME: "OffRadarJobBot" } as any, mockCtx);

    expect(res.status).toBe(200);
    const data = (await res.json()) as any;

    expect(data.sessionToken).toMatch(/^auth_[a-f0-9]{12}$/);
    expect(data.botUsername).toBe("OffRadarJobBot");
    expect(data.deepLink).toBe(`https://t.me/OffRadarJobBot?start=login_${data.sessionToken}`);
    expect(data.qrUrl).toContain("api.qrserver.com");
    expect(data.qrUrl).toContain(encodeURIComponent(data.deepLink));
    expect(data.expiresIn).toBe(600);

    // Initial status poll should be pending
    const pollReq = new Request(`http://localhost/api/auth/telegram/session?token=${data.sessionToken}`);
    const pollRes = await worker.fetch(pollReq, { DB: db } as any, mockCtx);
    expect(pollRes.status).toBe(200);
    const pollData = (await pollRes.json()) as any;
    expect(pollData.status).toBe("pending");
  });

  it("should return 404 expired for non-existent session token", async () => {
    const pollReq = new Request("http://localhost/api/auth/telegram/session?token=auth_nonexistent");
    const pollRes = await worker.fetch(pollReq, { DB: db } as any, mockCtx);
    expect(pollRes.status).toBe(404);
    const pollData = (await pollRes.json()) as any;
    expect(pollData.status).toBe("expired");
  });

  it("should complete authentication when Telegram Webhook receives /start login_<token>", async () => {
    // 1. Create session
    const initRes = await worker.fetch(
      new Request("http://localhost/api/auth/telegram/session"),
      { DB: db } as any,
      mockCtx
    );
    const { sessionToken } = (await initRes.json()) as any;

    // 2. Simulate Telegram Bot Webhook payload
    const tgWebhookUpdate = {
      update_id: 10001,
      message: {
        message_id: 42,
        from: {
          id: 99887766,
          is_bot: false,
          first_name: "Sarah",
          last_name: "Connor",
          username: "sarah_connor",
          language_code: "en",
        },
        chat: {
          id: 99887766,
          first_name: "Sarah",
          type: "private",
        },
        date: Math.floor(Date.now() / 1000),
        text: `/start login_${sessionToken}`,
      },
    };

    const webhookReq = new Request("http://localhost/api/telegram/webhook", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(tgWebhookUpdate),
    });

    const webhookRes = await worker.fetch(webhookReq, { DB: db } as any, mockCtx);
    expect(webhookRes.status).toBe(200);
    const webhookData = (await webhookRes.json()) as any;
    expect(webhookData.ok).toBe(true);
    expect(webhookData.authenticated).toBe(true);

    // Verify user was stored in D1
    const storedUser = await userRepo.findByTelegramId("99887766");
    expect(storedUser).toBeDefined();
    expect(storedUser?.firstName).toBe("Sarah");
    expect(storedUser?.username).toBe("sarah_connor");
    expect(storedUser?.apiToken).toMatch(/^orp_[a-f0-9]{32}$/);

    // 3. Poll session: should now be authenticated and return Set-Cookie
    const pollReq = new Request(`http://localhost/api/auth/telegram/session?token=${sessionToken}`);
    const pollRes = await worker.fetch(pollReq, { DB: db } as any, mockCtx);
    expect(pollRes.status).toBe(200);

    const pollData = (await pollRes.json()) as any;
    expect(pollData.status).toBe("authenticated");
    expect(pollData.user.username).toBe("sarah_connor");
    expect(pollData.token).toBe(storedUser?.apiToken);

    const cookieHeader = pollRes.headers.get("Set-Cookie");
    expect(cookieHeader).toBeDefined();
    expect(cookieHeader).toContain(`user_token=${storedUser?.apiToken}`);
    expect(cookieHeader).toContain("HttpOnly");

    // 4. User can now access /api/user/me using the cookie
    const meReq = new Request("http://localhost/api/user/me", {
      headers: { Cookie: `user_token=${storedUser?.apiToken}` },
    });
    const meRes = await worker.fetch(meReq, { DB: db } as any, mockCtx);
    expect(meRes.status).toBe(200);
    const meData = (await meRes.json()) as any;
    expect(meData.user.telegramId).toBe("99887766");
  });

  it("should handle /start <token> without the login_ prefix", async () => {
    // 1. Create session
    const initRes = await worker.fetch(
      new Request("http://localhost/api/auth/telegram/session"),
      { DB: db } as any,
      mockCtx
    );
    const { sessionToken } = (await initRes.json()) as any;

    // 2. Webhook payload with `/start <token>`
    const webhookReq = new Request("http://localhost/api/telegram/webhook", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: {
          from: { id: 54321, first_name: "Bob", username: "bob_engineer" },
          chat: { id: 54321 },
          text: `/start ${sessionToken}`,
        },
      }),
    });

    const webhookRes = await worker.fetch(webhookReq, { DB: db } as any, mockCtx);
    expect(webhookRes.status).toBe(200);

    // 3. Poll session
    const pollReq = new Request(`http://localhost/api/auth/telegram/session?token=${sessionToken}`);
    const pollRes = await worker.fetch(pollReq, { DB: db } as any, mockCtx);
    const pollData = (await pollRes.json()) as any;
    expect(pollData.status).toBe("authenticated");
    expect(pollData.user.username).toBe("bob_engineer");
  });

  it("should support quick 1-click confirm-session for demo/testing without Telegram app", async () => {
    // 1. Create session
    const initRes = await worker.fetch(
      new Request("http://localhost/api/auth/telegram/session"),
      { DB: db } as any,
      mockCtx
    );
    const { sessionToken } = (await initRes.json()) as any;

    // 2. 1-click confirm
    const confirmReq = new Request("http://localhost/api/auth/telegram/confirm-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token: sessionToken,
        username: "demo_guest",
        first_name: "Demo Guest",
      }),
    });

    const confirmRes = await worker.fetch(confirmReq, { DB: db } as any, mockCtx);
    expect(confirmRes.status).toBe(200);
    const confirmData = (await confirmRes.json()) as any;
    expect(confirmData.success).toBe(true);
    expect(confirmData.user.username).toBe("demo_guest");

    // 3. Subsequent poll reflects authenticated status
    const pollReq = new Request(`http://localhost/api/auth/telegram/session?token=${sessionToken}`);
    const pollRes = await worker.fetch(pollReq, { DB: db } as any, mockCtx);
    const pollData = (await pollRes.json()) as any;
    expect(pollData.status).toBe("authenticated");
    expect(pollData.user.username).toBe("demo_guest");
  });

  it("should preserve original apiToken when existing user re-logs in via bot", async () => {
    // 1. First login
    const session1Res = await worker.fetch(new Request("http://localhost/api/auth/telegram/session"), { DB: db } as any, mockCtx);
    const { sessionToken: token1 } = (await session1Res.json()) as any;

    await worker.fetch(
      new Request("http://localhost/api/telegram/webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: {
            from: { id: 777888, first_name: "Repeat User", username: "repeat_user" },
            chat: { id: 777888 },
            text: `/start login_${token1}`,
          },
        }),
      }),
      { DB: db } as any,
      mockCtx
    );

    const poll1 = await (await worker.fetch(new Request(`http://localhost/api/auth/telegram/session?token=${token1}`), { DB: db } as any, mockCtx)).json() as any;
    const initialToken = poll1.token;

    // 2. Second login later with new session
    const session2Res = await worker.fetch(new Request("http://localhost/api/auth/telegram/session"), { DB: db } as any, mockCtx);
    const { sessionToken: token2 } = (await session2Res.json()) as any;

    await worker.fetch(
      new Request("http://localhost/api/telegram/webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: {
            from: { id: 777888, first_name: "Repeat User (Updated)", username: "repeat_user" },
            chat: { id: 777888 },
            text: `/start login_${token2}`,
          },
        }),
      }),
      { DB: db } as any,
      mockCtx
    );

    const poll2 = await (await worker.fetch(new Request(`http://localhost/api/auth/telegram/session?token=${token2}`), { DB: db } as any, mockCtx)).json() as any;
    expect(poll2.token).toBe(initialToken);
    expect(poll2.user.firstName).toBe("Repeat User (Updated)");
  });

  it("should return error if /api/telegram/setup-webhook is called without TELEGRAM_BOT_TOKEN", async () => {
    const res = await worker.fetch(
      new Request("http://localhost/api/telegram/setup-webhook"),
      { DB: db } as any,
      mockCtx
    );
    expect(res.status).toBe(400);
    const data = (await res.json()) as any;
    expect(data.error).toContain("TELEGRAM_BOT_TOKEN not configured");
  });
});
