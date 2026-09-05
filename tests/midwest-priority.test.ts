import { describe, it, expect, beforeEach } from "vitest";
import { InMemoryD1Database } from "../src/db/in-memory-db.js";
import { JobRepository, CompanyRepository, CvRepository } from "../src/db/repositories.js";
import { McpServerHandler } from "../src/mcp/mcp-server.js";
import { Job, Company, User } from "../src/types/domain.js";

describe("US-Midwest Priority Suite", () => {
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
    apiToken: "orp_test_mcp_token_abc",
    createdAt: 1000,
    updatedAt: 1000,
  };

  beforeEach(async () => {
    db = new InMemoryD1Database();
    jobRepo = new JobRepository(db);
    compRepo = new CompanyRepository(db);
    cvRepo = new CvRepository(db);
    mcpServer = new McpServerHandler(jobRepo, compRepo, cvRepo);

    // Seed companies
    const sfCompany: Company = {
      id: "comp_sf_tech",
      domain: "sftech.io",
      name: "SF Tech Hub",
      websiteUrl: "https://sftech.io",
      techStack: ["TypeScript", "React"],
      socialLinks: {},
      locationHint: "San Francisco, CA",
      discoverySource: "seed",
      createdAt: 1000,
      updatedAt: 1000,
    };

    const chicagoCompany: Company = {
      id: "comp_chicago_software",
      domain: "chicagosoftware.com",
      name: "Chicago Software Studio",
      websiteUrl: "https://chicagosoftware.com",
      techStack: ["Go", "Kubernetes"],
      socialLinks: {},
      locationHint: "Chicago, IL (Midwest)",
      discoverySource: "seed",
      createdAt: 1000,
      updatedAt: 1000,
    };

    const indyCompany: Company = {
      id: "comp_indy_cloud",
      domain: "indycloud.dev",
      name: "Indy Cloud Labs",
      websiteUrl: "https://indycloud.dev",
      techStack: ["Python", "AWS"],
      socialLinks: {},
      locationHint: "Indianapolis, IN",
      discoverySource: "seed",
      createdAt: 1000,
      updatedAt: 1000,
    };

    await compRepo.upsert(sfCompany);
    await compRepo.upsert(chicagoCompany);
    await compRepo.upsert(indyCompany);

    // Seed jobs
    const jobSF: Job = {
      id: "job_sf_1",
      companyId: "comp_sf_tech",
      careerPageId: "cp_sf_tech",
      title: "Senior Backend Engineer",
      status: "open",
      employmentType: "full-time",
      seniorityLevel: "senior",
      techCategory: "backend_systems",
      skills: ["Go", "PostgreSQL"],
      isRemote: true,
      remoteScope: "us-west",
      location: "San Francisco, CA",
      isTechRole: true,
      applyType: "url",
      applyTarget: "https://sftech.io/apply",
      contentHash: "hash_sf_backend",
      firstSeenAt: 5000, // Newer timestamp
      lastSeenAt: 5000,
    };

    const jobChicago: Job = {
      id: "job_chicago_1",
      companyId: "comp_chicago_software",
      careerPageId: "cp_chicago_software",
      title: "Staff Systems Engineer",
      status: "open",
      employmentType: "full-time",
      seniorityLevel: "lead",
      techCategory: "devops_cloud",
      skills: ["Kubernetes", "Linux"],
      isRemote: true,
      remoteScope: "us-midwest",
      location: "Chicago, IL",
      isTechRole: true,
      applyType: "email",
      applyTarget: "jobs@chicagosoftware.com",
      contentHash: "hash_chicago_systems",
      firstSeenAt: 2000, // Older timestamp
      lastSeenAt: 2000,
    };

    const jobIndy: Job = {
      id: "job_indy_1",
      companyId: "comp_indy_cloud",
      careerPageId: "cp_indy_cloud",
      title: "Cloud Architect",
      status: "open",
      employmentType: "full-time",
      seniorityLevel: "senior",
      techCategory: "backend_systems",
      skills: ["Python", "AWS"],
      isRemote: true,
      remoteScope: "us",
      location: "Indianapolis, IN",
      isTechRole: true,
      applyType: "url",
      applyTarget: "https://indycloud.dev/jobs",
      contentHash: "hash_indy_cloud",
      firstSeenAt: 1000,
      lastSeenAt: 1000,
    };

    await jobRepo.upsert(jobSF);
    await jobRepo.upsert(jobChicago);
    await jobRepo.upsert(jobIndy);
  });

  it("should prioritize US-Midwest jobs first in listPaged even if non-Midwest jobs have newer timestamps", async () => {
    const result = await jobRepo.listPaged({ page: 1, limit: 10, region: "all" });
    expect(result.items.length).toBe(3);

    // Top jobs should be the Midwest ones
    const topTwoIds = [result.items[0]?.id, result.items[1]?.id];
    expect(topTwoIds).toContain("job_chicago_1");
    expect(topTwoIds).toContain("job_indy_1");
    expect(result.items[0]?.isMidwest).toBe(true);
    expect(result.items[1]?.isMidwest).toBe(true);

    // Third job is SF (non-Midwest)
    expect(result.items[2]?.id).toBe("job_sf_1");
    expect(result.items[2]?.isMidwest).toBe(false);
  });

  it("should filter strictly for Midwest jobs when region is set to midwest", async () => {
    const result = await jobRepo.listPaged({ page: 1, limit: 10, region: "midwest" });
    expect(result.items.length).toBe(2);
    expect(result.items.every(j => j.isMidwest)).toBe(true);
    expect(result.items.find(j => j.id === "job_sf_1")).toBeUndefined();
  });

  it("should prioritize Midwest companies first in CompanyRepository.listPaged", async () => {
    const result = await compRepo.listPaged({ page: 1, limit: 10 });
    expect(result.items.length).toBe(3);

    // The first 2 companies should be Chicago & Indianapolis
    const topTwoIds = [result.items[0]?.id, result.items[1]?.id];
    expect(topTwoIds).toContain("comp_chicago_software");
    expect(topTwoIds).toContain("comp_indy_cloud");
    expect(result.items[0]?.isMidwest).toBe(true);
    expect(result.items[1]?.isMidwest).toBe(true);

    // The last company should be SF Tech Hub
    expect(result.items[2]?.id).toBe("comp_sf_tech");
    expect(result.items[2]?.isMidwest).toBe(false);
  });

  it("should surface Midwest priority flag in MCP search_jobs tool", async () => {
    const rpcRes = await mcpServer.handleJsonRpc({
      jsonrpc: "2.0",
      id: 1,
      method: "tools/call",
      params: {
        name: "search_jobs",
        arguments: { limit: 10 },
      },
    }, mockUser);

    expect(rpcRes.result).toBeDefined();
    const data = JSON.parse(rpcRes.result.content[0].text);
    expect(data.total_matches).toBe(3);
    expect(data.jobs.length).toBe(3);

    // The first returned job in MCP must be a Midwest job with is_midwest_priority: true
    expect(data.jobs[0].is_midwest_priority).toBe(true);
    expect(["Staff Systems Engineer", "Cloud Architect"]).toContain(data.jobs[0].title);
  });
});
