import { ID1Database } from "../db/types.js";
import {
  CompanyRepository,
  CareerPageRepository,
  JobRepository,
  LogRepository,
  CrawlTaskRepository,
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
  public readonly taskRepo: CrawlTaskRepository;

  constructor(db: ID1Database) {
    this.companyRepo = new CompanyRepository(db);
    this.careerPageRepo = new CareerPageRepository(db);
    this.jobRepo = new JobRepository(db);
    this.logRepo = new LogRepository(db);
    this.taskRepo = new CrawlTaskRepository(db);

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
    source: string = "seed_list",
    taskId?: string | undefined
  ): Promise<{
    taskId: string;
    companies: Company[];
    jobs: Job[];
    logs: CrawlLog[];
  }> {
    const traceId = `tr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const actualTaskId = taskId ?? `task_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    if (!taskId) {
      await this.taskRepo.create({
        id: actualTaskId,
        targetUrl: seedUrl,
        sourceType: source,
        status: "running",
        jobsFound: 0,
        metadata: { traceId },
        createdAt: Date.now(),
      });
    } else {
      await this.taskRepo.update(actualTaskId, { status: "running" });
    }

    try {
      // 1. Stage 1: Discovery
      const discMsg: DiscoveryMessage = {
        type: "DISCOVER_SEED",
        traceId,
        source: source as any,
        sourceUrl: seedUrl,
        timestamp: Date.now(),
        retryCount: 0,
      };

      const discRes = await this.discoveryAgent.process(discMsg);
      if (!discRes.ok || discRes.value.length === 0) {
        const errMsg = !discRes.ok ? discRes.error.message : "No valid companies discovered";
        await this.taskRepo.update(actualTaskId, {
          status: discRes.ok ? "completed" : "failed",
          jobsFound: 0,
          errorMessage: discRes.ok ? null : errMsg,
          completedAt: Date.now(),
        });
        const logs = await this.logRepo.getRecent(10);
        return { taskId: actualTaskId, companies: [], jobs: [], logs };
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

      await this.taskRepo.update(actualTaskId, {
        status: "completed",
        companyId: savedCompanies[0]?.id ?? null,
        jobsFound: savedJobs.length,
        completedAt: Date.now(),
      });

      const logs = await this.logRepo.getRecent(20);
      return {
        taskId: actualTaskId,
        companies: savedCompanies,
        jobs: savedJobs,
        logs,
      };
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      await this.taskRepo.update(actualTaskId, {
        status: "failed",
        errorMessage: errMsg,
        completedAt: Date.now(),
      });
      throw err;
    }
  }

  /**
   * Process multiple seed URLs in sequence
   */
  public async batchProcessAsync(
    urls: string[],
    sourceType: string = "batch"
  ): Promise<string[]> {
    const taskIds: string[] = [];

    for (const url of urls) {
      const cleanUrl = url.trim();
      if (!cleanUrl) continue;

      const taskId = `task_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      taskIds.push(taskId);

      await this.taskRepo.create({
        id: taskId,
        targetUrl: cleanUrl,
        sourceType,
        status: "pending",
        jobsFound: 0,
        metadata: {},
        createdAt: Date.now(),
      });

      await this.processSeedAsync(cleanUrl, sourceType, taskId).catch((err) => {
        console.error(`[BatchProcess] Failed for ${cleanUrl}:`, err);
      });
    }

    return taskIds;
  }
}
