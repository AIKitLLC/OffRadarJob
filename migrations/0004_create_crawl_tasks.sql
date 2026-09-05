-- Migration: 0004_create_crawl_tasks.sql
-- Table to manage and monitor crawl processes / agent runs from Admin Panel

CREATE TABLE IF NOT EXISTS crawl_tasks (
  id TEXT PRIMARY KEY,
  target_url TEXT NOT NULL,
  source_type TEXT NOT NULL DEFAULT 'manual', -- 'manual', 'batch', 'scheduled', 'midwest_preset'
  status TEXT NOT NULL DEFAULT 'pending',     -- 'pending', 'running', 'completed', 'failed'
  company_id TEXT,
  jobs_found INTEGER NOT NULL DEFAULT 0,
  error_message TEXT,
  metadata TEXT NOT NULL DEFAULT '{}',
  created_at INTEGER NOT NULL,
  completed_at INTEGER
);

CREATE INDEX IF NOT EXISTS idx_crawl_tasks_status ON crawl_tasks(status);
CREATE INDEX IF NOT EXISTS idx_crawl_tasks_created ON crawl_tasks(created_at DESC);
