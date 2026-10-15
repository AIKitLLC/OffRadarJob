import {
  TargetGroup,
  TARGET_GROUPS,
  DecisionCvSuggestion,
  CvSuggestionItem,
  RealtimeJdRankingReport,
} from "../types/domain.js";

export interface CloudflareAiBinding {
  run(model: string, inputs: Record<string, unknown>): Promise<any>;
}

export interface DecisionEngineOptions {
  ai?: CloudflareAiBinding | undefined;
  customSystemPrompt?: string | undefined;
}

/**
 * Cloudflare Decision API & CV Optimizer Service
 * Evaluates candidate CVs against real-time reranked employer JDs and computes
 * concrete additions (thêm) and removals (bớt) tailored to distinct target groups.
 */
export class DecisionApiService {
  constructor(private readonly options: DecisionEngineOptions = {}) {}

  /**
   * Optimize a candidate's CV for a specific employer target group using
   * Cloudflare Decision API / Workers AI with a deterministic fallback engine.
   */
  public async optimizeCvForTargetGroup(
    cvContent: string,
    targetGroup: TargetGroup,
    rankingReport?: RealtimeJdRankingReport
  ): Promise<DecisionCvSuggestion> {
    const profile = TARGET_GROUPS[targetGroup] || TARGET_GROUPS.early_stage_startups;

    // Filter reranked jobs that fit this target group
    const targetJobs = rankingReport?.topRankedJobs.filter(
      (j) => j.rerank.primaryTargetGroup === targetGroup || (j.rerank.targetGroupFit[targetGroup] || 0) >= 65
    ) || [];

    // Extract top demanded skills for this target group
    const demandedSkillsSet = new Map<string, number>();
    for (const { job } of targetJobs) {
      for (const skill of job.skills || []) {
        const norm = skill.trim();
        demandedSkillsSet.set(norm, (demandedSkillsSet.get(norm) || 0) + 1);
      }
    }

    // Merge with target group profile recommendations
    for (const rec of profile.recommendedKeywords) {
      demandedSkillsSet.set(rec, (demandedSkillsSet.get(rec) || 0) + 3);
    }

    const topDemandedSkillsInSegment = Array.from(demandedSkillsSet.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([s]) => s);

    // If Cloudflare AI binding is available, try running Workers AI
    if (this.options.ai && typeof this.options.ai.run === "function") {
      try {
        const aiResult = await this.runCloudflareAiDecision(
          cvContent,
          profile,
          topDemandedSkillsInSegment
        );
        if (aiResult) {
          return aiResult;
        }
      } catch (err) {
        console.warn("[Decision API] Cloudflare Workers AI inference skipped, falling back to deterministic engine:", err);
      }
    }

    // High-performance deterministic Decision Engine
    return this.runDeterministicDecision(
      cvContent,
      profile,
      topDemandedSkillsInSegment
    );
  }

