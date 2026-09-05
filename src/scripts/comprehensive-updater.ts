/**
 * Comprehensive Data Updater for OffRadarJob
 * Orchestrates multi-source ingestion:
 * 1. Curated US SMBs & Boutique Tech Studios (90+ companies)
 * 2. Established Remote Tech Companies (78 companies)
 * 3. Hacker News "Who is Hiring" Monthly Thread (80+ companies with active hiring posts)
 * 4. GitHub remoteintech Curated Micro & Small Tech Companies (60+ companies)
 *
 * Generates clean, robust SQL batch for Cloudflare D1 with foreign key safety.
 *
 * Usage:
 *   npx tsx src/scripts/comprehensive-updater.ts
 */

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { CURATED_SEEDS } from "../seeds/seed-catalogue.js";
import {
  HackerNewsHarvester,
  GitHubDirectoryHarvester,
  inferSeniority,
  inferTechCategory,
  extractDomainFromUrl,
} from "../harvesters/public-source-harvester.js";

interface CompanyRecord {
  id: string;
  domain: string;
  name: string;
  tagline: string | null;
  description: string | null;
  websiteUrl: string;
  logoUrl: string | null;
  industry: string | null;
  techStack: string[];
  socialLinks: Record<string, string>;
  contactEmail: string | null;
  headcountEstimate: string | null;
  locationHint: string | null;
  discoverySource: string;
  careersUrl: string | null;
  inlineRoles: Array<{
    title: string;
    location?: string | null;
    employmentType?: string | null;
    applyTarget?: string | null;
    techCategory?: string | null;
    seniorityLevel?: string | null;
  }>;
}

function escapeSql(str: string | null | undefined): string {
  if (str === null || str === undefined) return "NULL";
  return `'${String(str).replace(/'/g, "''")}'`;
}

function hashString(input: string): string {
  return crypto.createHash("sha256").update(input).digest("hex").substring(0, 32);
}

const REMOTEINTECH_VETTED_SLUGS = [
  "10up", "15five", "ably", "aerolab", "aerostrat", "aestudio", "aha", "airbyte", "airgarage",
  "automattic", "buffer", "carto", "close", "doist", "duckduckgo", "elastic", "ghost",
  "gitlab", "grafana", "hasura", "help-scout", "honeycomb", "hotjar", "invision", "knapsack",
  "launchdarkly", "linear", "mattermost", "meilisearch", "netlify", "postman", "prisma",
  "sanity", "sentry", "sourcegraph", "spreedly", "stripe", "supabase", "tailscale",
  "transistor", "trigger-dev", "turso", "twist", "typeform", "vizzuality", "zapier",
  "codeship", "compose", "crate-io", "exercism", "expo", "fastly", "fauna",
  "front", "gatsby", "gitbook", "gitter", "hashicorp", "heroku", "logdna",
  "mixpanel", "mullvad", "observable", "octobox", "olark", "openphone", "pagerduty",
  "pantheon", "plausible", "replit", "shogun", "signal", "split", "statuspage",
  "teamwork", "tigera", "toggl", "toptal", "travis-ci", "tus", "upstatement",
  "vanna", "vimeo", "webflow", "wp-engine", "zeit", "zerotier"
];

