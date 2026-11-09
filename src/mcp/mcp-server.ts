import { toPublicJob } from "../jobs/public-job-view.js";
import {
  JobRepository,
  CompanyRepository,
  CvRepository,
  LlmFeedbackRepository,
  UserSubscriptionRepository,
} from "../db/repositories.js";
import {
  User,
  CvVersion,
  LlmFeedback,
  FeedbackType,
  FeedbackSentiment,
  UserSubscription,
  TargetGroup,
  TARGET_GROUPS,
  RealtimeJdRankingReport,
  DecisionCvSuggestion,
} from "../types/domain.js";
import { JdRerankerService } from "../services/jd-reranker.js";
import { DecisionApiService } from "../services/decision-api.js";
import { CandidateMatchService } from "../pipeline/candidate-match-service.js";

/**
 * Model Context Protocol (MCP) Server for Off-Radar Jobs
 * Implements JSON-RPC 2.0 protocol for Cursor IDE, Claude Desktop, Antigravity, and other AI agents.
 */
export class McpServerHandler {
  private readonly decisionApi: DecisionApiService;
  private readonly rerankerService: JdRerankerService;

  constructor(
    private readonly jobRepo: JobRepository,
    private readonly companyRepo: CompanyRepository,
    private readonly cvRepo?: CvRepository,
    private readonly feedbackRepo?: LlmFeedbackRepository,
    private readonly onFeedbackCreated?: (feedback: LlmFeedback, user: User) => Promise<void>,
    private readonly subscriptionRepo?: UserSubscriptionRepository,
    decisionApi?: DecisionApiService,
    rerankerService?: JdRerankerService,
    private readonly candidateMatch?: CandidateMatchService
  ) {
    this.decisionApi = decisionApi || new DecisionApiService();
    this.rerankerService = rerankerService || new JdRerankerService();
  }

  public async handleJsonRpc(requestBody: any, user: User): Promise<any> {
    const { jsonrpc, id, method, params } = requestBody;

    if (jsonrpc !== "2.0") {
      return {
        jsonrpc: "2.0",
        id: id ?? null,
        error: { code: -32600, message: "Invalid Request: jsonrpc must be '2.0'" },
      };
    }

    try {
      switch (method) {
        case "initialize":
          return {
            jsonrpc: "2.0",
            id,
            result: {
              protocolVersion: "2024-11-05",
              capabilities: {
                tools: {},
                prompts: {},
              },
              serverInfo: {
                name: "off-radar-jobs-mcp",
                version: "1.1.0",
              },
            },
          };

        case "ping":
          return { jsonrpc: "2.0", id, result: {} };

        case "tools/list":
          return {
            jsonrpc: "2.0",
            id,
            result: {
              tools: this.getToolDefinitions(),
            },
          };

        case "prompts/list":
          return {
            jsonrpc: "2.0",
            id,
            result: {
              prompts: this.getPromptDefinitions(),
            },
          };

        case "prompts/get": {
          const promptName = params?.name;
          const promptArgs = params?.arguments ?? {};
          try {
            const promptContent = this.getPromptContent(promptName, promptArgs, user);
            return {
              jsonrpc: "2.0",
              id,
              result: promptContent,
            };
          } catch (err: any) {
            return {
              jsonrpc: "2.0",
              id,
              error: { code: -32602, message: err?.message || `Prompt not found: ${promptName}` },
            };
          }
        }

        case "tools/call": {
          const toolName = params?.name;
          const args = params?.arguments ?? {};
          const result = await this.callTool(toolName, args, user);
          return {
            jsonrpc: "2.0",
            id,
            result: {
              content: [
                {
                  type: "text",
                  text: typeof result === "string" ? result : JSON.stringify(result, null, 2),
                },
              ],
            },
          };
        }

        default:
          return {
            jsonrpc: "2.0",
            id,
            error: { code: -32601, message: `Method not found: ${method}` },
          };
      }
    } catch (err: any) {
      return {
        jsonrpc: "2.0",
        id,
        error: { code: -32603, message: `Internal error: ${err?.message || String(err)}` },
      };
    }
  }

