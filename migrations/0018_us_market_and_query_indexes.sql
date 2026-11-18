-- Migration: 0018_us_market_and_query_indexes.sql
-- Additive-only D1 / SQLite indexes for public job listings and batched quality-decision lookups.

CREATE INDEX IF NOT EXISTS idx_jobs_open_tech_first_seen ON jobs(status, is_tech_role, first_seen_at DESC);
CREATE INDEX IF NOT EXISTS idx_jobs_open_remote_first_seen ON jobs(status, is_remote, first_seen_at DESC);
CREATE INDEX IF NOT EXISTS idx_jobs_open_grade_cat ON jobs(status, seniority_level, tech_category, first_seen_at DESC);

CREATE INDEX IF NOT EXISTS idx_quality_job_hash_version ON job_quality_decisions(job_id, content_hash, ruleset_version);
