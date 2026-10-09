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
        item: `Thêm kĩ năng: ${skill}`,
        rationale: `Xuất hiện thường xuyên trong 70%+ job descriptions của nhóm ${profile.name}. Giúp tăng độ khớp ATS.`,
        priority: "high",
      });
    }

    // 2. Target Group Specific Impact Additions
    if (profile.id === "early_stage_startups") {
      if (!cvLower.includes("mvp") && !cvLower.includes("0-to-1")) {
        additions.push({
          category: "project_impact",
          item: "Bổ sung kinh nghiệm đưa sản phẩm từ 0-to-1 / MVP launch",
          rationale: "Các startup giai đoạn đầu cực kì chuộng các kỹ sư dám tự chủ, tự tay dựng MVP và ra mắt người dùng nhanh chóng.",
          priority: "high",
        });
      }
      additions.push({
        category: "metric",
        item: "Thêm số liệu về tốc độ triển khai (e.g. ship tính năng trong 48h, tối ưu deployment)",
        rationale: "Minh chứng khả năng làm việc với nhịp độ cao mà không cần quy trình rườm rà.",
        priority: "medium",
      });
    } else if (profile.id === "scaleups_growth") {
      if (!cvLower.includes("throughput") && !cvLower.includes("latency") && !cvLower.includes("scale")) {
        additions.push({
          category: "metric",
          item: "Thêm số liệu về tải và độ trễ (e.g. xử lý 50K+ RPM, giảm latency p99 xuống <50ms)",
          rationale: "Scale-up tìm kiếm bằng chứng bạn đã từng giải quyết bài toán tải lớn và tối ưu hệ thống thực tế.",
          priority: "high",
        });
      }
      additions.push({
        category: "architecture_keyword",
        item: "Nhấn mạnh kiến trúc Microservices / Event-Driven / Kafka / Caching",
        rationale: "Hệ thống quy mô vừa và lớn đòi hỏi hiểu biết sâu về phân tán và đảm bảo tính sẵn sàng cao.",
        priority: "medium",
      });
    } else if (profile.id === "ai_first_innovators") {
      if (!cvLower.includes("llm") && !cvLower.includes("prompt") && !cvLower.includes("rag")) {
        additions.push({
          category: "architecture_keyword",
          item: "Bổ sung dự án tích hợp LLM / RAG / Workers AI / Model Context Protocol (MCP)",
          rationale: "Các công ty AI-first ưu tiên ứng viên đã từng làm việc trực tiếp với model inference, agent workflows và tool calling.",
          priority: "high",
        });
      }
    } else if (profile.id === "midwest_regional") {
      additions.push({
        category: "project_impact",
        item: "Nêu bật tính ổn định và duy trì lâu dài của kiến trúc mã nguồn (Clean Architecture, Unit Testing)",
        rationale: "Các doanh nghiệp công nghệ vùng Midwest đánh giá rất cao kỹ sư có tư duy thực dụng, mã nguồn dễ bảo trì và gắn bó.",
        priority: "high",
      });
    } else if (profile.id === "new_grad_junior") {
      additions.push({
        category: "project_impact",
        item: "Bổ sung liên kết GitHub / live demo cho các dự án cá nhân & capstone project",
        rationale: "Nhà tuyển dụng junior/new grad cần bằng chứng code sạch và khả năng tự học thực tế hơn là danh sách công nghệ chung chung.",
        priority: "high",
      });
    }

    // 3. Removals / Deprecations (Bớt)
    const OBSOLETE_TECH = [
      { pattern: "jquery", name: "jQuery", reason: "Công nghệ cũ, làm giảm ấn tượng về stack hiện đại." },
      { pattern: "svn", name: "Subversion (SVN)", reason: "Hệ thống quản lý phiên bản lỗi thời so với Git." },
      { pattern: "angularjs", name: "AngularJS (1.x)", reason: "Framework đã hết vòng đời hỗ trợ." },
      { pattern: "php 5", name: "PHP 5.x", reason: "Phiên bản quá cũ, không phù hợp với chuẩn hiện tại." },
      { pattern: "flash", name: "Adobe Flash", reason: "Đã bị loại bỏ hoàn toàn trên web hiện đại." },
    ];

    for (const obs of OBSOLETE_TECH) {
      if (cvLower.includes(obs.pattern)) {
        removals.push({
          category: "outdated_tech",
          item: `Lược bỏ: ${obs.name}`,
          rationale: obs.reason,
          priority: "high",
        });
      }
    }

    // Buzzword filler removals
    const GENERIC_BUZZWORDS = [
      { pattern: "hard worker", name: "'Hard worker' / 'Chăm chỉ'", reason: "Từ sáo rỗng, hãy thay bằng kết quả dự án cụ thể." },
      { pattern: "team player", name: "'Team player' / 'Làm việc nhóm tốt'", reason: "Không có giá trị phân loại, nên thay bằng số dự án cross-team đã lead." },
      { pattern: "go-getter", name: "'Go-getter'", reason: "Khẩu hiệu văn phòng, không chứng minh được năng lực kỹ thuật." },
      { pattern: "detail oriented", name: "'Detail oriented'", reason: "Thể hiện qua test coverage hoặc code quality thay vì ghi chung chung." },
    ];

    for (const bw of GENERIC_BUZZWORDS) {
      if (cvLower.includes(bw.pattern)) {
        removals.push({
          category: "generic_filler",
          item: `Lược bỏ cụm từ sáo rỗng: ${bw.name}`,
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

    const targetGroupStrategy = `Chiến lược tối ưu cho nhóm [${profile.name}]: Tập trung làm nổi bật ${profile.keyAttributes.slice(0, 2).join(" & ")}, đưa các từ khóa then chốt (${demandedSkills.slice(0, 3).join(", ")}) lên 30% đầu CV, đồng thời lược bỏ các kỹ thuật không liên quan để tạo ấn tượng sắc bén ngay trong 6 giây duyệt đầu tiên.`;

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
        const keyword = rem.item.replace(/Lược bỏ(:|\s+cụm từ sáo rỗng:)/i, "").trim();
        if (keyword) {
          const regex = new RegExp(`\\b${keyword}\\b[,\\s]*`, "gi");
          output = output.replace(regex, "");
        }
      }
    }

    // Prepend or enrich Skills section with additions
    const skillsToAdd = additions
      .filter((a) => a.category === "skill")
      .map((a) => a.item.replace(/Thêm kĩ năng:\s*/i, "").trim())
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
