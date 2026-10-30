import { Job } from "../types/domain.js";

/** Catalog payload. `rawContent` stays in the database and is not sent on `/api/jobs`. */
export type PublicJob = Omit<Job, "rawContent">;

export function toPublicJob(job: Job): PublicJob {
  const published: Job = { ...job };
  delete published.rawContent;
  return published;
}

export function presentPublicJobCatalog<T extends Job[] | { items: Job[] }>(data: T): T {
  if (Array.isArray(data)) return data.map((job) => toPublicJob(job)) as T;
  return { ...data, items: data.items.map((job) => toPublicJob(job)) } as T;
}
