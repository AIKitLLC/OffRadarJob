import { z } from "zod";
import { ID1Database } from "./types.js";
import { CandidateProfile, CandidateProfileSchema } from "../matching/candidate-profile.js";
import { SavedJobFilter, SavedJobFilterSchema } from "../alerts/saved-job-filter.js";
import { JobQualityDecision } from "../quality/decide-job-quality.js";
import { MatchReason } from "../matching/score-job-match.js";

export interface StoredCandidateProfile {
  id: string;
  userId: string;
  label: string;
  profile: CandidateProfile;
  sourceCvId: string | null;
  createdAt: number;
  updatedAt: number;
}

export interface StoredMatchAlert {
  id: string;
  alertKey: string;
  userId: string;
  profileId: string;
  filterId: string;
  jobId: string;
  contentHash: string;
  score: number;
  reasons: MatchReason[];
  createdAt: number;
}

const ReasonSchema = z.object({
  factor: z.enum(["skills", "seniority", "location", "remote", "sponsorship"]),
  score: z.number(),
  weight: z.number(),
  polarity: z.enum(["positive", "neutral", "negative"]),
  detail: z.string(),
});

function changes(meta: unknown): number | null {
  if (!meta || typeof meta !== "object") return null;
  const value = (meta as { changes?: unknown }).changes;
  return typeof value === "number" ? value : null;
}

export class CandidateProfileRepository {
  constructor(private readonly db: ID1Database) {}

