/**
 * Text match for the public job catalog and the admin export.
 * One bound pattern is repeated per column so list rows and the pagination
 * total cannot drift. Public search matches `description_summary` only.
 * `raw_content` is not part of the catalog predicate.
 * The caller passes a lowercased, wildcard-escaped pattern wrapped in `%`.
 */
export const JOB_CATALOG_TEXT_SEARCH_SQL =
  "(LOWER(j.title) LIKE ? ESCAPE '\\' OR LOWER(COALESCE(c.name, '')) LIKE ? ESCAPE '\\' OR LOWER(j.skills) LIKE ? ESCAPE '\\' OR LOWER(COALESCE(j.location, '')) LIKE ? ESCAPE '\\' OR LOWER(COALESCE(j.department, '')) LIKE ? ESCAPE '\\' OR LOWER(COALESCE(j.description_summary, '')) LIKE ? ESCAPE '\\')";

export const JOB_CATALOG_TEXT_SEARCH_COLUMN_COUNT = 6;

/** Trimmed `search` / `q` longer than this is rejected with HTTP 400. It is not truncated. */
export const JOB_CATALOG_SEARCH_MAX_CHARS = 100;

export function jobCatalogTextSearchBindings(pattern: string): string[] {
  return Array.from({ length: JOB_CATALOG_TEXT_SEARCH_COLUMN_COUNT }, () => pattern);
}

/**
 * Escape `\`, `%`, and `_`, then wrap the term so it is a contains-match.
 * Callers must use `ESCAPE '\'` on every `LIKE`.
 */
export function jobCatalogLikePattern(term: string): string {
  const escaped = term
    .trim()
    .toLowerCase()
    .replace(/\\/g, "\\\\")
    .replace(/%/g, "\\%")
    .replace(/_/g, "\\_");
  return `%${escaped}%`;
}

/** Undo a pattern produced by {@link jobCatalogLikePattern}. Returns null when it is not a contains-pattern. */
export function literalFromWrappedLikePattern(pattern: string): string | null {
  if (!pattern.startsWith("%") || !pattern.endsWith("%") || pattern.length < 2) return null;
  const middle = pattern.slice(1, -1);
  let literal = "";
  for (let i = 0; i < middle.length; i++) {
    const char = middle[i]!;
    if (char === "\\") {
      const next = middle[i + 1];
      if (next === undefined) return null;
      literal += next;
      i++;
      continue;
    }
    if (char === "%" || char === "_") return null;
    literal += char;
  }
  return literal;
}

export function jobCatalogSearchTooLong(search: string | undefined): boolean {
  return (search?.trim().length ?? 0) > JOB_CATALOG_SEARCH_MAX_CHARS;
}

export function jobCatalogSearchLengthError(search: string | undefined): string | null {
  if (!jobCatalogSearchTooLong(search)) return null;
  return `search must be at most ${JOB_CATALOG_SEARCH_MAX_CHARS} characters`;
}
