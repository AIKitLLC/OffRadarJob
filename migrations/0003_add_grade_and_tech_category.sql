-- Migration: 0003_add_grade_and_tech_category.sql
-- Add grade (seniority_level), tech_category, and is_tech_role to jobs table

ALTER TABLE jobs ADD COLUMN seniority_level TEXT DEFAULT 'mid';
ALTER TABLE jobs ADD COLUMN tech_category TEXT DEFAULT 'fullstack';
ALTER TABLE jobs ADD COLUMN is_tech_role INTEGER DEFAULT 1;

CREATE INDEX IF NOT EXISTS idx_jobs_seniority ON jobs(seniority_level);
CREATE INDEX IF NOT EXISTS idx_jobs_tech_category ON jobs(tech_category);

-- Update existing seeded jobs with precise grade & tech specialization
UPDATE jobs SET seniority_level = 'founding', tech_category = 'ai_ml', is_tech_role = 1 
WHERE id = 'job_promptloop_scraping';

UPDATE jobs SET seniority_level = 'senior', tech_category = 'devops_cloud', is_tech_role = 1 
WHERE id = 'job_sixfeetup_cloud';

UPDATE jobs SET seniority_level = 'senior', tech_category = 'backend_systems', is_tech_role = 1 
WHERE id = 'job_bendyworks_elixir';

UPDATE jobs SET seniority_level = 'mid', tech_category = 'frontend_ui', is_tech_role = 1 
WHERE id = 'job_sfg_frontend';

UPDATE jobs SET seniority_level = 'senior', tech_category = 'backend_systems', is_tech_role = 1 
WHERE id = 'job_gaslight_backend';
