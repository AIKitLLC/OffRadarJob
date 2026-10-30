import { jobCatalogSearchLengthError } from "../db/job-catalog-search.js";
import { JobCatalogExportFactory, parseJobExportFormat } from "../export/job-catalog-export-factory.js";
import { JobCatalogReader } from "../export/job-catalog-reader.js";
import { JOB_EXPORT_JSON_MAX_ROWS, JOB_EXPORT_PRIVATE_HEADERS } from "../export/job-export-limits.js";
import { readJobCatalogFilters } from "../jobs/job-catalog-filters.js";

function readPositiveInt(raw: string | null, fallback: number, max: number): number {
  if (raw == null || raw.trim() === "") return Math.min(max, fallback);
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) return Math.min(max, fallback);
  return Math.min(max, Math.max(1, Math.floor(parsed)));
}

function jsonError(error: string, status: number, extra?: Record<string, string>): Response {
  return Response.json({ error }, { status, headers: { ...JOB_EXPORT_PRIVATE_HEADERS, ...extra } });
}

/**
 * `GET /api/jobs/export?format=csv|json`.
 * Auth is the caller's `authorizeAdmin` (the same check admin endpoints use).
 * Returns null when the path is not the export route.
 */
export async function handleJobExportRoute(input: {
  request: Request;
  url: URL;
  jobs: JobCatalogReader;
  authorizeAdmin: () => Promise<boolean>;
}): Promise<Response | null> {
  if (input.url.pathname !== "/api/jobs/export") return null;
  if (input.request.method !== "GET") {
    return jsonError("Method Not Allowed", 405, { Allow: "GET" });
  }
  if (!(await input.authorizeAdmin())) return jsonError("Unauthorized", 401);

  const format = parseJobExportFormat(input.url.searchParams.get("format"));
  if (!format) return jsonError("format must be csv or json", 400);

  const filters = readJobCatalogFilters(input.url.searchParams);
  const searchError = jobCatalogSearchLengthError(filters.search);
  if (searchError) return jsonError(searchError, 400);
  const command = {
    filters,
    page: readPositiveInt(input.url.searchParams.get("page"), 1, 1_000_000),
    limit: readPositiveInt(
      input.url.searchParams.get("limit"),
      JOB_EXPORT_JSON_MAX_ROWS,
      JOB_EXPORT_JSON_MAX_ROWS
    ),
  };
  return new JobCatalogExportFactory(input.jobs).create(format).export(command);
}