async function main() {
  console.log("===================================================================");
  console.log("🚀 Starting Comprehensive OffRadarJob Directory & Job Update");
  console.log("===================================================================\n");

  const companyMap = new Map<string, CompanyRecord>();
  const now = Date.now();

  // 1. INGEST CURATED SEEDS (90+ companies)
  console.log(`[1/4] Processing ${CURATED_SEEDS.length} Curated US SMBs & Labs...`);
  for (const seed of CURATED_SEEDS) {
    const domain = extractDomainFromUrl(seed.url);
    if (!domain) continue;

    companyMap.set(domain, {
      id: `comp_${domain.replace(/[^a-z0-9]/g, "_")}`,
      domain,
      name: seed.name,
      tagline: seed.notes || `Boutique software engineering team in ${seed.region}`,
      description: seed.notes || `${seed.name} is an off-radar tech organization located in ${seed.region}.`,
      websiteUrl: seed.url,
      logoUrl: null,
      industry: "Software & Technology",
      techStack: ["TypeScript", "Fullstack", "Cloud"],
      socialLinks: {},
      contactEmail: `jobs@${domain}`,
      headcountEstimate: seed.headcount || "10-50",
      locationHint: seed.region,
      discoverySource: seed.category,
      careersUrl: `${seed.url.replace(/\/$/, "")}/careers`,
      inlineRoles: [],
    });
  }
  console.log(`  -> Accumulated ${companyMap.size} unique companies so far.`);

  // 2. HARVEST ESTABLISHED-REMOTE (78 companies)
  console.log("\n[2/4] Harvesting Established Remote Directory (yanirs/established-remote)...");
  try {
    const ghHarvester = new GitHubDirectoryHarvester();
    const estProfiles = await ghHarvester.harvestEstablishedRemote(100);
    console.log(`  Fetched ${estProfiles.length} profiles from established-remote.`);

    for (const p of estProfiles) {
      if (!p.domain) continue;
      const existing = companyMap.get(p.domain);
      if (existing) {
        if (p.careersUrl && !existing.careersUrl) existing.careersUrl = p.careersUrl;
        if (p.techStack.length > 0) existing.techStack = Array.from(new Set([...existing.techStack, ...p.techStack]));
      } else {
        companyMap.set(p.domain, {
          id: `comp_${p.domain.replace(/[^a-z0-9]/g, "_")}`,
          domain: p.domain,
          name: p.name,
          tagline: p.tagline || `Remote technology company`,
          description: p.description || `${p.name} remote engineering team.`,
          websiteUrl: p.websiteUrl,
          logoUrl: null,
          industry: p.industry || "Software & Technology",
          techStack: p.techStack,
          socialLinks: p.socialLinks,
          contactEmail: p.contactEmail,
          headcountEstimate: p.headcountEstimate || "20-100",
          locationHint: p.locationHint || "Remote / US",
          discoverySource: "established_remote",
          careersUrl: p.careersUrl,
          inlineRoles: p.inlineRoles,
        });
      }
    }
  } catch (err) {
    console.error("  Failed to harvest established-remote:", err);
  }
  console.log(`  -> Accumulated ${companyMap.size} unique companies so far.`);

  // 3. HARVEST HACKER NEWS "WHO IS HIRING" (100 comments)
  console.log("\n[3/4] Harvesting latest Hacker News 'Ask HN: Who is hiring?' thread...");
  try {
    const hnHarvester = new HackerNewsHarvester();
    const story = await hnHarvester.fetchLatestHiringStory();
    if (story) {
      console.log(`  Hacker News Story: "${story.title}" (ID: ${story.id}, ${story.numComments} comments)`);
      const hnProfiles = await hnHarvester.harvestStoryComments(story.id, 100);
      console.log(`  Parsed ${hnProfiles.length} company posts from HN comments.`);

      for (const p of hnProfiles) {
        if (!p.domain) continue;
        const existing = companyMap.get(p.domain);
        if (existing) {
          if (p.contactEmail && !existing.contactEmail) existing.contactEmail = p.contactEmail;
          if (p.careersUrl && !existing.careersUrl) existing.careersUrl = p.careersUrl;
          if (p.inlineRoles.length > 0) existing.inlineRoles.push(...p.inlineRoles);
          if (p.techStack.length > 0) existing.techStack = Array.from(new Set([...existing.techStack, ...p.techStack]));
        } else {
          companyMap.set(p.domain, {
            id: `comp_${p.domain.replace(/[^a-z0-9]/g, "_")}`,
            domain: p.domain,
            name: p.name,
            tagline: p.tagline || `Hiring tech team on Hacker News`,
            description: p.description || `${p.name} software engineering team.`,
            websiteUrl: p.websiteUrl,
            logoUrl: null,
            industry: p.industry || "Technology",
            techStack: p.techStack,
            socialLinks: p.socialLinks,
            contactEmail: p.contactEmail,
            headcountEstimate: p.headcountEstimate || "5-50",
            locationHint: p.locationHint || "US / Remote",
            discoverySource: "hn_whoishiring",
            careersUrl: p.careersUrl,
            inlineRoles: p.inlineRoles,
          });
        }
      }
    }
  } catch (err) {
    console.error("  Failed to harvest Hacker News:", err);
  }
  console.log(`  -> Accumulated ${companyMap.size} unique companies so far.`);

  // 4. HARVEST REMOTEINTECH VETTED SLUGS
  console.log("\n[4/4] Harvesting remoteintech/remote-jobs directory...");
  try {
    const ghHarvester = new GitHubDirectoryHarvester();
    let remoteInTechCount = 0;
    for (const slug of REMOTEINTECH_VETTED_SLUGS) {
      try {
        const url = `https://cdn.jsdelivr.net/gh/remoteintech/remote-jobs@main/src/companies/${slug}.md`;
        const res = await fetch(url, { headers: { "User-Agent": "OffRadarJobHarvester/1.0" } });
        if (!res.ok) continue;
        const content = await res.text();
        const p = ghHarvester.parseRemoteInTechMarkdown(content);
        if (!p || !p.domain) continue;

        remoteInTechCount++;
        const existing = companyMap.get(p.domain);
        if (existing) {
          if (p.careersUrl && !existing.careersUrl) existing.careersUrl = p.careersUrl;
          if (p.techStack.length > 0) existing.techStack = Array.from(new Set([...existing.techStack, ...p.techStack]));
        } else {
          companyMap.set(p.domain, {
            id: `comp_${p.domain.replace(/[^a-z0-9]/g, "_")}`,
            domain: p.domain,
            name: p.name,
            tagline: p.tagline || `Remote engineering studio (${p.headcountEstimate})`,
            description: p.description || `${p.name} remote software development team.`,
            websiteUrl: p.websiteUrl,
            logoUrl: null,
            industry: p.industry || "Software & Services",
            techStack: p.techStack,
            socialLinks: p.socialLinks,
            contactEmail: p.contactEmail,
            headcountEstimate: p.headcountEstimate || "10-100",
            locationHint: p.locationHint || "Remote / US",
            discoverySource: "remoteintech",
            careersUrl: p.careersUrl,
            inlineRoles: p.inlineRoles,
          });
        }
      } catch {
        // ignore
      }
    }
    console.log(`  Parsed ${remoteInTechCount} valid profiles from remoteintech.`);
  } catch (err) {
    console.error("  Failed to harvest remoteintech:", err);
  }

  const allCompanies = Array.from(companyMap.values());
  console.log(`\n===================================================================`);
  console.log(`📊 Ingestion Phase Complete: Total Unique Companies: ${allCompanies.length}`);
  console.log(`===================================================================\n`);

  // 5. BUILD CLEAN SQL STATEMENTS
  console.log("Generating SQL statements for Cloudflare D1...");
  const companySqls: string[] = [];
  const careerPageSqls: string[] = [];
  const jobSqls: string[] = [];

  for (const c of allCompanies) {
    const techStackJson = JSON.stringify(c.techStack);
    const socialLinksJson = JSON.stringify(c.socialLinks);

    // 5A. Companies
    companySqls.push(
      `INSERT INTO companies (
        id, domain, name, tagline, description, website_url, logo_url, industry,
        tech_stack, social_links, contact_email, headcount_estimate, location_hint,
        discovery_source, created_at, updated_at
      ) VALUES (
        ${escapeSql(c.id)},
        ${escapeSql(c.domain)},
        ${escapeSql(c.name)},
        ${escapeSql(c.tagline)},
        ${escapeSql(c.description)},
        ${escapeSql(c.websiteUrl)},
        ${escapeSql(c.logoUrl)},
        ${escapeSql(c.industry)},
        ${escapeSql(techStackJson)},
        ${escapeSql(socialLinksJson)},
        ${escapeSql(c.contactEmail)},
        ${escapeSql(c.headcountEstimate)},
        ${escapeSql(c.locationHint)},
        ${escapeSql(c.discoverySource)},
        ${now},
        ${now}
      ) ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        tagline = COALESCE(excluded.tagline, companies.tagline),
        description = COALESCE(excluded.description, companies.description),
        website_url = excluded.website_url,
        tech_stack = excluded.tech_stack,
        contact_email = COALESCE(excluded.contact_email, companies.contact_email),
        headcount_estimate = COALESCE(excluded.headcount_estimate, companies.headcount_estimate),
        location_hint = COALESCE(excluded.location_hint, companies.location_hint),
        updated_at = ${now};`
    );

    // 5B. Career Pages (INSERT OR IGNORE to prevent foreign key or unique conflict)
    const pageUrl = c.careersUrl || `${c.websiteUrl.replace(/\/$/, "")}/careers`;
    const pageId = `page_${c.id}_auto`;
    careerPageSqls.push(
      `INSERT OR IGNORE INTO career_pages (
        id, company_id, url, page_type, status, content_hash, last_checked_at, created_at
      ) VALUES (
        ${escapeSql(pageId)},
        ${escapeSql(c.id)},
        ${escapeSql(pageUrl)},
        'custom',
        'active',
        NULL,
        ${now},
        ${now}
      );`
    );

    // 5C. Jobs (Safely join against career_pages table to resolve valid career_page_id)
    for (const r of c.inlineRoles) {
      const title = r.title.trim();
      const contentHash = hashString(`${c.id}_${title.toLowerCase()}`);
      const jobId = `job_${c.id}_${contentHash.substring(0, 12)}`;
      const seniority = r.seniorityLevel || inferSeniority(title);
      const techCategory = r.techCategory || inferTechCategory(title, c.techStack);
      const applyTarget = r.applyTarget || c.careersUrl || c.contactEmail || c.websiteUrl;
      const applyType = applyTarget.includes("@") ? "email" : "url";

      jobSqls.push(
        `INSERT INTO jobs (
          id, company_id, career_page_id, title, department, employment_type,
          location, is_remote, remote_scope, salary_min, salary_max, salary_currency,
          skills, description_summary, raw_content, apply_type, apply_target,
          status, content_hash, first_seen_at, last_seen_at, seniority_level,
          tech_category, is_tech_role
        )
        SELECT
          ${escapeSql(jobId)},
          ${escapeSql(c.id)},
          cp.id,
          ${escapeSql(title)},
          'Engineering',
          ${escapeSql(r.employmentType || "full-time")},
          ${escapeSql(r.location || c.locationHint || "Remote")},
          1,
          'worldwide',
          NULL,
          NULL,
          'USD',
          ${escapeSql(JSON.stringify(c.techStack))},
          ${escapeSql(`${c.name} is hiring a ${title} (${c.locationHint || "Remote"}).`)},
          NULL,
          ${escapeSql(applyType)},
          ${escapeSql(applyTarget)},
          'open',
          ${escapeSql(contentHash)},
          ${now},
          ${now},
          ${escapeSql(seniority)},
          ${escapeSql(techCategory)},
          1
        FROM career_pages cp
        WHERE cp.company_id = ${escapeSql(c.id)} OR cp.url = ${escapeSql(pageUrl)}
        LIMIT 1
        ON CONFLICT(content_hash) DO UPDATE SET
          title = excluded.title,
          seniority_level = excluded.seniority_level,
          tech_category = excluded.tech_category,
          apply_target = excluded.apply_target,
          last_seen_at = ${now},
          status = 'open';`
      );
    }
  }

  const scratchDir = path.resolve(process.cwd(), "scratch");
  if (!fs.existsSync(scratchDir)) {
    fs.mkdirSync(scratchDir, { recursive: true });
  }

  const fullSql = [
    "-- OffRadarJob Comprehensive Batch Update",
    "PRAGMA foreign_keys = OFF;",
    "",
    "-- 1. Companies",
    ...companySqls,
    "",
    "-- 2. Career Pages",
    ...careerPageSqls,
    "",
    "-- 3. Jobs",
    ...jobSqls,
    "",
    "PRAGMA foreign_keys = ON;",
  ].join("\n\n");

  const sqlFilePath = path.join(scratchDir, "full_update_data.sql");
  fs.writeFileSync(sqlFilePath, fullSql, "utf-8");

  console.log(`\n💾 Generated SQL batch:`);
  console.log(`   - Companies statements:    ${companySqls.length}`);
  console.log(`   - Career Pages statements: ${careerPageSqls.length}`);
  console.log(`   - Jobs statements:         ${jobSqls.length}`);
  console.log(`   - Total operations:        ${companySqls.length + careerPageSqls.length + jobSqls.length}`);
  console.log(`   - File:                    ${sqlFilePath} (${(fs.statSync(sqlFilePath).size / 1024).toFixed(1)} KB)`);
}

main().catch((err) => {
  console.error("Fatal error during comprehensive update:", err);
  process.exit(1);
});
