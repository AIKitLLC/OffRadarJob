/**
 * Massive Company Expander for OffRadarJob
 *
 * Expands the company directory from ~1,030 to 3,000+ companies from verified sources:
 * 1. Official Y Combinator Directory (Active US Startups via yc-oss API: 2,500+ companies)
 * 2. Hiring Without Whiteboards (750+ companies)
 * 3. Awesome Remote Jobs (400+ companies)
 * 4. Established Remote Tech Studios (250+ companies)
 *
 * Usage:
 *   npx tsx src/scripts/massive-company-expander.ts --execute
 */

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { requireCi } from "../utils/require-ci.js";

const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID || "05130ca1f0bdabbab4d08a5d75544e92";

interface CompanyToInsert {
  id: string;
  name: string;
  domain: string;
  websiteUrl: string;
  industry: string;
  techStack: string[];
  headcountEstimate: string;
  locationHint: string;
  tagline: string;
  description: string;
  discoverySource: string;
  careersUrl?: string;
}

const GENERIC_DOMAINS = new Set([
  "github.com", "gitlab.com", "bitbucket.org", "twitter.com", "x.com",
  "linkedin.com", "facebook.com", "instagram.com", "youtube.com", "medium.com",
  "substack.com", "notion.so", "notion.site", "docs.google.com", "drive.google.com",
  "forms.gle", "t.me", "discord.gg", "discord.com", "apple.com", "google.com",
  "amazon.com", "microsoft.com", "wikipedia.org", "reddit.com", "cloudflare.com"
]);

function cleanDomain(urlStr: string): string | null {
  try {
    const raw = urlStr.startsWith("http") ? urlStr : `https://${urlStr}`;
    const parsed = new URL(raw);
    const domain = parsed.hostname.toLowerCase().replace(/^www\./, "");
    if (!domain || domain.includes(" ") || !domain.includes(".")) return null;
    if (domain.endsWith(".edu") || domain.endsWith(".gov") || domain.endsWith(".org.vn")) return null;
    if (GENERIC_DOMAINS.has(domain)) return null;
    return domain;
  } catch {
    return null;
  }
}

function escapeSql(str: string | null | undefined): string {
  if (str === null || str === undefined) return "NULL";
  return `'${String(str).replace(/'/g, "''")}'`;
}

async function fetchYcCompanies(companyMap: Map<string, CompanyToInsert>) {
  console.log("📥 Fetching Y Combinator Active US Directory from yc-oss API...");
  try {
    const res = await fetch("https://yc-oss.github.io/api/companies/all.json", {
      headers: { "User-Agent": "OffRadarJob-Expander/1.0" },
    });
    if (!res.ok) {
      console.warn("  Failed to fetch YC directory:", res.status);
      return;
    }
    const list = (await res.json()) as any[];
    let added = 0;

    for (const c of list) {
      if (c.status !== "Active" || !c.website) continue;
      const domain = cleanDomain(c.website);
      if (!domain || companyMap.has(domain)) continue;

      // Filter for US or remote focus
      const isUS =
        !c.regions ||
        c.regions.includes("United States of America") ||
        c.regions.includes("America / Canada") ||
        (c.all_locations && c.all_locations.includes("USA")) ||
        (c.all_locations && c.all_locations.includes("United States"));

      if (!isUS) continue;

      const name = String(c.name || domain.split(".")[0]).trim();
      const websiteUrl = c.website.startsWith("http") ? c.website : `https://${c.website}`;
      const industry = c.industry || "Software & Technology";
      const locationHint = c.all_locations || "United States";
      const headcountEstimate = c.team_size ? `${Math.max(1, Math.round(c.team_size * 0.8))}-${c.team_size}` : "10-50";
      const tagline = (c.one_liner || `${name} is a Y Combinator company in ${industry}.`).substring(0, 200).trim();
      const description = (c.long_description || c.one_liner || `${name} operates in ${industry}.`).substring(0, 500).trim();
      const tags = Array.isArray(c.tags) ? c.tags.slice(0, 5) : ["YC", "Startup", "Tech"];

      companyMap.set(domain, {
        id: `comp_yc_${domain.replace(/[^a-zA-Z0-9]/g, "_")}`,
        name,
        domain,
        websiteUrl,
        industry,
        techStack: tags.length > 0 ? tags : ["Tech", "Cloud", "Fullstack"],
        headcountEstimate,
        locationHint,
        tagline,
        description,
        discoverySource: "yc_directory",
        careersUrl: `${websiteUrl.replace(/\/+$/, "")}/careers`,
      });
      added++;
    }
    console.log(`  ✅ Successfully parsed ${added} active US YC companies!`);
  } catch (err: any) {
    console.error("  ❌ Error in YC fetch:", err.message);
  }
}

