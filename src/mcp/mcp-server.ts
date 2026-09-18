import {
  JobRepository,
  CompanyRepository,
  CvRepository,
  LlmFeedbackRepository,
} from "../db/repositories.js";
import {
  User,
  CvVersion,
  LlmFeedback,
  FeedbackType,
  FeedbackSentiment,
} from "../types/domain.js";

/**
 * Model Context Protocol (MCP) Server for Off-Radar Jobs
 * Implements JSON-RPC 2.0 protocol for Cursor IDE, Claude Desktop, Antigravity, and other AI agents.
 */
export class McpServerHandler {
  constructor(
    private readonly jobRepo: JobRepository,
    private readonly companyRepo: CompanyRepository,
    private readonly cvRepo: CvRepository,
    private readonly feedbackRepo?: LlmFeedbackRepository,
    private readonly onFeedbackCreated?: (feedback: LlmFeedback, user: User) => Promise<void>
  ) {}

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
            summary: j.descriptionSummary,
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
        return {
          job,
          apply_instructions: `Direct application via ${job.applyType.toUpperCase()}: ${job.applyTarget}`,
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

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
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
    ];
  }

  public getPromptContent(name: string, args: Record<string, any>, user: User) {
    switch (name) {
      case "proactive_job_advisor": {
        const targetRole = args.target_role || "Software Engineer / Tech Professional";
        const region = args.preferred_region || "US-Midwest & Remote";

        const text = `# OffRadarJob AI Assistant & Proactive Feedback Protocol

You are an expert AI Career Advisor empowered with direct access to OffRadarJob's verified directory of unlisted tech startups, micro-companies, and direct-to-founder career portals.
Target Role Context: ${targetRole}
Region Preference: ${region}
Authenticated User: ${user.firstName} (@${user.username || user.id})

## Your Mission:
1. Help the candidate discover high-conviction unlisted tech roles that never appear on noisy aggregators. Prioritize Midwest tech hubs (Chicago, Indianapolis, Minneapolis, Madison, etc.) and remote-first boutique startups.
2. Tailor CVs directly against real job JDs using 'tailor_cv_for_job' and save optimized versions via 'save_cv_version'.
3. **PROACTIVE FEEDBACK PROTOCOL (MANDATORY)**:
   You have a special role as a data-quality sentinel. Whenever you or the user encounter any of the following during the conversation, you MUST PROACTIVELY invoke the 'submit_llm_feedback' tool:
   - **Broken Links / Expired JDs**: The apply target or link is 404, invalid, or position is filled (feedback_type: 'broken_link', sentiment: 'critical').
   - **Unmet User Demand**: The user repeatedly seeks a specific tech stack, role, or regional presence that returned few or zero results (feedback_type: 'user_preference', sentiment: 'neutral' or 'positive'). Example: "User looking for Elixir/OTP roles in Chicago; candidate is willing to relocate."
   - **Data Discrepancies**: Missing compensation, ambiguous tech requirements, or misclassified tech category (feedback_type: 'missing_data' or 'job_relevance').
   - **CV Tailoring Gaps**: Noticeable pattern of missing skills or advice for crawler improvement (feedback_type: 'cv_tailoring').
   - **General Suggestions / Sentiment**: High praise, user frustration, or UI improvements (feedback_type: 'general_suggestion').

Always be helpful, precise, and proactive in keeping the OffRadarJob ecosystem top-tier!`;

        return {
          description: "Comprehensive system prompt for OffRadarJob with proactive feedback protocol.",
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
