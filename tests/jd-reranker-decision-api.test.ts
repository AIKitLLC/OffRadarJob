import { describe, it, expect, beforeEach } from "vitest";
import { JdRerankerService } from "../src/services/jd-reranker.js";
import { DecisionApiService } from "../src/services/decision-api.js";
import { Job, Company, TARGET_GROUPS } from "../src/types/domain.js";
import { InMemoryD1Database } from "../src/db/in-memory-db.js";
import {
  JobRepository,
  CompanyRepository,
  CvRepository,
  UserRepository,
  UserSubscriptionRepository,
  LlmFeedbackRepository,
} from "../src/db/repositories.js";
import { McpServerHandler } from "../src/mcp/mcp-server.js";
import worker from "../src/index.js";

describe("Continuous JD Reranker & Cloudflare Decision CV Optimizer Suite", () => {
  const mockNow = 1750000000000; // Deterministic test timestamp

  const sampleCompany: Company = {
    id: "comp_flyio",
    domain: "fly.io",
    name: "Fly.io",
    websiteUrl: "https://fly.io",
    techStack: ["Rust", "Go", "Docker", "Linux"],
    socialLinks: {},
    discoverySource: "seed",
    isMidwest: true,
    usRegion: "midwest",
    fundingStage: "series_b",
    companyTier: "tier_1",
    valuationEstimate: "$500M",
    createdAt: mockNow - 1000 * 60 * 60 * 24 * 30,
    updatedAt: mockNow,
  };

  const sampleAiJob: Job = {
    id: "job_ai_agent_eng",
    companyId: "comp_flyio",
    companyName: "Fly.io",
    careerPageId: "page_fly",
    title: "Founding AI Agent Engineer",
    descriptionSummary: "Build autonomous LLM agents, MCP tools, and Workers AI inference pipelines.",
    applyType: "url",
    applyTarget: "https://fly.io/jobs/ai-agent",
    employmentType: "full-time",
    location: "Chicago, IL",
    isRemote: true,
    remoteScope: "worldwide",
    isMidwest: true,
    usRegion: "midwest",
    isTechRole: true,
    seniorityLevel: "founding",
    techCategory: "ai_ml",
    skills: ["TypeScript", "Python", "Workers AI", "LLM", "MCP", "RAG"],
    salaryMin: 180000,
    salaryMax: 230000,
    salaryCurrency: "USD",
    status: "open",
    contentHash: "hash_ai_1",
    firstSeenAt: mockNow - 1000 * 60 * 60 * 24 * 1, // 1 day ago
    lastSeenAt: mockNow - 1000 * 60 * 60 * 2, // 2 hours ago
  };

  const sampleScaleupJob: Job = {
    id: "job_dist_sys_eng",
    companyId: "comp_flyio",
    companyName: "Fly.io",
    careerPageId: "page_fly",
    title: "Senior Distributed Systems Engineer",
    descriptionSummary: "High-throughput microservices, Kafka streaming, and Kubernetes cluster orchestration.",
    applyType: "url",
    applyTarget: "https://fly.io/jobs/distributed",
    employmentType: "full-time",
    location: "Chicago, IL",
    isRemote: false,
    remoteScope: "us_only",
    isMidwest: true,
    usRegion: "midwest",
    isTechRole: true,
    seniorityLevel: "senior",
    techCategory: "backend_systems",
    skills: ["Go", "Kafka", "PostgreSQL", "Kubernetes", "Docker", "Distributed Systems"],
    salaryMin: 160000,
    salaryMax: 210000,
    salaryCurrency: "USD",
    status: "open",
    contentHash: "hash_dist_1",
    firstSeenAt: mockNow - 1000 * 60 * 60 * 24 * 4,
    lastSeenAt: mockNow - 1000 * 60 * 60 * 24 * 3,
  };

  describe("1. JdRerankerService Unit Tests", () => {
    let reranker: JdRerankerService;

    beforeEach(() => {
      reranker = new JdRerankerService();
    });

    it("should compute high composite score and 'trending_up' for fresh AI job with transparent salary", () => {
      const scores = reranker.rerankJob(sampleAiJob, sampleCompany, mockNow);

      expect(scores.demandScore).toBeGreaterThanOrEqual(80);
      expect(scores.freshnessScore).toBeGreaterThanOrEqual(95);
      expect(scores.transparencyScore).toBeGreaterThanOrEqual(80);
      expect(scores.compositeScore).toBeGreaterThanOrEqual(80);
      expect(scores.trendDirection).toBe("trending_up");
      expect(scores.primaryTargetGroup).toBe("ai_first_innovators");
    });

    it("should classify distributed systems job into scaleups_growth target group", () => {
      const scores = reranker.rerankJob(sampleScaleupJob, sampleCompany, mockNow);

      expect(scores.primaryTargetGroup).toBe("scaleups_growth");
      expect(scores.targetGroupFit.scaleups_growth).toBeGreaterThanOrEqual(80);
      expect(scores.compositeScore).toBeGreaterThanOrEqual(70);
    });

    it("should aggregate trending skills and target group breakdowns in real-time report", () => {
      const companiesMap = new Map<string, Company>([[sampleCompany.id, sampleCompany]]);
      const report = reranker.generateRealtimeReport(
        [sampleAiJob, sampleScaleupJob],
        companiesMap,
        mockNow
      );

      expect(report.totalJdsAnalyzed).toBe(2);
      expect(report.topRankedJobs.length).toBe(2);
      expect(report.topRankedJobs[0]!.rerank.compositeScore).toBeGreaterThanOrEqual(
        report.topRankedJobs[1]!.rerank.compositeScore
      );

      // Trending skills check
      expect(report.trendingSkills.length).toBeGreaterThan(0);
      const skillNames = report.trendingSkills.map((s) => s.skill.toLowerCase());
      expect(skillNames).toContain("typescript");

      // Target group check
      expect(report.targetGroupBreakdown.ai_first_innovators.count).toBe(1);
      expect(report.targetGroupBreakdown.scaleups_growth.count).toBe(1);
      expect(report.marketSummary).toContain("Real-time index");
    });
  });

  describe("2. DecisionApiService Unit Tests (Additions & Removals)", () => {
    let decisionService: DecisionApiService;

    beforeEach(() => {
      decisionService = new DecisionApiService();
    });

    it("should suggest adding missing high-demand skills and removing outdated tech (jQuery, SVN)", async () => {
      const legacyCv = `# Alex Dev - Software Developer

## Experience
- Worked on monolithic web apps with jQuery and SVN.
- A very hard worker and detail oriented team player.

## Skills
HTML, CSS, JavaScript, jQuery, Subversion (SVN)`;

      const result = await decisionService.optimizeCvForTargetGroup(
        legacyCv,
        "early_stage_startups"
      );

      expect(result.targetGroup).toBe("early_stage_startups");
      expect(result.currentMatchScore).toBeLessThan(75);
      expect(result.projectedMatchScore).toBeGreaterThanOrEqual(85);

      // Check Additions (Add skill / additions)
      expect(result.additions.length).toBeGreaterThan(0);
      const additionItems = result.additions.map((a) => a.item);
      expect(additionItems.some((item) => item.includes("Add skill") || item.includes("Thêm kĩ năng") || item.includes("MVP"))).toBe(true);

      // Check Removals (Bớt)
      expect(result.removals.length).toBeGreaterThan(0);
      const removalItems = result.removals.map((r) => r.item.toLowerCase());
      expect(removalItems.some((r) => r.includes("jquery"))).toBe(true);
      expect(removalItems.some((r) => r.includes("subversion") || r.includes("svn"))).toBe(true);
      expect(removalItems.some((r) => r.includes("hard worker") || r.includes("team player"))).toBe(true);

      // Check synthesized markdown
      expect(result.optimizedCvContent).toContain("Target Profile: Early-Stage Startups & Stealth");
      expect(result.optimizedCvContent.toLowerCase()).not.toContain("jquery");
    });

    it("should tailor CV with AI-first keywords and RAG architecture for ai_first_innovators", async () => {
      const baseCv = `# Morgan - Backend Engineer

## Experience
- Built REST APIs in Node.js and Postgres.

## Skills
Node.js, PostgreSQL`;

      const result = await decisionService.optimizeCvForTargetGroup(
        baseCv,
        "ai_first_innovators"
      );

      expect(result.targetGroup).toBe("ai_first_innovators");
      expect(result.additions.some((a) => a.item.includes("LLM") || a.item.includes("Workers AI"))).toBe(true);
      expect(result.targetGroupStrategy).toContain("AI-First & LLM Innovators");
      expect(result.topDemandedSkillsInSegment.length).toBeGreaterThan(0);
    });
  });

  describe("3. MCP Server Handler Integration Tests", () => {
    let db: InMemoryD1Database;
    let jobRepo: JobRepository;
    let companyRepo: CompanyRepository;
    let cvRepo: CvRepository;
    let userRepo: UserRepository;
    let mcpHandler: McpServerHandler;

    const testUser = {
      id: "usr_mcp_test",
      telegramId: "12345678",
      firstName: "TestUser",
      apiToken: "tok_test_mcp",
      createdAt: mockNow,
      updatedAt: mockNow,
    };

    beforeEach(async () => {
      db = new InMemoryD1Database();
      jobRepo = new JobRepository(db);
      companyRepo = new CompanyRepository(db);
      cvRepo = new CvRepository(db);
      userRepo = new UserRepository(db);

      await userRepo.upsert(testUser);
      await companyRepo.upsert(sampleCompany);
      await jobRepo.upsert(sampleAiJob);
      await jobRepo.upsert(sampleScaleupJob);

      mcpHandler = new McpServerHandler(
        jobRepo,
        companyRepo,
        cvRepo,
        undefined,
        undefined,
        undefined,
        new DecisionApiService(),
        new JdRerankerService()
      );
    });

    it("should return tool definitions including new rerank and decision tools", () => {
      const tools = mcpHandler.getToolDefinitions();
      const toolNames = tools.map((t) => t.name);

      expect(toolNames).toContain("get_realtime_jd_ranking_report");
      expect(toolNames).toContain("optimize_cv_with_decision_api");
      expect(toolNames).toContain("list_target_groups");
    });

    it("should execute 'get_realtime_jd_ranking_report' via JSON-RPC", async () => {
      const rpcReq = {
        jsonrpc: "2.0",
        id: 1,
        method: "tools/call",
        params: {
          name: "get_realtime_jd_ranking_report",
          arguments: { target_group: "all", limit: 5 },
        },
      };

      const res = await mcpHandler.handleJsonRpc(rpcReq, testUser);
      expect(res.error).toBeUndefined();
      const content = JSON.parse(res.result.content[0].text);

      expect(content.total_jds_analyzed).toBe(2);
      expect(content.top_ranked_jds.length).toBe(2);
      expect(content.trending_skills.length).toBeGreaterThan(0);
      expect(content.top_ranked_jds[0].composite_score).toBeGreaterThanOrEqual(70);
    });

    it("should execute 'optimize_cv_with_decision_api' and auto-save version", async () => {
      const rpcReq = {
        jsonrpc: "2.0",
        id: 2,
        method: "tools/call",
        params: {
          name: "optimize_cv_with_decision_api",
          arguments: {
            target_group: "ai_first_innovators",
            custom_cv_content: "# Test Candidate\n\n## Skills\nTypeScript, Python",
            save_as_version: true,
            version_title: "AI Specialist CV",
          },
        },
      };

      const res = await mcpHandler.handleJsonRpc(rpcReq, testUser);
      expect(res.error).toBeUndefined();
      const content = JSON.parse(res.result.content[0].text);

      expect(content.success).toBe(true);
      expect(content.target_group).toBe("ai_first_innovators");
      expect(content.additions.length).toBeGreaterThan(0);
      expect(content.saved_version_id).toBeTruthy();

      // Check that it was persisted in cvRepo
      const saved = await cvRepo.getById(content.saved_version_id, testUser.id);
      expect(saved).not.toBeNull();
      expect(saved?.title).toBe("AI Specialist CV");
      expect(saved?.targetGroup).toBe("ai_first_innovators");
    });

    it("should execute 'list_target_groups' via JSON-RPC", async () => {
      const rpcReq = {
        jsonrpc: "2.0",
        id: 3,
        method: "tools/call",
        params: {
          name: "list_target_groups",
          arguments: {},
        },
      };

      const res = await mcpHandler.handleJsonRpc(rpcReq, testUser);
      expect(res.error).toBeUndefined();
      const content = JSON.parse(res.result.content[0].text);

      expect(content.total_groups).toBe(Object.keys(TARGET_GROUPS).length);
      expect(content.target_groups.some((g: any) => g.id === "midwest_regional")).toBe(true);
    });
  });

  describe("4. End-to-End REST API Endpoints", () => {
    let db: InMemoryD1Database;
    let env: any;
    const testToken = "test_user_api_token_123";

    beforeEach(async () => {
      db = new InMemoryD1Database();
      env = {
        DB: db,
        ADMIN_TOKEN: "test-admin-secret-2026-0123456789abcdef",
      };

      const userRepo = new UserRepository(db);
      const companyRepo = new CompanyRepository(db);
      const jobRepo = new JobRepository(db);

      await userRepo.upsert({
        id: "usr_api_test",
        telegramId: "98765432",
        firstName: "Quynh",
        apiToken: testToken,
        createdAt: mockNow,
        updatedAt: mockNow,
      });

      await companyRepo.upsert(sampleCompany);
      await jobRepo.upsert(sampleAiJob);
      await jobRepo.upsert(sampleScaleupJob);
    });

    it("GET /api/reports/realtime-jd-ranking should return live ranking report", async () => {
      const req = new Request("http://localhost/api/reports/realtime-jd-ranking?limit=10");
      const res = await worker.fetch(req, env, {} as any);

      expect(res.status).toBe(200);
      const data = (await res.json()) as any;
      expect(data.totalJdsAnalyzed).toBe(2);
      expect(data.topRankedJobs.length).toBe(2);
      expect(data.topRankedJobs[0].rerank.compositeScore).toBeGreaterThanOrEqual(70);
    });

    it("GET /api/target-groups should return all target groups", async () => {
      const req = new Request("http://localhost/api/target-groups");
      const res = await worker.fetch(req, env, {} as any);

      expect(res.status).toBe(200);
      const data = (await res.json()) as any;
      expect(data.total).toBe(6);
      expect(data.groups.length).toBe(6);
    });

    it("POST /api/user/cvs/optimize-decision should optimize CV and return additions/removals", async () => {
      const req = new Request("http://localhost/api/user/cvs/optimize-decision", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${testToken}`,
        },
        body: JSON.stringify({
          target_group: "scaleups_growth",
          custom_cv_content: "# Quynh - Backend Dev\n\n## Experience\nBuilt systems using jQuery and PHP 5.\n\n## Skills\njQuery, PHP 5",
          save_as_version: true,
          version_title: "Scaleup Distributed CV",
        }),
      });

      const res = await worker.fetch(req, env, {} as any);
      expect(res.status).toBe(200);
      const data = (await res.json()) as any;

      expect(data.success).toBe(true);
      expect(data.decision.targetGroup).toBe("scaleups_growth");
      expect(data.decision.removals.length).toBeGreaterThan(0);
      expect(data.savedCv).toBeTruthy();
      expect(data.savedCv.title).toBe("Scaleup Distributed CV");
    });

    it("POST /api/admin/rerank should trigger continuous reranking for authorized admin", async () => {
      const req = new Request("http://localhost/api/admin/rerank", {
        method: "POST",
        headers: {
          "x-admin-token": "test-admin-secret-2026-0123456789abcdef",
        },
      });

      const res = await worker.fetch(req, env, {} as any);
      expect(res.status).toBe(200);
      const data = (await res.json()) as any;

      expect(data.success).toBe(true);
      expect(data.totalAnalyzed).toBe(2);
      expect(data.trendingSkillsCount).toBeGreaterThan(0);
    });
  });
});
