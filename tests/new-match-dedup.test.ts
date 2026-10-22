import { describe, expect, it } from "vitest";
import { InMemoryD1Database } from "../src/db/in-memory-db.js";
import { JobRepository, UserRepository } from "../src/db/repositories.js";
import { CandidateMatchService } from "../src/pipeline/candidate-match-service.js";
import { selectNewMatches } from "../src/alerts/select-new-matches.js";
import { parseCandidateProfile } from "../src/matching/candidate-profile.js";
import { Job } from "../src/types/domain.js";
import { SavedJobFilter } from "../src/alerts/saved-job-filter.js";
import worker from "../src/index.js";
import { SYNTHETIC_EDGE_CV } from "./fixtures/synthetic-cvs.js";
import { STALE_AFTER_MS } from "../src/quality/quality-rules.js";

const NOW = 1_750_000_000_000;

function openJob(id: string, overrides: Partial<Job> = {}): Job {
  return {
    id,
    companyId: "comp_northwind",
    careerPageId: "page_northwind",
    title: "Senior Software Engineer",
    seniorityLevel: "senior",
    techCategory: "fullstack",
    isTechRole: true,
    employmentType: "full-time",
    location: "Chicago, IL",
    isRemote: true,
    remoteScope: "us",
    skills: ["TypeScript", "React"],
    descriptionSummary: "Visa sponsorship is available for this role. The team ships TypeScript services and React interfaces for a small product group with room to grow the platform.",
    applyType: "url",
    applyTarget: `https://northwind.example/jobs/${id}`,
    status: "open",
    contentHash: `hash_${id}`,
    firstSeenAt: NOW - 3_600_000,
    lastSeenAt: NOW,
    ...overrides,
  };
}

function filter(overrides: Partial<SavedJobFilter> = {}): SavedJobFilter {
  return {
    id: "flt_edge",
    userId: "user_jordan",
    profileId: "prof_edge",
    keywords: ["TypeScript"],
    seniorityLevels: ["senior"],
    locations: ["Chicago"],
    remote: "preferred",
    sponsorship: "required",
    minScore: 70,
    isActive: true,
    ...overrides,
  };
}

