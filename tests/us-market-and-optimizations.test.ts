import { describe, it, expect, afterEach } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import worker from "../src/index.js";
import { InMemoryD1Database } from "../src/db/in-memory-db.js";
import { CompanyRepository, JobRepository, LogRepository, UserRepository } from "../src/db/repositories.js";
import { JobQualityDecisionRepository, MatchAlertRepository } from "../src/db/candidate-match-repository.js";
import { detectSponsorshipSignal } from "../src/matching/sponsorship-signal.js";
import { parseCandidateProfile } from "../src/matching/candidate-profile.js";
import { locationMatches } from "../src/matching/location-match.js";
import { DecisionApiService } from "../src/services/decision-api.js";
import { JdRerankerService } from "../src/services/jd-reranker.js";
import { JobExtractorAgent } from "../src/agents/job-extractor-agent.js";
import { BaseAgent } from "../src/agents/base.js";
import { renderDashboardHtml } from "../src/ui/dashboard.js";
import { Company, Job } from "../src/types/domain.js";
import { QUALITY_RULESET_VERSION } from "../src/quality/quality-rules.js";
import { decideJobQuality } from "../src/quality/decide-job-quality.js";
import { TEST_WEBHOOK_SECRET, TG_WEBHOOK_HEADERS } from "./helpers/telegram.js";

const NOW = 1_750_000_000_000;
const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

function walkTsFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) {
      out.push(...walkTsFiles(full));
    } else if (entry.endsWith(".ts")) {
      out.push(full);
    }
  }
  return out;
}

function makeCompany(id: string, name: string, locationHint: string, region: NonNullable<Company["usRegion"]>): Company {
  const slug = id.replace(/[^a-z0-9]/gi, "");
  return {
    id,
    name,
    domain: `${slug}.us`,
    websiteUrl: `https://${slug}.us`,
    locationHint,
    isMidwest: region === "midwest",
    usRegion: region,
    companyTier: "tier_1",
    techStack: ["TypeScript", "React"],
    socialLinks: {},
    discoverySource: "manual",
    createdAt: NOW - 10_000,
    updatedAt: NOW - 10_000,
  };
}

function makeJob(id: string, companyId: string, overrides: Partial<Job> = {}): Job {
  return {
    id,
    companyId,
    careerPageId: `page_${companyId}`,
    title: "Senior Software Engineer",
    seniorityLevel: "senior",
    techCategory: "fullstack",
    isTechRole: true,
    employmentType: "full-time",
    location: "Austin, TX",
    isRemote: false,
    remoteScope: "us_only",
    skills: ["TypeScript", "React"],
    descriptionSummary: "Build scalable US cloud applications with TypeScript and React.",
    rawContent: "Full job description in English.",
    applyType: "url",
    applyTarget: `https://jobs.example.us/${id}`,
    status: "open",
    contentHash: `hash_${id}`,
    firstSeenAt: NOW - 3_600_000,
    lastSeenAt: NOW,
    ...overrides,
  };
}

class TestSafeFetchAgent extends BaseAgent {
  public readonly name = "test-safe-fetch-agent";
  public async runSafeFetch(url: string) {
    return this.safeFetch(url);
  }
}

