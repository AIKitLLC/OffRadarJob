import { ID1Database } from "../db/types.js";
import { JobRepository } from "../db/repositories.js";
import {
  CandidateProfileRepository,
  JobQualityDecisionRepository,
  MatchAlertRepository,
  SavedJobFilterRepository,
  StoredCandidateProfile,
  StoredMatchAlert,
} from "../db/candidate-match-repository.js";
import { Job } from "../types/domain.js";
import { CandidateProfile, parseCandidateProfile } from "../matching/candidate-profile.js";
import { rankJobMatches, RankedJobMatch } from "../matching/score-job-match.js";
import { parseSavedJobFilterInput, SavedJobFilter } from "../alerts/saved-job-filter.js";
import { selectNewMatches } from "../alerts/select-new-matches.js";
import { decideJobQuality, JobQualityDecision } from "../quality/decide-job-quality.js";
import { isStale, QUALITY_RULESET_VERSION } from "../quality/quality-rules.js";
import { WorkersAiBinding } from "../quality/quality-judge.js";

export class MatchRequestError extends Error {
  constructor(
    message: string,
    readonly status: number
  ) {
    super(message);
  }
}

export interface MatchPassReport {
  judged: number;
  reused: number;
  dropped: number;
  enriched: number;
  kept: number;
  alertsCreated: number;
  alertsSkipped: number;
  modelCalls: number;
}

export interface MatchPassOptions {
  nowMs?: number;
  maxAiCalls?: number;
  jobLimit?: number;
  userId?: string;
}

const PASS_JOB_LIMIT = 40;

export class CandidateMatchService {
  constructor(
    private readonly profiles: CandidateProfileRepository,
    private readonly filters: SavedJobFilterRepository,
    private readonly quality: JobQualityDecisionRepository,
    private readonly alerts: MatchAlertRepository,
    private readonly jobs: JobRepository,
    private readonly ai?: WorkersAiBinding
  ) {}

  public static fromDatabase(db: ID1Database, ai?: WorkersAiBinding): CandidateMatchService {
    return new CandidateMatchService(
      new CandidateProfileRepository(db),
      new SavedJobFilterRepository(db),
      new JobQualityDecisionRepository(db),
      new MatchAlertRepository(db),
      new JobRepository(db),
      ai
    );
  }

  public async saveProfile(userId: string, input: unknown, nowMs = Date.now()): Promise<StoredCandidateProfile> {
    const body = asRecord(input);
    const parsed = parseCandidateProfile(profilePayload(body));
    if (!parsed.ok) throw new MatchRequestError(parsed.error, 400);
    const requestedId = typeof body["id"] === "string" ? body["id"] : undefined;
    const existing = requestedId ? await this.profiles.getById(userId, requestedId) : null;
    if (requestedId && !existing) throw new MatchRequestError("Candidate profile not found", 404);
    const label = typeof body["label"] === "string" && body["label"].trim() ? body["label"].trim().slice(0, 80) : existing?.label ?? "Candidate profile";
    const sourceCvId = typeof body["sourceCvId"] === "string" ? body["sourceCvId"] : existing?.sourceCvId ?? null;
    const record: StoredCandidateProfile = {
      id: existing?.id ?? `prof_${crypto.randomUUID()}`,
      userId,
      label,
      profile: parsed.value,
      sourceCvId,
      createdAt: existing?.createdAt ?? nowMs,
      updatedAt: nowMs,
    };
    await this.profiles.upsert(record);
    return record;
  }

  public async listProfiles(userId: string): Promise<StoredCandidateProfile[]> {
    return this.profiles.listByUser(userId);
  }

  public async deleteProfile(userId: string, id: string): Promise<void> {
    const deleted = await this.profiles.delete(userId, id);
    if (!deleted) throw new MatchRequestError("Candidate profile not found", 404);
  }

  public async saveFilter(userId: string, input: unknown): Promise<SavedJobFilter> {
    const parsed = parseSavedJobFilterInput(input, userId);
    if (!parsed.ok) throw new MatchRequestError(parsed.error, 400);
    const profile = await this.profiles.getById(userId, parsed.value.profileId);
    if (!profile) throw new MatchRequestError("Candidate profile not found", 404);
    if (parsed.value.id) {
      const existing = await this.filters.getById(parsed.value.id);
      if (existing && existing.userId !== userId) throw new MatchRequestError("Job filter not found", 404);
    }
    const filter: SavedJobFilter = {
      id: parsed.value.id ?? `flt_${crypto.randomUUID()}`,
      userId,
      profileId: parsed.value.profileId,
      keywords: parsed.value.keywords,
      seniorityLevels: parsed.value.seniorityLevels,
      locations: parsed.value.locations,
      remote: parsed.value.remote,
      sponsorship: parsed.value.sponsorship,
      minScore: parsed.value.minScore,
      isActive: parsed.value.isActive,
    };
    await this.filters.upsert(filter);
    return filter;
  }

  public async listFilters(userId: string): Promise<SavedJobFilter[]> {
    return this.filters.listByUser(userId);
  }

  public async deleteFilter(userId: string, id: string): Promise<void> {
    const deleted = await this.filters.delete(userId, id);
    if (!deleted) throw new MatchRequestError("Job filter not found", 404);
  }

  public async listAlerts(userId: string): Promise<StoredMatchAlert[]> {
    return this.alerts.listByUser(userId);
  }

  public async rank(userId: string, input: unknown): Promise<{ profile: CandidateProfile; matches: RankedJobMatch[] }> {
    const body = asRecord(input);
    const limit = clampLimit(body["limit"], 10);
    const profile = await this.resolveProfile(userId, body);
    const jobs = (await this.jobs.list({ limit: 80, techOnly: true })).filter((job) => job.status === "open");
    return { profile, matches: rankJobMatches(profile, jobs, limit) };
  }

