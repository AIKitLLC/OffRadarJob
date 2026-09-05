import { JobRepository, CompanyRepository, CvRepository } from "../db/repositories.js";
import { User, CvVersion } from "../types/domain.js";

/**
 * Model Context Protocol (MCP) Server for Off-Radar Jobs
 * Implements JSON-RPC 2.0 protocol for Cursor IDE, Claude Desktop, Antigravity, and other AI agents.
 */
export class McpServerHandler {
  constructor(
    private readonly jobRepo: JobRepository,
    private readonly companyRepo: CompanyRepository,
    private readonly cvRepo: CvRepository
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
              },
              serverInfo: {
                name: "off-radar-jobs-mcp",
                version: "1.0.0",
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
        description: "Search and filter unlisted & micro-company tech jobs from verified company career portals. Free for authenticated MCP clients.",
        inputSchema: {
          type: "object",
          properties: {
            query: { type: "string", description: "Keyword search for title, company name, skills, or location" },
            grade: {
              type: "string",
              enum: ["all", "founding", "lead", "senior", "mid", "junior", "new_grad", "intern"],
              description: "Seniority / grade filter (e.g. founding, new_grad, senior)",
            },
            tech_category: {
              type: "string",
              enum: ["all", "fullstack", "backend_systems", "frontend_ui", "ai_ml", "devops_cloud", "product_design"],
              description: "Tech discipline specialization",
            },
            region: {
              type: "string",
              enum: ["all", "midwest", "remote"],
              description: "Location filter (midwest focus or 100% remote)",
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
        description: "Browse boutique, high-conviction micro-companies and tech startups in the Off-Radar directory.",
        inputSchema: {
          type: "object",
          properties: {
            search: { type: "string", description: "Search by company name, domain, tech stack, or industry" },
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
    ];
  }

  private async callTool(name: string, args: Record<string, any>, user: User): Promise<any> {
    switch (name) {
      case "search_jobs": {
        const query = args.query ?? undefined;
        const grade = args.grade ?? undefined;
        const techCategory = args.tech_category ?? undefined;
        const region = args.region ?? undefined;
        const limit = Math.min(Math.max(1, args.limit ?? 10), 50);

        const res = await this.jobRepo.listPaged({
          page: 1,
          limit,
          search: query,
          grade,
          techCategory,
          region,
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
            salary: j.salaryMin ? `$${j.salaryMin.toLocaleString()} - $${j.salaryMax?.toLocaleString()} ${j.salaryCurrency || "USD"}` : "Unspecified",
            skills: j.skills,
            summary: j.descriptionSummary,
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
        const limit = Math.min(Math.max(1, args.limit ?? 15), 50);
        const res = await this.companyRepo.listPaged({ page: 1, limit, search });
        return {
          total: res.pagination.total,
          companies: res.items.map((c) => ({
            id: c.id,
            name: c.name,
            website: c.websiteUrl,
            industry: c.industry,
            headcount: c.headcountEstimate,
            location: c.locationHint,
            techStack: c.techStack,
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

        const tailoringSuggestions = [
          `Target role: Emphasize '${job.title}' in the header summary.`,
          `Highlight primary tech category: ${job.techCategory} architecture.`,
          missingSkills.length > 0
            ? `Incorporate key JD keywords: ${missingSkills.slice(0, 5).join(", ")}.`
            : `All top requirements (${matchedSkills.slice(0, 4).join(", ")}) already matched!`,
          job.isRemote
            ? "Highlight async communication & remote team impact."
            : `Highlight regional presence near ${job.location || "office location"}.`,
        ];

        const tailoredSummary = `Results-driven ${job.title} specializing in ${[...matchedSkills.slice(0, 3), job.techCategory].join(", ")}. Proven track record designing scalable systems, accelerating engineering velocity, and delivering mission-critical products for high-growth tech teams.`;

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

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  }
}