describe("continuous new-match dedup", () => {
  it("surfaces one alert per profile and content hash", () => {
    const parsed = parseCandidateProfile({ text: SYNTHETIC_EDGE_CV });
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    const profiles = new Map([["prof_edge", parsed.value]]);
    const fit = openJob("job_fit");
    const noSponsor = openJob("job_no_sponsor", {
      descriptionSummary: "Must be authorized to work. No sponsorship. TypeScript and React in Chicago.",
      contentHash: "hash_no_sponsor",
    });
    const jobs = [fit, noSponsor];
    const filters = [filter()];

    const first = selectNewMatches({ jobs, profiles, filters, existingKeys: new Set() });
    expect(first.created.map((alert) => alert.jobId)).toEqual(["job_fit"]);
    expect(first.skippedDuplicates).toBe(0);

    const second = selectNewMatches({
      jobs,
      profiles,
      filters,
      existingKeys: new Set(first.created.map((alert) => alert.alertKey)),
    });
    expect(second.created).toEqual([]);
    expect(second.skippedDuplicates).toBe(1);

    const changed = selectNewMatches({
      jobs: [openJob("job_fit", { contentHash: "hash_fit_v2" })],
      profiles,
      filters,
      existingKeys: new Set(first.created.map((alert) => alert.alertKey)),
    });
    expect(changed.created).toHaveLength(1);
    expect(changed.created[0]?.contentHash).toBe("hash_fit_v2");
  });

  it("persists one quality decision and one alert across repeated passes", async () => {
    const db = new InMemoryD1Database();
    const jobs = new JobRepository(db);
    const fit = openJob("job_fit");
    const spam = openJob("job_spam", {
      title: "Data entry",
      skills: [],
      descriptionSummary: "Guaranteed income. Whatsapp only.",
      contentHash: "hash_spam",
    });
    await jobs.upsert(fit);
    await jobs.upsert(spam);

    const service = CandidateMatchService.fromDatabase(db);
    const profile = await service.saveProfile("user_jordan", { label: "Edge", text: SYNTHETIC_EDGE_CV }, NOW);
    await service.saveFilter("user_jordan", {
      profileId: profile.id,
      keywords: ["TypeScript"],
      seniorityLevels: ["senior"],
      locations: ["Chicago"],
      remote: "preferred",
      sponsorship: "required",
      minScore: 70,
    });

    const first = await service.runPass([fit, spam], { nowMs: NOW, maxAiCalls: 0 });
    const second = await service.runPass([fit, spam], { nowMs: NOW, maxAiCalls: 0 });
    const storedSpam = await jobs.getById("job_spam");

    expect(first.alertsCreated).toBe(1);
    expect(first.judged).toBe(2);
    expect(second.alertsCreated).toBe(0);
    expect(second.reused).toBe(2);
    expect(second.alertsSkipped).toBe(1);
    expect(storedSpam?.status).toBe("closed");
    expect(await service.listAlerts("user_jordan")).toHaveLength(1);

    const later = await service.runPass([openJob("job_fit")], {
      nowMs: NOW + STALE_AFTER_MS + 60_000,
      maxAiCalls: 0,
    });
    expect(later.dropped).toBe(1);
    expect((await jobs.getById("job_fit"))?.status).toBe("closed");
  });

  it("serves rank and scan over HTTP without duplicate alerts", async () => {
    const db = new InMemoryD1Database();
    const users = new UserRepository(db);
    const jobs = new JobRepository(db);
    await users.upsert({
      id: "user_jordan",
      telegramId: "4242",
      firstName: "Jordan",
      apiToken: "orp_synthetictoken",
      createdAt: NOW,
      updatedAt: NOW,
    });
    const seenAt = Date.now();
    await jobs.upsert(openJob("job_fit", { firstSeenAt: seenAt - 3_600_000, lastSeenAt: seenAt }));
    const ctx = { waitUntil: (promise: Promise<unknown>) => promise, passThroughOnException: () => {} };
    const env = { DB: db, ADMIN_TOKEN: "unused" };

    const saveProfile = await worker.fetch(
      new Request("https://jobs.example/api/user/candidate-profiles", {
        method: "POST",
        headers: { Authorization: "Bearer orp_synthetictoken", "Content-Type": "application/json" },
        body: JSON.stringify({ label: "Edge", text: SYNTHETIC_EDGE_CV }),
      }),
      env as never,
      ctx as never
    );
    expect(saveProfile.status).toBe(201);
    const profileBody = (await saveProfile.json()) as { profile: { id: string } };

    const saveFilter = await worker.fetch(
      new Request("https://jobs.example/api/user/job-filters", {
        method: "POST",
        headers: { Authorization: "Bearer orp_synthetictoken", "Content-Type": "application/json" },
        body: JSON.stringify({
          profileId: profileBody.profile.id,
          keywords: ["TypeScript"],
          seniorityLevels: ["senior"],
          locations: ["Chicago"],
          sponsorship: "required",
          minScore: 70,
        }),
      }),
      env as never,
      ctx as never
    );
    expect(saveFilter.status).toBe(201);

    const ranked = await worker.fetch(
      new Request("https://jobs.example/api/match", {
        method: "POST",
        headers: { Authorization: "Bearer orp_synthetictoken", "Content-Type": "application/json" },
        body: JSON.stringify({ profileId: profileBody.profile.id, limit: 5 }),
      }),
      env as never,
      ctx as never
    );
    expect(ranked.status).toBe(200);
    const rankedBody = (await ranked.json()) as { matches: Array<{ job: { id: string }; score: number; reasons: Array<{ factor: string }> }> };
    expect(rankedBody.matches[0]?.job.id).toBe("job_fit");
    expect(rankedBody.matches[0]?.score).toBe(100);
    expect(rankedBody.matches[0]?.reasons.some((reason) => reason.factor === "sponsorship")).toBe(true);

    const scan = async () =>
      worker.fetch(
        new Request("https://jobs.example/api/user/match-alerts/scan", {
          method: "POST",
          headers: { Authorization: "Bearer orp_synthetictoken" },
        }),
        env as never,
        ctx as never
      );
    const firstScan = await scan();
    const secondScan = await scan();
    const firstBody = (await firstScan.json()) as { report: { alertsCreated: number } };
    const secondBody = (await secondScan.json()) as { report: { alertsCreated: number; alertsSkipped: number } };
    expect(firstBody.report.alertsCreated).toBe(1);
    expect(secondBody.report.alertsCreated).toBe(0);
    expect(secondBody.report.alertsSkipped).toBe(1);
  });
});
