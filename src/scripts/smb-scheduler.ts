/**
 * Cross-Industry US SMB Scheduler & Direct D1 Synchronizer
 *
 * Runs scheduled or on-demand gathering of 41 verified US Small & Medium Businesses across 9 industries:
 * - Healthcare, Biotech & Life Sciences
 * - Clean Energy, Climate & Sustainability
 * - Manufacturing, Hardware & Autonomous Robotics
 * - FinTech & InsurTech
 * - Supply Chain, Logistics & PropTech
 * - Retail, E-Commerce & Consumer Brands
 * - FoodTech, Restaurant Systems & Agriculture
 * - EdTech & LegalTech
 * - HRTech & Small Business Operations
 *
 * Usage:
 *   npx tsx src/scripts/smb-scheduler.ts --execute
 */

import { SMB_CATALOGUE, SmbHarvester } from "../harvesters/smb-harvester.js";
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID || "05130ca1f0bdabbab4d08a5d75544e92";

async function main() {
  console.log("=======================================================================");
  console.log("🏢 US Cross-Industry SMB Scheduler & Automated Gathering Engine");
  console.log("=======================================================================\n");

  const harvester = new SmbHarvester();
  console.log(`[1/4] Starting concurrent gather across ${SMB_CATALOGUE.length} vetted US SMB targets...`);

  const startTime = Date.now();
  const result = await harvester.gatherAll(SMB_CATALOGUE, 6);
  const durationSec = Math.round((Date.now() - startTime) / 1000);

  console.log(`\n✅ Gather completed in ${durationSec}s!`);
  console.log(`📊 Targets Swept: ${result.totalTargets}`);
  console.log(`🎯 Active Boards with Jobs: ${result.successfulTargets}`);
  console.log(`💼 Total Open Jobs Harvested: ${result.totalJobsGathered}`);

  console.log("\n📈 Breakdown by Industry:");
  for (const [ind, count] of Object.entries(result.byIndustry)) {
    console.log(`   • ${ind.padEnd(45)}: ${count} jobs`);
  }

  // 2. Generate Statements
  console.log("\n[2/4] Generating foreign-key safe SQL statements...");
  const { companySqls, careerPageSqls, jobSqls } = harvester.generateStatements(
    SMB_CATALOGUE,
    result.jobsByTarget
  );

  const allSqlStatements = [
    "PRAGMA foreign_keys = OFF;",
    ...companySqls,
    ...careerPageSqls,
    ...jobSqls,
  ];

  console.log(`Total Statements: ${allSqlStatements.length} (${companySqls.length} companies, ${careerPageSqls.length} career pages, ${jobSqls.length} jobs)`);

  // 3. Chunk Statements for D1 batch execution (250 statements per file)
  console.log("\n[3/4] Splitting statements into D1-compatible chunk files...");
  const chunksDir = path.resolve(process.cwd(), "scratch/smb_chunks");
  if (fs.existsSync(chunksDir)) {
    fs.rmSync(chunksDir, { recursive: true, force: true });
  }
  fs.mkdirSync(chunksDir, { recursive: true });

  const CHUNK_SIZE = 250;
  const chunkFiles: string[] = [];

  for (let i = 0; i < allSqlStatements.length; i += CHUNK_SIZE) {
    const chunkNum = Math.floor(i / CHUNK_SIZE) + 1;
    const padded = String(chunkNum).padStart(3, "0");
    const filename = path.join(chunksDir, `smb_chunk_${padded}.sql`);
    const chunkStatements = allSqlStatements.slice(i, i + CHUNK_SIZE);
    fs.writeFileSync(filename, chunkStatements.join("\n\n"), "utf-8");
    chunkFiles.push(filename);
  }

  console.log(`Generated ${chunkFiles.length} chunk files in: ${chunksDir}`);

  // 4. Remote Execution if --execute is passed
  const shouldExecute = process.argv.includes("--execute");
  if (!shouldExecute) {
    console.log("\nℹ️  To execute directly against remote D1, re-run with --execute");
    return;
  }

  console.log("\n[4/4] Executing chunks against Remote Cloudflare D1 (off_radar_db)...");
  let idx = 0;
  for (const file of chunkFiles) {
    idx++;
    const relPath = path.relative(process.cwd(), file);
    console.log(`  🚀 [${idx}/${chunkFiles.length}] Executing ${relPath}...`);
    try {
      execSync(
        `CLOUDFLARE_ACCOUNT_ID=${ACCOUNT_ID} npx wrangler d1 execute off_radar_db --remote --file="${file}"`,
        { stdio: "inherit" }
      );
    } catch (err) {
      console.error(`  ⚠️ Execution failed for ${relPath}, retrying once...`);
      execSync(
        `CLOUDFLARE_ACCOUNT_ID=${ACCOUNT_ID} npx wrangler d1 execute off_radar_db --remote --file="${file}"`,
        { stdio: "inherit" }
      );
    }
  }

  console.log("\n🎉 ALL CHUNKS EXECUTED SUCCESSFULLY ON CLOUDFLARE D1!");
}

main().catch((err) => {
  console.error("Fatal error in SMB scheduler:", err);
  process.exit(1);
});
