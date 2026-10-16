-- Migration: 0015_add_job_link_checks.sql
-- Link-quality tracking for apply URLs (ingest validation, daily link checker, auto-expire).
-- Additive only: no existing column is changed or dropped.

ALTER TABLE jobs ADD COLUMN link_status TEXT;                         -- 'ok', 'dead', 'closed_page', 'generic_redirect', 'error_redirect', 'unverifiable', 'network_error', 'server_error', 'invalid'
ALTER TABLE jobs ADD COLUMN link_fail_count INTEGER NOT NULL DEFAULT 0; -- consecutive failed checks; job is closed at >= 2
ALTER TABLE jobs ADD COLUMN link_checked_at INTEGER;                  -- Unix ms of the last link check
ALTER TABLE jobs ADD COLUMN last_verified_at INTEGER;                 -- Unix ms of the last successful check (shown as "Last verified")
ALTER TABLE jobs ADD COLUMN closed_reason TEXT;                       -- 'link_check', 'stale', ...

CREATE INDEX IF NOT EXISTS idx_jobs_link_check_queue ON jobs(status, apply_type, link_checked_at);
CREATE INDEX IF NOT EXISTS idx_jobs_status_last_seen ON jobs(status, last_seen_at);
