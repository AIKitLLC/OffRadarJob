/** JSON export page size. Clients cannot raise it. */
export const JOB_EXPORT_JSON_MAX_ROWS = 100;

/** Rows fetched per CSV page. Each page is one catalog query. */
export const JOB_EXPORT_CSV_PAGE_SIZE = 100;

/**
 * Hard stop for a single CSV download. The response sets
 * `X-Export-Truncated: true` when the filter matches more than this.
 */
export const JOB_EXPORT_CSV_MAX_ROWS = 5000;

export const JOB_EXPORT_PRIVATE_HEADERS: Record<string, string> = {
  "Cache-Control": "private, no-store",
  Vary: "Cookie",
  "X-Content-Type-Options": "nosniff",
};
