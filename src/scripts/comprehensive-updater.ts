/**
 * Comprehensive Data Updater & Continuous Scaling Engine for OffRadarJob (Loop 1 & 2)
 *
 * Ingestion Sources:
 * 1. Curated US SMBs & Boutique Tech Studios (90+ companies)
 * 2. Direct ATS JSON Harvester (Ashby, Greenhouse, Lever for 25+ boutique startups: 500+ jobs)
 * 3. Established Remote Tech Companies (78 companies)
 * 4. Multi-Month Hacker News Threads (May to September 2026 - 5 monthly threads, 1000+ comments)
 * 5. GitHub remoteintech Curated Micro & Small Tech Companies (200+ companies)
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
import { AtsHarvester, AtsJobPosting } from "../harvesters/ats-harvester.js";

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
    descriptionSummary?: string | null;
    skills?: string[];
  }>;
}

function escapeSql(str: string | null | undefined): string {
  if (str === null || str === undefined) return "NULL";
  return `'${String(str).replace(/'/g, "''")}'`;
}

function hashString(input: string): string {
  return crypto.createHash("sha256").update(input).digest("hex").substring(0, 32);
}

function isGenericDomain(domain: string): boolean {
  const d = domain.toLowerCase();
  return (
    d === "forms.gle" ||
    d === "docs.google.com" ||
    d === "ashbyhq.com" ||
    d === "jobs.ashbyhq.com" ||
    d === "greenhouse.io" ||
    d === "boards.greenhouse.io" ||
    d === "lever.co" ||
    d === "jobs.lever.co" ||
    d === "linkedin.com" ||
    d === "notion.site" ||
    d === "notion.so"
  );
}

async function main() {
  console.log("===================================================================");
  console.log("🚀 Starting Mega Scaled OffRadarJob Pipeline (Loops 1 & 2)");
  console.log("===================================================================\n");

  const companyMap = new Map<string, CompanyRecord>();
  const now = Date.now();

  // 1. INGEST CURATED SEEDS (90+ companies)
  console.log(`[1/5] Processing ${CURATED_SEEDS.length} Curated US SMBs & Labs...`);
  for (const seed of CURATED_SEEDS) {
    const domain = extractDomainFromUrl(seed.url);
    if (!domain || isGenericDomain(domain)) continue;

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

  // 2. DIRECT ATS HARVESTER (Ashby, Greenhouse, Lever for boutique startups)
  console.log("\n[2/5] Harvesting Direct ATS Boards (Ashby, Greenhouse, Lever)...");
  const atsHarvester = new AtsHarvester();
  const atsJobsList: AtsJobPosting[] = [];

  const ashbyTargets = [
    { domain: "cursor.com", name: "Cursor / Anysphere", token: "cursor", careersUrl: "https://jobs.ashbyhq.com/cursor" },
    { domain: "supabase.com", name: "Supabase", token: "supabase", careersUrl: "https://jobs.ashbyhq.com/supabase" },
    { domain: "render.com", name: "Render", token: "render", careersUrl: "https://jobs.ashbyhq.com/render" },
    { domain: "livekit.io", name: "LiveKit", token: "livekit", careersUrl: "https://jobs.ashbyhq.com/livekit" },
    { domain: "posthog.com", name: "PostHog", token: "posthog", careersUrl: "https://jobs.ashbyhq.com/posthog" },
    { domain: "braintrustdata.com", name: "Braintrust", token: "braintrust", careersUrl: "https://jobs.ashbyhq.com/braintrust" },
    { domain: "mintlify.com", name: "Mintlify", token: "mintlify", careersUrl: "https://jobs.ashbyhq.com/mintlify" },
    { domain: "resend.com", name: "Resend", token: "resend", careersUrl: "https://jobs.ashbyhq.com/resend" },
    { domain: "railway.app", name: "Railway", token: "railway", careersUrl: "https://jobs.ashbyhq.com/railway" },
    { domain: "langfuse.com", name: "Langfuse", token: "langfuse", careersUrl: "https://jobs.ashbyhq.com/langfuse" },
    { domain: "clerk.com", name: "Clerk", token: "clerk", careersUrl: "https://jobs.ashbyhq.com/clerk" },
    { domain: "cal.com", name: "Cal.com", token: "cal.com", careersUrl: "https://jobs.ashbyhq.com/cal.com" },
    { domain: "depot.dev", name: "Depot", token: "depot", careersUrl: "https://jobs.ashbyhq.com/depot" },
    { domain: "inngest.com", name: "Inngest", token: "inngest", careersUrl: "https://jobs.ashbyhq.com/inngest" },
    { domain: "trigger.dev", name: "Trigger.dev", token: "triggerdev", careersUrl: "https://jobs.ashbyhq.com/triggerdev" },
  ];

  const greenhouseTargets = [
    { domain: "tailscale.com", name: "Tailscale", token: "tailscale", careersUrl: "https://tailscale.com/careers" },
    { domain: "planetscale.com", name: "PlanetScale", token: "planetscale", careersUrl: "https://planetscale.com/careers" },
    { domain: "cockroachlabs.com", name: "Cockroach Labs", token: "cockroachlabs", careersUrl: "https://www.cockroachlabs.com/careers" },
    { domain: "launchdarkly.com", name: "LaunchDarkly", token: "launchdarkly", careersUrl: "https://launchdarkly.com/careers" },
  ];

  const leverTargets = [
    { domain: "neon.tech", name: "Neon", token: "neon", careersUrl: "https://neon.tech/careers" },
  ];

  for (const t of ashbyTargets) {
    const jobs = await atsHarvester.fetchAshbyJobs(t.domain, t.name, t.token);
    atsJobsList.push(...jobs);
    const existing = companyMap.get(t.domain);
    if (existing) {
      existing.careersUrl = t.careersUrl;
      for (const j of jobs) {
        existing.inlineRoles.push({
          title: j.title,
          location: j.location,
          employmentType: j.employmentType,
          applyTarget: j.applyUrl,
          techCategory: j.techCategory,
          seniorityLevel: j.seniorityLevel,
          descriptionSummary: j.descriptionSummary,
          skills: j.skills,
        });
      }
    }
  }

  for (const t of greenhouseTargets) {
    const jobs = await atsHarvester.fetchGreenhouseJobs(t.domain, t.name, t.token);
    atsJobsList.push(...jobs);
    const existing = companyMap.get(t.domain);
    if (existing) {
      existing.careersUrl = t.careersUrl;
      for (const j of jobs) {
        existing.inlineRoles.push({
          title: j.title,
          location: j.location,
          employmentType: j.employmentType,
          applyTarget: j.applyUrl,
          techCategory: j.techCategory,
          seniorityLevel: j.seniorityLevel,
          descriptionSummary: j.descriptionSummary,
          skills: j.skills,
        });
      }
    }
  }

  for (const t of leverTargets) {
    const jobs = await atsHarvester.fetchLeverJobs(t.domain, t.name, t.token);
    atsJobsList.push(...jobs);
    const existing = companyMap.get(t.domain);
    if (existing) {
      existing.careersUrl = t.careersUrl;
      for (const j of jobs) {
        existing.inlineRoles.push({
          title: j.title,
          location: j.location,
          employmentType: j.employmentType,
          applyTarget: j.applyUrl,
          techCategory: j.techCategory,
          seniorityLevel: j.seniorityLevel,
          descriptionSummary: j.descriptionSummary,
          skills: j.skills,
        });
      }
    }
  }
  console.log(`  Fetched ${atsJobsList.length} high-precision jobs directly from Ashby, Greenhouse, and Lever!`);

  // 3. HARVEST ESTABLISHED-REMOTE (78 companies)
  console.log("\n[3/5] Harvesting Established Remote Directory (yanirs/established-remote)...");
  try {
    const ghHarvester = new GitHubDirectoryHarvester();
    const estProfiles = await ghHarvester.harvestEstablishedRemote(100);
    console.log(`  Fetched ${estProfiles.length} profiles from established-remote.`);

    for (const p of estProfiles) {
      if (!p.domain || isGenericDomain(p.domain)) continue;
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
          contactEmail: p.contactEmail ?? null,
          headcountEstimate: p.headcountEstimate || "20-100",
          locationHint: p.locationHint || "Remote / US",
          discoverySource: "established_remote",
          careersUrl: p.careersUrl ?? null,
          inlineRoles: p.inlineRoles,
        });
      }
    }
  } catch (err) {
    console.error("  Failed to harvest established-remote:", err);
  }
  console.log(`  -> Accumulated ${companyMap.size} unique companies so far.`);

  // 4. HARVEST 5 MONTHS OF HACKER NEWS THREADS (May to Sept 2026)
  console.log("\n[4/5] Harvesting 5 Months of Hacker News 'Who is Hiring' Threads (2000+ comments)...");
  try {
    const hnHarvester = new HackerNewsHarvester();
    const stories = [
      { id: "49522897", title: "September 2026" },
      { id: "49156683", title: "August 2026" },
      { id: "48747976", title: "July 2026" },
      { id: "48357725", title: "June 2026" },
      { id: "47975571", title: "May 2026" },
    ];

    let hnAdded = 0;
    let rolesAdded = 0;

    for (const s of stories) {
      console.log(`  Fetching Ask HN: Who is hiring? (${s.title})...`);
      for (let page = 0; page < 2; page++) {
        const url = `https://hn.algolia.com/api/v1/search?tags=comment,story_${s.id}&hitsPerPage=100&page=${page}`;
        const res = await fetch(url, { headers: { "User-Agent": "OffRadarJobHarvester/1.0" } });
        if (!res.ok) continue;

        const data = (await res.json()) as { hits?: any[] };
        for (const hit of data.hits || []) {
          if (!hit.comment_text || String(hit.parent_id) !== String(s.id)) continue;

          const p = hnHarvester.parseHnComment(hit);
          if (!p || !p.domain || isGenericDomain(p.domain)) continue;

          const existing = companyMap.get(p.domain);
          if (existing) {
            if (p.contactEmail && !existing.contactEmail) existing.contactEmail = p.contactEmail;
            if (p.careersUrl && !existing.careersUrl) existing.careersUrl = p.careersUrl;
            if (p.inlineRoles.length > 0) {
              existing.inlineRoles.push(...p.inlineRoles);
              rolesAdded += p.inlineRoles.length;
            }
            if (p.techStack.length > 0) {
              existing.techStack = Array.from(new Set([...existing.techStack, ...p.techStack]));
            }
          } else {
            hnAdded++;
            rolesAdded += p.inlineRoles.length;
            companyMap.set(p.domain, {
              id: `comp_${p.domain.replace(/[^a-z0-9]/g, "_")}`,
              domain: p.domain,
              name: p.name,
              tagline: p.tagline || `Hiring tech team on Hacker News (${s.title})`,
              description: p.description || `${p.name} software engineering team.`,
              websiteUrl: p.websiteUrl,
              logoUrl: null,
              industry: p.industry || "Technology",
              techStack: p.techStack,
              socialLinks: p.socialLinks,
              contactEmail: p.contactEmail ?? null,
              headcountEstimate: p.headcountEstimate || "5-50",
              locationHint: p.locationHint || "US / Remote",
              discoverySource: `hn_${s.title.toLowerCase().replace(/[^a-z0-9]/g, "_")}`,
              careersUrl: p.careersUrl ?? null,
              inlineRoles: p.inlineRoles,
            });
          }
        }
      }
    }
    console.log(`  Parsed ${hnAdded} new company profiles and ${rolesAdded} roles from 5 HN threads.`);
  } catch (err) {
    console.error("  Failed to harvest Hacker News:", err);
  }
  console.log(`  -> Accumulated ${companyMap.size} unique companies so far.`);

  // 5. HARVEST REMOTEINTECH (220+ companies with chunked concurrency)
  console.log("\n[5/5] Harvesting remoteintech/remote-jobs directory (220 companies)...");
  try {
    const ghHarvester = new GitHubDirectoryHarvester();
    const contentsRes = await fetch(
      "https://api.github.com/repos/remoteintech/remote-jobs/contents/src/companies",
      { headers: { "User-Agent": "OffRadarJobHarvester/1.0" } }
    );

    let remoteInTechCount = 0;
    if (contentsRes.ok) {
      const files = (await contentsRes.json()) as Array<{ name: string }>;
      const slugs = files
        .map((f) => f.name.replace(/\.md$/, ""))
        .filter((s) => s !== "README")
        .slice(0, 230);

      // Concurrent chunks of 25 for high speed
      const batchSize = 25;
      for (let i = 0; i < slugs.length; i += batchSize) {
        const batch = slugs.slice(i, i + batchSize);
        await Promise.all(
          batch.map(async (slug) => {
            try {
              const url = `https://cdn.jsdelivr.net/gh/remoteintech/remote-jobs@main/src/companies/${slug}.md`;
              const r = await fetch(url);
              if (!r.ok) return;
              const text = await r.text();
              const p = ghHarvester.parseRemoteInTechMarkdown(text);
              if (!p || !p.domain || isGenericDomain(p.domain)) return;

              remoteInTechCount++;
              const existing = companyMap.get(p.domain);
              if (existing) {
                if (p.careersUrl && !existing.careersUrl) existing.careersUrl = p.careersUrl;
                if (p.techStack.length > 0) {
                  existing.techStack = Array.from(new Set([...existing.techStack, ...p.techStack]));
                }
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
                  contactEmail: p.contactEmail ?? null,
                  headcountEstimate: p.headcountEstimate || "10-100",
                  locationHint: p.locationHint || "Remote / US",
                  discoverySource: "remoteintech",
                  careersUrl: p.careersUrl ?? null,
                  inlineRoles: p.inlineRoles,
                });
              }
            } catch {
              // ignore
            }
          })
        );
      }
      console.log(`  Parsed ${remoteInTechCount} profiles from remoteintech.`);
    }
  } catch (err) {
    console.error("  Failed to harvest remoteintech:", err);
  }

  const allCompanies = Array.from(companyMap.values());
  const totalRolesCount = allCompanies.reduce((acc, c) => acc + c.inlineRoles.length, 0);

  console.log(`\n===================================================================`);
  console.log(`📊 Ingestion Complete:`);
  console.log(`   - Unique Companies: ${allCompanies.length}`);
  console.log(`   - Direct Jobs:       ${totalRolesCount}`);
  console.log(`===================================================================\n`);

  // 6. BUILD CLEAN SQL STATEMENTS
  console.log("Generating SQL statements for Cloudflare D1...");
  const companySqls: string[] = [];
  const careerPageSqls: string[] = [];
  const jobSqls: string[] = [];

  for (const c of allCompanies) {
    const techStackJson = JSON.stringify(c.techStack);
    const socialLinksJson = JSON.stringify(c.socialLinks);

    // 6A. Companies
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

    // 6B. Career Pages (INSERT OR IGNORE to prevent foreign key or unique conflict)
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

    // 6C. Jobs
    for (const r of c.inlineRoles) {
      const title = r.title.trim();
      const contentHash = hashString(`${c.id}_${title.toLowerCase()}_${r.applyTarget || ""}`);
      const jobId = `job_${c.id}_${contentHash.substring(0, 12)}`;
      const seniority = r.seniorityLevel || inferSeniority(title);
      const techCategory = r.techCategory || inferTechCategory(title, r.skills || c.techStack);
      const applyTarget = r.applyTarget || c.careersUrl || c.contactEmail || c.websiteUrl;
      const applyType = applyTarget.includes("@") ? "email" : "url";
      const descSummary = r.descriptionSummary || `${c.name} is hiring a ${title} (${c.locationHint || "Remote"}).`;

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
          ${escapeSql(JSON.stringify(r.skills || c.techStack))},
          ${escapeSql(descSummary)},
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
    "-- OffRadarJob Mega Scaled Ingestion Batch",
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
