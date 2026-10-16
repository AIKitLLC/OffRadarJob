/**
 * Autonomous Public Source Harvester CLI for OffRadarJob
 * Harvests micro-companies from Hacker News "Who is Hiring" and GitHub Open Directories,
 * feeds their direct websites to the crawler pipeline, and monitors progress.
 *
 * Usage:
 *   npx tsx src/scripts/harvest-public-sources.ts --source=hn --limit=20
 *   npx tsx src/scripts/harvest-public-sources.ts --source=github --limit=25
 *   npx tsx src/scripts/harvest-public-sources.ts --source=all --limit=30
 */

import { HackerNewsHarvester, GitHubDirectoryHarvester } from "../harvesters/public-source-harvester.js";

interface HarvesterCliOptions {
  source: "hn" | "github" | "all";
  limit: number;
  endpoint: string;
  token: string;
  previewOnly: boolean;
}

function parseArgs(): HarvesterCliOptions {
  const args = process.argv.slice(2);
  let source: "hn" | "github" | "all" = "all";
  let limit = 20;
  let endpoint = "https://off-radar-jobs.tuannx87.workers.dev";
  let token = process.env.OFFRADAR_ADMIN_TOKEN ?? "";
  let previewOnly = false;

  for (const arg of args) {
    if (arg.startsWith("--source=")) {
      const s = arg.split("=")[1]?.toLowerCase();
      if (s === "hn" || s === "github" || s === "all") source = s;
    } else if (arg.startsWith("--limit=")) {
      limit = parseInt(arg.split("=")[1] || "20", 10);
    } else if (arg.startsWith("--endpoint=")) {
      endpoint = arg.split("=")[1] || endpoint;
    } else if (arg.startsWith("--token=")) {
      token = arg.split("=")[1] || token;
    } else if (arg === "--preview" || arg === "--dry-run") {
      previewOnly = true;
    }
  }

  if (!token) {
    console.error("Missing admin token: set OFFRADAR_ADMIN_TOKEN or pass --token=...");
    process.exit(1);
  }

  return { source, limit, endpoint, token, previewOnly };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function apiCall<T = any>(
  endpoint: string,
  path: string,
  token: string,
  method = "GET",
  body?: unknown
): Promise<T> {
  const url = `${endpoint}${path}${path.includes("?") ? "&" : "?"}token=${encodeURIComponent(token)}`;
  const headers: Record<string, string> = {
    "x-admin-token": token,
  };
  if (body) {
    headers["Content-Type"] = "application/json";
  }

  const reqInit: RequestInit = {
    method,
    headers,
  };
  if (body) {
    reqInit.body = JSON.stringify(body);
  }

  const res = await fetch(url, reqInit);

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API ${path} failed (${res.status}): ${text}`);
  }

  return res.json() as Promise<T>;
}

async function main() {
  const opts = parseArgs();
  console.log("\n===================================================================");
  console.log("🌐 OffRadarJob Public Source Harvester CLI");
  console.log("===================================================================");
  console.log(`📡 Selected Source:  ${opts.source.toUpperCase()}`);
  console.log(`🎯 Limit:            ${opts.limit} companies`);
  console.log(`🌍 Target Cluster:   ${opts.endpoint}`);
  console.log(`🔎 Preview Only:     ${opts.previewOnly ? "YES (no write)" : "NO (dispatch & crawl)"}`);
  console.log("===================================================================\n");

  // Step 1: Live Terminal Inspection of Public Data
  console.log("🔍 [1/3] Inspecting live public sources...");
  if (opts.source === "hn" || opts.source === "all") {
    const hnH = new HackerNewsHarvester();
    const story = await hnH.fetchLatestHiringStory();
    if (story) {
      console.log(`  🟠 Hacker News thread: "${story.title}" (Story ID: ${story.id}, ${story.numComments} comments)`);
    } else {
      console.log("  ⚠️ Could not fetch latest Hacker News hiring story.");
    }
  }

  if (opts.source === "github" || opts.source === "all") {
    console.log("  🐙 GitHub Open Directories: remoteintech/remote-jobs (880+ companies) & yanirs/established-remote (78 companies)");
  }

  if (opts.previewOnly) {
    console.log("\n[Preview Mode] Fetching sample company profiles from source...");
    if (opts.source === "hn" || opts.source === "all") {
      const hnH = new HackerNewsHarvester();
      const story = await hnH.fetchLatestHiringStory();
      if (story) {
        const sample = await hnH.harvestStoryComments(story.id, 5);
        console.log(`\n--- Sample HN Companies (${sample.length}) ---`);
        for (const c of sample) {
          console.log(`• ${c.name} (${c.domain}) -> Website: ${c.websiteUrl}`);
          console.log(`  Tech: [${c.techStack.slice(0, 4).join(", ")}] | Location: ${c.locationHint || "Remote"}`);
          if (c.careersUrl) console.log(`  Careers URL: ${c.careersUrl}`);
        }
      }
    }

    if (opts.source === "github" || opts.source === "all") {
      const ghH = new GitHubDirectoryHarvester();
      const sample = await ghH.harvestEstablishedRemote(5);
      console.log(`\n--- Sample GitHub Companies (${sample.length}) ---`);
      for (const c of sample) {
        console.log(`• ${c.name} (${c.domain}) -> Website: ${c.websiteUrl}`);
        console.log(`  Tech: [${c.techStack.slice(0, 4).join(", ")}] | Careers: ${c.careersUrl}`);
      }
    }

    console.log("\n✨ Preview complete. To ingest and crawl live, run without --preview.");
    return;
  }

  // Step 2: Trigger Harvester API on Cloudflare Cluster
  console.log(`\n🚀 [2/3] Triggering public harvest on cluster (${opts.endpoint})...`);
  try {
    const harvestRes = await apiCall(
      opts.endpoint,
      `/api/admin/harvest/${opts.source}`,
      opts.token,
      "POST",
      { limit: opts.limit }
    );
    console.log(`  ✅ Server response: ${harvestRes.message || "Harvest dispatched."}`);
  } catch (err) {
    console.error("  ❌ Failed to trigger harvest endpoint:", err);
    process.exit(1);
  }

  // Step 3: Monitor Live Pipeline Progress
  console.log("\n⏳ [3/3] Monitoring crawl tasks on cluster (polling /api/admin/tasks)...");
  console.log("Press Ctrl+C at any time to exit (pipeline will continue running on Cloudflare).\n");

  let completedOrFailed = 0;
  let totalTracked = 0;
  const pollInterval = 4000;

  for (let poll = 0; poll < 15; poll++) {
    await sleep(pollInterval);

    try {
      const tasks = (await apiCall(opts.endpoint, "/api/admin/tasks?limit=25", opts.token)) as Array<{
        id: string;
        targetUrl: string;
        sourceType: string;
        status: string;
        jobsFound: number;
        errorMessage?: string;
      }>;

      const harvestTasks = tasks.filter((t) => t.sourceType.startsWith("harvest_"));
      totalTracked = harvestTasks.length;
      completedOrFailed = harvestTasks.filter((t) => t.status === "completed" || t.status === "failed").length;

      const runningCount = harvestTasks.filter((t) => t.status === "running").length;
      const pendingCount = harvestTasks.filter((t) => t.status === "pending").length;
      const totalJobs = harvestTasks.reduce((acc, t) => acc + (t.jobsFound || 0), 0);

      console.log(
        `[Poll ${poll + 1}/15] Harvest Tasks: ${completedOrFailed}/${totalTracked} finished | ` +
        `⏳ Pending: ${pendingCount} | ⚙️ Running: ${runningCount} | 🎯 Jobs Found: ${totalJobs}`
      );

      if (totalTracked > 0 && completedOrFailed === totalTracked && pendingCount === 0 && runningCount === 0) {
        console.log("\n🎉 All public source harvest & crawl tasks have finished!");
        break;
      }
    } catch (err) {
      console.warn("  ⚠️ Polling update failed:", err);
    }
  }

  // Final Stats
  try {
    const stats = await apiCall(opts.endpoint, "/api/stats", opts.token);
    console.log("\n===================================================================");
    console.log("📊 Updated Cluster Database Metrics:");
    console.log(`🏢 Total Tracked Companies: ${stats.companiesCount}`);
    console.log(`💼 Total Extracted Jobs:     ${stats.jobsCount}`);
    console.log(`📋 Total Telemetry Logs:     ${stats.logsCount}`);
    console.log("===================================================================\n");
  } catch {
    // ignore
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
