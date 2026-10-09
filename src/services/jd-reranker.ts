import {
  Job,
  Company,
  TargetGroup,
  TARGET_GROUPS,
  JdRerankScores,
  TrendingSkill,
  RealtimeJdRankingReport,
} from "../types/domain.js";

/**
 * Continuous Job Description Reranking Service
 * Evaluates real-time market demand, freshness decay, salary transparency,
 * employer credibility, and target group alignment across all tracked JDs.
 */
export class JdRerankerService {
  /**
   * Weights for high-demand market skills
   */
  private static readonly SKILL_DEMAND_WEIGHTS: Record<string, number> = {
    // AI / LLM / Agentic
    "ai": 95,
    "llm": 95,
    "workers ai": 98,
    "machine learning": 90,
    "rag": 92,
    "mcp": 96,
    "embeddings": 88,
    "vector": 88,
    "pytorch": 85,
    "python": 90,

    // Cloudflare & Edge
    "cloudflare": 94,
    "cloudflare workers": 98,
    "d1": 90,
    "kv": 85,
    "queues": 85,
    "serverless": 88,
    "edge computing": 90,

    // Core Modern Stack
    "typescript": 92,
    "node.js": 86,
    "nodejs": 86,
    "react": 88,
    "next.js": 88,
    "vue": 82,
    "rust": 93,
    "golang": 90,
    "go": 90,
    "postgresql": 89,
    "postgres": 89,
    "redis": 85,
    "kafka": 87,
    "docker": 85,
    "kubernetes": 87,
    "distributed systems": 92,
  };

  /**
   * Calculate full rerank scores for an individual job description
   */
  public rerankJob(
    job: Job,
    company?: Company | null,
    nowMs: number = Date.now()
  ): JdRerankScores {
    const demandScore = this.calculateDemandScore(job);
    const freshnessScore = this.calculateFreshnessScore(job, nowMs);
    const transparencyScore = this.calculateTransparencyScore(job);
    const employerTrustScore = this.calculateEmployerTrustScore(job, company);
    const targetGroupFit = this.calculateTargetGroupFit(job, company);

    // Composite formula:
    // 35% Demand + 25% Freshness + 20% Transparency + 20% Employer Credibility
    const rawComposite =
      demandScore * 0.35 +
      freshnessScore * 0.25 +
      transparencyScore * 0.2 +
      employerTrustScore * 0.2;
    const compositeScore = Math.min(100, Math.max(10, Math.round(rawComposite)));

    // Trend Direction based on freshness & high demand
    let trendDirection: "trending_up" | "stable" | "cooling" = "stable";
    if (freshnessScore >= 85 && demandScore >= 75) {
      trendDirection = "trending_up";
    } else if (freshnessScore < 50 || demandScore < 45) {
      trendDirection = "cooling";
    }

    // Determine primary target group: prioritize functional specializations over generic regional tags
    const priorityOrder: TargetGroup[] = [
      "ai_first_innovators",
      "new_grad_junior",
      "scaleups_growth",
      "early_stage_startups",
      "remote_first_boutique",
      "midwest_regional",
    ];

    let primaryTargetGroup: TargetGroup = "early_stage_startups";
    let maxFit = -1;
    for (const group of priorityOrder) {
      const fit = targetGroupFit[group];
      if (fit > maxFit) {
        maxFit = fit;
        primaryTargetGroup = group;
      }
    }

    return {
      jobId: job.id,
      demandScore,
      freshnessScore,
      transparencyScore,
      employerTrustScore,
      targetGroupFit,
      compositeScore,
      trendDirection,
      primaryTargetGroup,
    };
  }

