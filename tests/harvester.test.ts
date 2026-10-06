import { describe, it, expect, beforeEach } from "vitest";
import { InMemoryD1Database } from "../src/db/in-memory-db.js";
import {
  HackerNewsHarvester,
  GitHubDirectoryHarvester,
  PublicSourceManager,
  HarvestedCompanyProfile,
  decodeHtmlEntities,
  sanitizeEmail,
  extractDomainFromUrl,
} from "../src/harvesters/public-source-harvester.js";
import { PipelineOrchestrator } from "../src/orchestrator/dispatcher.js";

describe("Public Sources Harvester Suite", () => {
  let db: InMemoryD1Database;
  let manager: PublicSourceManager;

  beforeEach(() => {
    db = new InMemoryD1Database();
    manager = new PublicSourceManager(db);
  });

  describe("Utility Functions", () => {
    it("should correctly decode HTML entities", () => {
      const input = "Supero | Cloud &#x2F; Platform Engineer &amp; Dev | REMOTE | &lt;tag&gt; &#x27;quote&#x27;";
      const output = decodeHtmlEntities(input);
      expect(output).toBe("Supero | Cloud / Platform Engineer & Dev | REMOTE | <tag> 'quote'");
    });

    it("should sanitize and validate email addresses", () => {
      expect(sanitizeEmail("jobs@supero.dev")).toBe("jobs@supero.dev");
      expect(sanitizeEmail("invalid-email")).toBeNull();
      expect(sanitizeEmail("test@example.com")).toBeNull();
      expect(sanitizeEmail(null)).toBeNull();
    });

    it("should extract clean domains from URLs", () => {
      expect(extractDomainFromUrl("https://www.supero.dev/careers")).toBe("supero.dev");
      expect(extractDomainFromUrl("http://livekit.io")).toBe("livekit.io");
      expect(extractDomainFromUrl("invalid url")).toBeNull();
    });
  });

  describe("HackerNewsHarvester", () => {
    const hnHarvester = new HackerNewsHarvester();

    it("should parse structured Hacker News hiring comments with career URLs and roles", () => {
      const mockHit = {
        objectID: "49522899",
        parent_id: "49522897",
        story_id: "49522897",
        comment_text: `Supero | Cloud &#x2F; Platform Engineer | REMOTE (SF Bay Area, CA, US) | Full-time | <a href="https:&#x2F;&#x2F;www.supero.dev&#x2F;careers&#x2F;cloud-platform-engineer&#x2F;" rel="nofollow">https:&#x2F;&#x2F;www.supero.dev&#x2F;careers&#x2F;cloud-platform-engineer&#x2F;</a><p>We generate full-stack apps and deploy them on AWS and Kubernetes. TypeScript and Python stack.<p>Contact us at jobs@supero.dev`,
      };

      const profile = hnHarvester.parseHnComment(mockHit);
      expect(profile).not.toBeNull();
      expect(profile?.name).toBe("Supero");
      expect(profile?.domain).toBe("supero.dev");
      expect(profile?.websiteUrl).toBe("https://supero.dev");
      expect(profile?.careersUrl).toBe("https://www.supero.dev/careers/cloud-platform-engineer/");
      expect(profile?.contactEmail).toBe("jobs@supero.dev");
      expect(profile?.locationHint).toContain("REMOTE");
      expect(profile?.techStack).toContain("AWS");
      expect(profile?.techStack).toContain("Kubernetes");
      expect(profile?.techStack).toContain("TypeScript");

      // Verify direct inline role was extracted
      expect(profile?.inlineRoles.length).toBe(1);
      const role = profile?.inlineRoles[0];
      expect(role?.title).toBe("Cloud / Platform Engineer");
      expect(role?.techCategory).toBe("devops_cloud");
      expect(role?.seniorityLevel).toBe("mid");
    });

    it("should detect new grad and intern roles from HN comments", () => {
      const mockHit = {
        objectID: "49522900",
        parent_id: "49522897",
        story_id: "49522897",
        comment_text: `Acme AI | New Grad Software Engineer | Chicago, IL | Full-time | https://acmeai.tech/jobs<p>Building LLM tools with PyTorch and FastAPI. Contact founders@acmeai.tech`,
      };

      const profile = hnHarvester.parseHnComment(mockHit);
      expect(profile).not.toBeNull();
      expect(profile?.inlineRoles.length).toBe(1);
      expect(profile?.inlineRoles[0]?.seniorityLevel).toBe("new_grad");
      expect(profile?.inlineRoles[0]?.techCategory).toBe("ai_ml");
    });

    it("should return null for non-hiring conversational comments", () => {
      const mockHit = {
        objectID: "49522901",
        parent_id: "49522897",
        story_id: "49522897",
        comment_text: `Are you open to remote position if I can overlap meaningful hours with EST/EDT?`,
      };

      const profile = hnHarvester.parseHnComment(mockHit);
      expect(profile).toBeNull();
    });
  });

  describe("GitHubDirectoryHarvester", () => {
    const ghHarvester = new GitHubDirectoryHarvester();

    it("should parse established-remote Markdown tables", () => {
      const mockMarkdown = `
# Established Remote Tech Companies

| Company | Industry | Technologies | Hiring | Careers |
| --- | --- | --- | --- | --- |
| [10up](https://10up.com/) | Web consulting | WordPress, PHP, React | ✗ | [Jobs](https://10up.com/careers/) |
| [37signals](https://37signals.com) | Collaboration tools | Ruby, Web | ✓ | [Jobs](https://37signals.com/jobs) |
`;

      const profiles = ghHarvester.parseEstablishedRemoteMarkdown(mockMarkdown);
      expect(profiles.length).toBe(2);

      const comp1 = profiles[0]!;
      expect(comp1.name).toBe("10up");
      expect(comp1.domain).toBe("10up.com");
      expect(comp1.websiteUrl).toBe("https://10up.com/");
      expect(comp1.careersUrl).toBe("https://10up.com/careers/");
      expect(comp1.techStack).toContain("React");
      expect(comp1.industry).toBe("Web consulting");

      const comp2 = profiles[1]!;
      expect(comp2.name).toBe("37signals");
      expect(comp2.domain).toBe("37signals.com");
      expect(comp2.careersUrl).toBe("https://37signals.com/jobs");
    });

    it("should parse remoteintech Markdown file frontmatter and blurb", () => {
      const mockMarkdown = `---
title: "Adaface"
slug: adaface
website: https://www.adaface.com
careers_url: https://adaface.com/careers
region: asia-pacific
remote_policy: fully-remote
company_size: tiny
technologies:
  - devops
  - javascript
  - python
---

## Company blurb

Adaface helps companies identify top engineers with conversational AI screening.

## Company technologies

ReactJs, Docker, Django, Python
`;

      const profile = ghHarvester.parseRemoteInTechMarkdown(mockMarkdown);
      expect(profile).not.toBeNull();
      expect(profile?.name).toBe("Adaface");
      expect(profile?.domain).toBe("adaface.com");
      expect(profile?.websiteUrl).toBe("https://www.adaface.com");
      expect(profile?.careersUrl).toBe("https://adaface.com/careers");
      expect(profile?.headcountEstimate).toBe("tiny");
      expect(profile?.locationHint).toBe("asia-pacific");
      expect(profile?.description).toContain("Adaface helps companies identify top engineers");
      expect(profile?.techStack).toContain("Python");
      expect(profile?.techStack).toContain("Docker");
    });
  });

  describe("PublicSourceManager Ingestion & Dispatch", () => {
    it("should skip profiles sourced from job-board aggregators", async () => {
      const res = await manager.ingestProfiles([{
        name: "Adzuna",
        domain: "adzuna.co.uk",
        websiteUrl: "https://www.adzuna.co.uk",
        careersUrl: "https://www.adzuna.co.uk/jobs/careers",
        techStack: [],
        socialLinks: {},
        discoverySource: "seed_list",
        inlineRoles: [],
      }]);

      expect(res.importedCompanies).toHaveLength(0);
      expect(res.directJobsCount).toBe(0);
      expect(await manager.companyRepo.count()).toBe(0);
    });

    it("should ingest harvested company profiles, direct jobs, and career pages into D1", async () => {
      const profiles: HarvestedCompanyProfile[] = [
        {
          name: "Boutique Cloud Lab",
          domain: "boutiquecloud.io",
          websiteUrl: "https://boutiquecloud.io",
          careersUrl: "https://boutiquecloud.io/careers",
          tagline: "Serverless Boutique Studio",
          description: "We build ultra-fast Cloudflare Worker solutions.",
          industry: "Cloud & Dev",
          techStack: ["TypeScript", "Cloudflare", "Rust"],
          socialLinks: {},
          contactEmail: "founder@boutiquecloud.io",
          headcountEstimate: "1-10",
          locationHint: "Remote",
          discoverySource: "hn_whoishiring",
          inlineRoles: [
            {
              title: "Senior Cloud Engineer",
              location: "Remote",
              employmentType: "full-time",
              applyTarget: "https://boutiquecloud.io/careers/senior-cloud",
              seniorityLevel: "senior",
              techCategory: "devops_cloud",
            },
          ],
        },
      ];

      const res = await manager.ingestProfiles(profiles);
      expect(res.importedCompanies.length).toBe(1);
      expect(res.directJobsCount).toBe(1);
      expect(res.targetsToCrawl.length).toBe(1);

      // Verify Company was saved in D1
      const savedCompany = await manager.companyRepo.findByDomain("boutiquecloud.io");
      expect(savedCompany).not.toBeNull();
      expect(savedCompany?.name).toBe("Boutique Cloud Lab");
      expect(savedCompany?.techStack).toContain("Cloudflare");

      // Verify Job was saved in D1
      const savedJobs = await manager.jobRepo.list({ limit: 10 });
      expect(savedJobs.length).toBe(1);
      expect(savedJobs[0]?.title).toBe("Senior Cloud Engineer");
      expect(savedJobs[0]?.seniorityLevel).toBe("senior");
      expect(savedJobs[0]?.techCategory).toBe("devops_cloud");

      // Verify Career Page was saved in D1
      const savedCareerPages = await manager.careerPageRepo.findByCompanyId(savedCompany!.id);
      expect(savedCareerPages.length).toBe(1);
      expect(savedCareerPages[0]?.url).toBe("https://boutiquecloud.io/careers");
    });

    it("should run harvestAndGatherAsync with PipelineOrchestrator and track crawl tasks", async () => {
      const orchestrator = new PipelineOrchestrator(db);

      // Mock harvestProfiles to return controlled profile
      manager.harvestProfiles = async () => [
        {
          name: "MicroDev Studio",
          domain: "microdev.co",
          websiteUrl: "https://microdev.co",
          careersUrl: "https://microdev.co/jobs",
          techStack: ["TypeScript", "React"],
          socialLinks: {},
          discoverySource: "github_directory",
          inlineRoles: [],
        },
      ];

      // Mock orchestrator processSeedAsync
      orchestrator.processSeedAsync = async (url, source, taskId) => {
        await manager.taskRepo.update(taskId!, { status: "completed", jobsFound: 2 });
        return {
          taskId: taskId!,
          companies: [],
          jobs: [],
          logs: [],
        };
      };

      const report = await manager.harvestAndGatherAsync("github", 1, orchestrator);
      expect(report.companiesHarvested).toBe(1);
      expect(report.taskIds.length).toBe(1);

      // Verify crawl task was recorded
      const task = await manager.taskRepo.getById(report.taskIds[0]!);
      expect(task).not.toBeNull();
      expect(task?.sourceType).toBe("harvest_github");
      expect(task?.status).toBe("completed");
    });
  });
});
