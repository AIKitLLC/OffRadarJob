import { NewGradHarvester } from "../harvesters/newgrad-harvester.js";
import { NEW_GRAD_MIDWEST_SEEDS } from "../demo/newgrad-seeds.js";
import { inferTechCategory } from "../harvesters/public-source-harvester.js";
import { detectUsRegion } from "../db/repositories.js";
import { execSync } from "node:child_process";
import { requireCi } from "../utils/require-ci.js";
import * as fs from "node:fs";
import * as path from "node:path";

const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID || "05130ca1f0bdabbab4d08a5d75544e92";

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}

async function main() {
  console.log("==================================================================");
  console.log("   OffRadarJob - New Grad & Early Career Harvester & Ingestion    ");
  console.log("==================================================================");

  const harvester = new NewGradHarvester();
  const now = Date.now();

  const companyStatements: string[] = [];
  const careerPageStatements: string[] = [];
  const jobStatements: string[] = [];

  // 1. Seed curated Midwest Flagship New Grad Programs
  console.log(`[1/3] Preparing ${NEW_GRAD_MIDWEST_SEEDS.length} Midwest Flagship New Grad programs...`);
  for (const item of NEW_GRAD_MIDWEST_SEEDS) {
    const { company, careerPage, jobs } = item;

    companyStatements.push(`
      INSERT INTO companies (
        id, domain, name, tagline, description, website_url,
        industry, tech_stack, social_links, contact_email,
        headcount_estimate, location_hint, discovery_source,
        created_at, updated_at
      ) VALUES (
        '${company.id}',
        '${company.domain.replace(/'/g, "''")}',
        '${company.name.replace(/'/g, "''")}',
        ${company.tagline ? `'${company.tagline.replace(/'/g, "''")}'` : "NULL"},
        ${company.description ? `'${company.description.replace(/'/g, "''")}'` : "NULL"},
        '${company.websiteUrl}',
        ${company.industry ? `'${company.industry.replace(/'/g, "''")}'` : "NULL"},
        '${JSON.stringify(company.techStack).replace(/'/g, "''")}',
        '${JSON.stringify(company.socialLinks).replace(/'/g, "''")}',
        ${company.contactEmail ? `'${company.contactEmail}'` : "NULL"},
        ${company.headcountEstimate ? `'${company.headcountEstimate}'` : "NULL"},
        ${company.locationHint ? `'${company.locationHint.replace(/'/g, "''")}'` : "NULL"},
        '${company.discoverySource}',
        ${company.createdAt},
        ${company.updatedAt}
      ) ON CONFLICT(domain) DO UPDATE SET
        location_hint = excluded.location_hint,
        updated_at = excluded.updated_at;
    `);

    careerPageStatements.push(`
      INSERT INTO career_pages (
        id, company_id, url, page_type, status, content_hash, last_checked_at, created_at
      ) VALUES (
        '${careerPage.id}',
        COALESCE((SELECT id FROM companies WHERE domain = '${company.domain.replace(/'/g, "''")}' LIMIT 1), '${company.id}'),
        '${careerPage.url.replace(/'/g, "''")}',
        '${careerPage.pageType}',
        '${careerPage.status}',
        '${careerPage.contentHash}',
        ${careerPage.lastCheckedAt},
        ${careerPage.createdAt}
      ) ON CONFLICT(url) DO UPDATE SET
        status = excluded.status,
        last_checked_at = excluded.last_checked_at;
    `);

    for (const j of jobs) {
      jobStatements.push(`
        INSERT INTO jobs (
          id, company_id, career_page_id, title, department,
          seniority_level, tech_category, is_tech_role,
          employment_type, location, is_remote, remote_scope,
          salary_min, salary_max, salary_currency, skills,
          description_summary, raw_content, apply_type, apply_target,
          status, content_hash, first_seen_at, last_seen_at
        ) VALUES (
          '${j.id}',
          COALESCE((SELECT id FROM companies WHERE domain = '${company.domain.replace(/'/g, "''")}' LIMIT 1), '${company.id}'),
          COALESCE((SELECT id FROM career_pages WHERE url = '${careerPage.url.replace(/'/g, "''")}' LIMIT 1), '${careerPage.id}'),
          '${j.title.replace(/'/g, "''")}',
          ${j.department ? `'${j.department.replace(/'/g, "''")}'` : "NULL"},
          '${j.seniorityLevel}',
          '${j.techCategory}',
          ${j.isTechRole ? 1 : 0},
          '${j.employmentType}',
          ${j.location ? `'${j.location.replace(/'/g, "''")}'` : "NULL"},
          ${j.isRemote ? 1 : 0},
          '${j.remoteScope}',
          ${j.salaryMin ?? "NULL"},
          ${j.salaryMax ?? "NULL"},
          ${j.salaryCurrency ? `'${j.salaryCurrency}'` : "NULL"},
          '${JSON.stringify(j.skills).replace(/'/g, "''")}',
          ${j.descriptionSummary ? `'${j.descriptionSummary.replace(/'/g, "''")}'` : "NULL"},
          ${j.rawContent ? `'${j.rawContent.replace(/'/g, "''")}'` : "NULL"},
          '${j.applyType}',
          '${j.applyTarget.replace(/'/g, "''")}',
          '${j.status}',
          '${j.contentHash}',
          ${j.firstSeenAt},
          ${j.lastSeenAt}
        ) ON CONFLICT(content_hash) DO UPDATE SET
          title = excluded.title,
          seniority_level = excluded.seniority_level,
          tech_category = excluded.tech_category,
          status = excluded.status,
          last_seen_at = excluded.last_seen_at;
      `);
    }
  }

  // 2. Fetch and parse SimplifyJobs active 2025/2026 repository
  console.log("[2/3] Fetching active roles from SimplifyJobs 2025/2026 repo...");
  const rawReadme = await harvester.fetchRawReadme();
  if (!rawReadme) {
    console.error("Failed to fetch README from SimplifyJobs repository.");
  } else {
    const rows = harvester.parseTableRows(rawReadme, 350);
    console.log(`Parsed ${rows.length} active open new grad tech roles!`);

    const seenCompanyDomains = new Set<string>();
    const seenPageUrls = new Set<string>();
    const seenJobIds = new Set<string>();
    let midwestCount = 0;

    for (const row of rows) {
      const cleanCompId = `comp_ng_${row.companyDomain.replace(/[^a-z0-9]/g, "_")}`;
      const urlHash = Math.abs(hashCode(row.applyUrl)).toString(36);
      const cleanPageId = `page_ng_${cleanCompId}_${urlHash}`;
      const primaryLoc = row.locations.slice(0, 3).join(" / ");
      const isMidwest = harvester.isMidwestLocation(row.locations);
      if (isMidwest) midwestCount++;

      const usRegion = detectUsRegion(
        primaryLoc,
        primaryLoc,
        isMidwest ? "us_midwest" : "us_national",
        primaryLoc.toLowerCase().includes("remote")
      );

      // Company SQL (deduplicated by domain)
      if (!seenCompanyDomains.has(row.companyDomain)) {
        seenCompanyDomains.add(row.companyDomain);
        companyStatements.push(`
          INSERT INTO companies (
            id, domain, name, tagline, description, website_url,
            industry, tech_stack, social_links, contact_email,
            headcount_estimate, location_hint, discovery_source,
            created_at, updated_at
          ) VALUES (
            '${cleanCompId}',
            '${row.companyDomain.replace(/'/g, "''")}',
            '${row.companyName.replace(/'/g, "''")}',
            'Tech Employer (Hiring 2025/2026 New Grads)',
            '${row.companyName.replace(/'/g, "''")} is actively hiring early-career software engineers and university graduates.',
            '${row.websiteUrl}',
            'Technology',
            '["TypeScript", "Python", "Java", "Cloud"]',
            '{}',
            NULL,
            '50-1000',
            '${primaryLoc.replace(/'/g, "''")}',
            'newgrad_directory',
            ${now},
            ${now}
          ) ON CONFLICT(domain) DO UPDATE SET
            location_hint = excluded.location_hint,
            updated_at = excluded.updated_at;
        `);
      }

      // Career Page SQL (deduplicated by applyUrl)
      if (!seenPageUrls.has(row.applyUrl)) {
        seenPageUrls.add(row.applyUrl);
        careerPageStatements.push(`
          INSERT INTO career_pages (
            id, company_id, url, page_type, status, content_hash, last_checked_at, created_at
          ) VALUES (
            '${cleanPageId}',
            COALESCE((SELECT id FROM companies WHERE domain = '${row.companyDomain.replace(/'/g, "''")}' LIMIT 1), '${cleanCompId}'),
            '${row.applyUrl.replace(/'/g, "''")}',
            'ats_embed',
            'active',
            'hash_page_${cleanCompId}_${urlHash}',
            ${now},
            ${now}
          ) ON CONFLICT(url) DO UPDATE SET
            status = excluded.status,
            last_checked_at = excluded.last_checked_at;
        `);
      }

      // Job SQL (deduplicated by unique composite hash)
      const jobHash = Math.abs(hashCode(`${row.companyDomain}::${row.roleTitle}::${row.applyUrl}`)).toString(36);
      const jobId = `job_ng_${jobHash}`;
      const contentHash = `hash_ng_${jobHash}`;

      if (!seenJobIds.has(jobId)) {
        seenJobIds.add(jobId);
        const techCategory = inferTechCategory(row.roleTitle, ["Software", "Engineering", "Algorithms"]);
        const desc = `${row.companyName} is hiring a ${row.roleTitle} for 2025/2026 graduates in ${primaryLoc}. Direct ATS application link.`;

        jobStatements.push(`
          INSERT INTO jobs (
            id, company_id, career_page_id, title, department,
            seniority_level, tech_category, is_tech_role,
            employment_type, location, is_remote, remote_scope,
            salary_min, salary_max, salary_currency, skills,
            description_summary, raw_content, apply_type, apply_target,
            status, content_hash, first_seen_at, last_seen_at
          ) VALUES (
            '${jobId}',
            COALESCE((SELECT id FROM companies WHERE domain = '${row.companyDomain.replace(/'/g, "''")}' LIMIT 1), '${cleanCompId}'),
            COALESCE((SELECT id FROM career_pages WHERE url = '${row.applyUrl.replace(/'/g, "''")}' LIMIT 1), (SELECT id FROM career_pages WHERE company_id = (SELECT id FROM companies WHERE domain = '${row.companyDomain.replace(/'/g, "''")}' LIMIT 1) LIMIT 1), '${cleanPageId}'),
            '${row.roleTitle.replace(/'/g, "''")}',
            'Engineering / Early Career',
            'new_grad',
            '${techCategory}',
            1,
            'full-time',
            '${primaryLoc.replace(/'/g, "''")}',
            ${primaryLoc.toLowerCase().includes("remote") ? 1 : 0},
            '${isMidwest ? "us_midwest" : "us_national"}',
            NULL,
            NULL,
            'USD',
            '["Software Engineering", "Computer Science", "Algorithms", "Git"]',
            '${desc.replace(/'/g, "''")}',
            '${desc.replace(/'/g, "''")}',
            'url',
            '${row.applyUrl.replace(/'/g, "''")}',
            'open',
            '${contentHash}',
            ${now},
            ${now}
          ) ON CONFLICT(content_hash) DO UPDATE SET
            title = excluded.title,
            seniority_level = 'new_grad',
            tech_category = excluded.tech_category,
            status = 'open',
            last_seen_at = excluded.last_seen_at;
        `);
      }
    }

    console.log(`Identified ${midwestCount} New Grad positions in Midwest US regions!`);
  }

  // Combine ordered: 1. Companies -> 2. Career Pages -> 3. Jobs
  const allStatements = [
    ...companyStatements,
    ...careerPageStatements,
    ...jobStatements,
  ];

  console.log(`[3/3] Executing ${allStatements.length} ordered statements on Cloudflare D1 (off_radar_db)...`);
  const tmpSqlPath = path.resolve("./seed_newgrad.sql");
  fs.writeFileSync(tmpSqlPath, allStatements.join("\n"), "utf-8");

  try {
    requireCi("seed new-grad jobs into remote D1");
    execSync(
      `CLOUDFLARE_ACCOUNT_ID=${ACCOUNT_ID} npx wrangler d1 execute off_radar_db --remote --file="${tmpSqlPath}"`,
      { stdio: "inherit" }
    );
    console.log("✅ Successfully harvested and seeded New Grad jobs into Cloudflare D1!");
  } catch (err: any) {
    console.error("Execution failed on Cloudflare D1:", err?.message);
    throw err;
  } finally {
    if (fs.existsSync(tmpSqlPath)) {
      fs.unlinkSync(tmpSqlPath);
    }
  }
}

main().catch((err) => {
  console.error("Fatal harvest error:", err);
  process.exit(1);
});
