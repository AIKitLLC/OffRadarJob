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

export const UsRegionEnum = z.enum([
  "midwest",
  "west",
  "northeast",
  "south",
  "mountain",
  "remote",
  "other",
]);
export type UsRegion = z.infer<typeof UsRegionEnum>;

export const FundingStageEnum = z.enum([
  "bootstrapped",
  "seed",
  "series_a",
  "series_b",
  "series_c_plus",
  "public",
  "other",
]);
export type FundingStage = z.infer<typeof FundingStageEnum>;

export interface DepartmentWeight {
  count: number;
  percentage: number;
}

export interface HiringDepartmentMetrics {
  totalOpenJobs: number;
  primaryDepartment?: string;
  breakdown: Record<string, DepartmentWeight>;
}

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
  isMidwest: z.boolean().optional(),
  usRegion: UsRegionEnum.optional(),
  fundingStage: z.string().nullable().optional(),
  totalFunding: z.string().nullable().optional(),
  valuationEstimate: z.string().nullable().optional(),
  companyTier: z.string().nullable().optional(),
  primaryDepartment: z.string().nullable().optional(),
  hiringDepartments: z.record(z.object({ count: z.number(), percentage: z.number() })).optional(),
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
  isMidwest: z.boolean().optional(),
  usRegion: UsRegionEnum.optional(),
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

// -----------------------------------------------------------------------------
// User Domain Models & Schemas (Telegram Auth & MCP Key)
// -----------------------------------------------------------------------------

export const UserRoleEnum = z.enum(["user", "admin"]);
export type UserRole = z.infer<typeof UserRoleEnum>;

export const UserSchema = z.object({
  id: z.string().min(1),
  telegramId: z.string().min(1),
  username: z.string().nullable().optional(),
  firstName: z.string().min(1),
  photoUrl: z.string().nullable().optional(),
  apiToken: z.string().min(1),
  role: UserRoleEnum.default("user").optional(),
  createdAt: z.number().int().positive(),
  updatedAt: z.number().int().positive(),
});
export type User = z.infer<typeof UserSchema>;

// -----------------------------------------------------------------------------
// CV Version Domain Models & Schemas (Linked to Job JDs)
// -----------------------------------------------------------------------------

export const CvVersionSchema = z.object({
  id: z.string().min(1),
  userId: z.string().min(1),
  jobId: z.string().nullable().optional(),
  title: z.string().min(1),
  targetRole: z.string().nullable().optional(),
  targetGroup: z.string().nullable().optional(),
  content: z.string().min(1),
  skills: z.array(z.string()).default([]),
  matchScore: z.number().int().min(0).max(100).nullable().optional(),
  tailoredNotes: z.string().nullable().optional(),
  decisionSuggestions: z.unknown().nullable().optional(),
  createdAt: z.number().int().positive(),
  updatedAt: z.number().int().positive(),
  jobTitle: z.string().nullable().optional(),
  companyName: z.string().nullable().optional(),
});
export type CvVersion = z.infer<typeof CvVersionSchema>;

// -----------------------------------------------------------------------------
// Auth Session Domain Models & Schemas (Telegram Deep-Link Login)
// -----------------------------------------------------------------------------

export const AuthSessionSchema = z.object({
  token: z.string().min(1),
  status: z.enum(["pending", "authenticated", "expired"]),
  telegramId: z.string().nullable().optional(),
  apiToken: z.string().nullable().optional(),
  userJson: z.string().nullable().optional(),
  createdAt: z.number().int().positive(),
  authenticatedAt: z.number().int().positive().nullable().optional(),
});
export type AuthSession = z.infer<typeof AuthSessionSchema>;

// -----------------------------------------------------------------------------
// System Settings Domain Models & Schemas (Dynamic Telegram & App Config)
// -----------------------------------------------------------------------------

export const SystemSettingSchema = z.object({
  key: z.string().min(1),
  value: z.string(),
  updatedAt: z.number().int().positive(),
});
export type SystemSetting = z.infer<typeof SystemSettingSchema>;

// -----------------------------------------------------------------------------
// LLM Feedback Domain Models & Schemas (MCP & Proactive Feedback Protocol)
// -----------------------------------------------------------------------------

export const FeedbackTypeEnum = z.enum([
  "job_relevance",
  "broken_link",
  "missing_data",
  "cv_tailoring",
  "user_preference",
  "general_suggestion",
]);
export type FeedbackType = z.infer<typeof FeedbackTypeEnum>;

export const FeedbackSentimentEnum = z.enum(["positive", "neutral", "negative", "critical"]);
export type FeedbackSentiment = z.infer<typeof FeedbackSentimentEnum>;

export const FeedbackStatusEnum = z.enum(["new", "reviewed", "actioned", "dismissed"]);
export type FeedbackStatus = z.infer<typeof FeedbackStatusEnum>;

