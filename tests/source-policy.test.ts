import { describe, expect, it } from "vitest";
import { InMemoryD1Database } from "../src/db/in-memory-db.js";
import { CompanyRepository, JobRepository } from "../src/db/repositories.js";
import { Company, Job } from "../src/types/domain.js";
import { isIgnoredSourceDomain, normalizeDomain } from "../src/utils/source-policy.js";

const company = (id: string, domain: string): Company => ({
  id,
  domain,
  name: domain,
  websiteUrl: `https://${domain}`,
  techStack: ["TypeScript"],
  socialLinks: {},
  locationHint: "Remote, US",
  discoverySource: "test",
  createdAt: 1,
  updatedAt: 1,
});

const job = (id: string, companyId: string): Job => ({
  id,
  companyId,
  careerPageId: `page_${companyId}`,
  title: "Senior Software Engineer",
  status: "open",
  employmentType: "full-time",
  seniorityLevel: "senior",
  techCategory: "backend_systems",
  isTechRole: true,
  isRemote: true,
  remoteScope: "us",
  skills: ["TypeScript"],
  applyType: "url",
  applyTarget: `https://${companyId}.com/jobs/1`,
  contentHash: `hash_${id}`,
  firstSeenAt: 1,
  lastSeenAt: 1,
});

describe("Off-radar source policy", () => {
  it("normalizes URLs and blocks aggregator subdomains", () => {
    expect(normalizeDomain("HTTPS://WWW.ADZUNA.CO.UK/jobs")).toBe("adzuna.co.uk");
    expect(isIgnoredSourceDomain("jobs.indeed.com")).toBe(true);
    expect(isIgnoredSourceDomain("https://microdev.example/jobs")).toBe(false);
  });

  it("keeps blocked companies and jobs out of public repositories", async () => {
    const db = new InMemoryD1Database();
    const companies = new CompanyRepository(db);
    const jobs = new JobRepository(db);

    await companies.upsert(company("comp_clean", "microdev.example"));
    await companies.upsert(company("comp_adzuna", "adzuna.co.uk"));
    await jobs.upsert(job("job_clean", "comp_clean"));
    await jobs.upsert(job("job_adzuna", "comp_adzuna"));

    expect(await companies.count()).toBe(1);
    expect((await companies.listPaged({ limit: 10 })).items.map((item) => item.domain)).toEqual(["microdev.example"]);
    expect(await jobs.count()).toBe(1);
    expect((await jobs.listPaged({ limit: 10 })).pagination.total).toBe(1);
    expect((await jobs.getStatsSummary()).total).toBe(1);
    expect(await jobs.getById("job_adzuna")).toBeNull();
  });
});
