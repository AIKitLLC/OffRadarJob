import { Job } from "../types/domain.js";
import { jobFingerprint, jobSearchText } from "../matching/job-text.js";
import { detectSponsorshipSignal, SponsorshipSignal } from "../matching/sponsorship-signal.js";

export const QUALITY_RULESET_VERSION = "2026-10-22.1";
export const STALE_AFTER_MS = 14 * 24 * 60 * 60 * 1000;

const SPAM_PATTERNS: readonly RegExp[] = [
  /\$\s*\d{3,}\s*(?:a|per)\s*week/i,
  /work from home[^.]{0,40}no experience/i,
  /\bmlm\b/i,
  /crypto airdrop/i,
  /whatsapp only/i,
  /wire transfer/i,
  /guaranteed income/i,
  /make money fast/i,
  /\bpyramid scheme\b/i,
  /click here to earn/i,
  /earn \$\d{3,}k?\s*(?:weekly|per week)/i,
];

export type QualityAuthenticity = "real" | "stale" | "spam" | "duplicate" | "uncertain";
export type QualityDisposition = "hard_drop" | "hard_keep" | "review";

export interface RuleAssessment {
  rulesetVersion: string;
  authenticity: QualityAuthenticity;
  disposition: QualityDisposition;
  completeness: number;
  sponsorship: SponsorshipSignal;
  thin: boolean;
  findings: string[];
  provisionalAction: "keep" | "enrich" | "drop";
}

export function isStale(job: Job, nowMs: number): boolean {
  return job.status === "closed" || nowMs - job.lastSeenAt > STALE_AFTER_MS;
}

export function isSpam(job: Job): boolean {
  const text = jobSearchText(job);
  return SPAM_PATTERNS.some((pattern) => pattern.test(text));
}

export function isDuplicateOfEarlierJob(job: Job, peers: readonly Job[]): boolean {
  const fingerprint = jobFingerprint(job);
  for (const peer of peers) {
    if (peer.id === job.id) continue;
    if (jobFingerprint(peer) !== fingerprint) continue;
    if (peer.firstSeenAt < job.firstSeenAt) return true;
    if (peer.firstSeenAt === job.firstSeenAt && peer.id < job.id) return true;
  }
  return false;
}

export function completenessScore(job: Job): { score: number; findings: string[] } {
  const findings: string[] = [];
  let score = 0;
  if (job.title.trim().length >= 4) score += 15;
  else findings.push("missing_title");

  const description = `${job.descriptionSummary ?? ""} ${job.rawContent ?? ""}`.trim();
  if (description.length >= 120) score += 25;
  else if (description.length >= 40) {
    score += 10;
    findings.push("thin_description");
  } else findings.push("thin_description");

  const skillCount = job.skills.filter((skill) => skill.trim().length > 0).length;
  if (skillCount >= 3) score += 25;
  else if (skillCount >= 1) {
    score += 10;
    findings.push("few_skills");
  } else findings.push("few_skills");

  if (job.applyTarget.trim().length >= 4) score += 20;
  else findings.push("missing_apply_target");

  if ((job.location ?? "").trim().length > 0 || job.isRemote) score += 10;
  else findings.push("missing_location");

  if (job.salaryMin != null || job.salaryMax != null) score += 5;
  else findings.push("missing_salary");

  return { score, findings };
}

export function assessJobQuality(job: Job, peers: readonly Job[], nowMs: number): RuleAssessment {
  const completeness = completenessScore(job);
  const sponsorship = detectSponsorshipSignal(jobSearchText(job));
  const descriptionLength = `${job.descriptionSummary ?? ""} ${job.rawContent ?? ""}`.trim().length;
  const skillCount = job.skills.filter((skill) => skill.trim().length > 0).length;
  const findings = [...completeness.findings];

  let authenticity: QualityAuthenticity = "real";
  if (isSpam(job)) {
    authenticity = "spam";
    findings.push("spam_phrase");
  } else if (isDuplicateOfEarlierJob(job, peers)) {
    authenticity = "duplicate";
    findings.push("duplicate_fingerprint");
  } else if (job.status === "closed") {
    authenticity = "stale";
    findings.push("closed_status");
  } else if (nowMs - job.lastSeenAt > STALE_AFTER_MS) {
    authenticity = "stale";
    findings.push("stale_last_seen");
  }

  const thin = skillCount < 3 || descriptionLength < 120 || completeness.score < 80;
  let disposition: QualityDisposition = "review";
  if (authenticity === "spam" || authenticity === "duplicate" || authenticity === "stale") disposition = "hard_drop";
  else if (!thin && completeness.score >= 80) disposition = "hard_keep";

  const provisionalAction = disposition === "hard_drop" ? "drop" : disposition === "hard_keep" ? "keep" : thin && (skillCount < 2 || descriptionLength < 120 || completeness.score < 75) ? "enrich" : "keep";

  if (disposition === "hard_keep") findings.push("complete");

  return {
    rulesetVersion: QUALITY_RULESET_VERSION,
    authenticity,
    disposition,
    completeness: completeness.score,
    sponsorship,
    thin: disposition !== "hard_drop" && thin,
    findings: [...new Set(findings)].sort(),
    provisionalAction,
  };
}
