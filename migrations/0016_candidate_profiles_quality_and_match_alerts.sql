-- Candidate profiles, saved filters, quality decision log, and idempotent match alerts.

CREATE TABLE IF NOT EXISTS candidate_profiles (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  profile_json TEXT NOT NULL,
  source_cv_id TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_candidate_profiles_user ON candidate_profiles(user_id);

CREATE TABLE IF NOT EXISTS saved_job_filters (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  profile_id TEXT NOT NULL REFERENCES candidate_profiles(id) ON DELETE CASCADE,
  filter_json TEXT NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_saved_job_filters_user ON saved_job_filters(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_job_filters_active ON saved_job_filters(is_active);

CREATE TABLE IF NOT EXISTS job_quality_decisions (
  id TEXT PRIMARY KEY,
  job_id TEXT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  content_hash TEXT NOT NULL,
  action TEXT NOT NULL,
  quality_score INTEGER NOT NULL,
  authenticity TEXT NOT NULL,
  sponsorship_signal TEXT NOT NULL,
  ruleset_version TEXT NOT NULL,
  decision_key TEXT NOT NULL,
  source TEXT NOT NULL,
  record_json TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_quality_job_version ON job_quality_decisions(job_id, content_hash, ruleset_version);
CREATE INDEX IF NOT EXISTS idx_quality_created ON job_quality_decisions(created_at DESC);

CREATE TABLE IF NOT EXISTS match_alerts (
  id TEXT PRIMARY KEY,
  alert_key TEXT NOT NULL UNIQUE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  profile_id TEXT NOT NULL,
  filter_id TEXT NOT NULL,
  job_id TEXT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  content_hash TEXT NOT NULL,
  score INTEGER NOT NULL,
  reasons_json TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_match_alerts_user ON match_alerts(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_match_alerts_job ON match_alerts(job_id);
