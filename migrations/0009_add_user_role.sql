-- Migration: 0009_add_user_role.sql
-- Add user roles (admin vs user) for Telegram Bot authorization and Admin Center access

ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'user';

CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Set primary owner as admin by default
UPDATE users SET role = 'admin' WHERE username = 'tuannx87';
