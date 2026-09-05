-- Migration: 0006_expand_new_grad_and_junior_roles.sql
-- Expand New Grad, Junior & Early-Career opportunities across top US boutique tech studios

-- 1. Fly.io - New Grad Systems Engineer
INSERT INTO jobs (
  id, company_id, career_page_id, title, department,
  seniority_level, tech_category, is_tech_role,
  employment_type, location, is_remote, remote_scope,
  salary_min, salary_max, salary_currency, skills,
  description_summary, raw_content, apply_type, apply_target,
  status, content_hash, first_seen_at, last_seen_at
)
SELECT
  'job_flyio_newgrad_systems',
  'comp_fly_io',
  cp.id,
  'Junior / New Grad Systems Engineer (Rust & Linux Infra)',
  'Infrastructure',
  'new_grad',
  'backend_systems',
  1,
  'full-time',
  'Chicago, IL / Remote (US)',
  1,
  'us_only',
  105000,
  135000,
  'USD',
  '["Rust", "Go", "Linux", "eBPF", "Virtualization"]',
  'Join Fly.io building hardware virtualization close to users. Targeted at recent graduates with hands-on systems programming and Linux kernel passion.',
  'Mentorship under world-class distributed systems engineers. 100% remote friendly.',
  'url',
  'https://fly.io/jobs',
  'open',
  'hash_newgrad_flyio_systems',
  1757000000000,
  1757000000000
FROM career_pages cp WHERE cp.company_id = 'comp_fly_io' LIMIT 1
ON CONFLICT(content_hash) DO UPDATE SET last_seen_at = 1757000000000;

-- 2. Railway - Junior / New Grad Fullstack Engineer
INSERT INTO jobs (
  id, company_id, career_page_id, title, department,
  seniority_level, tech_category, is_tech_role,
  employment_type, location, is_remote, remote_scope,
  salary_min, salary_max, salary_currency, skills,
  description_summary, raw_content, apply_type, apply_target,
  status, content_hash, first_seen_at, last_seen_at
)
SELECT
  'job_railway_newgrad_fullstack',
  'comp_railway_app',
  cp.id,
  'New Grad Fullstack Developer (TypeScript & Cloud)',
  'Product',
  'new_grad',
  'fullstack',
  1,
  'full-time',
  'San Francisco, CA / Remote (US)',
  1,
  'us_only',
  100000,
  130000,
  'USD',
  '["TypeScript", "Next.js", "GraphQL", "TailwindCSS", "Node.js"]',
  'Help build developer tooling and deployment orchestration interfaces used by hundreds of thousands of developers worldwide.',
  'Lean team, rapid shipping culture, paired development with senior staff.',
  'url',
  'https://railway.app/careers',
  'open',
  'hash_newgrad_railway_fullstack',
  1757000000000,
  1757000000000
FROM career_pages cp WHERE cp.company_id = 'comp_railway_app' LIMIT 1
ON CONFLICT(content_hash) DO UPDATE SET last_seen_at = 1757000000000;

-- 3. Supabase - Junior / New Grad Developer Advocate & Frontend
INSERT INTO jobs (
  id, company_id, career_page_id, title, department,
  seniority_level, tech_category, is_tech_role,
  employment_type, location, is_remote, remote_scope,
  salary_min, salary_max, salary_currency, skills,
  description_summary, raw_content, apply_type, apply_target,
  status, content_hash, first_seen_at, last_seen_at
)
SELECT
  'job_supabase_newgrad_frontend',
  'comp_supabase_com',
  cp.id,
  'Junior Frontend Engineer (React / Next.js / Open Source)',
  'Frontend',
  'junior',
  'frontend_ui',
  1,
  'full-time',
  'Remote (US / Global)',
  1,
  'worldwide',
  85000,
  110000,
  'USD',
  '["React", "Next.js", "TypeScript", "PostgreSQL", "TailwindCSS"]',
  'Build and polish open-source dashboard components and developer documentation apps for the leading open source Firebase alternative.',
  'Open source first, transparent compensation, asynchronous workflow.',
  'url',
  'https://supabase.com/careers',
  'open',
  'hash_newgrad_supabase_frontend',
  1757000000000,
  1757000000000
FROM career_pages cp WHERE cp.company_id = 'comp_supabase_com' LIMIT 1
ON CONFLICT(content_hash) DO UPDATE SET last_seen_at = 1757000000000;

-- 4. PostHog - Junior / New Grad Product Engineer
INSERT INTO jobs (
  id, company_id, career_page_id, title, department,
  seniority_level, tech_category, is_tech_role,
  employment_type, location, is_remote, remote_scope,
  salary_min, salary_max, salary_currency, skills,
  description_summary, raw_content, apply_type, apply_target,
  status, content_hash, first_seen_at, last_seen_at
)
SELECT
  'job_posthog_newgrad_engineer',
  'comp_posthog_com',
  cp.id,
  'Early Career / Junior Fullstack Product Engineer',
  'Engineering',
  'junior',
  'fullstack',
  1,
  'full-time',
  'Remote (US / Americas)',
  1,
  'worldwide',
  95000,
  120000,
  'USD',
  '["TypeScript", "Python", "ClickHouse", "React", "PostgreSQL"]',
  'Work on open-source product analytics, session replays, and feature flags. Autonomous small teams with high agency.',
  'Generous transparent equity and compensation formula, unlimited vacation, work from anywhere.',
  'url',
  'https://posthog.com/careers',
  'open',
  'hash_newgrad_posthog_engineer',
  1757000000000,
  1757000000000
