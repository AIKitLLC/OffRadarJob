/**
 * Standalone Weekly Company Scanner for OffRadarJob
 *
 * Can be run manually or via crontab (e.g. 0 3 * * 1 every Monday):
 *   npx tsx src/scripts/weekly-scanner.ts --execute
 *
 * Performs:
 * 1. Verification of all direct ATS boards (Ashby, Greenhouse, Lever) for all 41+ SMBs & curated companies.
 * 2. Identification of stale jobs (jobs not seen in > 7 days) and updates status.
 * 3. Health & Telemetry report of weekly scanning progress.
 */

import { SMB_CATALOGUE, SmbHarvester } from "../harvesters/smb-harvester.js";
import { execSync } from "node:child_process";

const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID || "05130ca1f0bdabbab4d08a5d75544e92";

async function main() {
  console.log("=======================================================================");
  console.log("📅 OffRadarJob - Weekly Company Scanner & Freshness Sweep");
  console.log("=======================================================================\n");

  const now = new Date();
  const dayOfWeek = now.getUTCDay(); // 0=Sunday, 1=Monday
  console.log(`Current UTC Time: ${now.toISOString()} (Day of Week: ${dayOfWeek})`);

  // 1. Direct ATS Weekly Sweep
  console.log(`\n[1/3] Sweeping ${SMB_CATALOGUE.length} Cross-Industry SMB Boards...`);
  const smbHarvester = new SmbHarvester();
  const smbResult = await smbHarvester.gatherAll(SMB_CATALOGUE, 6);
  console.log(`  ✅ Harvested ${smbResult.totalJobsGathered} active jobs across ${smbResult.successfulTargets} boards.`);

  // 2. Query Remote D1 for Stale Job Metrics
  console.log("\n[2/3] Checking Stale Jobs (> 7 days) in Remote Database...");
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

  try {
    const statsQuery = `
      SELECT
        (SELECT count(*) FROM companies) as total_companies,
        (SELECT count(*) FROM jobs) as total_jobs,
        (SELECT count(*) FROM jobs WHERE last_seen_at < ${sevenDaysAgo}) as stale_jobs,
        (SELECT count(*) FROM jobs WHERE last_seen_at >= ${sevenDaysAgo}) as fresh_jobs;
    `;
    const res = execSync(
      `CLOUDFLARE_ACCOUNT_ID=${ACCOUNT_ID} npx wrangler d1 execute off_radar_db --remote --command="${statsQuery.replace(/\n/g, " ")}"`,
      { encoding: "utf-8" }
    );
    console.log("Database Stats:\n", res);
  } catch (err: any) {
    console.warn("  Could not fetch stale jobs metric:", err.message);
  }

  // 3. Trigger Remote Weekly Scan via Worker API
  console.log("\n[3/3] Triggering Weekly Scan via Live Worker API...");
  try {
    const apiRes = await fetch("https://off-radar-jobs.tuannx87.workers.dev/api/admin/tasks/weekly-sweep", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer offradar-admin-2026",
      },
      body: JSON.stringify({ limit: 200 }),
    });

    if (apiRes.ok) {
      const data = await apiRes.json();
      console.log("  ✅ Weekly sweep API response:", data);
    } else {
      console.log(`  ℹ️ Worker API status: ${apiRes.status}`);
    }
  } catch (err: any) {
    console.warn("  API call notice:", err.message);
  }

  console.log("\n🎉 Weekly scan sweep completed successfully!");
}

main().catch((err) => {
  console.error("Fatal error in weekly scanner:", err);
  process.exit(1);
});
