/**
 * Filters shared by `GET /api/jobs` and `GET /api/jobs/export`.
 * `techOnly` defaults to true, matching the public catalog.
 */
export interface JobCatalogFilters {
  grade?: string;
  techCategory?: string;
  region?: string;
  state?: string;
  search?: string;
  techOnly: boolean;
}

export function readJobCatalogFilters(params: URLSearchParams): JobCatalogFilters {
  const grade = params.get("grade") ?? params.get("seniority") ?? undefined;
  const techCategory = params.get("tech_category") ?? undefined;
  const region = params.get("region") ?? undefined;
  const state = params.get("state") ?? undefined;
  const search = params.get("search") ?? params.get("q") ?? undefined;
  const techOnly = params.get("tech_only") === "false" ? false : true;
  return {
    ...(grade !== undefined ? { grade } : {}),
    ...(techCategory !== undefined ? { techCategory } : {}),
    ...(region !== undefined ? { region } : {}),
    ...(state !== undefined ? { state } : {}),
    ...(search !== undefined ? { search } : {}),
    techOnly,
  };
}
