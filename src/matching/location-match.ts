import { Job } from "../types/domain.js";
import { getUsState, matchesUsState } from "../utils/us-states.js";

const US_METRO_SYNONYMS: ReadonlyArray<{ aliases: readonly string[]; terms: readonly string[] }> = [
  {
    aliases: ["bay area", "sf bay", "san francisco bay area", "silicon valley"],
    terms: [
      "san francisco",
      "san jose",
      "palo alto",
      "mountain view",
      "menlo park",
      "sunnyvale",
      "santa clara",
      "redwood city",
      "oakland",
      "berkeley",
      "fremont",
    ],
  },
  {
    aliases: ["nyc", "new york city", "new york metro"],
    terms: ["new york", "manhattan", "brooklyn", "jersey city", "hoboken"],
  },
  {
    aliases: ["dmv", "dc metro", "washington dc metro"],
    terms: ["washington, dc", "washington, d.c.", "arlington", "alexandria", "reston", "mclean", "bethesda", "silver spring", "tysons"],
  },
  {
    aliases: ["research triangle", "rtp", "triangle area"],
    terms: ["raleigh", "durham", "chapel hill", "cary", "morrisville"],
  },
  {
    aliases: ["twin cities"],
    terms: ["minneapolis", "st. paul", "saint paul"],
  },
  {
    aliases: ["dfw", "dallas-fort worth", "dallas fort worth"],
    terms: ["dallas", "fort worth", "irving", "plano", "frisco", "richardson"],
  },
];

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function matchesSingleLocation(job: Job, haystack: string, rawLocation: string): boolean {
  const needle = rawLocation.trim().toLowerCase();
  if (!needle) return false;

  if (needle.length >= 3) {
    if (haystack.includes(needle)) return true;
  } else {
    const pattern = new RegExp(`(?:^|[^a-z])${escapeRegExp(needle)}(?:$|[^a-z])`, "i");
    if (pattern.test(haystack)) return true;
  }

  for (const metro of US_METRO_SYNONYMS) {
    const needleIsAlias = metro.aliases.some((alias) => needle.includes(alias));
    const needleIsTerm = metro.terms.some((term) => needle.includes(term));
    if (needleIsAlias && (metro.aliases.some((a) => haystack.includes(a)) || metro.terms.some((t) => haystack.includes(t)))) {
      return true;
    }
    if (needleIsTerm && metro.aliases.some((alias) => haystack.includes(alias))) {
      return true;
    }
  }

  const wholeState = getUsState(needle);
  if (wholeState && job.location && matchesUsState(job.location, wholeState.code)) {
    return true;
  }

  const commaIdx = needle.lastIndexOf(",");
  if (commaIdx > 0 && job.location) {
    const cityPart = needle.slice(0, commaIdx).trim();
    const statePart = needle.slice(commaIdx + 1).trim();
    const cityState = getUsState(statePart);
    if (cityPart.length >= 3 && cityState && haystack.includes(cityPart) && matchesUsState(job.location, cityState.code)) {
      return true;
    }
  }

  return false;
}

export function locationHaystack(job: Job): string {
  return `${job.location ?? ""} ${job.usRegion ?? ""} ${job.isMidwest ? "midwest" : ""} ${job.isRemote ? "remote" : ""}`.toLowerCase();
}

export function locationMatches(job: Job, locations: readonly string[]): boolean {
  if (locations.length === 0) return true;
  const haystack = locationHaystack(job);
  return locations.some((location) => matchesSingleLocation(job, haystack, location));
}

export function matchedLocation(job: Job, locations: readonly string[]): string | null {
  const haystack = locationHaystack(job);
  for (const location of locations) {
    if (matchesSingleLocation(job, haystack, location)) return location.trim();
  }
  return null;
}
