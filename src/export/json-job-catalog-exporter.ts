import { toExportedJob } from "./exported-job.js";
import { JobCatalogExporter, JobCatalogReader, JobExportCommand } from "./job-catalog-reader.js";
import { JOB_EXPORT_JSON_MAX_ROWS, JOB_EXPORT_PRIVATE_HEADERS } from "./job-export-limits.js";

/** One page of the catalog. `limit` cannot exceed {@link JOB_EXPORT_JSON_MAX_ROWS}. */
export class JsonJobCatalogExporter implements JobCatalogExporter {
  constructor(private readonly jobs: JobCatalogReader) {}

  public async export(command: JobExportCommand): Promise<Response> {
    const limit = Math.min(JOB_EXPORT_JSON_MAX_ROWS, Math.max(1, Math.floor(command.limit)));
    const page = Math.max(1, Math.floor(command.page));
    const result = await this.jobs.listPaged({
      ...command.filters,
      page,
      limit,
      maxLimit: JOB_EXPORT_JSON_MAX_ROWS,
    });
    const items = result.items.slice(0, limit).map((job) => toExportedJob(job));
    return Response.json(
      {
        format: "json",
        items,
        pagination: {
          ...result.pagination,
          page,
          limit,
        },
      },
      { headers: JOB_EXPORT_PRIVATE_HEADERS }
    );
  }
}
