import { Job } from "../types/domain.js";
import { CandidateProfile } from "../matching/candidate-profile.js";
import { jobSearchText } from "../matching/job-text.js";
import { locationMatches } from "../matching/location-match.js";
import { detectSponsorshipSignal } from "../matching/sponsorship-signal.js";
import { JobMatchScore, scoreJobMatch } from "../matching/score-job-match.js";
import { SavedJobFilter } from "./saved-job-filter.js";

export interface NewMatchCandidate {
  alertKey: string;
  userId: string;
  profileId: string;
  filterId: string;
  jobId: string;
  contentHash: string;
  score: number;
  reasons: JobMatchScore["reasons"];
}

export interface NewMatchScan {
  created: NewMatchCandidate[];
  skippedDuplicates: number;
}

export function alertKey(profileId: string, jobId: string, contentHash: string): string {
  return `${profileId}:${jobId}:${contentHash}`;
}

export function passesSavedFilter(filter: SavedJobFilter, job: Job, match: JobMatchScore): boolean {
  if (!filter.isActive) return false;
  if (job.status !== "open") return false;
  if (match.total < filter.minScore) return false;
  if (filter.remote === "required" && !job.isRemote) return false;
  if (filter.sponsorship === "required" && detectSponsorshipSignal(jobSearchText(job)) !== "yes") return false;
  if (filter.seniorityLevels.length > 0 && !filter.seniorityLevels.includes(job.seniorityLevel)) return false;
  if (filter.locations.length > 0 && !locationMatches(job, filter.locations)) return false;
  if (filter.keywords.length > 0) {
    const haystack = jobSearchText(job).toLowerCase();
    const matched = filter.keywords.some((keyword) => haystack.includes(keyword.trim().toLowerCase()));
    if (!matched) return false;
  }
  return true;
}

export function selectNewMatches(input: {
  jobs: readonly Job[];
  profiles: ReadonlyMap<string, CandidateProfile>;
  filters: readonly SavedJobFilter[];
  existingKeys: ReadonlySet<string>;
}): NewMatchScan {
  const seen = new Set(input.existingKeys);
  const created: NewMatchCandidate[] = [];
  let skippedDuplicates = 0;

  const jobs = [...input.jobs].sort((left, right) => left.id.localeCompare(right.id));
  const filters = [...input.filters].sort((left, right) => left.id.localeCompare(right.id));

  for (const job of jobs) {
    for (const filter of filters) {
      const profile = input.profiles.get(filter.profileId);
      if (!profile || filter.userId.length === 0) continue;
      const match = scoreJobMatch(profile, job);
      if (!passesSavedFilter(filter, job, match)) continue;
      const key = alertKey(filter.profileId, job.id, job.contentHash);
      if (seen.has(key)) {
        skippedDuplicates += 1;
        continue;
      }
      seen.add(key);
      created.push({
        alertKey: key,
        userId: filter.userId,
        profileId: filter.profileId,
        filterId: filter.id,
        jobId: job.id,
        contentHash: job.contentHash,
        score: match.total,
        reasons: match.reasons,
      });
    }
  }

  created.sort((left, right) => right.score - left.score || left.alertKey.localeCompare(right.alertKey));
  return { created, skippedDuplicates };
}
