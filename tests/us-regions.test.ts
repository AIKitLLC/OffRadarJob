import { describe, it, expect, beforeEach } from "vitest";
import { InMemoryD1Database } from "../src/db/in-memory-db.js";
import { JobRepository, CompanyRepository, CvRepository } from "../src/db/repositories.js";
import { McpServerHandler } from "../src/mcp/mcp-server.js";
import { Job, Company, User } from "../src/types/domain.js";

describe("Nationwide US Regional Filtering Suite", () => {
  let db: InMemoryD1Database;
  let jobRepo: JobRepository;
  let compRepo: CompanyRepository;
  let cvRepo: CvRepository;
  let mcpServer: McpServerHandler;

  const mockUser: User = {
    id: "usr_test_reg",
    telegramId: "99887766",
    username: "regionaltester",
    firstName: "Tester",
    apiToken: "orp_reg_mcp_token_xyz",
    createdAt: 1000,
    updatedAt: 1000,
  };

  beforeEach(async () => {
    db = new InMemoryD1Database();
    jobRepo = new JobRepository(db);
    compRepo = new CompanyRepository(db);
    cvRepo = new CvRepository(db);
    mcpServer = new McpServerHandler(jobRepo, compRepo, cvRepo);

    // 1. West (Seattle, WA)
    const compWest: Company = {
      id: "comp_substantial",
      domain: "substantial.com",
      name: "Substantial",
      websiteUrl: "https://substantial.com",
      techStack: ["TypeScript", "React", "Elixir"],
      socialLinks: {},
      locationHint: "Seattle, WA",
      discoverySource: "seed",
      createdAt: 1000,
      updatedAt: 1000,
    };

    // 2. Northeast (Boston / Somerville, MA)
    const compNortheast: Company = {
      id: "comp_formlabs",
      domain: "formlabs.com",
      name: "Formlabs",
      websiteUrl: "https://formlabs.com",
      techStack: ["C++", "Python", "Qt"],
      socialLinks: {},
      locationHint: "Somerville, MA",
      discoverySource: "seed",
      createdAt: 1000,
      updatedAt: 1000,
    };

    // 3. South (Austin, TX)
    const compSouth: Company = {
      id: "comp_praxent",
      domain: "praxent.com",
      name: "Praxent",
      websiteUrl: "https://praxent.com",
      techStack: ["Node.js", "React Native", "PostgreSQL"],
      socialLinks: {},
      locationHint: "Austin, TX",
      discoverySource: "seed",
      createdAt: 1000,
      updatedAt: 1000,
    };

    // 4. Mountain (Boulder, CO)
    const compMountain: Company = {
      id: "comp_automox",
      domain: "automox.com",
      name: "Automox",
      websiteUrl: "https://automox.com",
      techStack: ["Go", "AWS", "Python"],
      socialLinks: {},
      locationHint: "Boulder, CO",
      discoverySource: "seed",
      createdAt: 1000,
      updatedAt: 1000,
    };

    // 5. Midwest (Chicago, IL)
    const compMidwest: Company = {
      id: "comp_basecamp",
      domain: "37signals.com",
      name: "37signals",
      websiteUrl: "https://37signals.com",
      techStack: ["Ruby", "Rails", "Hotwire"],
      socialLinks: {},
      locationHint: "Chicago, IL",
      discoverySource: "seed",
      createdAt: 1000,
      updatedAt: 1000,
    };

    await compRepo.upsert(compWest);
    await compRepo.upsert(compNortheast);
    await compRepo.upsert(compSouth);
    await compRepo.upsert(compMountain);
    await compRepo.upsert(compMidwest);

    // Jobs corresponding to each region
    const jobWest: Job = {
      id: "job_west_1",
      companyId: "comp_substantial",
      careerPageId: "cp_substantial",
      title: "Senior Full-Stack Engineer",
      status: "open",
      employmentType: "full-time",
      seniorityLevel: "senior",
      techCategory: "fullstack",
      skills: ["TypeScript", "React", "Node.js"],
      isRemote: true,
      remoteScope: "us-west",
      location: "Seattle, WA",
      isTechRole: true,
      applyType: "url",
      applyTarget: "https://substantial.com/careers/role-1042",
      contentHash: "hash_west_1",
      firstSeenAt: 2000,
      lastSeenAt: 2000,
    };


    const jobNortheast: Job = {
      id: "job_northeast_1",
      companyId: "comp_formlabs",
      careerPageId: "cp_formlabs",
      title: "Embedded Systems Software Engineer",
      status: "open",
      employmentType: "full-time",
      seniorityLevel: "mid",
      techCategory: "backend_systems",
      skills: ["C++", "Linux", "Python"],
      isRemote: false,
      remoteScope: "us",
      location: "Somerville, MA",
      isTechRole: true,
      applyType: "url",
      applyTarget: "https://formlabs.com/careers/role-1042",
      contentHash: "hash_northeast_1",
      firstSeenAt: 2100,
      lastSeenAt: 2100,
    };

    const jobSouth: Job = {
      id: "job_south_1",
      companyId: "comp_praxent",
      careerPageId: "cp_praxent",
      title: "Lead FinTech Engineer",
      status: "open",
      employmentType: "full-time",
      seniorityLevel: "lead",
      techCategory: "backend_systems",
      skills: ["Node.js", "PostgreSQL", "AWS"],
      isRemote: true,
      remoteScope: "us",
      location: "Austin, TX",
      isTechRole: true,
      applyType: "url",
      applyTarget: "https://praxent.com/careers/role-1042",
      contentHash: "hash_south_1",
      firstSeenAt: 2200,
      lastSeenAt: 2200,
    };

    const jobMountain: Job = {
      id: "job_mountain_1",
      companyId: "comp_automox",
      careerPageId: "cp_automox",
      title: "Platform & Security Engineer",
      status: "open",
      employmentType: "full-time",
      seniorityLevel: "senior",
      techCategory: "devops_cloud",
      skills: ["Go", "Kubernetes", "Linux"],
      isRemote: true,
      remoteScope: "us-mountain",
      location: "Boulder, CO",
      isTechRole: true,
      applyType: "url",
      applyTarget: "https://automox.com/careers/role-1042",
      contentHash: "hash_mountain_1",
      firstSeenAt: 2300,
      lastSeenAt: 2300,
    };

    const jobMidwest: Job = {
      id: "job_midwest_1",
      companyId: "comp_basecamp",
      careerPageId: "cp_basecamp",
      title: "Senior Product Engineer",
      status: "open",
      employmentType: "full-time",
      seniorityLevel: "senior",
      techCategory: "fullstack",
      skills: ["Ruby", "Rails", "JavaScript"],
      isRemote: true,
      remoteScope: "us-midwest",
      location: "Chicago, IL",
      isTechRole: true,
      applyType: "url",
      applyTarget: "https://37signals.com/jobs/role-1042",
      contentHash: "hash_midwest_1",
      firstSeenAt: 1500,
      lastSeenAt: 1500,
    };

    await jobRepo.upsert(jobWest);
    await jobRepo.upsert(jobNortheast);
    await jobRepo.upsert(jobSouth);
    await jobRepo.upsert(jobMountain);
    await jobRepo.upsert(jobMidwest);
  });

  describe("JobRepository Regional Filtering", () => {
    it("should filter West jobs correctly", async () => {
      const res = await jobRepo.listPaged({ page: 1, limit: 10, region: "west" });
      expect(res.pagination.total).toBe(1);
      expect(res.items[0]?.id).toBe("job_west_1");
      expect(res.items[0]?.usRegion).toBe("west");
    });

    it("should filter Northeast jobs correctly", async () => {
      const res = await jobRepo.listPaged({ page: 1, limit: 10, region: "northeast" });
      expect(res.pagination.total).toBe(1);
      expect(res.items[0]?.id).toBe("job_northeast_1");
      expect(res.items[0]?.usRegion).toBe("northeast");
    });

    it("should filter South jobs correctly", async () => {
      const res = await jobRepo.listPaged({ page: 1, limit: 10, region: "south" });
      expect(res.pagination.total).toBe(1);
      expect(res.items[0]?.id).toBe("job_south_1");
      expect(res.items[0]?.usRegion).toBe("south");
    });

    it("should filter Mountain jobs correctly", async () => {
      const res = await jobRepo.listPaged({ page: 1, limit: 10, region: "mountain" });
      expect(res.pagination.total).toBe(1);
      expect(res.items[0]?.id).toBe("job_mountain_1");
      expect(res.items[0]?.usRegion).toBe("mountain");
    });

    it("should filter Midwest jobs correctly and maintain priority in 'all'", async () => {
      const midwestRes = await jobRepo.listPaged({ page: 1, limit: 10, region: "midwest" });
      expect(midwestRes.pagination.total).toBe(1);
      expect(midwestRes.items[0]?.id).toBe("job_midwest_1");
      expect(midwestRes.items[0]?.usRegion).toBe("midwest");
      expect(midwestRes.items[0]?.isMidwest).toBe(true);

      const allRes = await jobRepo.listPaged({ page: 1, limit: 10, region: "all" });
      expect(allRes.pagination.total).toBe(5);
      // Midwest must be #1 ranked
      expect(allRes.items[0]?.id).toBe("job_midwest_1");
    });

    it("should provide regional breakdown counts in getStatsSummary", async () => {
      const stats = await jobRepo.getStatsSummary();
      expect(stats.total).toBe(5);
      expect(stats.midwestCount).toBe(1);
      expect(stats.westCount).toBe(1);
      expect(stats.northeastCount).toBe(1);
      expect(stats.southCount).toBe(1);
      expect(stats.mountainCount).toBe(1);
    });
  });

  describe("CompanyRepository Regional Filtering", () => {
    it("should filter companies by region", async () => {
      const westComps = await compRepo.listPaged({ page: 1, limit: 10, region: "west" });
      expect(westComps.pagination.total).toBe(1);
      expect(westComps.items[0]?.id).toBe("comp_substantial");
      expect(westComps.items[0]?.usRegion).toBe("west");

      const southComps = await compRepo.listPaged({ page: 1, limit: 10, region: "south" });
      expect(southComps.pagination.total).toBe(1);
      expect(southComps.items[0]?.id).toBe("comp_praxent");
      expect(southComps.items[0]?.usRegion).toBe("south");

      const mountainComps = await compRepo.listPaged({ page: 1, limit: 10, region: "mountain" });
      expect(mountainComps.pagination.total).toBe(1);
      expect(mountainComps.items[0]?.id).toBe("comp_automox");
      expect(mountainComps.items[0]?.usRegion).toBe("mountain");

      const northeastComps = await compRepo.listPaged({ page: 1, limit: 10, region: "northeast" });
      expect(northeastComps.pagination.total).toBe(1);
      expect(northeastComps.items[0]?.id).toBe("comp_formlabs");
      expect(northeastComps.items[0]?.usRegion).toBe("northeast");
    });
  });

  describe("MCP Server Integration with US Regions", () => {
    it("should search jobs by region in MCP search_jobs tool", async () => {
      const rpcWest = await mcpServer.handleJsonRpc({
        jsonrpc: "2.0",
        id: 1,
        method: "tools/call",
        params: {
          name: "search_jobs",
          arguments: { region: "west" },
        },
      }, mockUser);

      expect(rpcWest.result).toBeDefined();
      const westData = JSON.parse(rpcWest.result.content[0].text);
      expect(westData.total_matches).toBe(1);
      expect(westData.jobs[0].title).toBe("Senior Full-Stack Engineer");
      expect(westData.jobs[0].us_region).toBe("west");

      const rpcSouth = await mcpServer.handleJsonRpc({
        jsonrpc: "2.0",
        id: 2,
        method: "tools/call",
        params: {
          name: "search_jobs",
          arguments: { region: "south" },
        },
      }, mockUser);

      expect(rpcSouth.result).toBeDefined();
      const southData = JSON.parse(rpcSouth.result.content[0].text);
      expect(southData.total_matches).toBe(1);
      expect(southData.jobs[0].title).toBe("Lead FinTech Engineer");
      expect(southData.jobs[0].us_region).toBe("south");
    });

    it("should filter companies by region in MCP list_companies tool", async () => {
      const rpcComp = await mcpServer.handleJsonRpc({
        jsonrpc: "2.0",
        id: 3,
        method: "tools/call",
        params: {
          name: "list_companies",
          arguments: { region: "mountain" },
        },
      }, mockUser);

      expect(rpcComp.result).toBeDefined();
      const compData = JSON.parse(rpcComp.result.content[0].text);
      expect(compData.total).toBe(1);
      expect(compData.companies[0].name).toBe("Automox");
      expect(compData.companies[0].us_region).toBe("mountain");
    });
  });
});
