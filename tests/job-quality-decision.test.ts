import { describe, expect, it } from "vitest";
import { Job } from "../src/types/domain.js";
import { decideJobQuality, mergeRuleAndJudge } from "../src/quality/decide-job-quality.js";
import { assessJobQuality, QUALITY_RULESET_VERSION, STALE_AFTER_MS } from "../src/quality/quality-rules.js";
import { QualityJudgeVerdict } from "../src/quality/quality-judge.js";

const NOW = 1_750_000_000_000;

function job(overrides: Partial<Job> & Pick<Job, "id">): Job {
  return {
    companyId: "comp_northwind",
    careerPageId: "page_northwind",
    title: "Senior Backend Engineer",
    seniorityLevel: "senior",
    techCategory: "backend_systems",
    isTechRole: true,
    employmentType: "full-time",
    location: "Chicago, IL",
    isRemote: true,
    remoteScope: "us",
    skills: ["TypeScript", "PostgreSQL", "Cloudflare Workers"],
    descriptionSummary: "A".repeat(140),
    applyType: "url",
    applyTarget: `https://northwind.example/jobs/${overrides.id}`,
    status: "open",
    contentHash: `hash_${overrides.id}`,
    firstSeenAt: NOW - 86_400_000,
    lastSeenAt: NOW,
    ...overrides,
  };
}

const spamJudge: QualityJudgeVerdict = {
  authenticity: "spam",
  completeness: 40,
  sponsorship: "unknown",
  action: "drop",
  rationale: "The posting reads as recruiting spam.",
};

describe("job quality decisions", () => {
  it("drops spam, stale, and duplicate postings from rules alone", async () => {
    const calls = { count: 0 };
    const ai = {
      async run() {
        calls.count += 1;
        return { response: JSON.stringify(spamJudge) };
      },
    };
    const spam = job({
      id: "job_spam",
      title: "Data entry",
      skills: [],
      descriptionSummary: "Guaranteed income. Whatsapp only.",
    });
    const stale = job({ id: "job_stale", lastSeenAt: NOW - STALE_AFTER_MS - 1 });
    const original = job({ id: "job_original", firstSeenAt: NOW - 10_000 });
    const duplicate = job({
      id: "job_duplicate",
      title: original.title,
      applyTarget: original.applyTarget,
      contentHash: "hash_duplicate",
      firstSeenAt: NOW,
    });

    const spamDecision = await decideJobQuality({ job: spam, peers: [spam], nowMs: NOW, ai });
    const staleDecision = await decideJobQuality({ job: stale, peers: [stale], nowMs: NOW, ai });
    const duplicateDecision = await decideJobQuality({ job: duplicate, peers: [original, duplicate], nowMs: NOW, ai });
    const kept = await decideJobQuality({ job: original, peers: [original, duplicate], nowMs: NOW, ai });

    expect(spamDecision.action).toBe("drop");
    expect(spamDecision.authenticity).toBe("spam");
    expect(spamDecision.source).toBe("rules");
    expect(staleDecision.action).toBe("drop");
    expect(staleDecision.authenticity).toBe("stale");
    expect(duplicateDecision.action).toBe("drop");
    expect(duplicateDecision.authenticity).toBe("duplicate");
    expect(kept.action).toBe("keep");
    expect(kept.source).toBe("rules");
    expect(calls.count).toBe(0);
    expect(spamDecision.rulesetVersion).toBe(QUALITY_RULESET_VERSION);
  });

  it("enriches a thin posting and repeats the same decision key", async () => {
    const thin = job({
      id: "job_thin",
      title: "Backend engineer",
      skills: [],
      descriptionSummary: "Build TypeScript and PostgreSQL services for the product.",
      salaryMin: undefined,
      salaryMax: undefined,
      salaryCurrency: undefined,
    });
    const first = await decideJobQuality({ job: thin, peers: [thin], nowMs: NOW });
    const second = await decideJobQuality({ job: thin, peers: [thin], nowMs: NOW });
    expect(first.action).toBe("enrich");
    expect(first.addedSkills).toEqual(expect.arrayContaining(["TypeScript", "PostgreSQL"]));
    expect(first.decisionKey).toBe(second.decisionKey);
    expect(first.source).toBe("rules");
    expect(first.modelInvoked).toBe(false);
  });

  it("lets a Workers AI spam verdict drop a review posting and ignores a judge on a hard drop", async () => {
    const review = job({
      id: "job_review",
      skills: ["TypeScript", "React"],
      descriptionSummary: "B".repeat(140),
    });
    const rules = assessJobQuality(review, [review], NOW);
    expect(rules.disposition).toBe("review");
    const calls = { count: 0 };
    const decision = await decideJobQuality({
      job: review,
      peers: [review],
      nowMs: NOW,
      ai: {
        async run() {
          calls.count += 1;
          return { response: JSON.stringify(spamJudge) };
        },
      },
    });
    expect(calls.count).toBe(1);
    expect(decision.action).toBe("drop");
    expect(decision.source).toBe("workers_ai");
    expect(decision.modelInvoked).toBe(true);
    expect(decision.decisionKey).toBe((await decideJobQuality({
      job: review,
      peers: [review],
      nowMs: NOW,
      ai: { async run() { return { response: JSON.stringify(spamJudge) }; } },
    })).decisionKey);

    const overridden = mergeRuleAndJudge(assessJobQuality(job({ id: "job_spam_rule", descriptionSummary: "Guaranteed income." }), [], NOW), {
      authenticity: "real",
      completeness: 90,
      sponsorship: "yes",
      action: "keep",
      rationale: "Looks fine.",
    });
    expect(overridden.action).toBe("drop");
    expect(overridden.source).toBe("rules");
    expect(overridden.judge).toBeNull();
  });
});
