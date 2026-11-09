import { Job } from "../types/domain.js";
import { PublicJob, toPublicJob } from "../jobs/public-job-view.js";
import { redactExportedDescription } from "./redact-export-text.js";

/** Admin download shape: no `rawContent`, and contact details removed from the summary. */
export function toExportedJob(job: Job): PublicJob {
  const published = toPublicJob(job);
  if (typeof published.descriptionSummary !== "string") return published;
  return {
    ...published,
    descriptionSummary: redactExportedDescription(published.descriptionSummary),
  };
}
