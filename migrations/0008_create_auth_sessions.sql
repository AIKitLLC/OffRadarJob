-- Migration: 0008_create_auth_sessions.sql
-- Persistent distributed Telegram login sessions across Cloudflare Edge

CREATE TABLE IF NOT EXISTS auth_sessions (
  token TEXT PRIMARY KEY,
  status TEXT NOT NULL,
  telegram_id TEXT,
  api_token TEXT,
  user_json TEXT,
  created_at INTEGER NOT NULL,
  authenticated_at INTEGER
);

CREATE INDEX IF NOT EXISTS idx_auth_sessions_token ON auth_sessions(token);
CREATE INDEX IF NOT EXISTS idx_auth_sessions_created ON auth_sessions(created_at DESC);
