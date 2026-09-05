import { ID1Database } from "../db/types.js";
import {
  CompanyRepository,
  CareerPageRepository,
  JobRepository,
  LogRepository,
} from "../db/repositories.js";
import { DiscoveryAgent } from "../agents/discovery-agent.js";
import { CompanyProfilerAgent } from "../agents/profiler-agent.js";
import { CareerHunterAgent } from "../agents/career-hunter-agent.js";
import { JobExtractorAgent } from "../agents/job-extractor-agent.js";
import {
  DiscoveryMessage,
  ProfileMessage,
  HuntMessage,
  ExtractMessage,
} from "../types/queues.js";
import { Company, Job, CrawlLog } from "../types/domain.js";

export interface PipelineStats {
  discoveredCount: number;
  profiledCount: number;
  huntedCount: number;
  extractedJobsCount: number;
  errorCount: number;
  durationMs: number;
}

/**
 * PipelineOrchestrator manages the decoupled agents.
 * Can be triggered via Cloudflare Queues or run standalone for local execution / tests.
 */
export class PipelineOrchestrator {
  public readonly discoveryAgent: DiscoveryAgent;
  public readonly profilerAgent: CompanyProfilerAgent;
  public readonly hunterAgent: CareerHunterAgent;
  public readonly extractorAgent: JobExtractorAgent;

  public readonly companyRepo: CompanyRepository;
  public readonly careerPageRepo: CareerPageRepository;
  public readonly jobRepo: JobRepository;
  public readonly logRepo: LogRepository;

  constructor(db: ID1Database) {
    this.companyRepo = new CompanyRepository(db);
    this.careerPageRepo = new CareerPageRepository(db);
    this.jobRepo = new JobRepository(db);
    this.logRepo = new LogRepository(db);

    this.discoveryAgent = new DiscoveryAgent(this.logRepo);
    this.profilerAgent = new CompanyProfilerAgent(this.companyRepo, this.logRepo);
    this.hunterAgent = new CareerHunterAgent(this.careerPageRepo, this.logRepo);
    this.extractorAgent = new JobExtractorAgent(this.jobRepo, this.logRepo);
  }

  /**
   * Run end-to-end pipeline asynchronously for a seed URL or domain
   */
  public async processSeedAsync(
    seedUrl: string,
    source: "seed_list" | "manual" | "hn_whoishiring" | "github" | "indie_hackers" = "seed_list"
  ): Promise<{
    companies: Company[];
    jobs: Job[];
    logs: CrawlLog[];
  }> {
    const traceId = `tr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    // 1. Stage 1: Discovery
    const discMsg: DiscoveryMessage = {
      type: "DISCOVER_SEED",
      traceId,
      source,
      sourceUrl: seedUrl,
      timestamp: Date.now(),
      retryCount: 0,
    };

    const discRes = await this.discoveryAgent.process(discMsg);
    if (!discRes.ok || discRes.value.length === 0) {
      const logs = await this.logRepo.getRecent(10);
      return { companies: [], jobs: [], logs };
    }

    const savedCompanies: Company[] = [];
    const savedJobs: Job[] = [];

    // 2. Stage 2: Profiling
    for (const profileMsg of discRes.value) {
      const profRes = await this.profilerAgent.process(profileMsg);
      if (!profRes.ok) continue;

      const comp = await this.companyRepo.findById(profRes.value.companyId);
      if (comp) savedCompanies.push(comp);

      // 3. Stage 3: Career Hunting
      const huntRes = await this.hunterAgent.process(profRes.value);
      if (!huntRes.ok) continue;

      // 4. Stage 4: Job Extraction
      for (const extractMsg of huntRes.value) {
        const extRes = await this.extractorAgent.process(extractMsg);
        if (!extRes.ok) continue;
        savedJobs.push(...extRes.value);
      }
    }

    const logs = await this.logRepo.getRecent(20);
    return {
      companies: savedCompanies,
      jobs: savedJobs,
      logs,
    };
  }
}
