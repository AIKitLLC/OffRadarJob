/**
 * Text match for the public job catalog (`/api/jobs`) and the admin export.
 * One bound pattern is repeated per column so list rows and the pagination
 * total cannot drift. `description_summary` and `raw_content` are included
 * so a phrase that appears only in the job description still matches.
 * The caller lowercases the term and wraps it in `%`.
 */
export const JOB_CATALOG_TEXT_SEARCH_SQL =
  "(LOWER(j.title) LIKE ? OR LOWER(COALESCE(c.name, '')) LIKE ? OR LOWER(j.skills) LIKE ? OR LOWER(COALESCE(j.location, '')) LIKE ? OR LOWER(COALESCE(j.department, '')) LIKE ? OR LOWER(COALESCE(j.description_summary, '')) LIKE ? OR LOWER(COALESCE(j.raw_content, '')) LIKE ?)";

export const JOB_CATALOG_TEXT_SEARCH_COLUMN_COUNT = 7;

export function jobCatalogTextSearchBindings(pattern: string): string[] {
  return Array.from({ length: JOB_CATALOG_TEXT_SEARCH_COLUMN_COUNT }, () => pattern);
}
