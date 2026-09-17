import { describe, it, expect, beforeEach } from "vitest";
import { InMemoryD1Database } from "../src/db/in-memory-db.js";
import { JobRepository, CompanyRepository, CvRepository } from "../src/db/repositories.js";
import { McpServerHandler } from "../src/mcp/mcp-server.js";
import { Company, Job, User } from "../src/types/domain.js";

describe("Company Valuation & Department Weights Suite", () => {
  let db: InMemoryD1Database;
  let jobRepo: JobRepository;
  let compRepo: CompanyRepository;
  let cvRepo: CvRepository;
  let mcpServer: McpServerHandler;

  const mockUser: User = {
    id: "usr_test",
    telegramId: "12345678",
    username: "testuser",
    firstName: "Test",
    apiToken: "orp_test_token_123",
    createdAt: 1000,
    updatedAt: 1000,
  };

  beforeEach(async () => {
    db = new InMemoryD1Database();
    jobRepo = new JobRepository(db);
    compRepo = new CompanyRepository(db);
    cvRepo = new CvRepository(db);
    mcpServer = new McpServerHandler(jobRepo, compRepo, cvRepo);

    // Seed companies with various funding stages
    const comp1: Company = {
      id: "comp_seed_corp",
      domain: "seedcorp.io",
      name: "Seed Corp",
      websiteUrl: "https://seedcorp.io",
      techStack: ["TypeScript", "Node.js"],
      socialLinks: {},
      locationHint: "Chicago, IL",
      discoverySource: "yc_directory",
      fundingStage: "Seed",
      totalFunding: "$3.5M",
      valuationEstimate: "$15M",
      companyTier: "Seed Startup",
      createdAt: 1000,
      updatedAt: 1000,
    };

    const comp2: Company = {
      id: "comp_growth_inc",
      domain: "growthinc.com",
      name: "Growth Inc",
      websiteUrl: "https://growthinc.com",
      techStack: ["Go", "Kubernetes"],
      socialLinks: {},
      locationHint: "Austin, TX",
      discoverySource: "hn_whoishiring",
      fundingStage: "Series B",
      totalFunding: "$45M",
      valuationEstimate: "$200M",
      companyTier: "Growth Stage Tech",
      createdAt: 1000,
      updatedAt: 1000,
    };

    const comp3: Company = {
      id: "comp_bootstrapped_lab",
      domain: "bootstrappedlab.com",
      name: "Bootstrapped Lab",
      websiteUrl: "https://bootstrappedlab.com",
      techStack: ["Python", "Django"],
      socialLinks: {},
      locationHint: "Minneapolis, MN",
      discoverySource: "seed",
      fundingStage: "Bootstrapped",
      companyTier: "Bootstrapped SMB",
      createdAt: 1000,
      updatedAt: 1000,
    };

    await compRepo.upsert(comp1);
    await compRepo.upsert(comp2);
    await compRepo.upsert(comp3);
  });

  describe("1. Department Weights Recalculation", () => {
    it("should calculate correct department weights and set primary department", async () => {
      const now = Date.now();
      // Insert jobs for comp_seed_corp
      // 3 Engineering jobs, 1 Product job
      const jobs: Job[] = [
        {
          id: "job_eng_1",
          companyId: "comp_seed_corp",
          careerPageId: "cp_seed_corp",
          contentHash: "hash_eng_1",
          isTechRole: true,
          remoteScope: "worldwide",
          title: "Senior Backend Engineer",
          department: "Engineering",
          location: "Remote",
          isRemote: true,
          employmentType: "full-time",
          seniorityLevel: "senior",
          techCategory: "backend_systems",
          skills: ["Node.js", "TypeScript"],
          descriptionSummary: "Build core backend APIs",
          applyType: "url",
          applyTarget: "https://seedcorp.io/careers/1",
          status: "open",
          firstSeenAt: now,
          lastSeenAt: now,
        },
        {
          id: "job_eng_2",
          companyId: "comp_seed_corp",
          careerPageId: "cp_seed_corp",
          contentHash: "hash_eng_2",
          isTechRole: true,
          remoteScope: "worldwide",
          title: "Frontend Software Engineer",
          department: "Engineering",
          location: "Remote",
          isRemote: true,
          employmentType: "full-time",
          seniorityLevel: "mid",
          techCategory: "frontend_ui",
          skills: ["React"],
          descriptionSummary: "Build modern dashboard UI",
          applyType: "url",
          applyTarget: "https://seedcorp.io/careers/2",
          status: "open",
          firstSeenAt: now,
          lastSeenAt: now,
        },
        {
          id: "job_eng_3",
          companyId: "comp_seed_corp",
          careerPageId: "cp_seed_corp",
          contentHash: "hash_eng_3",
          isTechRole: true,
          remoteScope: "worldwide",
          title: "Full Stack Developer",
          department: "Engineering",
          location: "Remote",
          isRemote: true,
          employmentType: "full-time",
          seniorityLevel: "senior",
          techCategory: "fullstack",
          skills: ["TypeScript"],
          descriptionSummary: "Full stack engineering",
          applyType: "url",
          applyTarget: "https://seedcorp.io/careers/3",
          status: "open",
          firstSeenAt: now,
          lastSeenAt: now,
        },
        {
          id: "job_prod_1",
          companyId: "comp_seed_corp",
          careerPageId: "cp_seed_corp",
          contentHash: "hash_prod_1",
          isTechRole: true,
          remoteScope: "worldwide",
          title: "Senior Product Designer",
          department: "Product & Design",
          location: "Remote",
          isRemote: true,
          employmentType: "full-time",
          seniorityLevel: "senior",
          techCategory: "product_design",
          skills: ["Figma"],
          descriptionSummary: "Design design systems",
          applyType: "url",
          applyTarget: "https://seedcorp.io/careers/4",
          status: "open",
          firstSeenAt: now,
          lastSeenAt: now,
        },
      ];

      for (const j of jobs) {
        await jobRepo.upsert(j);
      }

      await compRepo.recalculateDepartmentWeights("comp_seed_corp");

      const updatedComp = await compRepo.findById("comp_seed_corp");
      expect(updatedComp).not.toBeNull();
      expect(updatedComp!.primaryDepartment).toBe("Engineering");
      expect(updatedComp!.hiringDepartments).toBeDefined();

      const depts = updatedComp!.hiringDepartments!;
      expect(depts["Engineering"]).toEqual({ count: 3, percentage: 75 });
      expect(depts["Product & Design"]).toEqual({ count: 1, percentage: 25 });
    });

    it("should backfill department weights across all companies with jobs", async () => {
      const now = Date.now();
      const job: Job = {
        id: "job_sales_1",
        companyId: "comp_growth_inc",
        careerPageId: "cp_growth_inc",
        contentHash: "hash_sales_1",
        isTechRole: false,
        remoteScope: "us-south",
        title: "Account Executive (Sales)",
        department: "Sales",
        location: "Austin, TX",
        isRemote: false,
        employmentType: "full-time",
        seniorityLevel: "senior",
        techCategory: "other_tech",
        skills: ["B2B"],
        descriptionSummary: "Enterprise sales",
        applyType: "url",
        applyTarget: "https://growthinc.com/apply",
        status: "open",
        firstSeenAt: now,
        lastSeenAt: now,
      };
      await jobRepo.upsert(job);

      const count = await compRepo.backfillAllDepartmentWeights();
      expect(count.updatedCount).toBeGreaterThanOrEqual(1);

      const growthComp = await compRepo.findById("comp_growth_inc");
      expect(growthComp!.primaryDepartment).toBe("Sales");
      expect(growthComp!.hiringDepartments).toBeDefined();
      expect(growthComp!.hiringDepartments!["Sales"]!.percentage).toBe(100);
    });
  });

  describe("2. Company Filtering by Funding Stage & Primary Department", () => {
    beforeEach(async () => {
      // Set primary departments
      const comp1 = await compRepo.findById("comp_seed_corp");
      if (comp1) {
        comp1.primaryDepartment = "Engineering";
        await compRepo.upsert(comp1);
      }
      const comp2 = await compRepo.findById("comp_growth_inc");
      if (comp2) {
        comp2.primaryDepartment = "Sales";
        await compRepo.upsert(comp2);
      }
    });

    it("should filter companies by funding stage", async () => {
      const seedComps = await compRepo.listPaged({ fundingStage: "seed" });
      expect(seedComps.items.length).toBe(1);
      expect(seedComps.items[0]?.id).toBe("comp_seed_corp");

      const bComps = await compRepo.listPaged({ fundingStage: "series_b" });
      expect(bComps.items.length).toBe(1);
      expect(bComps.items[0]?.id).toBe("comp_growth_inc");

      const bootstrappedComps = await compRepo.listPaged({ fundingStage: "bootstrapped" });
      expect(bootstrappedComps.items.length).toBe(1);
      expect(bootstrappedComps.items[0]?.id).toBe("comp_bootstrapped_lab");
    });

    it("should filter companies by primary department", async () => {
      const engComps = await compRepo.listPaged({ primaryDepartment: "Engineering" });
      expect(engComps.items.length).toBe(1);
      expect(engComps.items[0]?.id).toBe("comp_seed_corp");

      const salesComps = await compRepo.listPaged({ primaryDepartment: "Sales" });
      expect(salesComps.items.length).toBe(1);
      expect(salesComps.items[0]?.id).toBe("comp_growth_inc");
    });
  });

  describe("3. MCP Server list_companies with Valuation & Department Filters", () => {
    it("should allow AI agent to query companies by funding_stage and primary_department via MCP JSON-RPC", async () => {
      const response = await mcpServer.handleJsonRpc(
        {
          jsonrpc: "2.0",
          id: 1,
          method: "tools/call",
          params: {
            name: "list_companies",
            arguments: {
              funding_stage: "seed",
            },
          },
        },
        mockUser
      );

      expect(response.error).toBeUndefined();
      expect(response.result?.content?.[0]?.text).toBeDefined();

      const parsed = JSON.parse(response.result.content[0].text);
      expect(parsed.total).toBe(1);
      expect(parsed.companies[0].id).toBe("comp_seed_corp");
      expect(parsed.companies[0].funding_stage).toBe("Seed");
      expect(parsed.companies[0].total_funding).toBe("$3.5M");
      expect(parsed.companies[0].valuation_estimate).toBe("$15M");
    });
  });

  describe("4. State-by-State Directory Lookup", () => {
    it("should filter companies by individual US state code (e.g. IL, TX, MN)", async () => {
      // Chicago, IL
      const ilComps = await compRepo.listPaged({ state: "IL" });
      expect(ilComps.items.length).toBe(1);
      expect(ilComps.items[0]?.id).toBe("comp_seed_corp");

      // Austin, TX
      const txComps = await compRepo.listPaged({ state: "TX" });
      expect(txComps.items.length).toBe(1);
      expect(txComps.items[0]?.id).toBe("comp_growth_inc");

      // Minneapolis, MN
      const mnComps = await compRepo.listPaged({ state: "MN" });
      expect(mnComps.items.length).toBe(1);
      expect(mnComps.items[0]?.id).toBe("comp_bootstrapped_lab");

      // Non-existent state in seed
      const caComps = await compRepo.listPaged({ state: "CA" });
      expect(caComps.items.length).toBe(0);
    });

    it("should allow AI agent to filter companies by state via MCP", async () => {
      const response = await mcpServer.handleJsonRpc(
        {
          jsonrpc: "2.0",
          id: 2,
          method: "tools/call",
          params: {
            name: "list_companies",
            arguments: {
              state: "TX",
            },
          },
        },
        mockUser
      );

      expect(response.error).toBeUndefined();
      const parsed = JSON.parse(response.result.content[0].text);
      expect(parsed.total).toBe(1);
      expect(parsed.companies[0].id).toBe("comp_growth_inc");
    });
  });
});
