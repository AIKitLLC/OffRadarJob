import { JobCatalogExporter, JobCatalogReader, JobExportCommand } from "./job-catalog-reader.js";
import {
  JOB_EXPORT_CSV_MAX_ROWS,
  JOB_EXPORT_CSV_PAGE_SIZE,
  JOB_EXPORT_PRIVATE_HEADERS,
} from "./job-export-limits.js";
import { openJobCsvStream } from "./stream-job-csv.js";

/** Streams every catalog row that matches the public filters, up to the row budget. */
export class CsvJobCatalogExporter implements JobCatalogExporter {
  constructor(private readonly jobs: JobCatalogReader) {}

  public async export(command: JobExportCommand): Promise<Response> {
    const pageSize = JOB_EXPORT_CSV_PAGE_SIZE;
    const readPage = (page: number) =>
      this.jobs.listPaged({
        ...command.filters,
        page,
        limit: pageSize,
        maxLimit: pageSize,
      });

    const first = await readPage(1);
    const truncated = first.pagination.total > JOB_EXPORT_CSV_MAX_ROWS;
    const body = openJobCsvStream({
      firstPage: first.items,
      pageSize,
      maxRows: JOB_EXPORT_CSV_MAX_ROWS,
      fetchPage: async (page) => (await readPage(page)).items,
    });

    const headers = new Headers(JOB_EXPORT_PRIVATE_HEADERS);
    headers.set("Content-Type", "text/csv; charset=utf-8");
    headers.set("Content-Disposition", 'attachment; filename="offradar-jobs.csv"');
    if (truncated) headers.set("X-Export-Truncated", "true");
    return new Response(body, { status: 200, headers });
  }
}
