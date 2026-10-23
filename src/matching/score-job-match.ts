import { Job, SeniorityLevel } from "../types/domain.js";
import { CandidateProfile, RemotePreference, SponsorshipPreference, skillsFromText } from "./candidate-profile.js";
import { jobSearchText } from "./job-text.js";
import { matchedLocation } from "./location-match.js";
import { detectSponsorshipSignal, SponsorshipSignal } from "./sponsorship-signal.js";

export const MATCH_FACTORS = ["skills", "seniority", "location", "remote", "sponsorship"] as const;
export type MatchFactor = (typeof MATCH_FACTORS)[number];

export const MATCH_FACTOR_WEIGHTS: Record<MatchFactor, number> = {
  skills: 0.45,
  seniority: 0.2,
  location: 0.15,
  remote: 0.1,
  sponsorship: 0.1,
};

const SENIORITY_LADDER: readonly SeniorityLevel[] = ["intern", "new_grad", "junior", "mid", "senior", "lead", "founding"];
const SENIORITY_BY_DISTANCE = [100, 75, 45, 20, 10, 10, 10] as const;

export interface MatchReason {
  factor: MatchFactor;
  score: number;
  weight: number;
  polarity: "positive" | "neutral" | "negative";
  detail: string;
}

export interface JobMatchScore {
  jobId: string;
  total: number;
  factors: Record<MatchFactor, number>;
  reasons: MatchReason[];
}

export interface RankedJobMatch {
  job: Job;
  match: JobMatchScore;
}

function polarity(score: number): MatchReason["polarity"] {
  if (score >= 75) return "positive";
  if (score <= 40) return "negative";
  return "neutral";
}

function seniorityDistance(left: SeniorityLevel, right: SeniorityLevel): number {
  return Math.abs(SENIORITY_LADDER.indexOf(left) - SENIORITY_LADDER.indexOf(right));
}

function scoreSeniority(profile: CandidateProfile, job: Job): { score: number; detail: string } {
  if (profile.seniorityLevels.length === 0) {
    return { score: 80, detail: "Profile does not limit seniority." };
  }
  if (profile.seniorityLevels.includes(job.seniorityLevel)) {
    return { score: 100, detail: `Role seniority ${job.seniorityLevel} matches the profile.` };
  }
  let nearest = SENIORITY_LADDER.length;
  for (const level of profile.seniorityLevels) {
    nearest = Math.min(nearest, seniorityDistance(level, job.seniorityLevel));
  }
  const score = SENIORITY_BY_DISTANCE[Math.min(nearest, SENIORITY_BY_DISTANCE.length - 1)] ?? 10;
  return {
    score,
    detail: `Role seniority ${job.seniorityLevel} is outside the profile levels ${profile.seniorityLevels.join(", ")}.`,
  };
}

function roleSkills(job: Job): string[] {
  const explicit = job.skills.map((skill) => skill.trim()).filter((skill) => skill.length > 0);
  if (explicit.length > 0) return uniqueSkills(explicit);
  return uniqueSkills(skillsFromText(`${job.title}\n${job.descriptionSummary ?? ""}`));
}

function uniqueSkills(skills: readonly string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const skill of skills) {
    const key = skill.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(skill);
  }
  return result;
}

function scoreSkills(profile: CandidateProfile, job: Job): { score: number; detail: string } {
  const required = roleSkills(job);
  if (required.length === 0) {
    return { score: 50, detail: "Role does not list skills; skill score stays neutral." };
  }
  const owned = new Set(profile.skills.map((skill) => skill.toLowerCase()));
  const matched = required.filter((skill) => owned.has(skill.toLowerCase()));
  const score = Math.round((matched.length / required.length) * 100);
  if (matched.length === 0) return { score, detail: "No overlap with the listed role skills." };
  return {
    score,
    detail: `Shares ${matched.slice(0, 4).join(", ")} with this role (${matched.length} of ${required.length} role skills).`,
  };
}

function scoreLocation(profile: CandidateProfile, job: Job): { score: number; detail: string } {
  if (profile.locations.length === 0) return { score: 80, detail: "Profile does not limit location." };
  const hit = matchedLocation(job, profile.locations);
  if (hit) return { score: 100, detail: `Location matches ${hit}.` };
  if (job.isRemote) return { score: 60, detail: "Role is remote, so a city mismatch is discounted." };
  return { score: 20, detail: "Location does not match the profile." };
}

function scoreRemote(preference: RemotePreference, isRemote: boolean): { score: number; detail: string } {
  if (preference === "required") {
    return isRemote
      ? { score: 100, detail: "Role is remote and the profile requires remote." }
      : { score: 0, detail: "Role is not remote and the profile requires remote." };
  }
  if (preference === "preferred") {
    return isRemote
      ? { score: 100, detail: "Role is remote and the profile prefers remote." }
      : { score: 55, detail: "Role is not remote; the profile prefers remote." };
  }
  return isRemote
    ? { score: 85, detail: "Role is remote." }
    : { score: 70, detail: "Role is onsite; the profile accepts either." };
}

function scoreSponsorship(preference: SponsorshipPreference, signal: SponsorshipSignal): { score: number; detail: string } {
  if (signal === "yes") return { score: preference === "required" ? 100 : preference === "not_needed" ? 80 : 90, detail: "Role text offers visa sponsorship." };
  if (signal === "no") {
    return {
      score: preference === "required" ? 0 : preference === "not_needed" ? 100 : 70,
      detail: "Role text says visa sponsorship is not available.",
    };
  }
  return {
    score: preference === "required" ? 40 : preference === "not_needed" ? 85 : 75,
    detail: "Role text does not mention visa sponsorship.",
  };
}

export function scoreJobMatch(profile: CandidateProfile, job: Job): JobMatchScore {
  const sponsorshipSignal = detectSponsorshipSignal(jobSearchText(job));
  const parts = {
    skills: scoreSkills(profile, job),
    seniority: scoreSeniority(profile, job),
    location: scoreLocation(profile, job),
    remote: scoreRemote(profile.remote, job.isRemote),
    sponsorship: scoreSponsorship(profile.sponsorship, sponsorshipSignal),
  };

  let weighted = 0;
  const factors = {} as Record<MatchFactor, number>;
  const reasons: MatchReason[] = [];
  for (const factor of MATCH_FACTORS) {
    const part = parts[factor];
    const weight = MATCH_FACTOR_WEIGHTS[factor];
    factors[factor] = part.score;
    weighted += part.score * weight;
    reasons.push({
      factor,
      score: part.score,
      weight,
      polarity: polarity(part.score),
      detail: part.detail,
    });
  }

  reasons.sort((left, right) => {
    const leftWeight = Math.abs(left.score - 70) * left.weight;
    const rightWeight = Math.abs(right.score - 70) * right.weight;
    if (rightWeight !== leftWeight) return rightWeight - leftWeight;
    return MATCH_FACTORS.indexOf(left.factor) - MATCH_FACTORS.indexOf(right.factor);
  });

  return {
    jobId: job.id,
    total: Math.max(0, Math.min(100, Math.round(weighted))),
    factors,
    reasons,
  };
}

export function rankJobMatches(profile: CandidateProfile, jobs: readonly Job[], limit: number): RankedJobMatch[] {
  const bounded = Math.max(1, Math.min(limit, 25));
  return jobs
    .filter((job) => job.status === "open")
    .map((job) => ({ job, match: scoreJobMatch(profile, job) }))
    .sort((left, right) => right.match.total - left.match.total || left.job.id.localeCompare(right.job.id))
    .slice(0, bounded);
}
