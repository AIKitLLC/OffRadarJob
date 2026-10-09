-- Migration: 0014_add_cv_target_groups_and_reranking.sql
-- Add target_group and decision_suggestions columns to cv_versions for multi-version CV optimization with Cloudflare Decision API

ALTER TABLE cv_versions ADD COLUMN target_group TEXT;
ALTER TABLE cv_versions ADD COLUMN decision_suggestions TEXT;

CREATE INDEX IF NOT EXISTS idx_cv_versions_target_group ON cv_versions(target_group);