  /**
   * Cloudflare Workers AI integration (@cf/meta/llama-3.1-8b-instruct)
   */
  private async runCloudflareAiDecision(
    cvContent: string,
    profile: typeof TARGET_GROUPS[TargetGroup],
    demandedSkills: string[]
  ): Promise<DecisionCvSuggestion | null> {
    const prompt = `You are the Cloudflare Decision API Resume Optimizer for off-radar tech jobs.
Target Group: "${profile.name}"
Description: ${profile.description}
Key Attributes Looked For: ${profile.keyAttributes.join(", ")}
Demanded Skills & Keywords: ${demandedSkills.join(", ")}
Keywords to Avoid: ${profile.avoidKeywords.join(", ")}

Candidate CV:
${cvContent.slice(0, 3000)}

Analyze the CV and provide structured JSON recommendations:
{
  "currentMatchScore": number between 30 and 75,
  "projectedMatchScore": number between 85 and 99,
  "targetGroupStrategy": "string explaining how to position for this group",
  "additions": [
    { "category": "skill|project_impact|architecture_keyword|metric", "item": "string", "rationale": "string", "priority": "high|medium" }
  ],
  "removals": [
    { "category": "outdated_tech|generic_filler|irrelevant_detail", "item": "string", "rationale": "string", "priority": "high|medium" }
  ]
}
Return ONLY valid JSON.`;

    const response = await this.options.ai!.run("@cf/meta/llama-3.1-8b-instruct", {
      messages: [
        { role: "system", content: "You are a professional tech hiring decision system. You respond only with strict JSON." },
        { role: "user", content: prompt }
      ],
      max_tokens: 1024,
      temperature: 0.2,
    });

    const text = response?.response || response?.text || "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    const parsed = JSON.parse(jsonMatch[0]);
    const additions: CvSuggestionItem[] = Array.isArray(parsed.additions) ? parsed.additions : [];
    const removals: CvSuggestionItem[] = Array.isArray(parsed.removals) ? parsed.removals : [];

    // Synthesize optimized CV text
    const optimizedCvContent = this.synthesizeOptimizedCv(cvContent, additions, removals, profile);

    return {
      targetGroup: profile.id,
      targetGroupName: profile.name,
      currentMatchScore: parsed.currentMatchScore || 62,
      projectedMatchScore: parsed.projectedMatchScore || 94,
      targetGroupStrategy: parsed.targetGroupStrategy || `Tailored specifically for ${profile.name} hiring managers.`,
      additions,
      removals,
      optimizedCvContent,
      topDemandedSkillsInSegment: demandedSkills,
    };
  }

