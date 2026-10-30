import { CsvJobCatalogExporter } from "./csv-job-catalog-exporter.js";
import { JsonJobCatalogExporter } from "./json-job-catalog-exporter.js";
import { JobCatalogExporter, JobCatalogReader } from "./job-catalog-reader.js";

export type JobExportFormat = "csv" | "json";

export function parseJobExportFormat(value: string | null): JobExportFormat | null {
  if (value == null) return null;
  const normalized = value.trim().toLowerCase();
  if (normalized === "csv" || normalized === "json") return normalized;
  return null;
}

/** Picks the CSV stream or the capped JSON page for `format`. */
export class JobCatalogExportFactory {
  constructor(private readonly jobs: JobCatalogReader) {}

  public create(format: JobExportFormat): JobCatalogExporter {
    if (format === "csv") return new CsvJobCatalogExporter(this.jobs);
    return new JsonJobCatalogExporter(this.jobs);
  }
}