  public async runPass(jobs: readonly Job[], options: MatchPassOptions = {}): Promise<MatchPassReport> {
    const nowMs = options.nowMs ?? Date.now();
    const maxAiCalls = options.maxAiCalls ?? 0;
    const batch = jobs.slice(0, options.jobLimit ?? PASS_JOB_LIMIT).map((job) => ({ ...job, skills: [...job.skills] }));
    const report: MatchPassReport = {
      judged: 0,
      reused: 0,
      dropped: 0,
      enriched: 0,
      kept: 0,
      alertsCreated: 0,
      alertsSkipped: 0,
      modelCalls: 0,
    };

    let modelCalls = 0;
    for (const job of batch) {
      const existing = await this.quality.find(job.id, job.contentHash, QUALITY_RULESET_VERSION);
      const refreshStale = existing?.authenticity === "stale" && !isStale(job, nowMs);
      const becameStale = existing != null && existing.action !== "drop" && isStale(job, nowMs);
      if (existing && !refreshStale && !becameStale) {
        await this.applyDecision(job, existing);
        report.reused += 1;
        countAction(report, existing.action);
        continue;
      }

      const allowModel = this.ai && modelCalls < maxAiCalls ? this.ai : undefined;
      const decision = await decideJobQuality({ job, peers: batch, nowMs, ai: allowModel });
      if (decision.modelInvoked) modelCalls += 1;
      if (existing) await this.quality.deleteVersion(job.id, job.contentHash, QUALITY_RULESET_VERSION);
      await this.quality.insert(`qd_${crypto.randomUUID()}`, decision, nowMs);
      await this.applyDecision(job, decision);
      report.judged += 1;
      countAction(report, decision.action);
      console.log(
        JSON.stringify({
          event: "job_quality_decision",
          jobId: decision.jobId,
          action: decision.action,
          source: decision.source,
          rulesetVersion: decision.rulesetVersion,
          decisionKey: decision.decisionKey,
          qualityScore: decision.qualityScore,
          modelInvoked: decision.modelInvoked,
        })
      );
    }
    report.modelCalls = modelCalls;

    const openJobs = batch.filter((job) => job.status === "open");
    const storedProfiles = options.userId ? await this.profiles.listByUser(options.userId) : await this.profiles.listAll();
    const storedFilters = options.userId
      ? (await this.filters.listByUser(options.userId)).filter((filter) => filter.isActive)
      : await this.filters.listActive();
    const profileMap = new Map(storedProfiles.map((record) => [record.id, record.profile]));
    const existingKeys = new Set<string>();
    for (const job of openJobs) {
      for (const key of await this.alerts.listKeysForJob(job.id)) existingKeys.add(key);
    }
    const scan = selectNewMatches({ jobs: openJobs, profiles: profileMap, filters: storedFilters, existingKeys });
    report.alertsSkipped = scan.skippedDuplicates;
    for (const candidate of scan.created) {
      const outcome = await this.alerts.insertIfAbsent({
        id: `ma_${crypto.randomUUID()}`,
        alertKey: candidate.alertKey,
        userId: candidate.userId,
        profileId: candidate.profileId,
        filterId: candidate.filterId,
        jobId: candidate.jobId,
        contentHash: candidate.contentHash,
        score: candidate.score,
        reasons: candidate.reasons,
        createdAt: nowMs,
      });
      if (outcome === "created") report.alertsCreated += 1;
      else report.alertsSkipped += 1;
    }
    return report;
  }

  private async resolveProfile(userId: string, body: Record<string, unknown>) {
    if (body["profile"] !== undefined) {
      const parsed = parseCandidateProfile(body["profile"]);
      if (!parsed.ok) throw new MatchRequestError(parsed.error, 400);
      return parsed.value;
    }
    const profileId = typeof body["profileId"] === "string" ? body["profileId"] : "";
    if (!profileId) throw new MatchRequestError("profileId or profile is required", 400);
    const stored = await this.profiles.getById(userId, profileId);
    if (!stored) throw new MatchRequestError("Candidate profile not found", 404);
    return stored.profile;
  }

  private async applyDecision(job: Job, decision: JobQualityDecision): Promise<void> {
    if (decision.action === "drop") {
      if (job.status !== "closed") await this.jobs.updateStatus(job.id, "closed");
      job.status = "closed";
      return;
    }
    if (decision.action !== "enrich" || decision.addedSkills.length === 0) return;
    const merged = [...job.skills];
    for (const skill of decision.addedSkills) {
      if (!merged.some((existing) => existing.toLowerCase() === skill.toLowerCase())) merged.push(skill);
    }
    await this.jobs.replaceSkills(job.id, merged);
    job.skills = merged;
  }
}

function countAction(report: MatchPassReport, action: JobQualityDecision["action"]): void {
  if (action === "drop") report.dropped += 1;
  else if (action === "enrich") report.enriched += 1;
  else report.kept += 1;
}

function clampLimit(value: unknown, fallback: number): number {
  const parsed = typeof value === "number" ? value : typeof value === "string" ? Number(value) : fallback;
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(1, Math.min(25, Math.round(parsed)));
}

function asRecord(input: unknown): Record<string, unknown> {
  if (!input || typeof input !== "object" || Array.isArray(input)) return {};
  return input as Record<string, unknown>;
}

function profilePayload(body: Record<string, unknown>): unknown {
  if (body["profile"] !== undefined) return body["profile"];
  const rest: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(body)) {
    if (key === "id" || key === "label" || key === "sourceCvId") continue;
    rest[key] = value;
  }
  return rest;
}
