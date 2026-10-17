import { tgEnv, signTelegramLogin, TG_WEBHOOK_HEADERS, TEST_BOT_TOKEN, TEST_WEBHOOK_SECRET } from "./helpers/telegram.js";
import { describe, it, expect, beforeEach } from "vitest";
import { InMemoryD1Database } from "../src/db/in-memory-db.js";
import {
  UserRepository,
  CvRepository,
  JobRepository,
  CompanyRepository,
} from "../src/db/repositories.js";
import worker from "../src/index.js";

describe("Telegram Auth, CV Management & MCP Server Suite", () => {
  let db: InMemoryD1Database;
  let userRepo: UserRepository;
  let cvRepo: CvRepository;
  let jobRepo: JobRepository;
  let companyRepo: CompanyRepository;

  const mockCtx = {
    waitUntil: (p: Promise<unknown>) => p,
    passThroughOnException: () => {},
  } as any;

  beforeEach(() => {
    db = new InMemoryD1Database();
    userRepo = new UserRepository(db);
    cvRepo = new CvRepository(db);
    jobRepo = new JobRepository(db);
    companyRepo = new CompanyRepository(db);
  });

  describe("Telegram Authentication & Session", () => {
    it("should authenticate via Telegram handle and generate orp_ token and cookie", async () => {
      const payload = {
        username: "johndoe_dev",
        first_name: "John",
        id: 12345678,
      };

      const req = new Request("http://localhost/api/auth/telegram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(signTelegramLogin(payload)),
      });

      const res = await worker.fetch(req, tgEnv({ DB: db }), mockCtx);
      expect(res.status).toBe(200);

      const data = (await res.json()) as any;
      expect(data.success).toBe(true);
      expect(data.user).toBeDefined();
      expect(data.user.username).toBe("johndoe_dev");
      expect(data.user.firstName).toBe("John");
      expect(data.user.apiToken).toMatch(/^orp_[a-f0-9]{32}$/);

      // Verify Set-Cookie header
      const cookieHeader = res.headers.get("Set-Cookie");
      expect(cookieHeader).toBeDefined();
      expect(cookieHeader).toContain(`user_token=${data.user.apiToken}`);
      expect(cookieHeader).toContain("HttpOnly");
    });

    it("should verify authenticated user via /api/user/me", async () => {
      // 1. Create user via Telegram auth
      const authRes = await worker.fetch(
        new Request("http://localhost/api/auth/telegram", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(signTelegramLogin({ username: "alice_engineer", first_name: "Alice" })),
        }),
        tgEnv({ DB: db }),
        mockCtx
      );
      const authData = (await authRes.json()) as any;
      const token = authData.user.apiToken;

      // 2. Unauthenticated request should fail
      const unauthRes = await worker.fetch(
        new Request("http://localhost/api/user/me"),
        tgEnv({ DB: db }),
        mockCtx
      );
      expect(unauthRes.status).toBe(401);

      // 3. Authenticated request with Bearer header should succeed
      const authHeaderRes = await worker.fetch(
        new Request("http://localhost/api/user/me", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        tgEnv({ DB: db }),
        mockCtx
      );
      expect(authHeaderRes.status).toBe(200);
      const meData = (await authHeaderRes.json()) as any;
      expect(meData.user.username).toBe("alice_engineer");

      // 4. Logout should clear cookie
      const logoutRes = await worker.fetch(
        new Request("http://localhost/api/auth/logout", { method: "POST" }),
        tgEnv({ DB: db }),
        mockCtx
      );
      expect(logoutRes.status).toBe(200);
      expect(logoutRes.headers.get("Set-Cookie")).toContain("Max-Age=0");
    });
  });

  describe("CV Multi-Version Storage & JD Tailoring", () => {
    let testToken: string;

    beforeEach(async () => {
      const authRes = await worker.fetch(
        new Request("http://localhost/api/auth/telegram", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(signTelegramLogin({ username: "bob_dev", first_name: "Bob" })),
        }),
        tgEnv({ DB: db }),
        mockCtx
      );
      const data = (await authRes.json()) as any;
      testToken = data.user.apiToken;

      // Seed a test company and job
      await companyRepo.upsert({
        id: "comp_promptloop",
        name: "PromptLoop",
        domain: "promptloop.com",
        websiteUrl: "https://promptloop.com",
        techStack: ["Python", "PyTorch", "TypeScript"],
        socialLinks: {},
        discoverySource: "seed",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      await jobRepo.upsert({
        id: "job_promptloop_ai_eng",
        companyId: "comp_promptloop",
        companyName: "PromptLoop",
        careerPageId: "page_promptloop_1",
        title: "Senior AI Engineer (LLM & Python)",
        descriptionSummary: "Build high-throughput LLM pipelines and AI models.",
        rawContent: "Must have deep expertise with Python, PyTorch, LangChain, TypeScript, and Cloudflare Workers.",
        applyType: "url",
        applyTarget: "https://promptloop.com/careers/ai-engineer",
        employmentType: "full-time",
        isRemote: true,
        remoteScope: "us-only",
        isTechRole: true,
        seniorityLevel: "senior",
        techCategory: "ai_ml",
        skills: ["Python", "PyTorch", "LangChain", "TypeScript", "Cloudflare Workers"],
        firstSeenAt: Date.now(),
        lastSeenAt: Date.now(),
        status: "open",
        contentHash: "hash_test_promptloop",
      });
    });

    it("should perform full CV CRUD operations", async () => {
      // 1. Create a master CV
      const createRes = await worker.fetch(
        new Request("http://localhost/api/user/cvs", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${testToken}`,
          },
          body: JSON.stringify({
            title: "Master Backend CV",
            targetRole: "Backend Engineer",
            skills: ["TypeScript", "Node.js", "PostgreSQL", "Docker"],
            content: "# Bob - Backend Engineer\n\nExperienced in TypeScript, Node.js, and distributed SQL.",
          }),
        }),
        tgEnv({ DB: db }),
        mockCtx
      );
      expect(createRes.status).toBe(201);
      const createData = (await createRes.json()) as any;
      expect(createData.cv.id).toBeDefined();
      const cvId = createData.cv.id;

      // 2. List user's CVs
      const listRes = await worker.fetch(
        new Request("http://localhost/api/user/cvs", {
          headers: { Authorization: `Bearer ${testToken}` },
        }),
        tgEnv({ DB: db }),
        mockCtx
      );
      expect(listRes.status).toBe(200);
      const listData = (await listRes.json()) as any;
      expect(listData.items.length).toBe(1);
      expect(listData.items[0].title).toBe("Master Backend CV");

      // 3. Get CV by ID
      const getRes = await worker.fetch(
        new Request(`http://localhost/api/user/cvs/${cvId}`, {
          headers: { Authorization: `Bearer ${testToken}` },
        }),
        tgEnv({ DB: db }),
        mockCtx
      );
      expect(getRes.status).toBe(200);
      const getData = (await getRes.json()) as any;
      expect(getData.cv.title).toBe("Master Backend CV");

      // 4. Update CV
      const updateRes = await worker.fetch(
        new Request(`http://localhost/api/user/cvs/${cvId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${testToken}`,
          },
          body: JSON.stringify({
            title: "Senior Backend Engineer CV v2",
            targetRole: "Lead Engineer",
          }),
        }),
        tgEnv({ DB: db }),
        mockCtx
      );
      expect(updateRes.status).toBe(200);
      const updateData = (await updateRes.json()) as any;
      expect(updateData.cv.title).toBe("Senior Backend Engineer CV v2");
      expect(updateData.cv.targetRole).toBe("Lead Engineer");

      // 5. Delete CV
      const delRes = await worker.fetch(
        new Request(`http://localhost/api/user/cvs/${cvId}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${testToken}` },
        }),
        tgEnv({ DB: db }),
        mockCtx
      );
      expect(delRes.status).toBe(200);

      // Verify deletion
      const checkListRes = await worker.fetch(
        new Request("http://localhost/api/user/cvs", {
          headers: { Authorization: `Bearer ${testToken}` },
        }),
        tgEnv({ DB: db }),
        mockCtx
      );
      const checkListData = (await checkListRes.json()) as any;
      expect(checkListData.items.length).toBe(0);
    });

    it("should analyze JD keyword match score and suggest tailored CV", async () => {
      const tailorRes = await worker.fetch(
        new Request("http://localhost/api/user/cvs/tailor", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${testToken}`,
          },
          body: JSON.stringify({
            jobId: "job_promptloop_ai_eng",
            customCvContent: "# Bob's Resume\nExperienced in Python, PyTorch, and building AI tools.",
          }),
        }),
        tgEnv({ DB: db }),
        mockCtx
      );

      expect(tailorRes.status).toBe(200);
      const tailorData = (await tailorRes.json()) as any;
      expect(tailorData.success).toBe(true);

      const analysis = tailorData.analysis;
      expect(analysis.jobTitle).toBe("Senior AI Engineer (LLM & Python)");
      expect(analysis.companyName).toBe("PromptLoop");
      // Python and PyTorch matched out of 5 skills -> 40% match
      expect(analysis.matchScore).toBeGreaterThanOrEqual(40);
      expect(analysis.matchedSkills).toContain("Python");
      expect(analysis.matchedSkills).toContain("PyTorch");
      expect(analysis.missingSkills).toContain("LangChain");
      expect(analysis.suggestedSummary).toBeDefined();
      expect(analysis.tailoredCvMarkdown).toContain("Executive Summary");
      expect(analysis.tailoredCvMarkdown).toContain("Python");
    });
  });

  describe("MCP Server JSON-RPC Protocol (/mcp)", () => {
    let testToken: string;

    beforeEach(async () => {
      const authRes = await worker.fetch(
        new Request("http://localhost/api/auth/telegram", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(signTelegramLogin({ username: "mcp_tester", first_name: "MCP Tester" })),
        }),
        tgEnv({ DB: db }),
        mockCtx
      );
      const data = (await authRes.json()) as any;
      testToken = data.user.apiToken;

      await jobRepo.upsert({
        id: "job_sixfeetup_python",
        companyId: "comp_sixfeetup",
        companyName: "Six Feet Up",
        careerPageId: "page_sixfeetup_1",
        title: "Senior Python & AWS Developer",
        descriptionSummary: "Python development for enterprise clients.",
        applyType: "email",
        applyTarget: "jobs@sixfeetup.com",
        employmentType: "full-time",
        isRemote: true,
        remoteScope: "us-only",
        isTechRole: true,
        seniorityLevel: "senior",
        techCategory: "backend_systems",
        skills: ["Python", "AWS", "Docker"],
        firstSeenAt: Date.now(),
        lastSeenAt: Date.now(),
        status: "open",
        contentHash: "hash_test_sixfeetup",
      });
    });

    it("should reject MCP request without authentication", async () => {
      const req = new Request("http://localhost/mcp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/list" }),
      });
      const res = await worker.fetch(req, tgEnv({ DB: db }), mockCtx);
      expect(res.status).toBe(401);
    });

    it("should respond to MCP initialize method with capabilities", async () => {
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
            clientInfo: { name: "cursor", version: "0.45.0" },
          },
        }),
      });

      const res = await worker.fetch(req, tgEnv({ DB: db }), mockCtx);
      expect(res.status).toBe(200);

      const data = (await res.json()) as any;
      expect(data.jsonrpc).toBe("2.0");
      expect(data.id).toBe(1);
      expect(data.result.serverInfo.name).toBe("off-radar-jobs-mcp");
      expect(data.result.capabilities.tools).toBeDefined();
    });

    it("should list 6 tools via tools/list", async () => {
      const req = new Request("http://localhost/mcp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${testToken}`,
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 2,
          method: "tools/list",
        }),
      });

      const res = await worker.fetch(req, tgEnv({ DB: db }), mockCtx);
      expect(res.status).toBe(200);

      const data = (await res.json()) as any;
      expect(data.result.tools).toBeDefined();
      const toolNames = data.result.tools.map((t: any) => t.name);
      expect(toolNames).toContain("search_jobs");
      expect(toolNames).toContain("get_job_details");
      expect(toolNames).toContain("list_companies");
      expect(toolNames).toContain("list_user_cvs");
      expect(toolNames).toContain("tailor_cv_for_job");
      expect(toolNames).toContain("save_cv_version");
    });

    it("should execute tools/call search_jobs and return matching jobs", async () => {
      const req = new Request("http://localhost/mcp", {
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
            name: "search_jobs",
            arguments: {
              query: "Python",
              tech_category: "backend_systems",
            },
          },
        }),
      });

      const res = await worker.fetch(req, tgEnv({ DB: db }), mockCtx);
      expect(res.status).toBe(200);

      const data = (await res.json()) as any;
      expect(data.result.content).toBeDefined();
      const parsed = JSON.parse(data.result.content[0].text);
      expect(parsed.jobs.length).toBeGreaterThan(0);
      expect(parsed.jobs[0].title).toContain("Python");
    });

    it("should execute tools/call tailor_cv_for_job via MCP", async () => {
      const req = new Request("http://localhost/mcp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${testToken}`,
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 4,
          method: "tools/call",
          params: {
            name: "tailor_cv_for_job",
            arguments: {
              job_id: "job_sixfeetup_python",
              custom_cv_content: "# Developer CV\nSkilled in Python and Docker backend services.",
            },
          },
        }),
      });

      const res = await worker.fetch(req, tgEnv({ DB: db }), mockCtx);
      expect(res.status).toBe(200);

      const data = (await res.json()) as any;
      const parsed = JSON.parse(data.result.content[0].text);
      expect(parsed.jobTitle).toBe("Senior Python & AWS Developer");
      expect(parsed.matchScore).toBeGreaterThanOrEqual(50);
      expect(parsed.matchedSkills).toContain("Python");
      expect(parsed.missingSkills).toContain("AWS");
    });
  });

  describe("Dashboard Frontend UI Integration", () => {
    it("should render Telegram auth and MCP setup elements in dashboard HTML", async () => {
      const req = new Request("http://localhost/");
      const res = await worker.fetch(req, tgEnv({ DB: db }), mockCtx);
      expect(res.status).toBe(200);

      const html = await res.text();
      expect(html).toContain('id="auth-section"');
      expect(html).toContain('id="modal-login"');
      expect(html).toContain('id="modal-mcp"');
      expect(html).toContain('id="modal-my-cvs"');
      expect(html).toContain('id="modal-tailor"');
      expect(html).toContain("✨ Tailor CV");
      expect(html).toContain("submitTelegramLogin");
      expect(html).toContain("openMcpModal");
    });
  });
});
