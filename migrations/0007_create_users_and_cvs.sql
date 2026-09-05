-- Migration: 0007_create_users_and_cvs.sql
-- Users (Telegram Auth & Personal MCP API Key) and CV Versions (Linked to Job JDs)

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  telegram_id TEXT NOT NULL UNIQUE,
  username TEXT,
  first_name TEXT NOT NULL,
  photo_url TEXT,
  api_token TEXT NOT NULL UNIQUE,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_users_telegram_id ON users(telegram_id);
CREATE INDEX IF NOT EXISTS idx_users_api_token ON users(api_token);

CREATE TABLE IF NOT EXISTS cv_versions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  job_id TEXT REFERENCES jobs(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  target_role TEXT,
  content TEXT NOT NULL,
  skills TEXT NOT NULL DEFAULT '[]',
  match_score INTEGER,
  tailored_notes TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_cv_versions_user ON cv_versions(user_id);
CREATE INDEX IF NOT EXISTS idx_cv_versions_job ON cv_versions(job_id);
CREATE INDEX IF NOT EXISTS idx_cv_versions_updated ON cv_versions(updated_at DESC);
