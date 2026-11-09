import { Job } from "../types/domain.js";
import { JobCatalogFilters } from "../jobs/job-catalog-filters.js";

export interface JobCatalogPage {
  items: Job[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface JobCatalogReadOptions extends JobCatalogFilters {
  page?: number | undefined;
  limit?: number | undefined;
  maxLimit?: number | undefined;
}

export interface JobCatalogReader {
  listPaged(options: JobCatalogReadOptions): Promise<JobCatalogPage>;
}

export interface JobExportCommand {
  filters: JobCatalogFilters;
  page: number;
  limit: number;
}

export interface JobCatalogExporter {
  export(command: JobExportCommand): Promise<Response>;
}