export const LlmFeedbackSchema = z.object({
  id: z.string().min(1),
  userId: z.string().min(1),
  feedbackType: FeedbackTypeEnum,
  sentiment: FeedbackSentimentEnum.default("neutral"),
  rating: z.number().int().min(1).max(5).nullable().optional(),
  comment: z.string().min(1),
  jobId: z.string().nullable().optional(),
  companyId: z.string().nullable().optional(),
  contextSummary: z.string().nullable().optional(),
  suggestedAction: z.string().nullable().optional(),
  metadata: z.record(z.unknown()).default({}),
  status: FeedbackStatusEnum.default("new"),
  createdAt: z.number().int().positive(),
  updatedAt: z.number().int().positive(),
  // Enriched fields for presentation
  username: z.string().nullable().optional(),
  userFirstName: z.string().nullable().optional(),
  jobTitle: z.string().nullable().optional(),
  companyName: z.string().nullable().optional(),
});
export type LlmFeedback = z.infer<typeof LlmFeedbackSchema>;

// -----------------------------------------------------------------------------
// User Notification Subscriptions & Daily Digests
// -----------------------------------------------------------------------------

export const SubscriptionFrequencyEnum = z.enum(["daily", "weekly", "instant"]);
export type SubscriptionFrequency = z.infer<typeof SubscriptionFrequencyEnum>;

export const UserSubscriptionSchema = z.object({
  id: z.string().min(1),
  userId: z.string().min(1),
  telegramId: z.string().min(1),
  isActive: z.boolean().default(true),
  frequency: SubscriptionFrequencyEnum.default("daily"),
  targetRoles: z.array(z.string()).default([]),
  techCategories: z.array(z.string()).default([]),
  regions: z.array(z.string()).default(["midwest", "remote"]),
  minSalary: z.number().nullable().optional(),
  lastNotifiedAt: z.number().nullable().optional(),
  createdAt: z.number().int().positive(),
  updatedAt: z.number().int().positive(),
});
export type UserSubscription = z.infer<typeof UserSubscriptionSchema>;

// -----------------------------------------------------------------------------
// Target Groups, Real-time JD Reranking & Decision CV Optimization
// -----------------------------------------------------------------------------

export const TargetGroupEnum = z.enum([
  "early_stage_startups",   // High agility, autonomy, full-stack prototyping, equity
  "scaleups_growth",        // Microservices, high throughput, distributed systems, CI/CD
  "ai_first_innovators",    // LLMs, MCP, vector retrieval, Python/TypeScript inference, RAG
  "midwest_regional",       // US-Midwest tech hubs (Chicago, Minneapolis, Columbus, Indianapolis)
  "new_grad_junior",        // Entry-level, strong computer science fundamentals, mentorship
  "remote_first_boutique",  // Async communication, self-starter, small distributed teams
]);
export type TargetGroup = z.infer<typeof TargetGroupEnum>;

export interface TargetGroupProfile {
  id: TargetGroup;
  name: string;
  description: string;
  keyAttributes: string[];
  recommendedKeywords: string[];
  avoidKeywords: string[];
}

export const TARGET_GROUPS: Record<TargetGroup, TargetGroupProfile> = {
  early_stage_startups: {
    id: "early_stage_startups",
    name: "Early-Stage Startups & Stealth",
    description: "Fast-moving early-stage venture & bootstrapped companies looking for agile generalists who ship quickly and take ownership.",
    keyAttributes: ["Product velocity", "Full-stack ownership", "Rapid prototyping", "Ambiguity tolerance"],
    recommendedKeywords: ["0-to-1", "TypeScript", "MVP", "Cloudflare Workers", "PostgreSQL", "Fullstack", "User feedback", "Fast iteration"],
    avoidKeywords: ["Enterprise committee", "Legacy Waterfall", "Slow release cycles", "Narrow specialization"],
  },
  scaleups_growth: {
    id: "scaleups_growth",
    name: "High-Growth Scale-Ups",
    description: "Series B/C scale-ups prioritizing resilient distributed architecture, reliability, throughput, and automated testing.",
    keyAttributes: ["System design", "High throughput", "Observability", "Microservices", "Scalability"],
    recommendedKeywords: ["Distributed systems", "Kafka", "PostgreSQL", "Kubernetes", "Redis", "Microservices", "Latency reduction", "CI/CD"],
    avoidKeywords: ["Manual deployments", "Hacky workarounds", "Solo unreviewed commits"],
  },
  ai_first_innovators: {
    id: "ai_first_innovators",
    name: "AI-First & LLM Innovators",
    description: "Cutting-edge AI application builders deploying generative AI, autonomous agent loops, RAG, and MCP servers.",
    keyAttributes: ["LLM integration", "Agent pipelines", "Vector search", "Prompt engineering", "Workers AI"],
    recommendedKeywords: ["Workers AI", "LLM", "Model Context Protocol (MCP)", "Embeddings", "Vector search", "Python", "RAG", "Agentic workflows"],
    avoidKeywords: ["Legacy SOAP", "Static scripts only", "Obsolete NLP libraries"],
  },
  midwest_regional: {
    id: "midwest_regional",
    name: "US-Midwest Regional Tech",
    description: "High-stability engineering hubs in Illinois, Minnesota, Ohio, Indiana, and Wisconsin with strong engineering culture.",
    keyAttributes: ["Long-term value", "Strong culture", "Pragmatic engineering", "Competitive compensation"],
    recommendedKeywords: ["Chicago tech", "TypeScript", "Java / Spring", "Go", "Cloud Native", "Reliable engineering", "Clean architecture"],
    avoidKeywords: ["Silicon Valley hype words", "Unstable pivots"],
  },
  new_grad_junior: {
    id: "new_grad_junior",
    name: "New Grad & Junior Tech",
    description: "Early-career tech talent highlighting CS foundations, projects, curiosity, and rapid learning capacity.",
    keyAttributes: ["Foundational CS", "Project portfolio", "Fast learning", "Team collaboration"],
    recommendedKeywords: ["Algorithms", "Data structures", "Git", "TypeScript", "REST APIs", "Automated tests", "Capstone project"],
    avoidKeywords: ["Overblown senior leadership claims", "Generic filler text without concrete code links"],
  },
  remote_first_boutique: {
    id: "remote_first_boutique",
    name: "Remote-First Boutique Studios",
    description: "Async-first, high-autonomy teams valuing written communication, craft, and minimalist architectures.",
    keyAttributes: ["Async communication", "Documentation", "Craftsmanship", "Self-starter"],
    recommendedKeywords: ["Async-first", "Documentation", "Edge computing", "Performance tuning", "High autonomy"],
    avoidKeywords: ["Requires constant micromanagement", "Meeting-heavy culture"],
  },
};