  /**
   * Generate an aggregated real-time ranking report across all candidate jobs
   */
  public generateRealtimeReport(
    jobs: Job[],
    companiesMap: Map<string, Company> = new Map(),
    nowMs: number = Date.now()
  ): RealtimeJdRankingReport {
    const scoredJobs = jobs
      .filter((j) => j.status === "open")
      .map((job) => {
        const company = job.companyId ? companiesMap.get(job.companyId) ?? null : null;
        return {
          job,
          rerank: this.rerankJob(job, company, nowMs),
        };
      });

    // Sort descending by compositeScore
    scoredJobs.sort((a, b) => b.rerank.compositeScore - a.rerank.compositeScore);

    // Compute Skill Frequency & Trending Dynamics
    const skillStats = new Map<string, { count: number; groups: Record<TargetGroup, number> }>();
    for (const { job, rerank } of scoredJobs) {
      for (const rawSkill of job.skills || []) {
        const skill = rawSkill.trim();
        if (!skill) continue;
        const normalized = skill.toLowerCase();
        const stat = skillStats.get(normalized) || {
          count: 0,
          groups: {
            early_stage_startups: 0,
            scaleups_growth: 0,
            ai_first_innovators: 0,
            midwest_regional: 0,
            new_grad_junior: 0,
            remote_first_boutique: 0,
          },
        };
        stat.count += 1;
        stat.groups[rerank.primaryTargetGroup] = (stat.groups[rerank.primaryTargetGroup] || 0) + 1;
        skillStats.set(normalized, stat);
      }
    }

    const trendingSkills: TrendingSkill[] = Array.from(skillStats.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 15)
      .map(([skillLower, data]) => {
        // Find dominant group
        let topGroup: TargetGroup = "early_stage_startups";
        let topGCount = -1;
        for (const [grp, cnt] of Object.entries(data.groups) as [TargetGroup, number][]) {
          if (cnt > topGCount) {
            topGCount = cnt;
            topGroup = grp;
          }
        }

        // Relative growth mock estimation based on modern demand weighting
        const weight = JdRerankerService.SKILL_DEMAND_WEIGHTS[skillLower] ?? 70;
        const growthPercent = Math.round(15 + (weight - 70) * 1.5 + (data.count % 10));

        // Capitalize for display
        const displaySkill =
          skillLower.length <= 3
            ? skillLower.toUpperCase()
            : skillLower.charAt(0).toUpperCase() + skillLower.slice(1);

        return {
          skill: displaySkill,
          frequency: data.count,
          demandGrowth: `+${growthPercent}%`,
          primaryTargetGroup: topGroup,
        };
      });

    // Compute Target Group Breakdowns
    const targetGroupBreakdown: Record<TargetGroup, { count: number; averageScore: number; topSkills: string[] }> = {
      early_stage_startups: { count: 0, averageScore: 0, topSkills: [] },
      scaleups_growth: { count: 0, averageScore: 0, topSkills: [] },
      ai_first_innovators: { count: 0, averageScore: 0, topSkills: [] },
      midwest_regional: { count: 0, averageScore: 0, topSkills: [] },
      new_grad_junior: { count: 0, averageScore: 0, topSkills: [] },
      remote_first_boutique: { count: 0, averageScore: 0, topSkills: [] },
    };

    const targetGroupScoreSums: Record<TargetGroup, number> = {
      early_stage_startups: 0,
      scaleups_growth: 0,
      ai_first_innovators: 0,
      midwest_regional: 0,
      new_grad_junior: 0,
      remote_first_boutique: 0,
    };

    const targetGroupSkillCounts: Record<TargetGroup, Map<string, number>> = {
      early_stage_startups: new Map(),
      scaleups_growth: new Map(),
      ai_first_innovators: new Map(),
      midwest_regional: new Map(),
      new_grad_junior: new Map(),
      remote_first_boutique: new Map(),
    };

    for (const { job, rerank } of scoredJobs) {
      const grp = rerank.primaryTargetGroup;
      targetGroupBreakdown[grp].count += 1;
      targetGroupScoreSums[grp] += rerank.compositeScore;

      for (const skill of job.skills || []) {
        const norm = skill.trim();
        if (!norm) continue;
        const current = targetGroupSkillCounts[grp].get(norm) || 0;
        targetGroupSkillCounts[grp].set(norm, current + 1);
      }
    }

    for (const grp of Object.keys(targetGroupBreakdown) as TargetGroup[]) {
      const count = targetGroupBreakdown[grp].count;
      targetGroupBreakdown[grp].averageScore = count > 0 ? Math.round(targetGroupScoreSums[grp] / count) : 0;
      targetGroupBreakdown[grp].topSkills = Array.from(targetGroupSkillCounts[grp].entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([s]) => s);
    }

    // High level summary
    const topGroup = Object.entries(targetGroupBreakdown).sort((a, b) => b[1].count - a[1].count)[0]?.[0];
    const topGroupName = topGroup ? TARGET_GROUPS[topGroup as TargetGroup].name : "Tech";
    const marketSummary = `Real-time index of ${scoredJobs.length} live micro-company job descriptions. Leading category: ${topGroupName}. Key high-demand drivers: TypeScript, Workers AI, Distributed Systems, and Edge Computing.`;

    return {
      generatedAt: nowMs,
      totalJdsAnalyzed: scoredJobs.length,
      topRankedJobs: scoredJobs,
      trendingSkills,
      targetGroupBreakdown,
      marketSummary,
    };
  }

  // --- Internal Calculation Helpers ---

  private calculateDemandScore(job: Job): number {
    let score = 50; // baseline
    const skills = job.skills || [];

    // Award bonus for high-demand skills
    let highDemandHits = 0;
    for (const skill of skills) {
      const normalized = skill.toLowerCase();
      const weight = JdRerankerService.SKILL_DEMAND_WEIGHTS[normalized];
      if (weight) {
        highDemandHits++;
        score += (weight - 70) * 0.4;
      }
    }

    // Category bonus
    if (job.techCategory === "ai_ml") score += 12;
    if (job.techCategory === "backend_systems") score += 8;
    if (job.techCategory === "fullstack") score += 6;

    // Seniority modifier
    if (job.seniorityLevel === "founding") score += 10;
    if (job.seniorityLevel === "lead") score += 6;
    if (job.seniorityLevel === "new_grad" || job.seniorityLevel === "intern") score += 4;

    return Math.min(100, Math.max(20, Math.round(score)));
  }

