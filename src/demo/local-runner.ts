import { InMemoryD1Database } from "../db/in-memory-db.js";
import { PipelineOrchestrator } from "../orchestrator/dispatcher.js";
import { MOCK_FIXTURES } from "./mock-seed.js";

/**
 * Mock fetch interceptor to serve realistic micro-company fixtures
 * Falls back to global native fetch for any real external URLs.
 */
function setupMockFetch() {
  const originalFetch = globalThis.fetch;

  globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const urlStr = typeof input === "string" ? input : input.toString();

    for (const fix of MOCK_FIXTURES) {
      if (urlStr === fix.url || urlStr === `${fix.url}/`) {
        return new Response(fix.homepageHtml, {
          status: 200,
          headers: { "Content-Type": "text/html" },
        });
      }

      if (fix.careerPages[urlStr]) {
        return new Response(fix.careerPages[urlStr]!, {
          status: 200,
          headers: { "Content-Type": "text/html" },
        });
      }
    }

    // Try real fetch if not in mock list
    try {
      return await originalFetch(input, init);
    } catch {
      return new Response("Not found", { status: 404 });
    }
  };
}

async function runDemo() {
  console.log("================================================================================");
  console.log("🚀 DEMO: OFF-RADAR JOB GATHERER — DECOUPLED CLOUDFLARE AGENT PIPELINE");
  console.log("Target: Micro-companies & hidden jobs unlisted on mainstream job boards");
  console.log("================================================================================\n");

  setupMockFetch();

  const db = new InMemoryD1Database();
  const orchestrator = new PipelineOrchestrator(db);

  const seedUrls = [
    "https://tinysaas.dev",
    "https://boutiquelab.vn",
    "https://solomaker.notion.site/open-contract-roles",
    "https://solomaker.tools",
  ];

  console.log(`[1] Ingesting ${seedUrls.length} seed targets into Discovery Agent...\n`);

  const startTime = Date.now();

  for (const url of seedUrls) {
    console.log(`👉 Processing seed: ${url}`);
    const result = await orchestrator.processSeedAsync(url, "seed_list");
    console.log(`   Discovered: ${result.companies.length} company profile(s)`);
    console.log(`   Extracted: ${result.jobs.length} off-radar job(s)`);
    console.log("--------------------------------------------------------------------------------");
  }

  const duration = Date.now() - startTime;

  // Query database stores
  const companies = await orchestrator.companyRepo.list(10);
  const jobs = await orchestrator.jobRepo.list({ limit: 20 });
  const logs = await orchestrator.logRepo.getRecent(30);

  console.log("\n================================================================================");
  console.log(`🏢 1. DISCOVERED & ENRICHED MICRO-COMPANIES (${companies.length} saved in D1)`);
  console.log("================================================================================");
  for (const c of companies) {
    console.log(`• Company: ${c.name.padEnd(22)} | Domain: ${c.domain.padEnd(20)} | Team: ${c.headcountEstimate ?? "N/A"}`);
    console.log(`  Desc:    ${c.description ?? c.tagline ?? "N/A"}`);
    console.log(`  Tech:    [${c.techStack.join(", ")}]`);
    console.log(`  Email:   ${c.contactEmail ?? "None"} | Location: ${c.locationHint ?? "Remote"}`);
    console.log("--------------------------------------------------------------------------------");
  }

  console.log("\n================================================================================");
  console.log(`💼 2. EXTRACTED OFF-RADAR JOBS (${jobs.length} saved in D1)`);
  console.log("================================================================================");
  for (const j of jobs) {
    const salary = j.salaryMin
      ? `$${j.salaryMin.toLocaleString()} - $${j.salaryMax?.toLocaleString()} ${j.salaryCurrency}`
      : "Undisclosed";
    const remote = j.isRemote ? `Yes (${j.remoteScope})` : "No";

    console.log(`• Title:     ${j.title}`);
    console.log(`  Company:   ${j.companyId}`);
    console.log(`  Type:      ${j.employmentType.padEnd(12)} | Remote: ${remote.padEnd(16)} | Salary: ${salary}`);
    console.log(`  Skills:    [${j.skills.join(", ")}]`);
    console.log(`  Apply via: [${j.applyType.toUpperCase()}] -> ${j.applyTarget}`);
    console.log(`  Fingerprint: ${j.contentHash.substring(0, 16)}...`);
    console.log("--------------------------------------------------------------------------------");
  }

  console.log("\n================================================================================");
  console.log(`📊 3. AGENT TELEMETRY & AUDIT TRAIL (${logs.length} events logged)`);
  console.log("================================================================================");
  for (const l of logs.slice(0, 8)) {
    const time = new Date(l.createdAt).toLocaleTimeString();
    console.log(`[${time}] [${l.agentName.padEnd(20)}] [${l.status.toUpperCase().padEnd(7)}] ${l.message} (${l.durationMs}ms)`);
  }

  console.log("\n================================================================================");
  console.log("🎉 PIPELINE EXECUTION SUMMARY");
  console.log("================================================================================");
  console.log(`• Total Processing Duration: ${duration} ms`);
  console.log(`• Total Companies Profiled:  ${companies.length}`);
  console.log(`• Total Off-Radar Jobs Found: ${jobs.length}`);
  console.log(`• Remote-Friendly Jobs:      ${jobs.filter((j) => j.isRemote).length} / ${jobs.length} (100%)`);
  console.log(`• Agent Error Count:         ${logs.filter((l) => l.status === "error").length}`);
  console.log("================================================================================\n");
}

runDemo().catch((err) => {
  console.error("Local runner encountered error:", err);
  process.exit(1);
});