export interface JdRerankScores {
  jobId: string;
  demandScore: number;
  freshnessScore: number;
  transparencyScore: number;
  employerTrustScore: number;
  targetGroupFit: Record<TargetGroup, number>;
  compositeScore: number;
  trendDirection: "trending_up" | "stable" | "cooling";
  primaryTargetGroup: TargetGroup;
}

export interface TrendingSkill {
  skill: string;
  frequency: number;
  demandGrowth: string; // e.g. "+35%"
  primaryTargetGroup: TargetGroup;
}

export interface RealtimeJdRankingReport {
  generatedAt: number;
  totalJdsAnalyzed: number;
  topRankedJobs: Array<{
    job: Job;
    rerank: JdRerankScores;
  }>;
  trendingSkills: TrendingSkill[];
  targetGroupBreakdown: Record<TargetGroup, {
    count: number;
    averageScore: number;
    topSkills: string[];
  }>;
  marketSummary: string;
}

export interface CvSuggestionItem {
  category: "skill" | "project_impact" | "architecture_keyword" | "metric" | "outdated_tech" | "generic_filler" | "irrelevant_detail";
  item: string;
  rationale: string;
  priority: "high" | "medium" | "low";
}

export interface DecisionCvSuggestion {
  targetGroup: TargetGroup;
  targetGroupName: string;
  currentMatchScore: number;
  projectedMatchScore: number;
  targetGroupStrategy: string;
  additions: CvSuggestionItem[];
  removals: CvSuggestionItem[];
  optimizedCvContent: string;
  topDemandedSkillsInSegment: string[];
}

// -----------------------------------------------------------------------------
// Tag Cloud & Synchronized JD Matching Domain Models
// -----------------------------------------------------------------------------

export type SkillCategory =
  | "languages"
  | "frameworks"
  | "cloud_infra"
  | "ai_ml"
  | "database"
  | "architecture"
  | "tools"
  | "other";

export interface SkillTag {
  name: string;
  category: SkillCategory;
  weight: number; // 1-100 normalized score based on frequency & market relevance
  frequency: number; // occurrences in text
  status?: "matched" | "missing" | "cv_only" | "deprecated" | undefined;
  marketGrowth?: string | undefined; // e.g. "+35%"
}

export interface CvTagCloudAnalysis {
  cvId?: string | undefined;
  title?: string | undefined;
  totalTags: number;
  tags: SkillTag[];
  categoryBreakdown: Record<SkillCategory, number>;
  topSkills: string[];
  detectedTargetGroupFit: Record<TargetGroup, number>;
  primaryTargetGroup: TargetGroup;
  extractedRole?: string | undefined;
}

export interface SynchronizedTagCloudComparison {
  cvTags: SkillTag[];
  jdTags: SkillTag[];
  matchedTags: SkillTag[]; // In both CV and JD/Market
  missingTags: SkillTag[]; // In JD/Market but absent in CV (top recommendation to add)
  cvOnlyTags: SkillTag[]; // Unique to candidate's CV
  deprecatedTags: SkillTag[]; // Outdated/legacy skills flagged for removal
  matchPercentage: number; // 0-100%
  targetContext: {
    type: "job" | "target_group" | "market";
    id?: string | undefined;
    title?: string | undefined;
    companyName?: string | undefined;
    targetGroup?: TargetGroup | undefined;
  };
}