async function fetchHiringWithoutWhiteboards(companyMap: Map<string, CompanyToInsert>) {
  console.log("📥 Fetching hiring-without-whiteboards directory...");
  try {
    const res = await fetch("https://raw.githubusercontent.com/poteto/hiring-without-whiteboards/master/README.md");
    if (!res.ok) return;
    const text = await res.text();
    const matches = [...text.matchAll(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g)];
    let added = 0;

    for (const m of matches) {
      const name = m[1]!.trim();
      const url = m[2]!.trim();
      const domain = cleanDomain(url);
      if (!domain || companyMap.has(domain)) continue;

      companyMap.set(domain, {
        id: `comp_hww_${domain.replace(/[^a-zA-Z0-9]/g, "_")}`,
        name,
        domain,
        websiteUrl: url,
        industry: "Engineering & Technology",
        techStack: ["Software", "Craft", "Web"],
        headcountEstimate: "20-100",
        locationHint: "Remote / US",
        tagline: `${name} hires software craftspeople without whiteboard hazing.`,
        description: `${name} practices real-world software engineering assessments focusing on pragmatic problem-solving.`,
        discoverySource: "hiring_without_whiteboards",
        careersUrl: `${url.replace(/\/+$/, "")}/careers`,
      });
      added++;
    }
    console.log(`  ✅ Successfully parsed ${added} companies from hiring-without-whiteboards!`);
  } catch (err: any) {
    console.error("  ❌ Error in HWW fetch:", err.message);
  }
}

async function fetchAwesomeRemoteJobs(companyMap: Map<string, CompanyToInsert>) {
  console.log("📥 Fetching awesome-remote-job directory...");
  try {
    const res = await fetch("https://raw.githubusercontent.com/lukasz-madon/awesome-remote-job/master/README.md");
    if (!res.ok) return;
    const text = await res.text();
    const matches = [...text.matchAll(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g)];
    let added = 0;

    for (const m of matches) {
      const name = m[1]!.trim();
      const url = m[2]!.trim();
      const domain = cleanDomain(url);
      if (!domain || companyMap.has(domain)) continue;

      companyMap.set(domain, {
        id: `comp_arj_${domain.replace(/[^a-zA-Z0-9]/g, "_")}`,
        name,
        domain,
        websiteUrl: url,
        industry: "Remote Technology & SaaS",
        techStack: ["Remote", "Cloud", "Software"],
        headcountEstimate: "20-150",
        locationHint: "Remote / Worldwide",
        tagline: `${name} is a remote-first technology studio.`,
        description: `${name} operates a distributed engineering organization.`,
        discoverySource: "awesome_remote_job",
        careersUrl: `${url.replace(/\/+$/, "")}/jobs`,
      });
      added++;
    }
    console.log(`  ✅ Successfully parsed ${added} companies from awesome-remote-job!`);
  } catch (err: any) {
    console.error("  ❌ Error in ARJ fetch:", err.message);
  }
}

async function fetchEstablishedRemote(companyMap: Map<string, CompanyToInsert>) {
  console.log("📥 Fetching established-remote directory...");
  try {
    const res = await fetch("https://raw.githubusercontent.com/yanirs/established-remote/master/README.md");
    if (!res.ok) return;
    const text = await res.text();
    const lines = text.split("\n");
    let added = 0;

    for (const line of lines) {
      if (!line.includes("|") || line.startsWith("#") || line.startsWith("---") || line.includes("Company | Industry")) continue;
      const cols = line.split("|").map((c) => c.trim());
      if (cols.length < 5) continue;
      const compCol = cols[1] ?? cols[0] ?? "";
      const match = compCol.match(/\[([^\]]+)\]\(([^)]+)\)/);
      if (!match) continue;

      const name = match[1]!.trim();
      const url = match[2]!.trim();
      const domain = cleanDomain(url);
      if (!domain || companyMap.has(domain)) continue;

      const industry = cols[2]?.trim() || "Remote Software";
      companyMap.set(domain, {
        id: `comp_est_${domain.replace(/[^a-zA-Z0-9]/g, "_")}`,
        name,
        domain,
        websiteUrl: url,
        industry,
        techStack: ["Distributed", "Remote", "Cloud"],
        headcountEstimate: "50-250",
        locationHint: "Remote / US",
        tagline: `${name} is an established remote team in ${industry}.`,
        description: `${name} operates as an established remote organization.`,
        discoverySource: "established_remote",
        careersUrl: `${url.replace(/\/+$/, "")}/careers`,
      });
      added++;
    }
    console.log(`  ✅ Successfully parsed ${added} companies from established-remote!`);
  } catch (err: any) {
    console.error("  ❌ Error in ER fetch:", err.message);
  }
}

