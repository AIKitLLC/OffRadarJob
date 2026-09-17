-- Migration: 0011_add_company_valuation_and_department_weights.sql
-- Adds company valuation, funding stage, tier, and hiring department distribution metrics

ALTER TABLE companies ADD COLUMN funding_stage TEXT;
ALTER TABLE companies ADD COLUMN total_funding TEXT;
ALTER TABLE companies ADD COLUMN valuation_estimate TEXT;
ALTER TABLE companies ADD COLUMN company_tier TEXT;
ALTER TABLE companies ADD COLUMN primary_department TEXT;
ALTER TABLE companies ADD COLUMN hiring_departments_json TEXT NOT NULL DEFAULT '{}';

CREATE INDEX IF NOT EXISTS idx_companies_funding_stage ON companies(funding_stage);
CREATE INDEX IF NOT EXISTS idx_companies_primary_dept ON companies(primary_department);
