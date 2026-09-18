-- Migration: 0013_create_user_subscriptions.sql
-- Candidate alert subscriptions for automated daily digests and notification preferences

CREATE TABLE IF NOT EXISTS user_subscriptions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  telegram_id TEXT NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1,
  frequency TEXT NOT NULL DEFAULT 'daily',
  target_roles TEXT NOT NULL DEFAULT '[]',
  tech_categories TEXT NOT NULL DEFAULT '[]',
  regions TEXT NOT NULL DEFAULT '["midwest", "remote"]',
  min_salary REAL,
  last_notified_at INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_user_subs_user_id ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subs_active ON user_subscriptions(is_active);
CREATE INDEX IF NOT EXISTS idx_user_subs_telegram_id ON user_subscriptions(telegram_id);
