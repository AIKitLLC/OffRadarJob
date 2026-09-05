import { REGIONAL_SEEDS } from "../demo/regional-seeds.js";
import { execSync } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";

async function main() {
  console.log(`[Regional Studio Seeder] Preparing SQL statements for ${REGIONAL_SEEDS.length} regional studios...`);

  const sqlStatements: string[] = [];

  for (const item of REGIONAL_SEEDS) {
    const { company, careerPage, jobs } = item;

    // 1. Company SQL
    sqlStatements.push(`
      INSERT INTO companies (
        id, domain, name, tagline, description, website_url,
        industry, tech_stack, social_links, contact_email,
        headcount_estimate, location_hint, discovery_source,
        created_at, updated_at
      ) VALUES (
        '${company.id}',
        '${company.domain.replace(/'/g, "''")}',
        '${company.name.replace(/'/g, "''")}',
        ${company.tagline ? `'${company.tagline.replace(/'/g, "''")}'` : 'NULL'},
        ${company.description ? `'${company.description.replace(/'/g, "''")}'` : 'NULL'},
        '${company.websiteUrl}',
        ${company.industry ? `'${company.industry.replace(/'/g, "''")}'` : 'NULL'},
        '${JSON.stringify(company.techStack).replace(/'/g, "''")}',
        '${JSON.stringify(company.socialLinks).replace(/'/g, "''")}',
        ${company.contactEmail ? `'${company.contactEmail}'` : 'NULL'},
        ${company.headcountEstimate ? `'${company.headcountEstimate}'` : 'NULL'},
        ${company.locationHint ? `'${company.locationHint.replace(/'/g, "''")}'` : 'NULL'},
        '${company.discoverySource}',
        ${company.createdAt},
        ${company.updatedAt}
      ) ON CONFLICT(domain) DO UPDATE SET
        location_hint = excluded.location_hint,
        industry = COALESCE(excluded.industry, companies.industry),
        updated_at = excluded.updated_at;
    `);

    // 2. Career page SQL
    sqlStatements.push(`
      INSERT INTO career_pages (
        id, company_id, url, page_type, status, content_hash, last_checked_at, created_at
      ) VALUES (
        '${careerPage.id}',
        '${careerPage.companyId}',
        '${careerPage.url}',
        '${careerPage.pageType}',
        '${careerPage.status}',
        '${careerPage.contentHash}',
        ${careerPage.lastCheckedAt},
        ${careerPage.createdAt}
      ) ON CONFLICT(url) DO UPDATE SET
        status = excluded.status,
        last_checked_at = excluded.last_checked_at;
    `);

    // 3. Jobs SQL
    for (const j of jobs) {
      sqlStatements.push(`
        INSERT INTO jobs (
          id, company_id, career_page_id, title, department,
          seniority_level, tech_category, is_tech_role,
          employment_type, location, is_remote, remote_scope,
          salary_min, salary_max, salary_currency, skills,
          description_summary, raw_content, apply_type, apply_target,
          status, content_hash, first_seen_at, last_seen_at
        ) VALUES (
          '${j.id}',
          '${j.companyId}',
          COALESCE((SELECT id FROM career_pages WHERE company_id = '${j.companyId}' LIMIT 1), '${careerPage.id}'),
          '${j.title.replace(/'/g, "''")}',
          ${j.department ? `'${j.department.replace(/'/g, "''")}'` : 'NULL'},
          '${j.seniorityLevel}',
          '${j.techCategory}',
          ${j.isTechRole ? 1 : 0},
          '${j.employmentType}',
          ${j.location ? `'${j.location.replace(/'/g, "''")}'` : 'NULL'},
          ${j.isRemote ? 1 : 0},
          '${j.remoteScope}',
          ${j.salaryMin ?? 'NULL'},
          ${j.salaryMax ?? 'NULL'},
          ${j.salaryCurrency ? `'${j.salaryCurrency}'` : 'NULL'},
          '${JSON.stringify(j.skills).replace(/'/g, "''")}',
          ${j.descriptionSummary ? `'${j.descriptionSummary.replace(/'/g, "''")}'` : 'NULL'},
          ${j.rawContent ? `'${j.rawContent.replace(/'/g, "''")}'` : 'NULL'},
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

  const tmpSqlPath = path.resolve("./seed_regional.sql");
  fs.writeFileSync(tmpSqlPath, sqlStatements.join("\n"), "utf-8");
  console.log(`[Regional Studio Seeder] Written ${sqlStatements.length} statements to ${tmpSqlPath}. Executing on remote Cloudflare D1...`);

  try {
    execSync(`npx wrangler d1 execute off_radar_db --remote --file="${tmpSqlPath}"`, {
      stdio: "inherit",
    });
    console.log(`[Regional Studio Seeder] Successfully seeded regional tech studios into Cloudflare D1!`);
  } catch (err: any) {
    console.error(`[Regional Studio Seeder] Execution failed:`, err?.message);
  } finally {
    if (fs.existsSync(tmpSqlPath)) {
      fs.unlinkSync(tmpSqlPath);
    }
  }
}

main().catch(console.error);