async function main() {
  console.log("=======================================================================");
  console.log("🚀 Massive Company Expander: YC Directory & Open Source Registries");
  console.log("=======================================================================\n");

  const companyMap = new Map<string, CompanyToInsert>();

  await fetchYcCompanies(companyMap);
  await fetchHiringWithoutWhiteboards(companyMap);
  await fetchAwesomeRemoteJobs(companyMap);
  await fetchEstablishedRemote(companyMap);

  console.log(`\n🎉 Total unique candidate companies to ingest: ${companyMap.size}`);

  const now = Date.now();
  const allStatements: string[] = ["PRAGMA foreign_keys = OFF;"];

  for (const comp of companyMap.values()) {
    allStatements.push(`
      INSERT INTO companies (
        id, domain, name, tagline, description, website_url,
        logo_url, industry, tech_stack, social_links, contact_email,
        headcount_estimate, location_hint, discovery_source,
        created_at, updated_at
      ) VALUES (
        ${escapeSql(comp.id)},
        ${escapeSql(comp.domain)},
        ${escapeSql(comp.name)},
        ${escapeSql(comp.tagline)},
        ${escapeSql(comp.description)},
        ${escapeSql(comp.websiteUrl)},
        NULL,
        ${escapeSql(comp.industry)},
        ${escapeSql(JSON.stringify(comp.techStack))},
        '{}',
        NULL,
        ${escapeSql(comp.headcountEstimate)},
        ${escapeSql(comp.locationHint)},
        ${escapeSql(comp.discoverySource)},
        ${now},
        ${now}
      ) ON CONFLICT(domain) DO UPDATE SET
        tagline = COALESCE(companies.tagline, excluded.tagline),
        industry = COALESCE(companies.industry, excluded.industry),
        updated_at = ${now};
    `.trim());

    const pageId = `page_mass_${comp.domain.replace(/[^a-zA-Z0-9]/g, "_")}`;
    const careerUrl = comp.careersUrl || `${comp.websiteUrl.replace(/\/+$/, "")}/careers`;

    allStatements.push(`
      INSERT OR IGNORE INTO career_pages (
        id, company_id, url, status, page_type, content_hash, last_checked_at, created_at
      ) SELECT
        ${escapeSql(pageId)},
        c.id,
        ${escapeSql(careerUrl)},
        'active',
        'unknown',
        NULL,
        ${now},
        ${now}
      FROM companies c WHERE c.domain = ${escapeSql(comp.domain)};
    `.trim());
  }

  console.log(`\nGenerated ${allStatements.length} total SQL statements.`);

  // Chunking statements to batches of 250
  const chunksDir = path.resolve(process.cwd(), "scratch/massive_company_chunks");
  if (fs.existsSync(chunksDir)) {
    fs.rmSync(chunksDir, { recursive: true, force: true });
  }
  fs.mkdirSync(chunksDir, { recursive: true });

  const CHUNK_SIZE = 250;
  const chunkFiles: string[] = [];

  for (let i = 0; i < allStatements.length; i += CHUNK_SIZE) {
    const chunkNum = Math.floor(i / CHUNK_SIZE) + 1;
    const padded = String(chunkNum).padStart(3, "0");
    const filename = path.join(chunksDir, `massive_chunk_${padded}.sql`);
    const chunkStatements = allStatements.slice(i, i + CHUNK_SIZE);
    fs.writeFileSync(filename, chunkStatements.join("\n\n"), "utf-8");
    chunkFiles.push(filename);
  }

  console.log(`Split into ${chunkFiles.length} chunk files in: ${chunksDir}`);

  const shouldExecute = process.argv.includes("--execute");
  if (!shouldExecute) {
    console.log("\nℹ️  Dry-run complete. Re-run with --execute to apply to Cloudflare D1.");
    return;
  }
  requireCi("write company chunks to remote D1");

  console.log(`\n🚀 Executing ${chunkFiles.length} chunks against Remote D1 (off_radar_db)...`);
  let executedCount = 0;
  for (const file of chunkFiles) {
    executedCount++;
    const relPath = path.relative(process.cwd(), file);
    console.log(`  [${executedCount}/${chunkFiles.length}] Executing ${relPath}...`);
    try {
      execSync(
        `CLOUDFLARE_ACCOUNT_ID=${ACCOUNT_ID} npx wrangler d1 execute off_radar_db --remote --file="${file}"`,
        { stdio: "inherit" }
      );
    } catch (err) {
      console.warn(`  ⚠️ Retry once for ${relPath}...`);
      execSync(
        `CLOUDFLARE_ACCOUNT_ID=${ACCOUNT_ID} npx wrangler d1 execute off_radar_db --remote --file="${file}"`,
        { stdio: "inherit" }
      );
    }
  }

  console.log("\n🎉 ALL MASSIVE CHUNKS SUCCESSFULLY EXECUTED ON CLOUDFLARE D1!");
}

main().catch((err) => {
  console.error("Fatal error in massive company expander:", err);
  process.exit(1);
});