FROM career_pages cp WHERE cp.company_id = 'comp_posthog_com' LIMIT 1
ON CONFLICT(content_hash) DO UPDATE SET last_seen_at = 1757000000000;

-- 5. Cal.com - New Grad Full-Stack Engineer
INSERT INTO jobs (
  id, company_id, career_page_id, title, department,
  seniority_level, tech_category, is_tech_role,
  employment_type, location, is_remote, remote_scope,
  salary_min, salary_max, salary_currency, skills,
  description_summary, raw_content, apply_type, apply_target,
  status, content_hash, first_seen_at, last_seen_at
)
SELECT
  'job_calcom_newgrad_fullstack',
  'comp_cal_com',
  cp.id,
  'New Grad Full-Stack Engineer (Next.js, Prisma, TRPC)',
  'Engineering',
  'new_grad',
  'fullstack',
  1,
  'full-time',
  'Remote (US / Worldwide)',
  1,
  'worldwide',
  80000,
  105000,
  'USD',
  '["Next.js", "TypeScript", "Prisma", "tRPC", "PostgreSQL", "TailwindCSS"]',
  'Contribute directly to the core scheduling engine that connects millions of meetings each month. Open-source ecosystem development.',
  '100% remote, async communication, flexible hours.',
  'url',
  'https://cal.com/jobs',
  'open',
  'hash_newgrad_calcom_fullstack',
  1757000000000,
  1757000000000
FROM career_pages cp WHERE cp.company_id = 'comp_cal_com' LIMIT 1
ON CONFLICT(content_hash) DO UPDATE SET last_seen_at = 1757000000000;

-- 6. Turso - Junior Systems Engineer
INSERT INTO jobs (
  id, company_id, career_page_id, title, department,
  seniority_level, tech_category, is_tech_role,
  employment_type, location, is_remote, remote_scope,
  salary_min, salary_max, salary_currency, skills,
  description_summary, raw_content, apply_type, apply_target,
  status, content_hash, first_seen_at, last_seen_at
)
SELECT
  'job_turso_junior_systems',
  'comp_turso_tech',
  cp.id,
  'Junior Database Systems Engineer (Rust / C / SQLite)',
  'Core Database',
  'junior',
  'backend_systems',
  1,
  'full-time',
  'Remote (US)',
  1,
  'us_only',
  90000,
  120000,
  'USD',
  '["Rust", "C", "SQLite", "libSQL", "Distributed Systems"]',
  'Work on libSQL, our open-source fork of SQLite designed for the edge and multi-tenant cloud architectures.',
  'Learn from the world experts in database internals and edge computing.',
  'url',
  'https://turso.tech/careers',
  'open',
  'hash_newgrad_turso_systems',
  1757000000000,
  1757000000000
FROM career_pages cp WHERE cp.company_id = 'comp_turso_tech' LIMIT 1
ON CONFLICT(content_hash) DO UPDATE SET last_seen_at = 1757000000000;

-- 7. Resend - Junior Developer Experience Engineer
INSERT INTO jobs (
  id, company_id, career_page_id, title, department,
  seniority_level, tech_category, is_tech_role,
  employment_type, location, is_remote, remote_scope,
  salary_min, salary_max, salary_currency, skills,
  description_summary, raw_content, apply_type, apply_target,
  status, content_hash, first_seen_at, last_seen_at
)
SELECT
  'job_resend_junior_dx',
  'comp_resend_com',
  cp.id,
  'Junior Developer Experience & SDK Engineer',
  'Developer Experience',
  'junior',
  'fullstack',
  1,
  'full-time',
  'Remote (US)',
  1,
  'worldwide',
  90000,
  115000,
  'USD',
  '["TypeScript", "React Email", "Node.js", "Python", "Go"]',
  'Build and maintain client SDKs (TypeScript, Python, Ruby, Go) and developer samples for Resend transactional email platform.',
  'High craft standards, obsessive attention to developer UI and API design.',
  'url',
  'https://resend.com/careers',
  'open',
  'hash_newgrad_resend_dx',
  1757000000000,
  1757000000000
FROM career_pages cp WHERE cp.company_id = 'comp_resend_com' LIMIT 1
ON CONFLICT(content_hash) DO UPDATE SET last_seen_at = 1757000000000;

-- 8. PromptLoop - New Grad AI / Web Scraper Developer
INSERT INTO jobs (
  id, company_id, career_page_id, title, department,
  seniority_level, tech_category, is_tech_role,
  employment_type, location, is_remote, remote_scope,
  salary_min, salary_max, salary_currency, skills,
  description_summary, raw_content, apply_type, apply_target,
  status, content_hash, first_seen_at, last_seen_at
)
SELECT
  'job_promptloop_newgrad_ai',
  'comp_promptloop_com',
  cp.id,
  'New Grad AI Data Pipelines Engineer',
  'Engineering',
  'new_grad',
  'ai_ml',
  1,
  'full-time',
  'Chicago, IL / Remote (Midwest)',
  1,
  'us_midwest',
  85000,
  105000,
  'USD',
  '["Python", "LLMs", "Puppeteer", "FastAPI", "PostgreSQL"]',
  'Build intelligent data extraction pipelines and Excel/Sheets LLM models for micro and boutique business intelligence.',
  'Work directly with founding team in Chicago. Huge ownership from day 1.',
  'email',
  'careers@promptloop.com',
  'open',
  'hash_newgrad_promptloop_ai',
  1757000000000,
  1757000000000
FROM career_pages cp WHERE cp.company_id = 'comp_promptloop_com' LIMIT 1
ON CONFLICT(content_hash) DO UPDATE SET last_seen_at = 1757000000000;