  public async upsert(record: StoredCandidateProfile): Promise<void> {
    await this.db
      .prepare(
        `INSERT INTO candidate_profiles (id, user_id, label, profile_json, source_cv_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        record.id,
        record.userId,
        record.label,
        JSON.stringify(record.profile),
        record.sourceCvId,
        record.createdAt,
        record.updatedAt
      )
      .run();
  }

  public async getById(userId: string, id: string): Promise<StoredCandidateProfile | null> {
    const row = await this.db
      .prepare(`SELECT * FROM candidate_profiles WHERE id = ? AND user_id = ?`)
      .bind(id, userId)
      .first<Record<string, unknown>>();
    return row ? mapProfile(row) : null;
  }

  public async listByUser(userId: string): Promise<StoredCandidateProfile[]> {
    const result = await this.db
      .prepare(`SELECT * FROM candidate_profiles WHERE user_id = ?`)
      .bind(userId)
      .all<Record<string, unknown>>();
    return (result.results ?? []).map(mapProfile).filter((row): row is StoredCandidateProfile => row !== null);
  }

  public async listAll(): Promise<StoredCandidateProfile[]> {
    const result = await this.db.prepare(`SELECT * FROM candidate_profiles ORDER BY updated_at DESC`).all<Record<string, unknown>>();
    return (result.results ?? []).map(mapProfile).filter((row): row is StoredCandidateProfile => row !== null);
  }

  public async delete(userId: string, id: string): Promise<boolean> {
    const result = await this.db.prepare(`DELETE FROM candidate_profiles WHERE id = ? AND user_id = ?`).bind(id, userId).run();
    const count = changes(result.meta);
    return count != null ? count > 0 : true;
  }
}

export class SavedJobFilterRepository {
  constructor(private readonly db: ID1Database) {}

  public async upsert(filter: SavedJobFilter): Promise<void> {
    const now = Date.now();
    await this.db
      .prepare(
        `INSERT INTO saved_job_filters (id, user_id, profile_id, filter_json, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(filter.id, filter.userId, filter.profileId, JSON.stringify(filter), filter.isActive ? 1 : 0, now, now)
      .run();
  }

  public async getById(id: string): Promise<SavedJobFilter | null> {
    const row = await this.db.prepare(`SELECT * FROM saved_job_filters WHERE id = ?`).bind(id).first<Record<string, unknown>>();
    return row ? mapFilter(row) : null;
  }

  public async listByUser(userId: string): Promise<SavedJobFilter[]> {
    const result = await this.db.prepare(`SELECT * FROM saved_job_filters WHERE user_id = ?`).bind(userId).all<Record<string, unknown>>();
    return (result.results ?? []).map(mapFilter).filter((row): row is SavedJobFilter => row !== null);
  }

  public async listActive(): Promise<SavedJobFilter[]> {
    const result = await this.db.prepare(`SELECT * FROM saved_job_filters WHERE is_active = 1`).all<Record<string, unknown>>();
    return (result.results ?? []).map(mapFilter).filter((row): row is SavedJobFilter => row !== null);
  }

  public async delete(userId: string, id: string): Promise<boolean> {
    const result = await this.db.prepare(`DELETE FROM saved_job_filters WHERE id = ? AND user_id = ?`).bind(id, userId).run();
    const count = changes(result.meta);
    return count != null ? count > 0 : true;
  }
}

export class JobQualityDecisionRepository {
  constructor(private readonly db: ID1Database) {}

  public async find(jobId: string, contentHash: string, rulesetVersion: string): Promise<JobQualityDecision | null> {
    const row = await this.db
      .prepare(`SELECT * FROM job_quality_decisions WHERE job_id = ? AND content_hash = ? AND ruleset_version = ?`)
      .bind(jobId, contentHash, rulesetVersion)
      .first<Record<string, unknown>>();
    if (!row || typeof row["record_json"] !== "string") return null;
    try {
      return JSON.parse(row["record_json"]) as JobQualityDecision;
    } catch {
      return null;
    }
  }

  public async deleteVersion(jobId: string, contentHash: string, rulesetVersion: string): Promise<void> {
    await this.db
      .prepare(`DELETE FROM job_quality_decisions WHERE job_id = ? AND content_hash = ? AND ruleset_version = ?`)
      .bind(jobId, contentHash, rulesetVersion)
      .run();
  }

  public async insert(id: string, decision: JobQualityDecision, createdAt: number): Promise<boolean> {
    const existing = await this.find(decision.jobId, decision.contentHash, decision.rulesetVersion);
    if (existing) return false;
    await this.db
      .prepare(
        `INSERT INTO job_quality_decisions (id, job_id, content_hash, action, quality_score, authenticity, sponsorship_signal, ruleset_version, decision_key, source, record_json, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        id,
        decision.jobId,
        decision.contentHash,
        decision.action,
        decision.qualityScore,
        decision.authenticity,
        decision.sponsorshipSignal,
        decision.rulesetVersion,
        decision.decisionKey,
        decision.source,
        JSON.stringify(decision),
        createdAt
      )
      .run();
    return true;
  }

  public async count(): Promise<number> {
    const row = await this.db.prepare(`SELECT COUNT(*) as count FROM job_quality_decisions`).first<Record<string, unknown>>();
    return Number(row?.["count"] ?? 0);
  }
}

export class MatchAlertRepository {
  constructor(private readonly db: ID1Database) {}

  public async listKeysForJob(jobId: string): Promise<string[]> {
    const result = await this.db.prepare(`SELECT alert_key FROM match_alerts WHERE job_id = ?`).bind(jobId).all<Record<string, unknown>>();
    return (result.results ?? []).map((row) => String(row["alert_key"]));
  }

  public async insertIfAbsent(alert: StoredMatchAlert): Promise<"created" | "duplicate"> {
    const existing = await this.db.prepare(`SELECT alert_key FROM match_alerts WHERE alert_key = ?`).bind(alert.alertKey).first();
    if (existing) return "duplicate";
    await this.db
      .prepare(
        `INSERT INTO match_alerts (id, alert_key, user_id, profile_id, filter_id, job_id, content_hash, score, reasons_json, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        alert.id,
        alert.alertKey,
        alert.userId,
        alert.profileId,
        alert.filterId,
        alert.jobId,
        alert.contentHash,
        alert.score,
        JSON.stringify(alert.reasons),
        alert.createdAt
      )
      .run();
    return "created";
  }

  public async listByUser(userId: string, limit = 50): Promise<StoredMatchAlert[]> {
    const result = await this.db.prepare(`SELECT * FROM match_alerts WHERE user_id = ?`).bind(userId).all<Record<string, unknown>>();
    return (result.results ?? [])
      .map(mapAlert)
      .filter((row): row is StoredMatchAlert => row !== null)
      .sort((left, right) => right.createdAt - left.createdAt || left.id.localeCompare(right.id))
      .slice(0, limit);
  }
}

function mapProfile(row: Record<string, unknown>): StoredCandidateProfile | null {
  if (typeof row["profile_json"] !== "string") return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(row["profile_json"]);
  } catch {
    return null;
  }
  const profile = CandidateProfileSchema.safeParse(parsed);
  if (!profile.success) return null;
  return {
    id: String(row["id"]),
    userId: String(row["user_id"]),
    label: String(row["label"]),
    profile: profile.data,
    sourceCvId: row["source_cv_id"] != null ? String(row["source_cv_id"]) : null,
    createdAt: Number(row["created_at"] ?? 0),
    updatedAt: Number(row["updated_at"] ?? 0),
  };
}

function mapFilter(row: Record<string, unknown>): SavedJobFilter | null {
  if (typeof row["filter_json"] !== "string") return null;
  try {
    const parsed = SavedJobFilterSchema.safeParse(JSON.parse(row["filter_json"]));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

function mapAlert(row: Record<string, unknown>): StoredMatchAlert | null {
  let reasons: MatchReason[] = [];
  if (typeof row["reasons_json"] === "string") {
    try {
      const parsed = z.array(ReasonSchema).safeParse(JSON.parse(row["reasons_json"]));
      if (!parsed.success) return null;
      reasons = parsed.data;
    } catch {
      return null;
    }
  }
  return {
    id: String(row["id"]),
    alertKey: String(row["alert_key"]),
    userId: String(row["user_id"]),
    profileId: String(row["profile_id"]),
    filterId: String(row["filter_id"]),
    jobId: String(row["job_id"]),
    contentHash: String(row["content_hash"]),
    score: Number(row["score"] ?? 0),
    reasons,
    createdAt: Number(row["created_at"] ?? 0),
  };
}