  /**
   * Deterministic Decision Engine: Fast, reliable, zero-latency edge calculation
   */
  private runDeterministicDecision(
    cvContent: string,
    profile: typeof TARGET_GROUPS[TargetGroup],
    demandedSkills: string[]
  ): DecisionCvSuggestion {
    const cvLower = cvContent.toLowerCase();
    const additions: CvSuggestionItem[] = [];
    const removals: CvSuggestionItem[] = [];

    // 1. Identify missing high-demand skills
    const missingSkills: string[] = [];
    for (const skill of demandedSkills) {
      if (!cvLower.includes(skill.toLowerCase())) {
        missingSkills.push(skill);
      }
    }

    for (const skill of missingSkills.slice(0, 4)) {
      additions.push({
        category: "skill",
        item: `Add skill: ${skill}`,
        rationale: `Frequently demanded in 70%+ of job descriptions for ${profile.name}. Enhances ATS match rate.`,
        priority: "high",
      });
    }

    // 2. Target Group Specific Impact Additions
    if (profile.id === "early_stage_startups") {
      if (!cvLower.includes("mvp") && !cvLower.includes("0-to-1")) {
        additions.push({
          category: "project_impact",
          item: "Highlight 0-to-1 product ownership & MVP launch experience",
          rationale: "Early-stage startups prioritize autonomous engineers who build, ship, and iterate quickly from zero to one.",
          priority: "high",
        });
      }
      additions.push({
        category: "metric",
        item: "Add delivery velocity metrics (e.g., shipped core features in 48h, cut deployment cycles)",
        rationale: "Demonstrates high execution velocity without needing heavy bureaucracy.",
        priority: "medium",
      });
    } else if (profile.id === "scaleups_growth") {
      if (!cvLower.includes("throughput") && !cvLower.includes("latency") && !cvLower.includes("scale")) {
        additions.push({
          category: "metric",
          item: "Include throughput and latency metrics (e.g., processed 50K+ RPM, reduced p99 latency <50ms)",
          rationale: "Scale-ups look for concrete proof of handling high concurrency and distributed systems optimization.",
          priority: "high",
        });
      }
      additions.push({
        category: "architecture_keyword",
        item: "Emphasize Microservices / Event-Driven / Kafka / Distributed Caching architectures",
        rationale: "Mid-to-large scale systems require deep knowledge of fault tolerance and high availability.",
        priority: "medium",
      });
    } else if (profile.id === "ai_first_innovators") {
      if (!cvLower.includes("llm") && !cvLower.includes("prompt") && !cvLower.includes("rag")) {
        additions.push({
          category: "architecture_keyword",
          item: "Add production LLM / RAG / Workers AI / Model Context Protocol (MCP) integrations",
          rationale: "AI-first companies favor candidates with hands-on experience in model inference, agent workflows, and tool calling.",
          priority: "high",
        });
      }
    } else if (profile.id === "midwest_regional") {
      additions.push({
        category: "project_impact",
        item: "Highlight architectural stability, clean code, and automated testing (Clean Architecture, Unit Testing)",
        rationale: "Midwest regional engineering teams value pragmatic engineering, maintainable codebases, and long-term commitment.",
        priority: "high",
      });
    } else if (profile.id === "new_grad_junior") {
      additions.push({
        category: "project_impact",
        item: "Include GitHub repository links and live demos for personal projects & capstones",
        rationale: "Junior and early-career hiring teams prioritize clean code and self-directed shipping ability over generic technology lists.",
        priority: "high",
      });
    } else if (profile.id === "remote_first_boutique") {
      additions.push({
        category: "project_impact",
        item: "Add technical design documentation (RFC / ADR) and async-first communication practices",
        rationale: "Remote-first engineering organizations value candidates with exceptional autonomy and clear written communication.",
        priority: "high",
      });
      if (!cvLower.includes("performance") && !cvLower.includes("tối ưu")) {
        additions.push({
          category: "metric",
          item: "Add reliability & performance metrics (e.g., 99.9% uptime, zero unhandled production exceptions)",
          rationale: "Signals high craft attention to detail and robust production engineering.",
          priority: "medium",
        });
      }
    }

    // 3. Removals / Deprecations (Bớt)
    const OBSOLETE_TECH = [
      { pattern: "jquery", name: "jQuery", reason: "Legacy technology; replace with modern TypeScript/React or modern Web APIs." },
      { pattern: "svn", name: "Subversion (SVN)", reason: "Outdated version control system compared to modern Git workflows." },
      { pattern: "cvs", name: "CVS", reason: "Obsolete revision control system; omit in favor of modern Git." },
      { pattern: "angularjs", name: "AngularJS (1.x)", reason: "End-of-life framework; replace with modern React, Vue, or current Angular." },
      { pattern: "php 5", name: "PHP 5.x", reason: "Unsupported legacy version; highlight modern PHP 8+ or modern backend stacks." },
      { pattern: "soap", name: "SOAP / XML-RPC", reason: "Legacy protocol; prioritize REST, gRPC, or GraphQL." },
      { pattern: "flash", name: "Adobe Flash", reason: "Completely deprecated from the modern web platform." },
      { pattern: "bower", name: "Bower", reason: "Deprecated package manager; use npm, pnpm, or yarn instead." },
    ];

    for (const obs of OBSOLETE_TECH) {
      if (cvLower.includes(obs.pattern)) {
        removals.push({
          category: "outdated_tech",
          item: `Remove: ${obs.name}`,
          rationale: obs.reason,
          priority: "high",
        });
      }
    }

    // Buzzword filler removals
    const GENERIC_BUZZWORDS = [
      { pattern: "hard worker", name: "'Hard worker'", reason: "Cliché filler phrase; replace with quantified project accomplishments." },
      { pattern: "team player", name: "'Team player'", reason: "Non-differentiating buzzword; highlight cross-functional projects led." },
      { pattern: "go-getter", name: "'Go-getter'", reason: "Vague corporate cliché; demonstrate technical initiative with concrete deliverables." },
      { pattern: "detail oriented", name: "'Detail oriented'", reason: "Demonstrate this via test coverage and architectural rigor instead." },
    ];

    for (const bw of GENERIC_BUZZWORDS) {
      if (cvLower.includes(bw.pattern)) {
        removals.push({
          category: "generic_filler",
          item: `Remove cliché phrase: ${bw.name}`,
          rationale: bw.reason,
          priority: "medium",
        });
      }
    }

    // Calculate Scores
    const matchedCount = demandedSkills.length - missingSkills.length;
    const currentMatchScore = Math.min(
      82,
      Math.max(40, Math.round((matchedCount / Math.max(1, demandedSkills.length)) * 100))
    );
    const projectedMatchScore = Math.min(98, Math.max(currentMatchScore + 20, 92));

    const targetGroupStrategy = `Optimization strategy for [${profile.name}]: Focus on highlighting ${profile.keyAttributes.slice(0, 2).join(" & ")}, elevating key keywords (${demandedSkills.slice(0, 3).join(", ")}) into the top third of your CV, and pruning legacy tooling to maximize recruiter impact within the initial 6-second scan.`;

    const optimizedCvContent = this.synthesizeOptimizedCv(cvContent, additions, removals, profile);

    return {
      targetGroup: profile.id,
      targetGroupName: profile.name,
      currentMatchScore,
      projectedMatchScore,
      targetGroupStrategy,
      additions,
      removals,
      optimizedCvContent,
      topDemandedSkillsInSegment: demandedSkills,
    };
  }

