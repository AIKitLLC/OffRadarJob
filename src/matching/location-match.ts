import { Job } from "../types/domain.js";

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function locationHaystack(job: Job): string {
  return `${job.location ?? ""} ${job.usRegion ?? ""} ${job.isMidwest ? "midwest" : ""} ${job.isRemote ? "remote" : ""}`.toLowerCase();
}

export function locationMatches(job: Job, locations: readonly string[]): boolean {
  if (locations.length === 0) return true;
  const haystack = locationHaystack(job);
  return locations.some((location) => {
    const needle = location.trim().toLowerCase();
    if (!needle) return false;
    if (needle.length >= 3) return haystack.includes(needle);
    const pattern = new RegExp(`(?:^|[^a-z])${escapeRegExp(needle)}(?:$|[^a-z])`, "i");
    return pattern.test(haystack);
  });
}

export function matchedLocation(job: Job, locations: readonly string[]): string | null {
  const haystack = locationHaystack(job);
  for (const location of locations) {
    const needle = location.trim().toLowerCase();
    if (!needle) continue;
    if (needle.length >= 3 && haystack.includes(needle)) return location.trim();
    if (needle.length < 3) {
      const pattern = new RegExp(`(?:^|[^a-z])${escapeRegExp(needle)}(?:$|[^a-z])`, "i");
      if (pattern.test(haystack)) return location.trim();
    }
  }
  return null;
}
