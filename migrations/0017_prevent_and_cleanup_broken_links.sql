-- Migration: 0017_prevent_and_cleanup_broken_links.sql
-- 1. Mark existing broken records for re-research/recovery (non-destructive: never close, null, or delete
--    a decodable Cloudflare email-protection target before the recovery pass can decode or re-fetch it).
-- 2. Add SQLite BEFORE INSERT / BEFORE UPDATE triggers to prevent broken /cdn-cgi/l/email-protection links from ever being stored in jobs or career_pages.

-- Mark open jobs with broken apply targets as invalid so the recovery finder can locate them.
-- The original apply_target is preserved so it can still be decoded or re-researched from its source page.
UPDATE jobs
SET link_status = 'invalid'
WHERE status = 'open'
  AND (
    LOWER(apply_target) LIKE '%/cdn-cgi/%'
    OR LOWER(apply_target) LIKE '%email-protection%'
  );

-- Mark career_pages that were mistakenly recorded as /cdn-cgi/l/email-protection URLs as not_found.
-- The row and its original URL are preserved so recovery can re-discover the real career page from the company site.
UPDATE career_pages
SET status = 'not_found'
WHERE LOWER(url) LIKE '%/cdn-cgi/%'
   OR LOWER(url) LIKE '%email-protection%';

-- companies.contact_email is intentionally left untouched: the recovery pass decodes
-- /cdn-cgi/l/email-protection values or re-fetches the company homepage to find the real email.

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

-- Trigger: reject UPDATE on career_pages if url is changed to a Cloudflare email-protection link
CREATE TRIGGER IF NOT EXISTS trg_career_pages_reject_broken_links_update
BEFORE UPDATE OF url ON career_pages
FOR EACH ROW
WHEN LOWER(NEW.url) LIKE '%/cdn-cgi/%'
  OR LOWER(NEW.url) LIKE '%email-protection%'
BEGIN
  SELECT RAISE(ABORT, 'Rejected broken career_page url: Cloudflare email-protection URL is not allowed');
END;
