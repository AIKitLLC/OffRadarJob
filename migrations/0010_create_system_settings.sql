-- Migration: 0010_create_system_settings.sql
-- Persistent key-value storage for runtime application and Telegram bot configuration

CREATE TABLE IF NOT EXISTS system_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);
