-- Migration: 0017_prevent_and_cleanup_broken_links.sql
-- 1. Clean up existing jobs with Cloudflare /cdn-cgi/l/email-protection or generic /careers links
-- 2. Add SQLite BEFORE INSERT / BEFORE UPDATE triggers to prevent broken /cdn-cgi/l/email-protection links from ever being stored in jobs or career_pages.

-- Clean up existing open jobs whose apply_target contains /cdn-cgi/l/email-protection or /cdn-cgi/
UPDATE jobs
SET status = 'closed',
    closed_reason = 'invalid_link',
    link_status = 'invalid'
WHERE status = 'open'
  AND (
    LOWER(apply_target) LIKE '%/cdn-cgi/%'
    OR LOWER(apply_target) LIKE '%email-protection%'
  );

-- Clean up companies with obfuscated contact_email
UPDATE companies
SET contact_email = NULL
WHERE contact_email IS NOT NULL
  AND (
    LOWER(contact_email) LIKE '%/cdn-cgi/%'
    OR LOWER(contact_email) LIKE '%email-protection%'
  );

-- Delete career_pages that were mistakenly recorded as /cdn-cgi/l/email-protection URLs
DELETE FROM career_pages
WHERE LOWER(url) LIKE '%/cdn-cgi/%'
   OR LOWER(url) LIKE '%email-protection%';

-- Trigger: reject INSERT on jobs if apply_target is a Cloudflare email-protection link
CREATE TRIGGER IF NOT EXISTS trg_jobs_reject_broken_links_insert
BEFORE INSERT ON jobs
FOR EACH ROW
WHEN LOWER(NEW.apply_target) LIKE '%/cdn-cgi/%'
  OR LOWER(NEW.apply_target) LIKE '%email-protection%'
BEGIN
  SELECT RAISE(ABORT, 'Rejected broken apply_target: Cloudflare email-protection URL is not allowed');
END;

-- Trigger: reject UPDATE on jobs if apply_target is changed to a Cloudflare email-protection link
CREATE TRIGGER IF NOT EXISTS trg_jobs_reject_broken_links_update
BEFORE UPDATE OF apply_target ON jobs
FOR EACH ROW
WHEN LOWER(NEW.apply_target) LIKE '%/cdn-cgi/%'
  OR LOWER(NEW.apply_target) LIKE '%email-protection%'
BEGIN
  SELECT RAISE(ABORT, 'Rejected broken apply_target: Cloudflare email-protection URL is not allowed');
END;

-- Trigger: reject INSERT on career_pages if url is a Cloudflare email-protection link
CREATE TRIGGER IF NOT EXISTS trg_career_pages_reject_broken_links_insert
BEFORE INSERT ON career_pages
FOR EACH ROW
WHEN LOWER(NEW.url) LIKE '%/cdn-cgi/%'
  OR LOWER(NEW.url) LIKE '%email-protection%'
BEGIN
  SELECT RAISE(ABORT, 'Rejected broken career_page url: Cloudflare email-protection URL is not allowed');
END;
