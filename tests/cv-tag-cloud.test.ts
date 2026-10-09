import { describe, it, expect, beforeEach } from "vitest";
import { CvTagCloudService } from "../src/services/cv-tag-cloud.js";
import { JdRerankerService } from "../src/services/jd-reranker.js";
import { Job, Company, CvVersion, TARGET_GROUPS } from "../src/types/domain.js";
import { InMemoryD1Database } from "../src/db/in-memory-db.js";
import {
  JobRepository,
  CompanyRepository,
  CvRepository,
  UserRepository,
} from "../src/db/repositories.js";
import worker from "../src/index.js";

describe("Synchronized CV Tag Cloud & Document Import Suite", () => {
  const service = new CvTagCloudService();
  const reranker = new JdRerankerService();
  const mockNow = 1750000000000;

  const sampleCompany: Company = {
    id: "comp_synthetix",
    domain: "synthetix.io",
    name: "Synthetix Labs",
    websiteUrl: "https://synthetix.io",
    techStack: ["Rust", "TypeScript", "Solidity", "Docker"],
    socialLinks: {},
    discoverySource: "seed",
    isMidwest: true,
    usRegion: "midwest",
    fundingStage: "series_a",
    createdAt: mockNow,
    updatedAt: mockNow,
  };

  const sampleJob: Job = {
    id: "job_lead_backend",
    companyId: "comp_synthetix",
    companyName: "Synthetix Labs",
    careerPageId: "page_syn",
    title: "Lead Backend Engineer",
    descriptionSummary: "Build high-throughput event-driven microservices using Go, Rust, PostgreSQL, Kubernetes, and Cloudflare Workers.",
    applyType: "url",
    applyTarget: "https://synthetix.io/jobs/lead-backend",
    employmentType: "full-time",
    location: "Chicago, IL",
    isRemote: true,
    remoteScope: "worldwide",
    isMidwest: true,
    usRegion: "midwest",
    isTechRole: true,
    seniorityLevel: "lead",
    techCategory: "backend_systems",
    skills: ["Go", "Rust", "PostgreSQL", "Kubernetes", "Cloudflare Workers", "Kafka", "Docker"],
    salaryMin: 170000,
    salaryMax: 220000,
    salaryCurrency: "USD",
    status: "open",
    contentHash: "hash_backend_1",
    firstSeenAt: mockNow,
    lastSeenAt: mockNow,
  };

  describe("1. Document Parsing & Text Extraction", () => {
    it("should extract skills and text from Markdown / Plain Text", () => {
      const mdContent = `# Alex Rivera - Staff Software Engineer
## Profile
Experienced backend systems architect specializing in Go, TypeScript, Docker, and PostgreSQL.

## Technical Skills
- Languages: Go, TypeScript, Python, SQL
- Cloud & Infrastructure: Cloudflare Workers, Docker, Kubernetes, AWS
- Databases: PostgreSQL, Redis`;

      const result = service.parseUploadedDocument("resume.md", mdContent, "text/markdown");

      expect(result.content.length).toBeGreaterThan(100);
      expect(result.skills).toContain("Go");
      expect(result.skills).toContain("TypeScript");
      expect(result.skills).toContain("PostgreSQL");
      expect(result.skills).toContain("Docker");
      expect(result.tagCloud.totalTags).toBeGreaterThanOrEqual(5);
    });

    it("should extract text from PDF content stream literals", () => {
      // Emulate raw PDF content stream containing BT ... ET text blocks
      const pdfBufferLike = `
%PDF-1.4
1 0 obj
<< /Length 200 >>
stream
BT
/F1 12 Tf
(Senior Fullstack Engineer with React, Node.js, TypeScript and GraphQL experience) Tj
ET
BT
(Proficient in PostgreSQL, Docker, AWS and TailwindCSS) Tj
ET
endstream
endobj
%%EOF`;

      const result = service.parseUploadedDocument("resume.pdf", pdfBufferLike, "application/pdf");

      expect(result.skills).toContain("React");
      expect(result.skills).toContain("TypeScript");
      expect(result.skills).toContain("PostgreSQL");
      expect(result.skills).toContain("Docker");
    });

    it("should extract text from Word DOCX XML markup", () => {
      const docxXml = `
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p><w:r><w:t>Nguyen Van B - AI & ML Engineer</w:t></w:r></w:p>
    <w:p><w:r><w:t>Specialized in PyTorch, LLMs, LangChain, Python, Vector DBs, and FastAPI.</w:t></w:r></w:p>
  </w:body>
</w:document>`;

      const result = service.parseUploadedDocument("resume.docx", docxXml, "application/vnd.openxmlformats-officedocument.wordprocessingml.document");

      expect(result.skills).toContain("Python");
      expect(result.skills).toContain("PyTorch");
      expect(result.skills).toContain("FastAPI");
      expect(result.tagCloud.primaryTargetGroup).toBe("ai_first_innovators");
    });

    it("should extract structured data from JSON resume format", () => {
      const jsonResume = JSON.stringify({
        basics: {
          name: "Taylor Swift",
          label: "Site Reliability & Platform Engineer",
        },
        skills: [
          { name: "DevOps", keywords: ["Kubernetes", "Terraform", "Docker", "Prometheus"] },
          { name: "Languages", keywords: ["Go", "Python", "Bash"] }
        ],
      });

      const result = service.parseUploadedDocument("resume.json", jsonResume, "application/json");

      expect(result.skills).toContain("Kubernetes");
      expect(result.skills).toContain("Docker");
      expect(result.skills).toContain("Terraform");
      expect(result.targetRole).toBe("Site Reliability & Platform Engineer");
    });
  });

  describe("2. Tag Cloud Skill Categorization & Weighting", () => {
    it("should categorize skills into appropriate domain categories", () => {
      const text = `
Proficient in TypeScript, Python, React, Next.js, PostgreSQL, Cloudflare Workers,
PyTorch, LLM, Docker, Kubernetes, CI/CD, Microservices, and System Design.`;

      const analysis = service.analyzeCv(text);

      const languages = analysis.tags.filter((t) => t.category === "languages").map((t) => t.name);
      const frameworks = analysis.tags.filter((t) => t.category === "frameworks").map((t) => t.name);
      const cloud = analysis.tags.filter((t) => t.category === "cloud_infra").map((t) => t.name);
      const db = analysis.tags.filter((t) => t.category === "database").map((t) => t.name);
      const ai = analysis.tags.filter((t) => t.category === "ai_ml").map((t) => t.name);
      const arch = analysis.tags.filter((t) => t.category === "architecture").map((t) => t.name);

      expect(languages).toContain("TypeScript");
      expect(languages).toContain("Python");
      expect(frameworks).toContain("React");
      expect(cloud).toContain("Docker");
      expect(db).toContain("PostgreSQL");
      expect(ai).toContain("PyTorch");
      expect(arch).toContain("Microservices");
    });

    it("should compute target group archetype fit correctly", () => {
      const aiSpecialistText = `
Master of AI Engineering. Built Autonomous Agents with PyTorch, Transformers,
LangChain, Vector DBs, RAG architectures, and fine-tuned open-source LLMs with Python.`;

      const analysis = service.analyzeCv(aiSpecialistText);

      expect(analysis.primaryTargetGroup).toBe("ai_first_innovators");
      expect(analysis.detectedTargetGroupFit.ai_first_innovators).toBeGreaterThan(
        analysis.detectedTargetGroupFit.early_stage_startups
      );
    });
  });

  describe("3. Synchronized JD Tag Cloud Comparison", () => {
    it("should accurately compare CV against a specific Job JD", () => {
      const cvText = `# Software Engineer
## Skills
Go, Docker, PostgreSQL, React, TypeScript, jQuery, SVN`;

      const comparison = service.compareCvWithJd(cvText, { job: sampleJob });

      const matchedNames = comparison.matchedTags.map((t) => t.name);
      const missingNames = comparison.missingTags.map((t) => t.name);
      const cvOnlyNames = comparison.cvOnlyTags.map((t) => t.name);
      const deprecatedNames = comparison.deprecatedTags.map((t) => t.name);

      // In both CV and sampleJob (Go, Docker, PostgreSQL)
      expect(matchedNames).toContain("Go");
      expect(matchedNames).toContain("Docker");
      expect(matchedNames).toContain("PostgreSQL");

      // In sampleJob but missing from CV (Rust, Kubernetes, Cloudflare Workers)
      expect(missingNames).toContain("Rust");
      expect(missingNames).toContain("Kubernetes");

      // In CV but not strictly in sampleJob (React, TypeScript)
      expect(cvOnlyNames).toContain("React");
      expect(cvOnlyNames).toContain("TypeScript");

      // Deprecated skills flagged
      expect(deprecatedNames).toContain("jQuery");
      expect(deprecatedNames).toContain("SVN");

      expect(comparison.matchPercentage).toBeGreaterThan(30);
      expect(comparison.matchPercentage).toBeLessThan(100);
      expect(comparison.targetContext.type).toBe("job");
      expect(comparison.targetContext.title).toBe("Lead Backend Engineer");
    });

    it("should compare CV against target group archetype and market report", () => {
      const jobs = [sampleJob];
      const report = reranker.generateRealtimeReport(jobs);

      const candidateCv = `Experienced with TypeScript, Node.js, React, Docker, Cloudflare Workers, Next.js, Supabase, TailwindCSS.`;

      const comparison = service.compareCvWithJd(candidateCv, {
        targetGroup: "early_stage_startups",
        report,
      });

      expect(comparison.targetContext.type).toBe("target_group");
      expect(comparison.matchPercentage).toBeGreaterThanOrEqual(40);
      expect(comparison.matchedTags.length).toBeGreaterThan(0);
    });
  });

  describe("4. End-to-End REST API Integration", () => {
    let db: InMemoryD1Database;
    let env: any;
    const testToken = "test_tag_cloud_token_456";

    beforeEach(async () => {
      db = new InMemoryD1Database();
      env = {
        DB: db,
        ADMIN_TOKEN: "admin-secret-2026",
      };

      const userRepo = new UserRepository(db);
      const companyRepo = new CompanyRepository(db);
      const jobRepo = new JobRepository(db);

      await userRepo.upsert({
        id: "usr_tag_cloud",
        telegramId: "12345678",
        firstName: "Thao",
        apiToken: testToken,
        createdAt: mockNow,
        updatedAt: mockNow,
      });

      await companyRepo.upsert(sampleCompany);
      await jobRepo.upsert(sampleJob);
    });

    it("POST /api/user/cvs/import should accept text/json payload and persist CV with tag cloud", async () => {
      const req = new Request("http://localhost/api/user/cvs/import", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${testToken}`,
        },
        body: JSON.stringify({
          version_title: "Cloud & Distributed Systems CV",
          target_role: "Principal Infrastructure Architect",
          target_group: "scaleups_growth",
          file_content: "# Thao Resume\n\n## Skills\nGo, Rust, Kubernetes, Docker, PostgreSQL, Kafka, Prometheus, Linux",
        }),
      });

      const res = await worker.fetch(req, env, {} as any);
      expect(res.status).toBe(201);
      const data = (await res.json()) as any;

      expect(data.success).toBe(true);
      expect(data.cv).toBeTruthy();
      expect(data.cv.title).toBe("Cloud & Distributed Systems CV");
      expect(data.cv.targetRole).toBe("Principal Infrastructure Architect");
      expect(data.parsed.skills).toContain("Kubernetes");
      expect(data.parsed.totalTags).toBeGreaterThanOrEqual(5);

      // Verify persistence in D1
      const cvRepo = new CvRepository(db);
      const stored = await cvRepo.getById(data.cv.id, "usr_tag_cloud");
      expect(stored).not.toBeNull();
      expect(stored?.skills).toContain("Rust");
    });

    it("POST /api/user/cvs/compare-tags should return synchronized comparison against targeted job", async () => {
      // First, create a CV
      const cvRepo = new CvRepository(db);
      const testCvId = "cv_test_compare_1";
      await cvRepo.create({
        id: testCvId,
        userId: "usr_tag_cloud",
        title: "Senior Go Developer",
        content: "# Developer\n\n## Skills\nGo, Docker, PostgreSQL, Redis",
        skills: ["Go", "Docker", "PostgreSQL", "Redis"],
        createdAt: mockNow,
        updatedAt: mockNow,
      });

      const req = new Request("http://localhost/api/user/cvs/compare-tags", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${testToken}`,
        },
        body: JSON.stringify({
          cv_id: testCvId,
          job_id: "job_lead_backend",
        }),
      });

      const res = await worker.fetch(req, env, {} as any);
      expect(res.status).toBe(200);
      const data = (await res.json()) as any;

      expect(data.success).toBe(true);
      expect(data.cvId).toBe(testCvId);
      expect(data.comparison.matchedTags.map((t: any) => t.name)).toContain("Go");
      expect(data.comparison.missingTags.map((t: any) => t.name)).toContain("Rust");
      expect(data.comparison.matchPercentage).toBeGreaterThan(0);
    });

    it("GET /api/user/cvs/:id/tag-cloud should return tag cloud analysis for stored CV", async () => {
      const cvRepo = new CvRepository(db);
      const testCvId = "cv_stored_tc_1";
      await cvRepo.create({
        id: testCvId,
        userId: "usr_tag_cloud",
        title: "AI Specialist",
        content: "# AI Developer\n\n## Skills\nPython, PyTorch, LangChain, Transformers, Docker",
        skills: ["Python", "PyTorch", "LangChain", "Transformers", "Docker"],
        createdAt: mockNow,
        updatedAt: mockNow,
      });

      const req = new Request(`http://localhost/api/user/cvs/${testCvId}/tag-cloud`, {
        headers: {
          Authorization: `Bearer ${testToken}`,
        },
      });

      const res = await worker.fetch(req, env, {} as any);
      expect(res.status).toBe(200);
      const data = (await res.json()) as any;

      expect(data.success).toBe(true);
      expect(data.cvId).toBe(testCvId);
      expect(data.analysis.tags.map((t: any) => t.name)).toContain("PyTorch");
      expect(data.analysis.primaryTargetGroup).toBe("ai_first_innovators");
    });

    it("GET /api/reports/tag-cloud-market should return aggregated market skill cloud", async () => {
      const req = new Request("http://localhost/api/reports/tag-cloud-market");
      const res = await worker.fetch(req, env, {} as any);

      expect(res.status).toBe(200);
      const data = (await res.json()) as any;

      expect(data.success).toBe(true);
      expect(data.marketTagCloud.totalJobsSampled).toBeGreaterThanOrEqual(1);
      expect(data.marketTagCloud.topSkills.length).toBeGreaterThan(0);
      expect(data.marketTagCloud.categories.languages).toBeDefined();
    });

    it("should allow adding missing skills via PUT and increase match score", async () => {
      const cvRepo = new CvRepository(db);
      const testCvId = "cv_iterative_opt";
      await cvRepo.create({
        id: testCvId,
        userId: "usr_tag_cloud",
        title: "Backend Engineer",
        content: "# Developer\n\n## Skills\nGo",
        skills: ["Go"],
        matchScore: 30,
        createdAt: mockNow,
        updatedAt: mockNow,
      });

      // Initial comparison
      let compReq = new Request("http://localhost/api/user/cvs/compare-tags", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${testToken}`,
        },
        body: JSON.stringify({ cv_id: testCvId, job_id: "job_lead_backend" }),
      });
      let compRes = await worker.fetch(compReq, env, {} as any);
      let compData = (await compRes.json()) as any;
      const initialScore = compData.comparison.matchPercentage;

      // User clicks '+ Thêm' on Rust, Kubernetes, PostgreSQL
      const updateReq = new Request(`http://localhost/api/user/cvs/${testCvId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${testToken}`,
        },
        body: JSON.stringify({
          skills: ["Go", "Rust", "Kubernetes", "PostgreSQL"],
          content: "# Developer\n\n## Skills\nGo, Rust, Kubernetes, PostgreSQL",
        }),
      });
      const updateRes = await worker.fetch(updateReq, env, {} as any);
      expect(updateRes.status).toBe(200);

      // Re-compare
      compReq = new Request("http://localhost/api/user/cvs/compare-tags", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${testToken}`,
        },
        body: JSON.stringify({ cv_id: testCvId, job_id: "job_lead_backend" }),
      });
      compRes = await worker.fetch(compReq, env, {} as any);
      compData = (await compRes.json()) as any;
      const updatedScore = compData.comparison.matchPercentage;

      expect(updatedScore).toBeGreaterThan(initialScore);
      expect(compData.comparison.matchedTags.map((t: any) => t.name)).toContain("Rust");
      expect(compData.comparison.matchedTags.map((t: any) => t.name)).toContain("Kubernetes");
    });
  });
});