  public getToolDefinitions() {
    return [
      {
        name: "search_jobs",
        description: "Search and filter unlisted & micro-company tech jobs from verified company career portals. Prioritizes US-Midwest tech hubs (Chicago, Indianapolis, Minneapolis, Madison, etc.) first. Free for authenticated MCP clients.",
        inputSchema: {
          type: "object",
          properties: {
            query: { type: "string", description: "Keyword search for title, company name, skills, or location" },
            grade: {
              type: "string",
              enum: ["all", "founding", "lead", "senior", "mid", "junior", "new_grad", "intern"],
              description: "Seniority / grade filter (e.g. founding, new_grad, senior)",
            },
            is_new_grad: {
              type: "boolean",
              description: "Convenience filter: Set to true to search specifically for New Grad & Early-Career roles (Class of 2025/2026)",
            },
            tech_category: {
              type: "string",
              enum: ["all", "fullstack", "backend_systems", "frontend_ui", "ai_ml", "devops_cloud", "product_design"],
              description: "Tech discipline specialization",
            },
            region: {
              type: "string",
              enum: ["all", "midwest", "west", "northeast", "south", "mountain", "remote"],
              description: "Location filter across US regions ('midwest', 'west', 'northeast', 'south', 'mountain', 'remote', 'all')",
            },
            state: {
              type: "string",
              description: "Filter jobs by specific 2-letter US State code (e.g. 'IL', 'IN', 'OH', 'WI', 'MN', 'TX', 'CA', 'NY', 'CO')",
            },
            limit: { type: "number", description: "Number of jobs to return (default 10, max 50)" },
          },
        },
      },
      {
        name: "get_job_details",
        description: "Retrieve full job specifications, description, exact salary range, and direct application target by Job ID.",
        inputSchema: {
          type: "object",
          properties: {
            job_id: { type: "string", description: "The unique job identifier (e.g. job_promptloop_scraping)" },
          },
          required: ["job_id"],
        },
      },
      {
        name: "list_companies",
        description: "Browse boutique, high-conviction micro-companies and tech startups in the Off-Radar directory across US regions, with valuation, funding stage, and department hiring weights.",
        inputSchema: {
          type: "object",
          properties: {
            search: { type: "string", description: "Search by company name, domain, tech stack, or industry" },
            region: {
              type: "string",
              enum: ["all", "midwest", "west", "northeast", "south", "mountain"],
              description: "Filter companies by US region ('midwest', 'west', 'northeast', 'south', 'mountain', 'all')",
            },
            state: {
              type: "string",
              description: "Filter companies by specific 2-letter US State code (e.g. 'IL', 'IN', 'OH', 'WI', 'MN', 'TX', 'CA', 'NY', 'CO')",
            },
            funding_stage: {
              type: "string",
              description: "Filter by funding stage / valuation status (e.g., 'bootstrapped', 'seed', 'series_a', 'series_b', 'growth', 'acquired')",
            },
            primary_department: {
              type: "string",
              description: "Filter by dominant hiring department (e.g., 'Engineering', 'Product & Design', 'Growth & Marketing', 'Sales')",
            },
            limit: { type: "number", description: "Number of companies to return (default 15)" },
          },
        },
      },
      {
        name: "list_user_cvs",
        description: "List all CV versions saved for the authenticated Telegram user, including links to specific target Job JDs and match scores.",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "tailor_cv_for_job",
        description: "Analyze a target Job JD and tailor a custom CV version that directly highlights matching skills, relevant projects, and keywords.",
        inputSchema: {
          type: "object",
          properties: {
            job_id: { type: "string", description: "Target job ID to tailor against" },
            base_cv_id: { type: "string", description: "Optional ID of an existing saved CV version to use as base" },
            custom_cv_content: { type: "string", description: "Optional raw Markdown/text CV if not using base_cv_id" },
          },
          required: ["job_id"],
        },
      },
      {
        name: "save_cv_version",
        description: "Save a new or updated CV version linked to a specific job JD in the user's personal storage.",
        inputSchema: {
          type: "object",
          properties: {
            id: { type: "string", description: "Optional ID if updating an existing CV version" },
            job_id: { type: "string", description: "Optional Job ID to link this CV version to" },
            title: { type: "string", description: "Title of this CV version (e.g. 'Founding AI Engineer - PromptLoop Tailored')" },
            target_role: { type: "string", description: "Target role title" },
            content: { type: "string", description: "Full Markdown CV text" },
            skills: { type: "array", items: { type: "string" }, description: "List of key skills" },
            match_score: { type: "number", description: "Match score percentage (0-100)" },
            tailored_notes: { type: "string", description: "Notes on how this CV was tailored for the role" },
          },
          required: ["title", "content"],
        },
      },
      {
        name: "submit_llm_feedback",
        description: "PROACTIVELY submit insights, data corrections, missing signals, or user preferences to the OffRadarJob team. The AI agent MUST proactively call this tool when: (1) An expired or broken JD link (404/closed) is noticed or reported by user, (2) User expresses a strong job demand/stack that lacks results (e.g. 'Looking for Elixir in Chicago'), (3) Inaccurate salary or requirements are noticed, (4) CV tailoring reveals major skill discrepancies, or (5) General feedback/sentiment from the conversation.",
        inputSchema: {
          type: "object",
          properties: {
            feedback_type: {
              type: "string",
              enum: [
                "job_relevance",
                "broken_link",
                "missing_data",
                "cv_tailoring",
                "user_preference",
                "general_suggestion",
              ],
              description: "Classification of feedback: 'broken_link' (404/closed), 'job_relevance' (poor match/mislabeled), 'missing_data' (missing salary/tech), 'cv_tailoring' (CV tailoring issues/scoring), 'user_preference' (unmet candidate demand), or 'general_suggestion'.",
            },
            comment: {
              type: "string",
              description: "Detailed description of the feedback, problem noticed, or user interaction context.",
            },
            sentiment: {
              type: "string",
              enum: ["positive", "neutral", "negative", "critical"],
              description: "Severity or sentiment level. Use 'critical' for broken application links or completely erroneous data.",
            },
            rating: {
              type: "number",
              description: "Optional rating score from 1 (poor) to 5 (excellent).",
            },
            job_id: {
              type: "string",
              description: "Target Job ID if feedback is related to a specific job listing.",
            },
            company_id: {
              type: "string",
              description: "Target Company ID or domain if feedback is related to a specific company.",
            },
            context_summary: {
              type: "string",
              description: "Brief summary of what the user asked or conversation context that triggered this feedback.",
            },
            suggested_action: {
              type: "string",
              description: "Concrete recommendation for OffRadarJob crawlers or admins (e.g., 'Re-crawl promptloop.com careers page', 'Add Elixir tech category to Midwest scrapers').",
            },
            metadata: {
              type: "object",
              description: "Optional metadata such as client agent ('Cursor', 'ClaudeDesktop'), model name, or prompt tokens.",
            },
          },
          required: ["feedback_type", "comment"],
        },
      },
      {
        name: "get_daily_digest",
        description: "Retrieve today's curated daily briefing of unlisted, high-conviction tech opportunities tailored to candidate preferences. Prioritizes US-Midwest boutique tech hubs and remote-first micro-companies. AI agents SHOULD call this tool proactively every day (or at the start of daily sessions) to brief the candidate on new hidden opportunities.",
        inputSchema: {
          type: "object",
          properties: {
            target_roles: {
              type: "array",
              items: { type: "string" },
              description: "Optional target roles or keywords (e.g. ['Backend Engineer', 'Rust', 'Founding Engineer']). If omitted, uses user subscription preferences.",
            },
            region: {
              type: "string",
              description: "Target US region filter ('midwest', 'west', 'northeast', 'south', 'mountain', 'remote', or 'all'). Default 'midwest'.",
            },
            tech_category: {
              type: "string",
              description: "Filter by technology category (e.g. 'backend_systems', 'ai_ml', 'frontend_ui', 'devops_cloud', 'fullstack').",
            },
            limit: {
              type: "number",
              description: "Number of top opportunities to return (default 5, max 15).",
            },
          },
        },
      },
      {
        name: "manage_job_subscription",
        description: "Inspect or configure the candidate's automatic daily job alert subscription. Enables receiving daily digests via Telegram bot, customizing target stacks, and setting regional preferences (Midwest & Remote focus).",
        inputSchema: {
          type: "object",
          properties: {
            action: {
              type: "string",
              enum: ["get", "update", "toggle"],
              description: "Action to perform: 'get' (view current preferences), 'update' (save new preferences), 'toggle' (enable/disable active alerts).",
            },
            is_active: {
              type: "boolean",
              description: "Enable (true) or pause (false) daily Telegram alerts.",
            },
            frequency: {
              type: "string",
              enum: ["daily", "weekly", "instant"],
              description: "Notification cadence (default 'daily').",
            },
            target_roles: {
              type: "array",
              items: { type: "string" },
              description: "List of desired roles or stack keywords.",
            },
            regions: {
              type: "array",
              items: { type: "string" },
              description: "List of preferred US regions (e.g. ['midwest', 'remote']).",
            },
          },
          required: ["action"],
        },
      },
      {
        name: "get_realtime_jd_ranking_report",
        description: "Retrieve the live real-time continuous reranking of all micro-company job descriptions, demand velocity, trending tech skills (+growth %), and target employer group distributions. Use to analyze current market hiring dynamics or select target jobs.",
        inputSchema: {
          type: "object",
          properties: {
            target_group: {
              type: "string",
              enum: ["all", "early_stage_startups", "scaleups_growth", "ai_first_innovators", "midwest_regional", "new_grad_junior", "remote_first_boutique"],
              description: "Filter report by employer target group (default: 'all')",
            },
            limit: {
              type: "number",
              description: "Maximum number of top-ranked JDs to return (default: 10, max: 50)",
            },
          },
        },
      },
      {
        name: "optimize_cv_with_decision_api",
        description: "Run Cloudflare Decision API / Workers AI on candidate CV to generate concrete additions and removals tailored to distinct employer target groups. Yields revised markdown CV, key rationale, and projected match score.",
        inputSchema: {
          type: "object",
          properties: {
            target_group: {
              type: "string",
              enum: ["early_stage_startups", "scaleups_growth", "ai_first_innovators", "midwest_regional", "new_grad_junior", "remote_first_boutique"],
              description: "The specific employer segment to optimize this CV version for.",
            },
            base_cv_id: {
              type: "string",
              description: "Optional ID of an existing saved CV version to use as base.",
            },
            custom_cv_content: {
              type: "string",
              description: "Optional raw Markdown/text CV if not using base_cv_id.",
            },
            save_as_version: {
              type: "boolean",
              description: "If true, automatically saves the optimized result as a new CV version in user storage (default: false).",
            },
            version_title: {
              type: "string",
              description: "Optional custom title for the saved CV version (e.g. 'Jane Doe - Early-Stage Startup CV').",
            },
          },
          required: ["target_group"],
        },
      },
      {
        name: "list_target_groups",
        description: "List all employer target groups (Early-Stage Startups, Scale-ups, AI Innovators, Midwest Tech, New Grad, Remote Studios) with key evaluation criteria, recommended keywords, and anti-patterns.",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "rank_jobs_for_profile",
        description: "Score and rank open jobs against a saved candidate profile or an inline CV profile. Explains skill, seniority, location, remote, and visa sponsorship reasons.",
        inputSchema: {
          type: "object",
          properties: {
            profile_id: { type: "string", description: "Saved candidate profile id" },
            profile: { type: "object", description: "Inline profile with text or structured skills, seniority, locations, remote, and sponsorship" },
            limit: { type: "number", description: "Maximum matches to return (default 10, max 25)" },
          },
        },
      },
      {
        name: "save_candidate_profile",
        description: "Save a candidate profile parsed from CV text or structured fields. Use synthetic or user-provided profile text only.",
        inputSchema: {
          type: "object",
          properties: {
            label: { type: "string" },
            text: { type: "string", description: "CV or profile text" },
            skills: { type: "array", items: { type: "string" } },
            seniority: { type: "string" },
            locations: { type: "array", items: { type: "string" } },
            remote: { type: "string", enum: ["required", "preferred", "any"] },
            sponsorship: { type: "string", enum: ["required", "not_needed", "any"] },
            keywords: { type: "array", items: { type: "string" } },
          },
        },
      },
      {
        name: "save_job_filter",
        description: "Save a continuous filter for a candidate profile. New jobs that pass it are surfaced once.",
        inputSchema: {
          type: "object",
          properties: {
            profileId: { type: "string" },
            keywords: { type: "array", items: { type: "string" } },
            seniorityLevels: { type: "array", items: { type: "string" } },
            locations: { type: "array", items: { type: "string" } },
            remote: { type: "string", enum: ["required", "preferred", "any"] },
            sponsorship: { type: "string", enum: ["required", "any"] },
            minScore: { type: "number" },
          },
          required: ["profileId"],
        },
      },
      {
        name: "list_new_match_alerts",
        description: "List match alerts already surfaced for the authenticated user. Does not create duplicates.",
        inputSchema: { type: "object", properties: {} },
      },
    ];
  }

