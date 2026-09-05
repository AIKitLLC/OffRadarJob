-- Migration: 0001_initial_schema.sql
-- Off-Radar Jobs D1 Database Schema

CREATE TABLE IF NOT EXISTS companies (
  id TEXT PRIMARY KEY,
  domain TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  tagline TEXT,
  description TEXT,
  website_url TEXT NOT NULL,
  logo_url TEXT,
  industry TEXT,
  tech_stack TEXT NOT NULL DEFAULT '[]',      -- JSON array of strings
  social_links TEXT NOT NULL DEFAULT '{}',    -- JSON object: { twitter, github, linkedin, etc. }
  contact_email TEXT,
  headcount_estimate TEXT,                    -- e.g. "1-5", "6-15", "16-30"
  location_hint TEXT,                         -- e.g. "Remote-first", "Vietnam", "US/EU"
  discovery_source TEXT,                      -- e.g. "seed", "hn", "github", "manual"
  created_at INTEGER NOT NULL,                -- Unix timestamp in ms
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_companies_domain ON companies(domain);
CREATE INDEX IF NOT EXISTS idx_companies_updated ON companies(updated_at DESC);

CREATE TABLE IF NOT EXISTS career_pages (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  url TEXT NOT NULL UNIQUE,
  page_type TEXT NOT NULL,                    -- 'internal_page', 'notion', 'airtable', 'typeform', 'blog_post', 'custom'
  status TEXT NOT NULL DEFAULT 'active',      -- 'active', 'not_found', 'unreachable'
  content_hash TEXT,
  last_checked_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_career_pages_company ON career_pages(company_id);
CREATE INDEX IF NOT EXISTS idx_career_pages_url ON career_pages(url);

CREATE TABLE IF NOT EXISTS jobs (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  career_page_id TEXT NOT NULL REFERENCES career_pages(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  department TEXT,
  employment_type TEXT NOT NULL DEFAULT 'full-time', -- 'full-time', 'part-time', 'contract', 'internship', 'other'
  location TEXT,
  is_remote INTEGER NOT NULL DEFAULT 1,       -- 1 = true, 0 = false
  remote_scope TEXT DEFAULT 'worldwide',      -- 'worldwide', 'us_only', 'vietnam_only', 'apac', etc.
  salary_min REAL,
  salary_max REAL,
  salary_currency TEXT,
  skills TEXT NOT NULL DEFAULT '[]',          -- JSON array of strings
  description_summary TEXT,
  raw_content TEXT,
  apply_type TEXT NOT NULL DEFAULT 'email',   -- 'email', 'url', 'form', 'discord', 'x_dm'
  apply_target TEXT NOT NULL,                 -- email address or application URL/handle
  status TEXT NOT NULL DEFAULT 'open',        -- 'open', 'closed'
  content_hash TEXT NOT NULL UNIQUE,          -- SHA-256 fingerprint for deduplication
  first_seen_at INTEGER NOT NULL,
  last_seen_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_jobs_company ON jobs(company_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_first_seen ON jobs(first_seen_at DESC);
CREATE INDEX IF NOT EXISTS idx_jobs_content_hash ON jobs(content_hash);

CREATE TABLE IF NOT EXISTS crawl_logs (
  id TEXT PRIMARY KEY,
  agent_name TEXT NOT NULL,                   -- 'discovery', 'profiler', 'career_hunter', 'job_extractor'
  target_url TEXT NOT NULL,
  status TEXT NOT NULL,                       -- 'success', 'warning', 'error'
  duration_ms INTEGER NOT NULL,
  message TEXT NOT NULL,
  metadata TEXT DEFAULT '{}',                 -- JSON metadata
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_crawl_logs_agent ON crawl_logs(agent_name);
CREATE INDEX IF NOT EXISTS idx_crawl_logs_created ON crawl_logs(created_at DESC);
