-- Apply-click measurement (#39). One row per counted click through /go/:jobId.
-- No IP address, user agent, or referrer is stored.

CREATE TABLE IF NOT EXISTS apply_clicks (
  id TEXT PRIMARY KEY,
  job_id TEXT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  source TEXT NOT NULL CHECK (source IN ('dashboard','list','digest','telegram','mcp','alert','other')),
  list_slug TEXT,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_apply_clicks_job ON apply_clicks(job_id, created_at);
CREATE INDEX IF NOT EXISTS idx_apply_clicks_source ON apply_clicks(source, created_at);
CREATE INDEX IF NOT EXISTS idx_apply_clicks_user_job ON apply_clicks(user_id, job_id, created_at);
