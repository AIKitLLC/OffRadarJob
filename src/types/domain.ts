import { z } from "zod";

/**
 * Result type for explicit error handling without exceptions
 */
export type Result<T, E = Error> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: E };

export function Ok<T>(value: T): Result<T, never> {
  return { ok: true, value };
}

export function Err<E>(error: E): Result<never, E> {
  return { ok: false, error };
}

// -----------------------------------------------------------------------------
// Company Domain Models & Schemas
// -----------------------------------------------------------------------------

export const SocialLinksSchema = z.object({
  twitter: z.string().url().optional(),
  github: z.string().url().optional(),
  linkedin: z.string().url().optional(),
  blog: z.string().url().optional(),
  discord: z.string().url().optional(),
  telegram: z.string().url().optional(),
});
export type SocialLinks = z.infer<typeof SocialLinksSchema>;

export const CompanySchema = z.object({
  id: z.string().min(1),
  domain: z.string().min(1),
  name: z.string().min(1),
  tagline: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  websiteUrl: z.string().url(),
  logoUrl: z.string().url().nullable().optional(),
  industry: z.string().nullable().optional(),
  techStack: z.array(z.string()),
  socialLinks: SocialLinksSchema,
  contactEmail: z.string().email().nullable().optional(),
  headcountEstimate: z.string().nullable().optional(), // e.g. "1-5", "6-15"
  locationHint: z.string().nullable().optional(),
  discoverySource: z.string().default("seed"),
  createdAt: z.number().int().positive(),
  updatedAt: z.number().int().positive(),
});
export type Company = z.infer<typeof CompanySchema>;

// -----------------------------------------------------------------------------
// Career Page Domain Models & Schemas
// -----------------------------------------------------------------------------

export const CareerPageTypeEnum = z.enum([
  "internal_page",
  "notion",
  "airtable",
  "typeform",
  "blog_post",
  "ats_embed", // Ashby, Lever, Greenhouse
  "custom"
]);
export type CareerPageType = z.infer<typeof CareerPageTypeEnum>;

export const CareerPageStatusEnum = z.enum(["active", "not_found", "unreachable"]);
export type CareerPageStatus = z.infer<typeof CareerPageStatusEnum>;

export const CareerPageSchema = z.object({
  id: z.string().min(1),
  companyId: z.string().min(1),
  url: z.string().url(),
  pageType: CareerPageTypeEnum,
  status: CareerPageStatusEnum,
  contentHash: z.string().nullable().optional(),
  lastCheckedAt: z.number().int().positive(),
  createdAt: z.number().int().positive(),
});
export type CareerPage = z.infer<typeof CareerPageSchema>;

// -----------------------------------------------------------------------------
// Job Domain Models & Schemas
// -----------------------------------------------------------------------------

export const EmploymentTypeEnum = z.enum([
  "full-time",
  "part-time",
  "contract",
  "internship",
  "other"
]);
export type EmploymentType = z.infer<typeof EmploymentTypeEnum>;

export const ApplyTypeEnum = z.enum([
  "email",
  "url",
  "form",
  "discord",
  "x_dm"
]);
export type ApplyType = z.infer<typeof ApplyTypeEnum>;

export const JobStatusEnum = z.enum(["open", "closed"]);
export type JobStatus = z.infer<typeof JobStatusEnum>;

export const SeniorityLevelEnum = z.enum([
  "intern",
  "new_grad",
  "junior",
  "mid",
  "senior",
  "lead",
  "founding"
]);
export type SeniorityLevel = z.infer<typeof SeniorityLevelEnum>;

export const TechCategoryEnum = z.enum([
  "ai_ml",
  "backend_systems",
  "frontend_ui",
  "fullstack",
  "devops_cloud",
  "product_design",
  "other_tech"
]);
export type TechCategory = z.infer<typeof TechCategoryEnum>;

export const JobSchema = z.object({
  id: z.string().min(1),
  companyId: z.string().min(1),
  careerPageId: z.string().min(1),
  title: z.string().min(1),
  department: z.string().nullable().optional(),
  seniorityLevel: SeniorityLevelEnum.default("mid"),
  techCategory: TechCategoryEnum.default("fullstack"),
  isTechRole: z.boolean().default(true),
  employmentType: EmploymentTypeEnum,
  location: z.string().nullable().optional(),
  isRemote: z.boolean(),
  remoteScope: z.string().default("worldwide"), // e.g. "worldwide", "vietnam_only", "us_only"
  salaryMin: z.number().positive().nullable().optional(),
  salaryMax: z.number().positive().nullable().optional(),
  salaryCurrency: z.string().length(3).nullable().optional(), // USD, VND, EUR
  skills: z.array(z.string()),
  descriptionSummary: z.string().nullable().optional(),
  rawContent: z.string().nullable().optional(),
  applyType: ApplyTypeEnum,
  applyTarget: z.string().min(1),
  status: JobStatusEnum,
  contentHash: z.string().min(1),
  companyName: z.string().nullable().optional(),
  companyWebsite: z.string().nullable().optional(),
  firstSeenAt: z.number().int().positive(),
  lastSeenAt: z.number().int().positive(),
});
export type Job = z.infer<typeof JobSchema>;

// -----------------------------------------------------------------------------
// Crawl Log Schema
// -----------------------------------------------------------------------------

export const CrawlLogStatusEnum = z.enum(["success", "warning", "error"]);
export type CrawlLogStatus = z.infer<typeof CrawlLogStatusEnum>;

export const CrawlLogSchema = z.object({
  id: z.string().min(1),
  agentName: z.string().min(1),
  targetUrl: z.string(),
  status: CrawlLogStatusEnum,
  durationMs: z.number().nonnegative(),
  message: z.string(),
  metadata: z.record(z.unknown()).optional(),
  createdAt: z.number().int().positive(),
});
export type CrawlLog = z.infer<typeof CrawlLogSchema>;

// -----------------------------------------------------------------------------
// Crawl Task / Process Schema (Admin Control Center)
// -----------------------------------------------------------------------------

export const CrawlTaskStatusEnum = z.enum(["pending", "running", "completed", "failed"]);
export type CrawlTaskStatus = z.infer<typeof CrawlTaskStatusEnum>;

export const CrawlTaskSchema = z.object({
  id: z.string().min(1),
  targetUrl: z.string().min(1),
  sourceType: z.string().default("manual"), // 'manual', 'batch', 'scheduled', 'midwest_preset'
  status: CrawlTaskStatusEnum,
  companyId: z.string().nullable().optional(),
  jobsFound: z.number().int().nonnegative().default(0),
  errorMessage: z.string().nullable().optional(),
  metadata: z.record(z.unknown()).default({}),
  createdAt: z.number().int().positive(),
  completedAt: z.number().int().positive().nullable().optional(),
});
export type CrawlTask = z.infer<typeof CrawlTaskSchema>;
