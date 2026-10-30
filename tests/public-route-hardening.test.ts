import { describe, it, expect, beforeEach } from "vitest";
import { InMemoryD1Database } from "../src/db/in-memory-db.js";
import { CompanyRepository, JobRepository, LlmFeedbackRepository } from "../src/db/repositories.js";
import { McpServerHandler } from "../src/mcp/mcp-server.js";
import { resetAdminAuthRateLimit } from "../src/index.js";
import worker from "../src/index.js";
import { signTelegramLogin, tgEnv } from "./helpers/telegram.js";
import type { Company, Job, User } from "../src/types/domain.js";

const ADMIN = "test-admin-secret-0123456789abcdef";
const ctx = { waitUntil: () => {}, passThroughOnException: () => {} } as any;

function catalogJob(id: string, patch: Partial<Job> = {}): Job {
  const seen = 1_700_000_000_000;
  return {
    id,
    companyId: "comp_dl32",
    careerPageId: "page_dl32",
    title: `Role ${id}`,
    seniorityLevel: "mid",
    techCategory: "backend_systems",
    isTechRole: true,
    employmentType: "full-time",
    isRemote: true,
    remoteScope: "worldwide",
    skills: ["TypeScript"],
    applyType: "email",
    applyTarget: "jobs@micro.example",
    status: "open",
    contentHash: `hash_${id}`,
    firstSeenAt: seen,
    lastSeenAt: seen,
    ...patch,
  };
}

function company(id: string, name: string, domain: string): Company {
  return {
    id,
    domain,
    name,
    websiteUrl: `https://${domain}`,
    techStack: [],
    socialLinks: {},
    discoverySource: "seed",
    createdAt: 1,
    updatedAt: 1,
  };
}

describe("public catalog redaction", () => {
  let db: InMemoryD1Database;

  beforeEach(async () => {
    db = new InMemoryD1Database();
    resetAdminAuthRateLimit();
    await new JobRepository(db).upsert(catalogJob("job_contact", {
      title: "Support Engineer",
      descriptionSummary: "Budget 180000. Email ada@example.com or call (312) 555-0199 about the role.",
      rawContent: "RAW_PUBLIC_SECRET",
    }));
  });

  it("redacts descriptionSummary on GET /api/jobs and omits rawContent", async () => {
    const res = await worker.fetch(
      new Request("http://localhost/api/jobs?search=Support%20Engineer&paged=true"),
      { DB: db } as any,
      ctx
    );
    expect(res.status).toBe(200);
    const body = await res.json() as { items: { descriptionSummary?: string }[] };
    const summary = body.items[0]?.descriptionSummary ?? "";
    expect(summary).toContain("Budget 180000");
    expect(summary).toContain("[redacted-email]");
    expect(summary).toContain("[redacted-phone]");
    expect(summary).not.toContain("ada@example.com");
    expect(summary).not.toContain("(312) 555-0199");
    expect(JSON.stringify(body)).not.toContain("rawContent");
    expect(JSON.stringify(body)).not.toContain("RAW_PUBLIC_SECRET");
  });

  it("maps ranking jobs through the public view and drops rawContent", async () => {
    const res = await worker.fetch(
      new Request("http://localhost/api/reports/realtime-jd-ranking?limit=5"),
      { DB: db } as any,
      ctx
    );
    expect(res.status).toBe(200);
    const body = await res.json() as { topRankedJobs: { job: { descriptionSummary?: string } }[] };
    expect(body.topRankedJobs.length).toBeGreaterThan(0);
    const summary = body.topRankedJobs[0]?.job.descriptionSummary ?? "";
    expect(summary).not.toContain("ada@example.com");
    expect(summary).toContain("[redacted-email]");
    expect(Object.hasOwn(body.topRankedJobs[0]!.job, "rawContent")).toBe(false);
    expect(JSON.stringify(body)).not.toContain("RAW_PUBLIC_SECRET");
  });

  it("does not return rawContent from MCP get_job_details", async () => {
    const mcp = new McpServerHandler(new JobRepository(db), new CompanyRepository(db));
    const user: User = {
      id: "usr_mcp",
      telegramId: "1",
      firstName: "Ada",
      apiToken: "orp_testtoken0123456789abcdef",
      createdAt: 1,
      updatedAt: 1,
    };
    const result = await mcp.handleJsonRpc({
      jsonrpc: "2.0",
      id: 1,
      method: "tools/call",
      params: { name: "get_job_details", arguments: { job_id: "job_contact" } },
    }, user);
    const text = JSON.stringify(result);
    expect(text).not.toContain("RAW_PUBLIC_SECRET");
    expect(text).not.toContain("ada@example.com");
    expect(text).toContain("[redacted-email]");
  });
});

