-- Migration: 0012_create_llm_feedbacks.sql
-- Table to store LLM proactive feedback received via MCP and UI

CREATE TABLE IF NOT EXISTS llm_feedbacks (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  feedback_type TEXT NOT NULL,
  sentiment TEXT NOT NULL DEFAULT 'neutral',
  rating INTEGER,
  comment TEXT NOT NULL,
  job_id TEXT REFERENCES jobs(id) ON DELETE SET NULL,
  company_id TEXT REFERENCES companies(id) ON DELETE SET NULL,
  context_summary TEXT,
  suggested_action TEXT,
  metadata TEXT NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'new',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_llm_feedbacks_user ON llm_feedbacks(user_id);
CREATE INDEX IF NOT EXISTS idx_llm_feedbacks_type ON llm_feedbacks(feedback_type);
CREATE INDEX IF NOT EXISTS idx_llm_feedbacks_status ON llm_feedbacks(status);
CREATE INDEX IF NOT EXISTS idx_llm_feedbacks_created ON llm_feedbacks(created_at DESC);
