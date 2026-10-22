import { describe, expect, it } from "vitest";
import { parseCandidateProfile } from "../src/matching/candidate-profile.js";
import { MATCH_FACTOR_WEIGHTS, rankJobMatches, scoreJobMatch } from "../src/matching/score-job-match.js";
import { Job } from "../src/types/domain.js";
import { SYNTHETIC_EDGE_CV, SYNTHETIC_JUNIOR_CV } from "./fixtures/synthetic-cvs.js";

const NOW = 1_750_000_000_000;

function job(overrides: Partial<Job> & Pick<Job, "id" | "title" | "skills" | "seniorityLevel" | "isRemote">): Job {
  return {
    companyId: "comp_northwind",
    careerPageId: "page_northwind",
    employmentType: "full-time",
    remoteScope: "us",
    applyType: "url",
    applyTarget: `https://northwind.example/jobs/${overrides.id}`,
    status: "open",
    contentHash: `hash_${overrides.id}`,
    firstSeenAt: NOW - 86_400_000,
    lastSeenAt: NOW,
    location: "Chicago, IL",
    descriptionSummary: "Build product software for a small team.",
    techCategory: "fullstack",
    isTechRole: true,
    ...overrides,
  };
}

describe("CV to job matching", () => {
  it("parses a synthetic CV into skills, seniority, location, remote, and sponsorship", () => {
    const parsed = parseCandidateProfile({ text: SYNTHETIC_EDGE_CV });
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.value.skills).toEqual(expect.arrayContaining(["TypeScript", "Cloudflare Workers", "PostgreSQL", "React", "Node.js"]));
    expect(parsed.value.seniorityLevels).toEqual(["senior"]);
    expect(parsed.value.locations).toEqual(["Chicago, IL"]);
    expect(parsed.value.remote).toBe("preferred");
    expect(parsed.value.sponsorship).toBe("required");
    expect(parsed.value.headline).toBe("Jordan Hale");
  });

  it("lets structured fields override text", () => {
    const parsed = parseCandidateProfile({
      text: SYNTHETIC_JUNIOR_CV,
      seniority: "mid",
      locations: ["Denver, CO"],
      remote: "required",
      sponsorship: "any",
    });
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.value.seniorityLevels).toEqual(["mid"]);
    expect(parsed.value.locations).toEqual(["Denver, CO"]);
    expect(parsed.value.remote).toBe("required");
    expect(parsed.value.sponsorship).toBe("any");
    expect(parsed.value.skills).toEqual(expect.arrayContaining(["Python", "FastAPI", "PostgreSQL"]));
  });

  it("scores an exact fit at 100 and a mismatched role at 12", () => {
    const parsed = parseCandidateProfile({
      headline: "Senior engineer",
      skills: ["TypeScript", "React"],
      seniority: "senior",
      locations: ["Chicago, IL"],
      remote: "required",
      sponsorship: "required",
    });
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;

    const fit = job({
      id: "job_fit",
      title: "Senior Software Engineer",
      skills: ["TypeScript", "React"],
      seniorityLevel: "senior",
      isRemote: true,
      descriptionSummary: "Visa sponsorship is available for this role. The team ships TypeScript and React.",
    });
    const miss = job({
      id: "job_miss",
      title: "Junior Python Engineer",
      skills: ["Python", "FastAPI"],
      seniorityLevel: "junior",
      isRemote: false,
      location: "Austin, TX",
      descriptionSummary: "This role does not offer visa sponsorship. Must be authorized to work.",
    });

    const fitScore = scoreJobMatch(parsed.value, fit);
    const missScore = scoreJobMatch(parsed.value, miss);
    const weightTotal = Object.values(MATCH_FACTOR_WEIGHTS).reduce((sum, weight) => sum + weight, 0);
    expect(weightTotal).toBeCloseTo(1);
    expect(fitScore.total).toBe(100);
    expect(fitScore.factors).toEqual({ skills: 100, seniority: 100, location: 100, remote: 100, sponsorship: 100 });
    expect(fitScore.reasons[0]?.detail).toBe("Shares TypeScript, React with this role (2 of 2 role skills).");
    expect(missScore.total).toBe(12);
    expect(missScore.factors).toEqual({ skills: 0, seniority: 45, location: 20, remote: 0, sponsorship: 0 });
    expect(missScore.reasons.some((reason) => reason.detail === "Role text says visa sponsorship is not available.")).toBe(true);
    expect(fitScore.total).toBeGreaterThan(missScore.total);
  });

  it("ranks open jobs deterministically and skips closed roles", () => {
    const parsed = parseCandidateProfile({
      headline: "Senior engineer",
      skills: ["TypeScript", "React"],
      seniority: "senior",
      locations: ["Chicago"],
      remote: "preferred",
      sponsorship: "required",
    });
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    const openFit = job({
      id: "job_b",
      title: "Senior Software Engineer",
      skills: ["TypeScript", "React"],
      seniorityLevel: "senior",
      isRemote: true,
      descriptionSummary: "Visa sponsorship is available.",
    });
    const openMiss = job({
      id: "job_a",
      title: "Junior Python Engineer",
      skills: ["Python"],
      seniorityLevel: "junior",
      isRemote: false,
      location: "Austin, TX",
      descriptionSummary: "No sponsorship. Must be authorized to work.",
    });
    const closed = job({
      id: "job_closed",
      title: "Senior Software Engineer",
      skills: ["TypeScript", "React"],
      seniorityLevel: "senior",
      isRemote: true,
      status: "closed",
      descriptionSummary: "Visa sponsorship is available.",
    });

    const first = rankJobMatches(parsed.value, [openMiss, closed, openFit], 10);
    const second = rankJobMatches(parsed.value, [openFit, openMiss, closed], 10);
    expect(first.map((entry) => entry.job.id)).toEqual(["job_b", "job_a"]);
    expect(JSON.stringify(first)).toBe(JSON.stringify(second));
  });
});