describe("company and feedback search limits", () => {
  let db: InMemoryD1Database;

  beforeEach(async () => {
    db = new InMemoryD1Database();
    resetAdminAuthRateLimit();
    const companies = new CompanyRepository(db);
    await companies.upsert(company("comp_pct", "100%_labs", "pct.example"));
    await companies.upsert(company("comp_wild", "100Xlabs", "wild.example"));
    const feedback = new LlmFeedbackRepository(db);
    await feedback.create({ userId: "usr_1", feedbackType: "general_suggestion", comment: "see 100%_note please" });
    await feedback.create({ userId: "usr_1", feedbackType: "general_suggestion", comment: "see 100Xnote please" });
  });

  it("treats company search wildcards as literal and rejects a term over 100 characters", async () => {
    const params = new URLSearchParams({ search: "100%_labs", paged: "true" });
    const res = await worker.fetch(new Request(`http://localhost/api/companies?${params}`), { DB: db } as any, ctx);
    expect(res.status).toBe(200);
    const body = await res.json() as { items: { name: string }[]; pagination: { total: number } };
    expect(body.pagination.total).toBe(1);
    expect(body.items.map((item) => item.name)).toEqual(["100%_labs"]);

    const tooLong = new URLSearchParams({ q: "c".repeat(101), paged: "true" });
    const rejected = await worker.fetch(new Request(`http://localhost/api/companies?${tooLong}`), { DB: db } as any, ctx);
    expect(rejected.status).toBe(400);
    expect(((await rejected.json()) as { error: string }).error).toContain("100");
  });

  it("treats admin feedback search wildcards as literal and rejects a term over 100 characters", async () => {
    const headers = { "x-admin-token": ADMIN };
    const env = { DB: db, ADMIN_TOKEN: ADMIN } as any;
    const params = new URLSearchParams({ search: "100%_note" });
    const res = await worker.fetch(new Request(`http://localhost/api/admin/feedbacks?${params}`, { headers }), env, ctx);
    expect(res.status).toBe(200);
    const body = await res.json() as { items: { comment: string }[] };
    expect(body.items.map((item) => item.comment)).toEqual(["see 100%_note please"]);

    const tooLong = new URLSearchParams({ search: "f".repeat(101) });
    const rejected = await worker.fetch(
      new Request(`http://localhost/api/admin/feedbacks?${tooLong}`, { headers }),
      env,
      ctx
    );
    expect(rejected.status).toBe(400);
    expect(((await rejected.json()) as { error: string }).error).toContain("100");
  });
});

describe("user_token cookie", () => {
  it("sets Secure on login and on logout", async () => {
    const db = new InMemoryD1Database();
    const login = await worker.fetch(
      new Request("http://localhost/api/auth/telegram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(signTelegramLogin({ username: "ada_dev", first_name: "Ada" })),
      }),
      tgEnv({ DB: db }),
      ctx
    );
    expect(login.status).toBe(200);
    const setCookie = login.headers.get("Set-Cookie") ?? "";
    expect(setCookie).toContain("user_token=");
    expect(setCookie).toContain("HttpOnly");
    expect(setCookie).toContain("Secure");
    expect(setCookie).toContain("SameSite=Lax");

    const logout = await worker.fetch(
      new Request("http://localhost/api/auth/logout", { method: "POST" }),
      tgEnv({ DB: db }),
      ctx
    );
    const cleared = logout.headers.get("Set-Cookie") ?? "";
    expect(cleared).toContain("Secure");
    expect(cleared).toContain("Max-Age=0");
  });
});
