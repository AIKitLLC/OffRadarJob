import { Job } from "../types/domain.js";

const RAW_CONTENT_LIMIT = 8_000;

export function jobSearchText(job: Job): string {
  const raw = (job.rawContent ?? "").slice(0, RAW_CONTENT_LIMIT);
  return [job.title, job.location ?? "", job.descriptionSummary ?? "", raw, job.skills.join(" ")].join("\n");
}

export function normalizeFingerprintPart(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

export function jobFingerprint(job: Job): string {
  return `${job.companyId}|${normalizeFingerprintPart(job.title)}|${normalizeFingerprintPart(job.applyTarget)}`;
}