describe("US Market Comprehensive Optimization Suite", () => {
  describe("1. Zero Vietnamese runtime copy, canonical domain, and US-focused dashboard SSR", () => {
    it("removes Vietnamese copy from runtime UI, index, decision API, MCP, and SMB comments", () => {
      const targetFiles = [
        "src/index.ts",
        "src/ui/dashboard.ts",
        "src/services/decision-api.ts",
        "src/mcp/mcp-server.ts",
        "src/harvesters/smb-harvester.ts",
      ];
      const viDiacritics = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐ]/;
      for (const file of targetFiles) {
        const content = readFileSync(file, "utf8").replace(/clich[eé]/gi, "cliche");
        expect(content, `${file} should not contain Vietnamese diacritics`).not.toMatch(viDiacritics);
      }
    });

    it("uses canonical https://jobs.ai-kit.net domain with zero legacy workers.dev references in src/", () => {
      for (const file of walkTsFiles("src")) {
        const content = readFileSync(file, "utf8");
        expect(content, `${file} still references legacy workers.dev domain`).not.toContain("off-radar-jobs.tuannx87.workers.dev");
      }
    });

    it("renders en-US SEO metadata, JSON-LD WebSite schema, 50 states + DC (CO under Mountain), and null-safe JS helpers", () => {
      const html = renderDashboardHtml({
        companiesCount: 25,
        jobsCount: 120,
        seniorCount: 40,
        midwestPercent: 50,
        regionalBreakdown: { midwest: 60, west: 25, northeast: 15, south: 12, mountain: 8 },
      });

      expect(html).toContain('<html lang="en-US">');
      expect(html).toContain('<link rel="canonical" href="https://jobs.ai-kit.net/">');
      expect(html).toContain('"@type":"WebSite"');
      expect(html).toContain('id="jobs-jsonld"');
      expect(html).toContain('https://jobs.ai-kit.net/mcp');
      expect(html).toContain('New Grad 2026/2027');
      expect(html).toContain('<option value="DC">Washington, D.C. (DC)</option>');
      expect(html).toContain('safeHref(');
      expect(html).toContain('formatSalaryBadge(');

      // CO must sit inside US-Mountain optgroup, not US-West
      const mountainIdx = html.indexOf('label="🏔️ US-Mountain');
      const coOptionIdx = html.indexOf('<option value="CO">Colorado');
      expect(mountainIdx).toBeGreaterThan(-1);
      expect(coOptionIdx).toBeGreaterThan(mountainIdx);
    });
  });

  describe("2. 50-State + DC Classification & US-Eligible Remote Filtering", () => {
    it("routes Washington, DC to US-South (excluding US-West) and classifies Alaska/Hawaii/Mountain accurately", async () => {
      const db = new InMemoryD1Database();
      const companyRepo = new CompanyRepository(db);
      const jobRepo = new JobRepository(db);

      const companies = [
        makeCompany("comp_dc", "Capitol Policy Tech", "Washington, DC", "south"),
        makeCompany("comp_wa", "Puget Sound Systems", "Seattle, WA", "west"),
        makeCompany("comp_co", "Front Range AI", "Denver, CO", "mountain"),
        makeCompany("comp_ma", "Charles River Labs", "Boston, MA", "northeast"),
        makeCompany("comp_il", "Lakefront Data", "Chicago, IL", "midwest"),
        makeCompany("comp_hi", "Pacific Grid", "Honolulu, HI", "west"),
        makeCompany("comp_ak", "Boreal Cloud", "Anchorage, AK", "west"),
      ];
      for (const c of companies) await companyRepo.upsert(c);

      await jobRepo.upsert(makeJob("job_dc", "comp_dc", { location: "Washington, DC", usRegion: "south" }));
      await jobRepo.upsert(makeJob("job_wa", "comp_wa", { location: "Seattle, WA", usRegion: "west" }));
      await jobRepo.upsert(makeJob("job_co", "comp_co", { location: "Denver, CO", usRegion: "mountain" }));
      await jobRepo.upsert(makeJob("job_ma", "comp_ma", { location: "Boston, MA", usRegion: "northeast" }));
      await jobRepo.upsert(makeJob("job_il", "comp_il", { location: "Chicago, IL", isMidwest: true, usRegion: "midwest" }));
      await jobRepo.upsert(makeJob("job_hi", "comp_hi", { location: "Honolulu, HI", usRegion: "west" }));
      await jobRepo.upsert(makeJob("job_ak", "comp_ak", { location: "Anchorage, AK", usRegion: "west" }));

      const southIds = (await jobRepo.listPaged({ page: 1, limit: 50, region: "south", techOnly: false })).items.map((j) => j.id);
      const westIds = (await jobRepo.listPaged({ page: 1, limit: 50, region: "west", techOnly: false })).items.map((j) => j.id);
      const mountainIds = (await jobRepo.listPaged({ page: 1, limit: 50, region: "mountain", techOnly: false })).items.map((j) => j.id);
      const northeastIds = (await jobRepo.listPaged({ page: 1, limit: 50, region: "northeast", techOnly: false })).items.map((j) => j.id);
      const midwestIds = (await jobRepo.listPaged({ page: 1, limit: 50, region: "midwest", techOnly: false })).items.map((j) => j.id);

      expect(southIds).toContain("job_dc");
      expect(westIds).not.toContain("job_dc");
      expect(westIds).toEqual(expect.arrayContaining(["job_wa", "job_hi", "job_ak"]));
      expect(mountainIds).toContain("job_co");
      expect(northeastIds).toContain("job_ma");
      expect(midwestIds).toContain("job_il");
    });

    it("excludes non-US remote scopes (vietnam_only, eu_only, apac) from US-eligible remote results", async () => {
      const db = new InMemoryD1Database();
      const companyRepo = new CompanyRepository(db);
      const jobRepo = new JobRepository(db);

      await companyRepo.upsert(makeCompany("comp_rem", "Remote US Corp", "Remote (US)", "west"));
      await jobRepo.upsert(makeJob("job_us_rem", "comp_rem", { isRemote: true, remoteScope: "us_only", location: "Remote (US)" }));
      await jobRepo.upsert(makeJob("job_mw_rem", "comp_rem", { isRemote: true, remoteScope: "us_midwest", location: "Remote (Midwest)" }));
      await jobRepo.upsert(makeJob("job_ww_rem", "comp_rem", { isRemote: true, remoteScope: "worldwide", location: "Remote" }));
      await jobRepo.upsert(makeJob("job_vn_rem", "comp_rem", { isRemote: true, remoteScope: "vietnam_only", location: "Remote (Vietnam)" }));
      await jobRepo.upsert(makeJob("job_eu_rem", "comp_rem", { isRemote: true, remoteScope: "eu_only", location: "Remote (EU)" }));
      await jobRepo.upsert(makeJob("job_ap_rem", "comp_rem", { isRemote: true, remoteScope: "apac", location: "Remote (APAC)" }));

      const listIds = (await jobRepo.list({ region: "remote", techOnly: false })).map((j) => j.id);
      const pagedIds = (await jobRepo.listPaged({ page: 1, limit: 50, region: "remote", techOnly: false })).items.map((j) => j.id);

      for (const ids of [listIds, pagedIds]) {
        expect(ids).toEqual(expect.arrayContaining(["job_us_rem", "job_mw_rem", "job_ww_rem"]));
        expect(ids).not.toContain("job_vn_rem");
        expect(ids).not.toContain("job_eu_rem");
        expect(ids).not.toContain("job_ap_rem");
      }
    });
  });

  describe("3. US Work Authorization, Clearance, Metro Synonyms & Resume Profile Parsing", () => {
    it("detects US security clearances, ITAR, citizenship restrictions, and US visa sponsorship pathways", () => {
      expect(detectSponsorshipSignal("Active TS/SCI security clearance required for this defense team.")).toBe("no");
      expect(detectSponsorshipSignal("ITAR regulated position - US Person only.")).toBe("no");
      expect(detectSponsorshipSignal("U.S. Citizens only due to federal contract.")).toBe("no");
      expect(detectSponsorshipSignal("Green Card or U.S. Citizen required without sponsorship.")).toBe("no");

      expect(detectSponsorshipSignal("We welcome H-1B transfer and cap-exempt applicants.")).toBe("yes");
      expect(detectSponsorshipSignal("Eligible for F-1 OPT, STEM OPT, E-3 visa, and TN visa.")).toBe("yes");
      expect(detectSponsorshipSignal("O-1 visa and Green Card sponsorship available after 6 months.")).toBe("yes");
    });

    it("matches US metro area synonyms and City, ST header extraction without false cross-city matches", () => {
      const mvJob = makeJob("job_mv", "comp_x", { location: "Mountain View, CA", usRegion: "west" });
      const vaJob = makeJob("job_va", "comp_x", { location: "Arlington, VA", usRegion: "south" });
      const atxJob = makeJob("job_atx", "comp_x", { location: "Austin, TX", usRegion: "south" });

      expect(locationMatches(mvJob, ["San Francisco Bay Area"])).toBe(true);
      expect(locationMatches(vaJob, ["DMV"])).toBe(true);
      expect(locationMatches(atxJob, ["Chicago, IL"])).toBe(false);

      const parsed = parseCandidateProfile({
        text: "Jane Doe\nStaff Backend Engineer\nAustin, TX\nExperience: TypeScript, PostgreSQL, AWS.\nWork Authorization: F-1 OPT / H-1B transfer candidate.",
      });
      expect(parsed.ok).toBe(true);
      if (parsed.ok) {
        expect(parsed.value.locations).toContain("Austin, TX");
        expect(parsed.value.sponsorship).toBe("required");
      }

      const citizenParsed = parseCandidateProfile({
        text: "John Smith\nBoulder, CO\nUS Citizen, Go & Kubernetes engineer.",
      });
      expect(citizenParsed.ok).toBe(true);
      if (citizenParsed.ok) {
        expect(citizenParsed.value.locations).toContain("Boulder, CO");
        expect(citizenParsed.value.sponsorship).toBe("not_needed");
      }
    });
  });

  describe("4. US Resume EEO Removals, USD Transparency Scoring & JobExtractorAgent Salary/Location Parsing", () => {
    it("flags and strips non-US EEO resume elements without corrupting engineering text", async () => {
      const optimizer = new DecisionApiService();
      const resume = [
        "# Jordan Lee",
        "Date of Birth: 1995-04-12",
        "Marital Status: Single",
        "Photo: headshot.jpg",
        "## Experience",
        "Built single-tenant Distributed Systems and TypeScript APIs with 99.9% uptime.",
        "## Skills",
        "TypeScript, PostgreSQL, jQuery",
        "References available upon request.",
      ].join("\n");

      const result = await optimizer.optimizeCvForTargetGroup(resume, "ai_first_innovators");
      const removalItems = result.removals.map((r) => r.item.toLowerCase());

      expect(removalItems.some((i) => i.includes("date of birth"))).toBe(true);
      expect(removalItems.some((i) => i.includes("marital status"))).toBe(true);
      expect(removalItems.some((i) => i.includes("photo / headshot"))).toBe(true);
      expect(removalItems.some((i) => i.includes("references available upon request"))).toBe(true);

      expect(result.optimizedCvContent).not.toContain("1995-04-12");
      expect(result.optimizedCvContent).not.toContain("Marital Status");
      expect(result.optimizedCvContent).not.toContain("headshot.jpg");
      expect(result.optimizedCvContent).not.toContain("References available upon request");
      expect(result.optimizedCvContent).toContain("single-tenant Distributed Systems");
    });

    it("rewards tight good-faith USD salary bands in JdRerankerService transparency scoring", () => {
      const reranker = new JdRerankerService();
      const company = makeCompany("comp_t", "Transparent US Corp", "Chicago, IL", "midwest");
      const tightBand = makeJob("j_tight", "comp_t", {
        salaryMin: 140000,
        salaryMax: 175000,
        salaryCurrency: "USD",
        descriptionSummary: "Detailed US engineering role focused on distributed storage and cloud observability.",
      });
      const wideBand = makeJob("j_wide", "comp_t", {
        salaryMin: 100000,
        salaryMax: 250000,
        salaryCurrency: "USD",
        descriptionSummary: "Detailed US engineering role focused on distributed storage and cloud observability.",
      });

      const tightScore = reranker.rerankJob(tightBand, company, NOW).transparencyScore;
      const wideScore = reranker.rerankJob(wideBand, company, NOW).transparencyScore;
      expect(tightScore).toBe(100);
      expect(wideScore).toBe(100);

      // Compare when total is below 100 ceiling (no description bonus)
      const tightShort = makeJob("j_tight2", "comp_t", { salaryMin: 140000, salaryMax: 175000, salaryCurrency: "USD", descriptionSummary: "Short" });
      const wideShort = makeJob("j_wide2", "comp_t", { salaryMin: 100000, salaryMax: 250000, salaryCurrency: "USD", descriptionSummary: "Short" });
      expect(reranker.rerankJob(tightShort, company, NOW).transparencyScore).toBe(95);
      expect(reranker.rerankJob(wideShort, company, NOW).transparencyScore).toBe(90);
    });

    it("extracts $145,500 comma precision, $80-$100/hr annualized USD, $150k+, and City, ST location", async () => {
      const html = `
        <html><body>
          <div class="job-listing">
            <h3>Staff Platform Engineer</h3>
            <p>Location: Austin, TX — Base compensation $145,500 - $185,200 with TypeScript and AWS.</p>
            <a href="https://jobs.uscorp.io/platform">Apply</a>
          </div>
          <div class="job-listing">
            <h3>Contract Rust Systems Engineer</h3>
            <p>Remote in the US — Rate $80 - $100/hr working with Rust and Kubernetes.</p>
            <a href="https://jobs.uscorp.io/rust-contract">Apply</a>
          </div>
          <div class="job-listing">
            <h3>Founding AI Engineer</h3>
            <p>On-site in Denver, CO — Starting at $150k+ building LLM systems in Python.</p>
            <a href="https://jobs.uscorp.io/founding-ai">Apply</a>
          </div>
        </body></html>
      `;

      globalThis.fetch = async () => new Response(html, { status: 200, headers: { "Content-Type": "text/html" } });

      const db = new InMemoryD1Database();
      const agent = new JobExtractorAgent(new JobRepository(db), new LogRepository(db));
      const res = await agent.process({
        type: "EXTRACT_JOBS",
        traceId: "trace_us_salary",
        companyId: "comp_uscorp",
        careerPageId: "page_uscorp",
        careerPageUrl: "https://uscorp.io/careers",
        pageType: "internal_page",
        timestamp: NOW,
        retryCount: 0,
      });

      expect(res.ok).toBe(true);
      if (!res.ok) return;

      const staff = res.value.find((j) => j.title.includes("Staff Platform"));
      expect(staff?.salaryMin).toBe(145500);
      expect(staff?.salaryMax).toBe(185200);
      expect(staff?.salaryCurrency).toBe("USD");
      expect(staff?.location).toContain("Austin, TX");

      const hourly = res.value.find((j) => j.title.includes("Contract Rust"));
      expect(hourly?.salaryMin).toBe(166400);
      expect(hourly?.salaryMax).toBe(208000);
      expect(hourly?.remoteScope).toBe("us_only");

      const founding = res.value.find((j) => j.title.includes("Founding AI"));
      expect(founding?.salaryMin).toBe(150000);
      expect(founding?.location).toBe("Denver, CO");
    });
  });

  describe("5. Performance, Batched Queries, SSRF Redirect Guard & US HTTP/SEO Routes", () => {
    it("avoids system_settings queries and omits rawContent on GET /api/jobs, while providing rawContent to matching", async () => {
      const db = new InMemoryD1Database();
      const companyRepo = new CompanyRepository(db);
      const jobRepo = new JobRepository(db);

      await companyRepo.upsert(makeCompany("comp_perf", "Perf Labs", "Chicago, IL", "midwest"));
      await jobRepo.upsert(
        makeJob("job_perf", "comp_perf", {
          rawContent: "Confidential full JD text for internal sponsorship matching: H-1B transfer supported.",
        })
      );

      let systemSettingsQueries = 0;
      const origPrepare = db.prepare.bind(db);
      db.prepare = ((query: string) => {
        if (query.toLowerCase().includes("system_settings")) {
          systemSettingsQueries += 1;
        }
        return origPrepare(query);
      }) as typeof db.prepare;

      const res = await worker.fetch(new Request("http://localhost/api/jobs?paged=true"), { DB: db } as any, {} as any);
      expect(res.status).toBe(200);
      expect(systemSettingsQueries).toBe(0);

      const data = (await res.json()) as { items: Array<Record<string, unknown>> };
      expect(data.items.length).toBe(1);
      expect(data.items[0]?.rawContent).toBeUndefined();

      const matchingJobs = await jobRepo.list({ limit: 10, techOnly: true, includeRawContent: true });
      expect(matchingJobs[0]?.rawContent).toContain("H-1B transfer supported");
    });

    it("supports batched JobQualityDecisionRepository.findForJobs and MatchAlertRepository.listKeysForJobs", async () => {
      const db = new InMemoryD1Database();
      const qualityRepo = new JobQualityDecisionRepository(db);
      const alertsRepo = new MatchAlertRepository(db);

      const j1 = makeJob("j_b1", "comp_1", { contentHash: "h1" });
      const j2 = makeJob("j_b2", "comp_1", { contentHash: "h2" });
      const d1 = await decideJobQuality({ job: j1, peers: [j1, j2], nowMs: NOW });
      const d2 = await decideJobQuality({ job: j2, peers: [j1, j2], nowMs: NOW });

      await qualityRepo.insert("qd_1", d1, NOW);
      await qualityRepo.insert("qd_2", d2, NOW);

      const decisionMap = await qualityRepo.findForJobs(["j_b1", "j_b2", "j_missing"], QUALITY_RULESET_VERSION);
      expect(decisionMap.size).toBe(2);
      expect(decisionMap.get("j_b1:h1")?.jobId).toBe("j_b1");
      expect(decisionMap.get("j_b2:h2")?.jobId).toBe("j_b2");

      await alertsRepo.insertIfAbsent({
        id: "al_1",
        alertKey: "user1:j_b1:flt1",
        userId: "user1",
        profileId: "prof1",
        filterId: "flt1",
        jobId: "j_b1",
        contentHash: "h1",
        score: 90,
        reasons: [{ factor: "skills", score: 90, weight: 0.4, polarity: "positive", detail: "Strong skills match" }],
        createdAt: NOW,
      });
      await alertsRepo.insertIfAbsent({
        id: "al_2",
        alertKey: "user1:j_b2:flt1",
        userId: "user1",
        profileId: "prof1",
        filterId: "flt1",
        jobId: "j_b2",
        contentHash: "h2",
        score: 85,
        reasons: [{ factor: "location", score: 85, weight: 0.2, polarity: "positive", detail: "Location match" }],
        createdAt: NOW,
      });

      const keys = await alertsRepo.listKeysForJobs(["j_b1", "j_b2", "j_none"]);
      expect(keys.has("user1:j_b1:flt1")).toBe(true);
      expect(keys.has("user1:j_b2:flt1")).toBe(true);
    });

    it("blocks private IPs and SSRF redirect hops in BaseAgent.safeFetch", async () => {
      const agent = new TestSafeFetchAgent();
      let fetchCalls = 0;
      globalThis.fetch = async (input: RequestInfo | URL): Promise<Response> => {
        fetchCalls += 1;
        const urlStr = typeof input === "string" ? input : input.toString();
        if (urlStr === "https://example.com/careers") {
          return new Response(null, {
            status: 302,
            headers: { Location: "http://localhost:8080/internal-admin" },
          });
        }
        return new Response("ok", { status: 200 });
      };

      const loopbackRes = await agent.runSafeFetch("http://127.0.0.1/secret");
      expect(loopbackRes.ok).toBe(false);
      expect(fetchCalls).toBe(0);

      const metadataRes = await agent.runSafeFetch("http://169.254.169.254/latest/meta-data/");
      expect(metadataRes.ok).toBe(false);
      expect(fetchCalls).toBe(0);

      const redirectRes = await agent.runSafeFetch("https://example.com/careers");
      expect(redirectRes.ok).toBe(false);
      if (!redirectRes.ok) {
        expect(redirectRes.error.message).toMatch(/Blocked redirect target/i);
      }
      expect(fetchCalls).toBe(1);
    });

    it("serves /healthz, /robots.txt, /sitemap.xml, rejects malformed JSON 400, clamps NaN query params, and validates Telegram /crawl queue messages", async () => {
      const db = new InMemoryD1Database();
      const userRepo = new UserRepository(db);
      await userRepo.upsert({
        id: "usr_match_tester",
        telegramId: "1234567",
        username: "tester_us",
        firstName: "Tester",
        apiToken: "orp_synthetictoken",
        createdAt: NOW,
        updatedAt: NOW,
      });

      const sentMessages: unknown[] = [];
      const env = {
        DB: db,
        TELEGRAM_ADMIN_IDS: "99887766",
        TELEGRAM_WEBHOOK_SECRET: TEST_WEBHOOK_SECRET,
        DISCOVERY_QUEUE: {
          send: async (msg: unknown) => {
            sentMessages.push(msg);
          },
        },
      } as any;

      const healthRes = await worker.fetch(new Request("http://localhost/healthz"), env, {} as any);
      expect(healthRes.status).toBe(200);
      expect(((await healthRes.json()) as { status: string }).status).toBe("ok");

      const robotsRes = await worker.fetch(new Request("http://localhost/robots.txt"), env, {} as any);
      expect(robotsRes.status).toBe(200);
      const robotsText = await robotsRes.text();
      expect(robotsText).toContain("Disallow: /admin");
      expect(robotsText).toContain("Sitemap: https://jobs.ai-kit.net/sitemap.xml");

      const sitemapRes = await worker.fetch(new Request("http://localhost/sitemap.xml"), env, {} as any);
      expect(sitemapRes.status).toBe(200);
      expect(sitemapRes.headers.get("Content-Type")).toContain("application/xml");
      const sitemapXml = await sitemapRes.text();
      expect(sitemapXml).toContain("<urlset");
      expect(sitemapXml).toContain("<loc>https://jobs.ai-kit.net/</loc>");

      // Malformed JSON on POST /api/match -> 400
      const badJsonRes = await worker.fetch(
        new Request("http://localhost/api/match", {
          method: "POST",
          headers: {
            Authorization: "Bearer orp_synthetictoken",
            "Content-Type": "application/json",
          },
          body: "{bad json",
        }),
        env,
        {} as any
      );
      expect(badJsonRes.status).toBe(400);

      // NaN / negative query params -> 200 (safe bounds)
      const nanJobsRes = await worker.fetch(new Request("http://localhost/api/jobs?paged=true&limit=abc&page=-5"), env, {} as any);
      expect(nanJobsRes.status).toBe(200);

      // Telegram /crawl sends valid DISCOVER_SEED DiscoveryMessage and blocks metadata SSRF host
      const crawlRes = await worker.fetch(
        new Request("http://localhost/api/telegram/webhook", {
          method: "POST",
          headers: TG_WEBHOOK_HEADERS,
          body: JSON.stringify({
            message: {
              from: { id: 99887766, first_name: "Admin", username: "admin_us" },
              chat: { id: 99887766 },
              text: "/crawl https://acme-us.com/careers",
            },
          }),
        }),
        env,
        {} as any
      );
      expect(crawlRes.status).toBe(200);
      expect(sentMessages.length).toBe(1);
      expect(sentMessages[0]).toMatchObject({
        type: "DISCOVER_SEED",
        source: "manual",
        sourceUrl: "https://acme-us.com/careers",
        retryCount: 0,
      });

      const blockedCrawlRes = await worker.fetch(
        new Request("http://localhost/api/telegram/webhook", {
          method: "POST",
          headers: TG_WEBHOOK_HEADERS,
          body: JSON.stringify({
            message: {
              from: { id: 99887766, first_name: "Admin", username: "admin_us" },
              chat: { id: 99887766 },
              text: "/crawl http://169.254.169.254/latest/meta-data",
            },
          }),
        }),
        env,
        {} as any
      );
      expect(((await blockedCrawlRes.json()) as { ok: boolean; error?: string }).ok).toBe(false);
      expect(sentMessages.length).toBe(1);
    });
  });
});
