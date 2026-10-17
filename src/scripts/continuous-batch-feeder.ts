/**
 * Autonomous Continuous Batch Feeder for OffRadarJob
 * Feeds target seeds into the Cloudflare pipeline in polite paced batches over several hours.
 *
 * Usage:
 *   npx tsx src/scripts/continuous-batch-feeder.ts --duration=2 --interval=15 --batch=3
 */

import { CURATED_SEEDS } from "../seeds/seed-catalogue.js";

interface FeederOptions {
  durationHours: number;
  intervalSeconds: number;
  batchSize: number;
  endpoint: string;
  token: string;
}

function parseArgs(): FeederOptions {
  const args = process.argv.slice(2);
  let durationHours = 2;
  let intervalSeconds = 15;
  let batchSize = 3;
  let endpoint = "https://off-radar-jobs.tuannx87.workers.dev";
  let token = process.env.OFFRADAR_ADMIN_TOKEN ?? "";

  for (const arg of args) {
    if (arg.startsWith("--duration=")) {
      durationHours = parseFloat(arg.split("=")[1] || "2");
    } else if (arg.startsWith("--interval=")) {
      intervalSeconds = parseInt(arg.split("=")[1] || "15", 10);
    } else if (arg.startsWith("--batch=")) {
      batchSize = parseInt(arg.split("=")[1] || "3", 10);
    } else if (arg.startsWith("--endpoint=")) {
      endpoint = arg.split("=")[1] || endpoint;
    } else if (arg.startsWith("--token=")) {
      token = arg.split("=")[1] || token;
    }
  }

  if (!token) {
    console.error("Missing admin token: set OFFRADAR_ADMIN_TOKEN or pass --token=...");
    process.exit(1);
  }

  return { durationHours, intervalSeconds, batchSize, endpoint, token };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function formatDuration(ms: number): string {
  const totalSecs = Math.floor(ms / 1000);
  const hours = Math.floor(totalSecs / 3600);
  const mins = Math.floor((totalSecs % 3600) / 60);
  const secs = totalSecs % 60;
  return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

async function apiCall(endpoint: string, path: string, token: string, method = "GET", body?: unknown) {
  const url = `${endpoint}${path}`;
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

  return res.json();
}

async function main() {
  const opts = parseArgs();
  const startTime = Date.now();
  const targetDurationMs = opts.durationHours * 3600 * 1000;
  const endTime = startTime + targetDurationMs;

  console.log("\n===================================================================");
  console.log("🚀 OffRadarJob Continuous Batch Feeder Starting");
  console.log("===================================================================");
  console.log(`⏱️  Target Run Duration: ${opts.durationHours} hours (${formatDuration(targetDurationMs)})`);
  console.log(`📦 Batch Size:          ${opts.batchSize} companies per wave`);
  console.log(`⏳ Wave Interval:       ${opts.intervalSeconds}s between waves (Polite crawling)`);
  console.log(`🌐 Target Endpoint:     ${opts.endpoint}`);
  console.log(`🎯 Seed Target Pool:    ${CURATED_SEEDS.length} curated micro-companies`);
  console.log("===================================================================\n");

  let seedIndex = 0;
  let waveCount = 0;
  let totalDispatched = 0;
  let isRunning = true;

  process.on("SIGINT", () => {
    console.log("\n\n🛑 Received SIGINT (Ctrl+C). Gracefully finishing current step and exiting...");
    isRunning = false;
  });

  while (isRunning && Date.now() < endTime) {
    waveCount++;
    const now = Date.now();
    const elapsedMs = now - startTime;
    const remainingMs = Math.max(0, endTime - now);

    // Pick next batch (cycling through pool if needed)
    const currentBatchUrls: string[] = [];
    for (let i = 0; i < opts.batchSize; i++) {
      const seed = CURATED_SEEDS[seedIndex % CURATED_SEEDS.length];
      if (seed) currentBatchUrls.push(seed.url);
      seedIndex++;
    }

    console.log(`\n[Wave #${waveCount}] [Elapsed: ${formatDuration(elapsedMs)} | Remaining: ${formatDuration(remainingMs)}]`);
    console.log(`  Dispatching ${currentBatchUrls.length} seeds:`);
    currentBatchUrls.forEach((u) => console.log(`    → ${u}`));

    try {
      const res = (await apiCall(
        opts.endpoint,
        "/api/admin/tasks/batch",
        opts.token,
        "POST",
        { urls: currentBatchUrls, source: "continuous_feeder" }
      )) as { success: boolean; dispatchedCount: number };

      totalDispatched += res.dispatchedCount || currentBatchUrls.length;
      console.log(`  ✅ Successfully queued ${res.dispatchedCount} tasks in Cloudflare Queues/Runner.`);
    } catch (err: unknown) {
      console.error(`  ❌ Failed to dispatch batch:`, err instanceof Error ? err.message : err);
    }

    // Fetch telemetry stats
    try {
      const stats = (await apiCall(opts.endpoint, "/api/admin/stats", opts.token)) as {
        companiesCount: number;
        jobsCount: number;
        tasks: { total: number; running: number; completed: number; failed: number; jobsFound: number };
      };

      console.log(`  📊 Edge Pipeline Telemetry:`);
      console.log(`     Companies Tracked: ${stats.companiesCount} | Off-Radar Jobs Found: ${stats.jobsCount}`);
      console.log(`     Tasks Total: ${stats.tasks?.total ?? 0} (Running: ${stats.tasks?.running ?? 0} | Completed: ${stats.tasks?.completed ?? 0} | Failed: ${stats.tasks?.failed ?? 0})`);
    } catch {
      // Ignore telemetry fetch errors
    }

    if (!isRunning || Date.now() >= endTime) break;

    console.log(`  💤 Waiting ${opts.intervalSeconds}s for next wave...`);
    await sleep(opts.intervalSeconds * 1000);
  }

  const finalElapsed = Date.now() - startTime;
  console.log("\n===================================================================");
  console.log("🏁 Continuous Batch Feeder Completed");
  console.log("===================================================================");
  console.log(`⏱️ Total Run Time:       ${formatDuration(finalElapsed)}`);
  console.log(`🌊 Total Waves:          ${waveCount}`);
  console.log(`🚀 Total Seeds Sent:     ${totalDispatched}`);
  console.log("Check live status at: https://off-radar-jobs.tuannx87.workers.dev/admin");
  console.log("===================================================================\n");
}

main().catch((err) => {
  console.error("Fatal error in continuous batch feeder:", err);
  process.exit(1);
});