  /**
   * Synthesize tailored CV content by injecting additions and pruning deprecated items
   */
  private synthesizeOptimizedCv(
    originalContent: string,
    additions: CvSuggestionItem[],
    removals: CvSuggestionItem[],
    profile: typeof TARGET_GROUPS[TargetGroup]
  ): string {
    let output = originalContent;

    // Prune generic fillers & obsolete tech
    for (const rem of removals) {
      if (rem.category === "generic_filler" || rem.category === "outdated_tech") {
        const raw = rem.item.replace(/(?:Remove|Lược bỏ)(?::|\s+cliché phrase:|\s+cụm từ sáo rỗng:)/i, "").replace(/['"]/g, "").trim();
        // Extract plain keywords or tokens (e.g. "Subversion (SVN)" -> ["Subversion", "SVN"])
        const tokens = raw.match(/[a-zA-Z0-9#+.]+/g) || [];
        for (const token of tokens) {
          if (token.length >= 2) {
            const escaped = token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
            const regex = new RegExp(`\\b${escaped}\\b[,\\s]*`, "gi");
            output = output.replace(regex, "");
          }
        }
        // Also strip multi-word phrases (e.g. "hard worker", "team player")
        const phraseClean = raw.split("/")[0]?.trim() || raw;
        if (phraseClean) {
          const phraseEscaped = phraseClean.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
          const phraseRegex = new RegExp(`\\b${phraseEscaped}\\b[,\\s]*`, "gi");
          output = output.replace(phraseRegex, "");
        }
      }
    }

    // Prepend or enrich Skills section with additions
    const skillsToAdd = additions
      .filter((a) => a.category === "skill")
      .map((a) => a.item.replace(/(?:Add skill|Thêm kĩ năng):\s*/i, "").trim())
      .filter(Boolean);

    if (skillsToAdd.length > 0) {
      const skillsHeaderMatch = output.match(/##\s*Skills[^\n]*/i);
      if (skillsHeaderMatch) {
        const replacement = `${skillsHeaderMatch[0]}\n**Tailored for ${profile.name}:** ${skillsToAdd.join(", ")}`;
        output = output.replace(skillsHeaderMatch[0], replacement);
      } else {
        output += `\n\n## Skills (${profile.name} Focus)\n${skillsToAdd.join(", ")}`;
      }
    }

    // Add Target Group Header Tag
    output = `<!-- Target Profile: ${profile.name} | Tailored via Cloudflare Decision API -->\n` + output;
    return output;
  }
}