  private async callTool(name: string, args: Record<string, any>, user: User): Promise<any> {
    switch (name) {
      case "search_jobs": {
        const query = args.query ?? undefined;
        const isNewGrad = args.is_new_grad === true || args.grade === "new_grad";
        const grade = isNewGrad ? "new_grad" : (args.grade ?? undefined);
        const techCategory = args.tech_category ?? undefined;
        const region = args.region ?? undefined;
        const state = args.state ?? undefined;
        const limit = Math.min(Math.max(1, args.limit ?? 10), 50);

        const res = await this.jobRepo.listPaged({
          page: 1,
          limit,
          search: query,
          grade,
          techCategory,
          region,
          state,
          techOnly: true,
        });

        return {
          total_matches: res.pagination.total,
          returned: res.items.length,
          jobs: res.items.map((j) => ({
            id: j.id,
            title: j.title,
            company: j.companyName || j.companyId,
            website: j.companyWebsite,
            seniority: j.seniorityLevel,
            techCategory: j.techCategory,
            location: j.isRemote ? `Remote (${j.remoteScope})` : j.location,
            us_region: j.usRegion || (j.isMidwest ? "midwest" : (j.isRemote ? "remote" : "other")),
            salary: j.salaryMin ? `$${j.salaryMin.toLocaleString()} - $${j.salaryMax?.toLocaleString()} ${j.salaryCurrency || "USD"}` : "Unspecified",
            skills: j.skills,
            summary: toPublicJob(j).descriptionSummary,
            is_midwest_priority: j.isMidwest ?? false,
            apply_type: j.applyType,
            apply_target: j.applyTarget,
          })),
        };
      }

      case "get_job_details": {
        const jobId = String(args.job_id);
        const job = await this.jobRepo.getById(jobId);
        if (!job) {
          return { error: `Job with ID '${jobId}' not found.` };
        }
        const published = toPublicJob(job);
        return {
          job: published,
          apply_instructions: `Direct application via ${published.applyType.toUpperCase()}: ${published.applyTarget}`,
        };
      }

      case "list_companies": {
        const search = args.search ?? undefined;
        const region = args.region ?? undefined;
        const state = args.state ?? undefined;
        const fundingStage = args.funding_stage ?? undefined;
        const primaryDepartment = args.primary_department ?? undefined;
        const limit = Math.min(Math.max(1, args.limit ?? 15), 50);
        const res = await this.companyRepo.listPaged({
          page: 1,
          limit,
          search,
          region,
          state,
          fundingStage,
          primaryDepartment,
        });
        return {
          total: res.pagination.total,
          companies: res.items.map((c) => ({
            id: c.id,
            name: c.name,
            website: c.websiteUrl,
            industry: c.industry,
            headcount: c.headcountEstimate,
            location: c.locationHint,
            us_region: c.usRegion || (c.isMidwest ? "midwest" : "other"),
            techStack: c.techStack,
            funding_stage: c.fundingStage,
            total_funding: c.totalFunding,
            valuation_estimate: c.valuationEstimate,
            company_tier: c.companyTier,
            primary_department: c.primaryDepartment,
            hiring_departments: c.hiringDepartments,
            description: c.description || c.tagline,
          })),
        };
      }

      case "list_user_cvs": {
        if (!this.cvRepo) {
          return { error: "CV repository is not available on this server instance." };
        }
        const cvs = await this.cvRepo.listByUser(user.id);
        return {
          user: { telegram: user.username || user.firstName, id: user.id },
          total_versions: cvs.length,
          versions: cvs.map((cv) => ({
            id: cv.id,
            title: cv.title,
            target_role: cv.targetRole,
            linked_job_id: cv.jobId,
            linked_job_title: cv.jobTitle,
            linked_company: cv.companyName,
            match_score: cv.matchScore ? `${cv.matchScore}%` : null,
            tailored_notes: cv.tailoredNotes,
            updated_at: new Date(cv.updatedAt).toISOString(),
            content_preview: cv.content.slice(0, 200) + "...",
          })),
        };
      }

      case "tailor_cv_for_job": {
        if (!this.cvRepo) {
          return { error: "CV repository is not available on this server instance." };
        }
        const jobId = String(args.job_id);
        const job = await this.jobRepo.getById(jobId);
        if (!job) {
          return { error: `Job with ID '${jobId}' not found.` };
        }

        let baseContent = args.custom_cv_content;
        if (!baseContent && args.base_cv_id) {
          const baseCv = await this.cvRepo.getById(args.base_cv_id, user.id);
          if (baseCv) baseContent = baseCv.content;
        }

        if (!baseContent) {
          const userCvs = await this.cvRepo.listByUser(user.id);
          if (userCvs.length > 0 && userCvs[0]) {
            baseContent = userCvs[0].content;
          } else {
            baseContent = `# ${user.firstName} - Software Engineer\n\n## Experience\n- Full Stack Software Engineer building distributed systems and cloud infrastructure.\n\n## Skills\nTypeScript, Node.js, Python, Cloudflare Workers, PostgreSQL, React`;
          }
        }

        // Tailoring & Keyword Matching Algorithm
        const jobSkills = job.skills || [];
        const contentLower = baseContent.toLowerCase();
        const matchedSkills: string[] = [];
        const missingSkills: string[] = [];

        for (const skill of jobSkills) {
          if (contentLower.includes(skill.toLowerCase())) {
            matchedSkills.push(skill);
          } else {
            missingSkills.push(skill);
          }
        }

        const matchScore = Math.min(
          98,
          Math.max(
            55,
            Math.round(
              (jobSkills.length > 0
                ? (matchedSkills.length / jobSkills.length) * 50
                : 35) + 40
            )
          )
        );

        const isNewGradJob = job.seniorityLevel === "new_grad";
        const tailoringSuggestions = isNewGradJob
          ? [
              `Target New Grad role: Emphasize '${job.title}' with graduation timeline (Class of 2025/2026).`,
              `Feature academic & capstone projects related to ${job.techCategory} at the top.`,
              `Highlight core coursework, data structures & algorithms foundation, and GitHub repositories.`,
              missingSkills.length > 0
                ? `Incorporate key JD keywords: ${missingSkills.slice(0, 5).join(", ")}.`
                : `Key tech stack matched: ${matchedSkills.slice(0, 4).join(", ")}.`,
              job.isMidwest
                ? `Highlight presence or willingness to relocate to US-Midwest tech hub.`
                : `Highlight relocation or remote readiness for ${job.location || "US"}.`,
            ]
          : [
              `Target role: Emphasize '${job.title}' in the header summary.`,
              `Highlight primary tech category: ${job.techCategory} architecture.`,
              missingSkills.length > 0
                ? `Incorporate key JD keywords: ${missingSkills.slice(0, 5).join(", ")}.`
                : `All top requirements (${matchedSkills.slice(0, 4).join(", ")}) already matched!`,
              job.isRemote
                ? "Highlight async communication & remote team impact."
                : `Highlight regional presence near ${job.location || "office location"}.`,
            ];

        const tailoredSummary = isNewGradJob
          ? `High-aptitude, motivated early-career ${job.title} specializing in ${[...matchedSkills.slice(0, 3), job.techCategory].join(", ")}. Strong computer science foundation, hands-on project experience, and eager to contribute to high-impact production systems at ${job.companyName || "high-growth tech teams"}.`
          : `Results-driven ${job.title} specializing in ${[...matchedSkills.slice(0, 3), job.techCategory].join(", ")}. Proven track record designing scalable systems, accelerating engineering velocity, and delivering mission-critical products for high-growth tech teams.`;

        const tailoredCvMarkdown = `# ${user.firstName} - ${job.title}\n\n## Executive Summary\n${tailoredSummary}\n\n## Matched Skills\n${[...matchedSkills, ...missingSkills].join(", ")}\n\n${baseContent}`;

        return {
          jobTitle: job.title,
          companyName: job.companyName || job.companyId,
          matchScore,
          matchedSkills,
          missingSkills,
          tailoringSuggestions,
          suggestedSummary: tailoredSummary,
          tailoredCvMarkdown,
          target_job: {
            id: job.id,
            title: job.title,
            company: job.companyName || job.companyId,
            skills: job.skills,
          },
          match_analysis: {
            match_score: `${matchScore}%`,
            match_score_number: matchScore,
            matched_skills: matchedSkills,
            missing_skills: missingSkills,
            tailoring_suggestions: tailoringSuggestions,
          },
          suggested_tailored_summary: tailoredSummary,
          ready_to_save: {
            title: `${job.title} - ${job.companyName || "Company"} Tailored`,
            job_id: job.id,
            target_role: job.title,
            match_score: matchScore,
          },
        };
      }

      case "save_cv_version": {
        if (!this.cvRepo) {
          return { error: "CV repository is not available on this server instance." };
        }
        const id = args.id || `cv_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        const now = Date.now();

        const cvRecord: CvVersion = {
          id,
          userId: user.id,
          jobId: args.job_id || undefined,
          title: String(args.title),
          targetRole: args.target_role || undefined,
          content: String(args.content),
          skills: Array.isArray(args.skills) ? args.skills : [],
          matchScore: args.match_score !== undefined ? Number(args.match_score) : undefined,
          tailoredNotes: args.tailored_notes || undefined,
          createdAt: now,
          updatedAt: now,
        };

        if (args.id) {
          await this.cvRepo.update(id, user.id, {
            title: cvRecord.title,
            targetRole: cvRecord.targetRole,
            content: cvRecord.content,
            skills: cvRecord.skills,
            matchScore: cvRecord.matchScore,
            tailoredNotes: cvRecord.tailoredNotes,
            jobId: cvRecord.jobId,
          });
        } else {
          await this.cvRepo.create(cvRecord);
        }

        const saved = await this.cvRepo.getById(id, user.id);
        return {
          success: true,
          message: `CV version '${saved?.title}' saved successfully.`,
          cv: saved,
        };
      }

      case "submit_llm_feedback": {
        const feedbackType = String(args.feedback_type || "general_suggestion") as FeedbackType;
        const comment = String(args.comment || "").trim();
        if (!comment) {
          return { error: "Missing required 'comment' field in feedback submission." };
        }

        const id = `fb_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        const now = Date.now();

        const feedbackRecord: LlmFeedback = {
          id,
          userId: user.id,
          feedbackType,
          sentiment: (args.sentiment || "neutral") as FeedbackSentiment,
          rating: args.rating != null ? Number(args.rating) : undefined,
          comment,
          jobId: args.job_id || undefined,
          companyId: args.company_id || undefined,
          contextSummary: args.context_summary || undefined,
          suggestedAction: args.suggested_action || undefined,
          metadata: typeof args.metadata === "object" && args.metadata !== null ? args.metadata : {},
          status: "new",
          createdAt: now,
          updatedAt: now,
        };

        if (this.feedbackRepo) {
          await this.feedbackRepo.create(feedbackRecord);
        }

        if (this.onFeedbackCreated) {
          try {
            await this.onFeedbackCreated(feedbackRecord, user);
          } catch (err) {
            console.warn("[McpServer] onFeedbackCreated callback error:", err);
          }
        }

          return {
          success: true,
          feedback_id: id,
          feedback_type: feedbackType,
          status: "recorded",
          message: "Feedback proactively recorded. Thank you for helping keep OffRadarJob listings accurate and intelligent!",
        };
      }

      case "get_daily_digest": {
        let preferredRegion = args.region || "midwest";
        let targetRoles = Array.isArray(args.target_roles) ? args.target_roles : [];
        let techCategory = args.tech_category ?? undefined;
        const limit = Math.min(Math.max(1, args.limit ?? 5), 15);

        // Enrich with saved subscription preferences if available and omitted in args
        if (this.subscriptionRepo && (!args.target_roles || !args.region)) {
          try {
            const savedSub = await this.subscriptionRepo.getByUserId(user.id);
            if (savedSub) {
              if (!args.region && savedSub.regions.length > 0) {
                preferredRegion = savedSub.regions[0] || "midwest";
              }
              if (!args.target_roles && savedSub.targetRoles.length > 0) {
                targetRoles = savedSub.targetRoles;
              }
              if (!args.tech_category && savedSub.techCategories.length > 0) {
                techCategory = savedSub.techCategories[0];
              }
            }
          } catch {}
        }

        const searchQuery = targetRoles.length > 0 ? targetRoles.join(" ") : undefined;
        const res = await this.jobRepo.listPaged({
          page: 1,
          limit,
          region: preferredRegion === "all" ? undefined : preferredRegion,
          techCategory,
          search: searchQuery,
          techOnly: true,
        });

        const digestDate = new Date().toLocaleDateString("en-US", {
          weekday: "long",
          year: "numeric",
          month: "short",
          day: "numeric",
        });

        const jobItems = res.items.map((j) => {
          const isMidwest = j.isMidwest || j.usRegion === "midwest";
          const location = isMidwest ? "📍 US-Midwest" : (j.isRemote ? `🌐 Remote (${j.remoteScope || "US"})` : `🏢 ${j.location || "US"}`);
          const salary = j.salaryMin ? `$${j.salaryMin.toLocaleString()} - $${j.salaryMax?.toLocaleString()} ${j.salaryCurrency || "USD"}` : "Competitive / Unlisted";
          return {
            id: j.id,
            title: j.title,
            company: j.companyName || j.companyId,
            website: j.companyWebsite,
            location,
            salary,
            tech_category: j.techCategory,
            seniority: j.seniorityLevel,
            skills: j.skills,
            summary: toPublicJob(j).descriptionSummary,
            apply_type: j.applyType,
            apply_target: j.applyTarget,
            is_midwest_priority: isMidwest,
          };
        });

        return {
          success: true,
          briefing_date: digestDate,
          candidate: user.firstName,
          preferred_region: preferredRegion,
          total_matching_openings: res.pagination.total,
          returned: jobItems.length,
          daily_digest: jobItems,
          guidance_for_ai: "Deliver a crisp morning career briefing to the user highlighting these high-conviction unlisted opportunities. Offer to tailor their CV for any target opening using 'tailor_cv_for_job'.",
        };
      }

      case "manage_job_subscription": {
        if (!this.subscriptionRepo) {
          return {
            success: false,
            message: "User subscription repository not initialized on this MCP server instance.",
          };
        }

        const action = String(args.action || "get").toLowerCase();

        if (action === "get") {
          const sub = await this.subscriptionRepo.getByUserId(user.id);
          return {
            success: true,
            has_subscription: !!sub,
            subscription: sub || {
              userId: user.id,
              telegramId: user.telegramId,
              isActive: false,
              frequency: "daily",
              targetRoles: [],
              techCategories: [],
              regions: ["midwest", "remote"],
              message: "No active alert subscription found. Call action='update' with is_active=true to subscribe.",
            },
          };
        }

        if (action === "toggle") {
          const existing = await this.subscriptionRepo.getByUserId(user.id);
          const newStatus = args.is_active !== undefined ? !!args.is_active : !(existing?.isActive ?? false);
          if (existing) {
            await this.subscriptionRepo.toggleActive(user.id, newStatus);
          } else {
            await this.subscriptionRepo.upsert({
              userId: user.id,
              telegramId: user.telegramId,
              isActive: newStatus,
            });
          }
          return {
            success: true,
            is_active: newStatus,
            message: newStatus ? "Daily Telegram alert subscription activated." : "Daily alerts paused.",
          };
        }

        if (action === "update") {
          const sub = await this.subscriptionRepo.upsert({
            userId: user.id,
            telegramId: user.telegramId,
            isActive: args.is_active !== undefined ? !!args.is_active : true,
            frequency: args.frequency || "daily",
            targetRoles: Array.isArray(args.target_roles) ? args.target_roles : undefined,
            regions: Array.isArray(args.regions) ? args.regions : undefined,
          });
          return {
            success: true,
            message: "Subscription preferences updated successfully.",
            subscription: sub,
          };
        }

        throw new Error(`Invalid action '${action}' for manage_job_subscription. Must be 'get', 'update', or 'toggle'.`);
      }

      case "get_realtime_jd_ranking_report": {
        const jobsRes = await this.jobRepo.listPaged({ page: 1, limit: 150, techOnly: true });
        const compRes = await this.companyRepo.listPaged({ page: 1, limit: 100 });
        const companiesMap = new Map<string, any>();
        for (const c of compRes.items) {
          companiesMap.set(c.id, c);
        }

        const report = this.rerankerService.generateRealtimeReport(jobsRes.items, companiesMap);
        const filterGroup = args.target_group;
        let topJobs = report.topRankedJobs;

        if (filterGroup && filterGroup !== "all") {
          topJobs = topJobs.filter(
            (j) => j.rerank.primaryTargetGroup === filterGroup || (j.rerank.targetGroupFit[filterGroup as TargetGroup] || 0) >= 60
          );
        }

        const limit = Math.min(Math.max(1, Number(args.limit) || 10), 50);
        return {
          generated_at: new Date(report.generatedAt).toISOString(),
          total_jds_analyzed: report.totalJdsAnalyzed,
          market_summary: report.marketSummary,
          target_group_breakdown: report.targetGroupBreakdown,
          trending_skills: report.trendingSkills,
          top_ranked_jds: topJobs.slice(0, limit).map(({ job, rerank }) => ({
            id: job.id,
            title: job.title,
            company: job.companyName || job.companyId,
            composite_score: rerank.compositeScore,
            trend: rerank.trendDirection,
            primary_target_group: rerank.primaryTargetGroup,
            demand_score: rerank.demandScore,
            freshness_score: rerank.freshnessScore,
            transparency_score: rerank.transparencyScore,
            skills: job.skills,
            salary: job.salaryMin && job.salaryMax ? `$${job.salaryMin.toLocaleString()} - $${job.salaryMax.toLocaleString()}` : "Not Disclosed",
            apply_target: job.applyTarget,
          })),
        };
      }

      case "optimize_cv_with_decision_api": {
        const targetGroup = args.target_group as TargetGroup;
        if (!TARGET_GROUPS[targetGroup]) {
          return {
            error: `Invalid target_group '${targetGroup}'. Supported groups: ${Object.keys(TARGET_GROUPS).join(", ")}`,
          };
        }

        let baseContent = args.custom_cv_content;
        if (!baseContent && args.base_cv_id && this.cvRepo) {
          const baseCv = await this.cvRepo.getById(args.base_cv_id, user.id);
          if (baseCv) baseContent = baseCv.content;
        }

        if (!baseContent && this.cvRepo) {
          const userCvs = await this.cvRepo.listByUser(user.id);
          if (userCvs.length > 0 && userCvs[0]) {
            baseContent = userCvs[0].content;
          }
        }

        if (!baseContent) {
          baseContent = `# ${user.firstName} - Software Engineer\n\n## Experience\n- Software Engineer building scalable backend systems, APIs, and cloud services.\n- Worked with modern web technologies and automated testing.\n\n## Skills\nTypeScript, Node.js, Python, PostgreSQL, React, Git, Cloud Services`;
        }

        // Fetch live jobs for report
        const jobsRes = await this.jobRepo.listPaged({ page: 1, limit: 100, techOnly: true });
        const report = this.rerankerService.generateRealtimeReport(jobsRes.items);

        // Run Decision API
        const decision = await this.decisionApi.optimizeCvForTargetGroup(baseContent, targetGroup, report);

        let savedCv: CvVersion | null = null;
        if (args.save_as_version && this.cvRepo) {
          const id = `cv_dec_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
          const title = args.version_title || `${user.firstName} - ${decision.targetGroupName} CV`;
          const now = Date.now();
          const cvRecord: CvVersion = {
            id,
            userId: user.id,
            title,
            targetRole: decision.targetGroupName,
            targetGroup: targetGroup,
            content: decision.optimizedCvContent,
            skills: decision.topDemandedSkillsInSegment,
            matchScore: decision.projectedMatchScore,
            tailoredNotes: decision.targetGroupStrategy,
            decisionSuggestions: decision,
            createdAt: now,
            updatedAt: now,
          };
          await this.cvRepo.create(cvRecord);
          savedCv = (await this.cvRepo.getById(id, user.id)) ?? cvRecord;
        }

        return {
          success: true,
          target_group: decision.targetGroup,
          target_group_name: decision.targetGroupName,
          current_match_score: `${decision.currentMatchScore}%`,
          projected_match_score: `${decision.projectedMatchScore}%`,
          target_group_strategy: decision.targetGroupStrategy,
          additions: decision.additions,
          removals: decision.removals,
          top_demanded_skills_in_segment: decision.topDemandedSkillsInSegment,
          optimized_cv_content: decision.optimizedCvContent,
          saved_version_id: savedCv?.id || null,
        };
      }

      case "list_target_groups": {
        return {
          total_groups: Object.keys(TARGET_GROUPS).length,
          target_groups: Object.values(TARGET_GROUPS),
        };
      }

      case "rank_jobs_for_profile": {
        const service = this.requireCandidateMatch();
        const ranked = await service.rank(user.id, {
          profileId: args.profile_id ?? args.profileId,
          profile: args.profile,
          limit: args.limit,
        });
        return {
          matches: ranked.matches.map((entry) => ({
            job_id: entry.job.id,
            title: entry.job.title,
            score: entry.match.total,
            factors: entry.match.factors,
            reasons: entry.match.reasons,
          })),
        };
      }

      case "save_candidate_profile": {
        const service = this.requireCandidateMatch();
        const saved = await service.saveProfile(user.id, args);
        return { id: saved.id, label: saved.label, profile: saved.profile };
      }

      case "save_job_filter": {
        const service = this.requireCandidateMatch();
        const saved = await service.saveFilter(user.id, {
          profileId: args.profileId ?? args.profile_id,
          keywords: args.keywords,
          seniorityLevels: args.seniorityLevels ?? args.seniority_levels,
          locations: args.locations,
          remote: args.remote,
          sponsorship: args.sponsorship,
          minScore: args.minScore ?? args.min_score,
        });
        return saved;
      }

      case "list_new_match_alerts": {
        const service = this.requireCandidateMatch();
        const alerts = await service.listAlerts(user.id);
        return { alerts };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  }

  private requireCandidateMatch(): CandidateMatchService {
    if (!this.candidateMatch) throw new Error("Candidate matching is not configured");
    return this.candidateMatch;
  }

  public getPromptDefinitions() {
    return [
      {
        name: "proactive_job_advisor",
        description: "Official system & workflow prompt for AI assistants connecting to OffRadarJob via MCP. Instructs the LLM on searching boutique tech jobs, tailoring resumes, and proactively submitting feedback via submit_llm_feedback.",
        arguments: [
          {
            name: "target_role",
            description: "Target job title, stack or level (e.g. 'Founding Backend Engineer', 'New Grad 2026')",
            required: false,
          },
          {
            name: "preferred_region",
            description: "Target US region or remote preference (e.g. 'midwest', 'remote')",
            required: false,
          },
        ],
      },
      {
        name: "llm_feedback_collector",
        description: "Focused workflow prompt instructing the LLM on how to extract conversational signals and proactively call submit_llm_feedback.",
        arguments: [
          {
            name: "last_interaction_summary",
            description: "Optional notes or query from the user session",
            required: false,
          },
        ],
      },
      {
        name: "daily_job_briefing",
        description: "Morning workflow prompt to generate a crisp daily briefing of newly discovered off-radar opportunities, highlight hidden gems, and suggest CV tailoring actions.",
        arguments: [
          {
            name: "target_role",
            description: "Target job title, stack or level",
            required: false,
          },
          {
            name: "preferred_region",
            description: "Target US region or remote preference (default 'midwest')",
            required: false,
          },
        ],
      },
    ];
  }

  public getPromptContent(name: string, args: Record<string, any>, user: User) {
    switch (name) {
      case "proactive_job_advisor": {
        const targetRole = args.target_role || "Software Engineer / Tech Professional";
        const region = args.preferred_region || "US-Midwest & Remote";

        const text = `# OffRadarJob AI Assistant & Proactive Protocols

You are an expert AI Career Advisor empowered with direct access to OffRadarJob's verified directory of unlisted tech startups, micro-companies, and direct-to-founder career portals.
Target Role Context: ${targetRole}
Region Preference: ${region}
Authenticated User: ${user.firstName} (@${user.username || user.id})

## Your Mission:
1. Help the candidate discover high-conviction unlisted tech roles that never appear on noisy aggregators. Prioritize Midwest tech hubs (Chicago, Indianapolis, Minneapolis, Madison, etc.) and remote-first boutique startups.
2. Tailor CVs directly against real job JDs using 'tailor_cv_for_job' and save optimized versions via 'save_cv_version'.

3. **PROACTIVE DAILY BRIEFING & SUBSCRIPTION PROTOCOL (MANDATORY)**:
   - At the beginning of each day, or upon initiating a session with the candidate, you SHOULD PROACTIVELY invoke 'get_daily_digest' to deliver a crisp morning briefing of high-conviction opportunities.
   - If the candidate has not yet subscribed to daily alerts, proactively suggest they enable daily Telegram notifications using 'manage_job_subscription' or via Telegram bot command '/subscribe'.
   - If operating in an agent environment with scheduling capabilities (e.g. /schedule 0 9 * * * or cron), recommend scheduling a standing daily check-in.

4. **PROACTIVE FEEDBACK PROTOCOL (MANDATORY)**:
   You have a special role as a data-quality sentinel. Whenever you or the user encounter any of the following during the conversation, you MUST PROACTIVELY invoke the 'submit_llm_feedback' tool:
   - **Broken Links / Expired JDs**: The apply target or link is 404, invalid, or position is filled (feedback_type: 'broken_link', sentiment: 'critical').
   - **Unmet User Demand**: The user repeatedly seeks a specific tech stack, role, or regional presence that returned few or zero results (feedback_type: 'user_preference', sentiment: 'neutral' or 'positive'). Example: "User looking for Elixir/OTP roles in Chicago; candidate is willing to relocate."
   - **Data Discrepancies**: Missing compensation, ambiguous tech requirements, or misclassified tech category (feedback_type: 'missing_data' or 'job_relevance').
   - **CV Tailoring Gaps**: Noticeable pattern of missing skills or advice for crawler improvement (feedback_type: 'cv_tailoring').
   - **General Suggestions / Sentiment**: High praise, user frustration, or UI improvements (feedback_type: 'general_suggestion').

Always be helpful, precise, and proactive in keeping the OffRadarJob ecosystem top-tier!`;

        return {
          description: "Comprehensive system prompt for OffRadarJob with proactive feedback and daily briefing protocols.",
          messages: [
            {
              role: "user",
              content: {
                type: "text",
                text,
              },
            },
          ],
        };
      }

      case "daily_job_briefing": {
        const targetRole = args.target_role || "Software Engineer";
        const region = args.preferred_region || "US-Midwest & Remote";

        const text = `Good morning ${user.firstName}!
Please run 'get_daily_digest' with region: "${region}" and target_role: "${targetRole}" now.
Review the newly discovered micro-company tech openings and present:
1. Top 3-5 high-conviction unlisted openings today.
2. Direct apply links and compensation insights.
3. Recommend 1-2 roles to tailor their CV for using 'tailor_cv_for_job'.
4. Remind the candidate that they can receive this digest automatically every morning via Telegram by running '/subscribe'.`;

        return {
          description: "Morning workflow prompt to generate a crisp daily briefing of newly discovered off-radar opportunities.",
          messages: [
            {
              role: "user",
              content: {
                type: "text",
                text,
              },
            },
          ],
        };
      }

      case "llm_feedback_collector": {
        const summary = args.last_interaction_summary || "Recent candidate interaction";
        const text = `Please evaluate the following conversation with ${user.firstName}:
"${summary}"

If any of the following apply, proactively call the 'submit_llm_feedback' tool now:
1. Did the user encounter a broken link, closed role, or expired job application target? (feedback_type: 'broken_link')
2. Did the user express a strong desire for a specific role or location that OffRadarJob lacked? (feedback_type: 'user_preference')
3. Were there salary or tech category discrepancies? (feedback_type: 'missing_data' or 'job_relevance')
4. Did the user share constructive feedback or sentiment? (feedback_type: 'general_suggestion')

Include a clear suggested_action for our engineering team.`;

        return {
          description: "Workflow prompt to analyze conversation and submit proactive LLM feedback.",
          messages: [
            {
              role: "user",
              content: {
                type: "text",
                text,
              },
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown prompt: ${name}`);
    }
  }
}
