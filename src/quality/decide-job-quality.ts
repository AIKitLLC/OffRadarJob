import { Job } from "../types/domain.js";
import { canonicalize, sha256Hex } from "../matching/stable-hash.js";
import { SponsorshipSignal } from "../matching/sponsorship-signal.js";
import { skillsFromText } from "../matching/candidate-profile.js";
import { assessJobQuality, QUALITY_RULESET_VERSION, RuleAssessment } from "./quality-rules.js";
import { judgeJobQuality, QUALITY_JUDGE_MODEL, QualityJudgeVerdict, WorkersAiBinding } from "./quality-judge.js";

export type QualityAction = "keep" | "enrich" | "drop";
export type QualitySource = "rules" | "workers_ai";

export interface JobQualityDecision {
  jobId: string;
  contentHash: string;
  action: QualityAction;
  qualityScore: number;
  authenticity: RuleAssessment["authenticity"];
  sponsorshipSignal: SponsorshipSignal;
  completeness: number;
  rulesetVersion: string;
  decisionKey: string;
  source: QualitySource;
  model: string | null;
  modelInvoked: boolean;
  rationale: string;
  findings: string[];
  addedSkills: string[];
  judge: QualityJudgeVerdict | null;
}

export interface MergedQuality {
  action: QualityAction;
  source: QualitySource;
  qualityScore: number;
  sponsorshipSignal: SponsorshipSignal;
  authenticity: RuleAssessment["authenticity"];
  rationale: string;
  findings: string[];
  judge: QualityJudgeVerdict | null;
}

export function mergeRuleAndJudge(rules: RuleAssessment, judge: QualityJudgeVerdict | null): MergedQuality {
  if (rules.disposition === "hard_drop") {
    return {
      action: "drop",
      source: "rules",
      qualityScore: rules.authenticity === "spam" ? 5 : rules.authenticity === "duplicate" ? 10 : 15,
      sponsorshipSignal: rules.sponsorship,
      authenticity: rules.authenticity,
      rationale: `Rules ${QUALITY_RULESET_VERSION} dropped this posting (${rules.authenticity}).`,
      findings: rules.findings,
      judge: null,
    };
  }

  if (rules.disposition === "hard_keep") {
    return {
      action: "keep",
      source: "rules",
      qualityScore: rules.completeness,
      sponsorshipSignal: rules.sponsorship,
      authenticity: "real",
      rationale: `Rules ${QUALITY_RULESET_VERSION} kept this posting.`,
      findings: rules.findings,
      judge: null,
    };
  }

  if (!judge) {
    return {
      action: rules.provisionalAction === "drop" ? "enrich" : rules.provisionalAction,
      source: "rules",
      qualityScore: rules.completeness,
      sponsorshipSignal: rules.sponsorship,
      authenticity: rules.authenticity,
      rationale: `Rules ${QUALITY_RULESET_VERSION} left this posting in review and chose ${rules.provisionalAction}.`,
      findings: rules.findings,
      judge: null,
    };
  }

  const findings = [...rules.findings];
  let action = judge.action;
  if (action === "drop" && judge.authenticity !== "spam" && judge.authenticity !== "duplicate") {
    findings.push("judge_drop_rejected");
    action = rules.provisionalAction === "keep" ? "keep" : "enrich";
  }
  if (action === "keep" && rules.thin) {
    findings.push("thin_posting_stays_enrich");
    action = "enrich";
  }

  const sponsorshipSignal = rules.sponsorship !== "unknown" ? rules.sponsorship : judge.sponsorship;
  return {
    action,
    source: "workers_ai",
    qualityScore: action === "drop" ? 20 : rules.completeness,
    sponsorshipSignal,
    authenticity: judge.authenticity,
    rationale: judge.rationale,
    findings: [...new Set(findings)].sort(),
    judge,
  };
}

function addedSkillsFor(job: Job, action: QualityAction): string[] {
  if (action !== "enrich") return [];
  const owned = new Set(job.skills.map((skill) => skill.toLowerCase()));
  const text = `${job.title}\n${job.descriptionSummary ?? ""}\n${(job.rawContent ?? "").slice(0, 8_000)}`;
  return skillsFromText(text).filter((skill) => !owned.has(skill.toLowerCase()));
}

function snapshot(job: Job): Record<string, unknown> {
  return {
    id: job.id,
    companyId: job.companyId,
    title: job.title,
    status: job.status,
    lastSeenAt: job.lastSeenAt,
    contentHash: job.contentHash,
    skills: [...job.skills].sort(),
    descriptionSummary: job.descriptionSummary ?? "",
    rawContent: (job.rawContent ?? "").slice(0, 2_000),
    applyTarget: job.applyTarget,
    location: job.location ?? "",
    isRemote: job.isRemote,
    seniorityLevel: job.seniorityLevel,
  };
}

export async function decisionKeyFor(job: Job, judge: QualityJudgeVerdict | null, evaluatedAt: number): Promise<string> {
  const payload = JSON.stringify(
    canonicalize({
      rulesetVersion: QUALITY_RULESET_VERSION,
      evaluatedAt,
      snapshot: snapshot(job),
      judge,
    })
  );
  return sha256Hex(payload);
}

export async function decideJobQuality(input: {
  job: Job;
  peers: readonly Job[];
  nowMs: number;
  ai?: WorkersAiBinding | undefined;
}): Promise<JobQualityDecision> {
  const rules = assessJobQuality(input.job, input.peers, input.nowMs);
  const judged = await judgeJobQuality(input.job, rules, input.ai);
  const merged = mergeRuleAndJudge(rules, judged.verdict);
  const decisionKey = await decisionKeyFor(input.job, merged.judge, input.nowMs);
  return {
    jobId: input.job.id,
    contentHash: input.job.contentHash,
    action: merged.action,
    qualityScore: merged.qualityScore,
    authenticity: merged.authenticity,
    sponsorshipSignal: merged.sponsorshipSignal,
    completeness: rules.completeness,
    rulesetVersion: QUALITY_RULESET_VERSION,
    decisionKey,
    source: merged.source,
    model: judged.invoked ? QUALITY_JUDGE_MODEL : null,
    modelInvoked: judged.invoked,
    rationale: merged.rationale,
    findings: merged.findings,
    addedSkills: addedSkillsFor(input.job, merged.action),
    judge: merged.judge,
  };
}