  private calculateFreshnessScore(job: Job, nowMs: number): number {
    const ageDays = Math.max(0, (nowMs - job.lastSeenAt) / (1000 * 60 * 60 * 24));
    if (ageDays <= 2) return 100;
    if (ageDays <= 5) return 92;
    if (ageDays <= 10) return 80;
    if (ageDays <= 20) return 65;
    if (ageDays <= 30) return 50;
    return Math.max(20, Math.round(100 - ageDays * 2));
  }

  private calculateTransparencyScore(job: Job): number {
    let score = 40; // baseline

    // Salary disclosed
    if (job.salaryMin && job.salaryMax) {
      score += 35;
    } else if (job.salaryMin || job.salaryMax) {
      score += 20;
    }

    // Direct application route
    if (job.applyType === "url" && job.applyTarget.startsWith("http")) {
      score += 15;
    } else if (job.applyType === "email") {
      score += 15;
    }

    // Detailed description summary
    if (job.descriptionSummary && job.descriptionSummary.length > 80) {
      score += 10;
    }

    return Math.min(100, Math.max(10, score));
  }

  private calculateEmployerTrustScore(job: Job, company?: Company | null): number {
    let score = 60; // baseline

    if (company) {
      if (company.isMidwest) score += 10;
      if (company.valuationEstimate) score += 10;
      if (company.fundingStage === "bootstrapped" || company.fundingStage === "seed" || company.fundingStage === "series_a") {
        score += 10; // high interest for off-radar seekers
      }
      if (company.techStack && company.techStack.length >= 3) {
        score += 10;
      }
    }

    if (job.isMidwest) score += 5;
    return Math.min(100, Math.max(20, score));
  }

  private calculateTargetGroupFit(job: Job, company?: Company | null): Record<TargetGroup, number> {
    const fits: Record<TargetGroup, number> = {
      early_stage_startups: 50,
      scaleups_growth: 50,
      ai_first_innovators: 50,
      midwest_regional: 50,
      new_grad_junior: 50,
      remote_first_boutique: 50,
    };

    const text = `${job.title} ${job.descriptionSummary || ""} ${(job.skills || []).join(" ")}`.toLowerCase();

    // 1. Early-stage startups
    if (
      company?.fundingStage === "seed" ||
      company?.fundingStage === "bootstrapped" ||
      job.seniorityLevel === "founding" ||
      text.includes("0-to-1") ||
      text.includes("founding") ||
      text.includes("fast-paced") ||
      text.includes("equity")
    ) {
      fits.early_stage_startups += 38;
      if (company?.fundingStage === "seed" || company?.fundingStage === "bootstrapped") {
        fits.early_stage_startups += 10;
      }
    }

    // 2. High-Growth Scale-Ups
    if (
      company?.fundingStage === "series_b" ||
      company?.fundingStage === "series_c_plus" ||
      text.includes("distributed") ||
      text.includes("kubernetes") ||
      text.includes("microservices") ||
      text.includes("kafka") ||
      job.seniorityLevel === "lead" ||
      job.seniorityLevel === "senior"
    ) {
      fits.scaleups_growth += 38;
      if (
        (company?.fundingStage === "series_b" || company?.fundingStage === "series_c_plus") &&
        (text.includes("distributed") || text.includes("microservices") || text.includes("kubernetes") || text.includes("kafka"))
      ) {
        fits.scaleups_growth += 10;
      }
    }

    // 3. AI-First Innovators
    if (
      job.techCategory === "ai_ml" ||
      text.includes("ai") ||
      text.includes("llm") ||
      text.includes("mcp") ||
      text.includes("vector") ||
      text.includes("rag") ||
      text.includes("prompt") ||
      text.includes("workers ai")
    ) {
      fits.ai_first_innovators += 42;
      if (
        job.techCategory === "ai_ml" ||
        text.includes("agent") ||
        text.includes("llm") ||
        text.includes("workers ai")
      ) {
        fits.ai_first_innovators += 8;
      }
    }

    // 4. US-Midwest Regional Tech
    if (job.isMidwest || company?.isMidwest || job.usRegion === "midwest") {
      fits.midwest_regional += 35;
    }

    // 5. New Grad & Junior Tech
    if (
      job.seniorityLevel === "intern" ||
      job.seniorityLevel === "new_grad" ||
      job.seniorityLevel === "junior" ||
      text.includes("entry") ||
      text.includes("graduate") ||
      text.includes("intern")
    ) {
      fits.new_grad_junior += 48;
    }

    // 6. Remote-First Boutique
    if (job.isRemote || text.includes("async") || text.includes("remote-first") || text.includes("boutique")) {
      fits.remote_first_boutique += 30;
    }

    // Normalize
    for (const key of Object.keys(fits) as TargetGroup[]) {
      fits[key] = Math.min(100, Math.max(10, fits[key]));
    }

    return fits;
  }
}
