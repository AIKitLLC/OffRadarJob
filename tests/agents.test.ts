import { describe, it, expect, beforeEach } from "vitest";
import { DiscoveryAgent } from "../src/agents/discovery-agent.js";
import { CompanyProfilerAgent } from "../src/agents/profiler-agent.js";
import { CareerHunterAgent } from "../src/agents/career-hunter-agent.js";
import { JobExtractorAgent } from "../src/agents/job-extractor-agent.js";
import { InMemoryD1Database } from "../src/db/in-memory-db.js";
import {
  CompanyRepository,
  CareerPageRepository,
  JobRepository,
  LogRepository,
} from "../src/db/repositories.js";
import { MOCK_FIXTURES } from "../src/demo/mock-seed.js";
import { PipelineOrchestrator } from "../src/orchestrator/dispatcher.js";
import { Job } from "../src/types/domain.js";

describe("Decoupled Agent Pipeline Suite", () => {
  let db: InMemoryD1Database;
  let companyRepo: CompanyRepository;
  let careerPageRepo: CareerPageRepository;
  let jobRepo: JobRepository;
  let logRepo: LogRepository;

  beforeEach(() => {
    db = new InMemoryD1Database();
    companyRepo = new CompanyRepository(db);
    careerPageRepo = new CareerPageRepository(db);
    jobRepo = new JobRepository(db);
    logRepo = new LogRepository(db);

    // Mock fetch for deterministic testing
    globalThis.fetch = async (input: RequestInfo | URL): Promise<Response> => {
      const urlStr = typeof input === "string" ? input : input.toString();

      for (const fix of MOCK_FIXTURES) {
        if (urlStr === fix.url || urlStr === `${fix.url}/`) {
          return new Response(fix.homepageHtml, {
            status: 200,
            headers: { "Content-Type": "text/html" },
          });
        }
        if (fix.careerPages[urlStr]) {
          return new Response(fix.careerPages[urlStr]!, {
            status: 200,
            headers: { "Content-Type": "text/html" },
          });
        }
      }
      return new Response("Not found", { status: 404 });
    };
  });

  describe("Agent 1: DiscoveryAgent", () => {
    it("should extract domain and emit ProfileMessage for valid micro-companies", async () => {
      const agent = new DiscoveryAgent(logRepo);
      const res = await agent.process({
        type: "DISCOVER_SEED",
        traceId: "test_trace_1",
        source: "seed_list",
        sourceUrl: "https://tinysaas.dev/some-landing-page?utm_source=twitter",
        timestamp: Date.now(),
        retryCount: 0,
      });

      expect(res.ok).toBe(true);
      if (!res.ok) return;

      expect(res.value).toHaveLength(1);
      expect(res.value[0]?.domain).toBe("tinysaas.dev");
      expect(res.value[0]?.originUrl).toBe("https://tinysaas.dev");
    });

    it("should reject mainstream corporate aggregators (LinkedIn, Indeed, Google)", async () => {
      const agent = new DiscoveryAgent(logRepo);
      const res = await agent.process({
        type: "DISCOVER_SEED",
        traceId: "test_trace_2",
        source: "seed_list",
        sourceUrl: "https://www.linkedin.com/jobs/view/123",
        timestamp: Date.now(),
        retryCount: 0,
      });

      expect(res.ok).toBe(true);
      if (!res.ok) return;
      expect(res.value).toHaveLength(0);
    });
  });

  describe("Agent 2: CompanyProfilerAgent", () => {
    it("should enrich company profile and identify career links", async () => {
      const agent = new CompanyProfilerAgent(companyRepo, logRepo);
      const res = await agent.process({
        type: "PROFILE_COMPANY",
        traceId: "test_trace_3",
        domain: "tinysaas.dev",
        originUrl: "https://tinysaas.dev",
        discoverySource: "seed",
        timestamp: Date.now(),
        retryCount: 0,
      });

      expect(res.ok).toBe(true);
      if (!res.ok) return;

      expect(res.value.domain).toBe("tinysaas.dev");
      expect(res.value.candidateLinks).toContain("https://tinysaas.dev/careers");

      // Verify saved in repository
      const saved = await companyRepo.findByDomain("tinysaas.dev");
      expect(saved).not.toBeNull();
      expect(saved?.name).toBe("TinySaaS");
      expect(saved?.contactEmail).toBe("founders@tinysaas.dev");
      expect(saved?.techStack).toContain("Next.js");
      expect(saved?.socialLinks.twitter).toBe("https://twitter.com/tinysaas_dev");
    });
  });

  describe("Agent 3: CareerHunterAgent", () => {
    it("should verify career page and detect page type", async () => {
      const agent = new CareerHunterAgent(careerPageRepo, logRepo);
      const res = await agent.process({
        type: "HUNT_CAREERS",
        traceId: "test_trace_4",
        companyId: "comp_tinysaas_dev",
        domain: "tinysaas.dev",
        baseUrl: "https://tinysaas.dev",
        candidateLinks: ["https://tinysaas.dev/careers"],
        timestamp: Date.now(),
        retryCount: 0,
      });

      expect(res.ok).toBe(true);
      if (!res.ok) return;

      expect(res.value.length).toBeGreaterThanOrEqual(1);
      expect(res.value[0]?.careerPageUrl).toBe("https://tinysaas.dev/careers");
      expect(res.value[0]?.pageType).toBe("internal_page");
    });
  });

  describe("Agent 4: JobExtractorAgent", () => {
    it("should extract structured job records, salary, skills, and apply targets", async () => {
      const agent = new JobExtractorAgent(jobRepo, logRepo);
      const res = await agent.process({
        type: "EXTRACT_JOBS",
        traceId: "test_trace_5",
        companyId: "comp_tinysaas_dev",
        careerPageId: "page_123",
        careerPageUrl: "https://tinysaas.dev/careers",
        pageType: "internal_page",
        timestamp: Date.now(),
        retryCount: 0,
      });

      expect(res.ok).toBe(true);
      if (!res.ok) return;

      expect(res.value.length).toBe(2);

      const rustJob = res.value.find((j: Job) => j.title.includes("Rust"));
      expect(rustJob).toBeDefined();
      expect(rustJob?.isRemote).toBe(true);
      expect(rustJob?.remoteScope).toBe("worldwide");
      expect(rustJob?.salaryMin).toBe(110000);
      expect(rustJob?.salaryMax).toBe(140000);
      expect(rustJob?.salaryCurrency).toBe("USD");
      expect(rustJob?.skills).toContain("Rust");
      expect(rustJob?.skills).toContain("TypeScript");
      expect(rustJob?.skills).toContain("Cloudflare");
      expect(rustJob?.applyType).toBe("email");
      expect(rustJob?.applyTarget).toContain("careers@tinysaas.dev");
      expect(rustJob?.contentHash).toBeDefined();
    });
  });

  describe("End-to-End Pipeline Orchestration", () => {
    it("should run complete decoupled pipeline from seed to extracted jobs", async () => {
      const orchestrator = new PipelineOrchestrator(db);
      const result = await orchestrator.processSeedAsync("https://boutiquelab.vn", "seed_list");

      expect(result.companies.length).toBe(1);
      expect(result.companies[0]?.name).toBe("Boutique Lab");
      expect(result.companies[0]?.locationHint).toContain("Vietnam");

      expect(result.jobs.length).toBe(1);
      expect(result.jobs[0]?.title).toContain("Founding Full-Stack AI Engineer");
      expect(result.jobs[0]?.salaryMin).toBe(40000);
      expect(result.jobs[0]?.applyTarget).toContain("founder@boutiquelab.vn");

      // Verify D1 records count
      const compCount = await orchestrator.companyRepo.count();
      const jobCount = await orchestrator.jobRepo.count();
      expect(compCount).toBe(1);
      expect(jobCount).toBe(1);
    });
  });
});
