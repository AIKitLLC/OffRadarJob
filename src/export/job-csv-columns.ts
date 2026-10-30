import { redactExportedDescription } from "./redact-export-text.js";
import { Job } from "../types/domain.js";

export const JOB_CSV_COLUMNS = [
  "id",
  "title",
  "companyName",
  "department",
  "seniorityLevel",
  "techCategory",
  "isTechRole",
  "employmentType",
  "location",
  "isRemote",
  "remoteScope",
  "salaryMin",
  "salaryMax",
  "salaryCurrency",
  "skills",
  "descriptionSummary",
  "applyType",
  "applyTarget",
  "status",
  "linkStatus",
  "usRegion",
  "firstSeenAt",
  "lastSeenAt",
] as const;

export type JobCsvColumn = (typeof JOB_CSV_COLUMNS)[number];

function text(value: string | null | undefined): string {
  return value ?? "";
}

function numberText(value: number | null | undefined): string {
  return value == null ? "" : String(value);
}

export const JOB_CSV_CELL: Record<JobCsvColumn, (job: Job) => string> = {
  id: (job) => job.id,
  title: (job) => job.title,
  companyName: (job) => text(job.companyName),
  department: (job) => text(job.department),
  seniorityLevel: (job) => job.seniorityLevel,
  techCategory: (job) => job.techCategory,
  isTechRole: (job) => (job.isTechRole ? "true" : "false"),
  employmentType: (job) => job.employmentType,
  location: (job) => text(job.location),
  isRemote: (job) => (job.isRemote ? "true" : "false"),
  remoteScope: (job) => job.remoteScope,
  salaryMin: (job) => numberText(job.salaryMin),
  salaryMax: (job) => numberText(job.salaryMax),
  salaryCurrency: (job) => text(job.salaryCurrency),
  skills: (job) => job.skills.join("; "),
  descriptionSummary: (job) => redactExportedDescription(text(job.descriptionSummary)),
  applyType: (job) => job.applyType,
  applyTarget: (job) => job.applyTarget,
  status: (job) => job.status,
  linkStatus: (job) => text(job.linkStatus),
  usRegion: (job) => text(job.usRegion),
  firstSeenAt: (job) => String(job.firstSeenAt),
  lastSeenAt: (job) => String(job.lastSeenAt),
};
