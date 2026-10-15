/**
 * CV Tag Cloud & Synchronized Job Description Matching Service
 * Extracts structured tech skill tag clouds from candidate CVs and
 * synchronizes/compares them against live employer JDs and market demand.
 */

import {
  SkillCategory,
  SkillTag,
  CvTagCloudAnalysis,
  SynchronizedTagCloudComparison,
  TargetGroup,
  TARGET_GROUPS,
  Job,
  RealtimeJdRankingReport,
} from "../types/domain.js";

export interface LexiconSkillDefinition {
  name: string;
  category: SkillCategory;
  defaultWeight: number; // 50 to 95 baseline
  aliases?: string[];
  isDeprecated?: boolean;
}

export class CvTagCloudService {
  /**
   * Curated Tech Lexicon with category assignments, weights, and deprecation flags
   */
  public static readonly LEXICON: LexiconSkillDefinition[] = [
    // Languages
    { name: "TypeScript", category: "languages", defaultWeight: 95, aliases: ["ts"] },
    { name: "JavaScript", category: "languages", defaultWeight: 88, aliases: ["js", "es6", "esnext"] },
    { name: "Python", category: "languages", defaultWeight: 94, aliases: ["py"] },
    { name: "Go", category: "languages", defaultWeight: 92, aliases: ["golang"] },
    { name: "Rust", category: "languages", defaultWeight: 93, aliases: ["rs"] },
    { name: "Java", category: "languages", defaultWeight: 84 },
    { name: "C#", category: "languages", defaultWeight: 82, aliases: ["csharp", ".net"] },
    { name: "C++", category: "languages", defaultWeight: 85, aliases: ["cpp"] },
    { name: "C", category: "languages", defaultWeight: 75 },
    { name: "Ruby", category: "languages", defaultWeight: 76 },
    { name: "PHP", category: "languages", defaultWeight: 68 },
    { name: "Swift", category: "languages", defaultWeight: 80 },
    { name: "Kotlin", category: "languages", defaultWeight: 83 },
    { name: "SQL", category: "languages", defaultWeight: 89 },
    { name: "Elixir", category: "languages", defaultWeight: 86 },
    { name: "Scala", category: "languages", defaultWeight: 78 },
    { name: "Zig", category: "languages", defaultWeight: 88 },
    { name: "Dart", category: "languages", defaultWeight: 80 },
    { name: "Solidity", category: "languages", defaultWeight: 85 },

    // AI & LLM (Top Demand)
    { name: "Workers AI", category: "ai_ml", defaultWeight: 98, aliases: ["cloudflare ai", "workers-ai"] },
    { name: "LLM", category: "ai_ml", defaultWeight: 96, aliases: ["large language models", "large language model"] },
    { name: "Model Context Protocol", category: "ai_ml", defaultWeight: 97, aliases: ["mcp", "mcp server", "mcp tools"] },
    { name: "RAG", category: "ai_ml", defaultWeight: 94, aliases: ["retrieval-augmented generation", "retrieval augmented generation"] },
    { name: "Vector Search", category: "ai_ml", defaultWeight: 93, aliases: ["vector db", "vector database", "pinecone", "chroma", "weaviate", "qdrant"] },
    { name: "Cloudflare Vectorize", category: "ai_ml", defaultWeight: 95, aliases: ["vectorize", "cf vectorize"] },
    { name: "Embeddings", category: "ai_ml", defaultWeight: 91, aliases: ["text-embedding", "embedding models"] },
    { name: "Prompt Engineering", category: "ai_ml", defaultWeight: 89, aliases: ["prompt design", "few-shot"] },
    { name: "Autonomous Agents", category: "ai_ml", defaultWeight: 94, aliases: ["ai agents", "agentic workflows", "agent loops"] },
    { name: "DeepSeek", category: "ai_ml", defaultWeight: 95, aliases: ["deepseek-r1", "deepseek-v3"] },
    { name: "Ollama", category: "ai_ml", defaultWeight: 91 },
    { name: "vLLM", category: "ai_ml", defaultWeight: 92 },
    { name: "Hugging Face", category: "ai_ml", defaultWeight: 90, aliases: ["huggingface", "transformers"] },
    { name: "LangGraph", category: "ai_ml", defaultWeight: 93 },
    { name: "DSPy", category: "ai_ml", defaultWeight: 89 },
    { name: "Whisper", category: "ai_ml", defaultWeight: 87 },
    { name: "PyTorch", category: "ai_ml", defaultWeight: 88 },
    { name: "TensorFlow", category: "ai_ml", defaultWeight: 80 },
    { name: "LangChain", category: "ai_ml", defaultWeight: 87 },
    { name: "LlamaIndex", category: "ai_ml", defaultWeight: 86 },
    { name: "OpenAI", category: "ai_ml", defaultWeight: 90, aliases: ["gpt-4", "gpt-4o", "chatgpt"] },
    { name: "Anthropic", category: "ai_ml", defaultWeight: 90, aliases: ["claude"] },

    // Cloud & Infrastructure
    { name: "Cloudflare Workers", category: "cloud_infra", defaultWeight: 96, aliases: ["cloudflare", "wrangler", "cf worker"] },
    { name: "Cloudflare Queues", category: "cloud_infra", defaultWeight: 92, aliases: ["cf queues", "workers queues"] },
    { name: "Cloudflare Pages", category: "cloud_infra", defaultWeight: 88, aliases: ["cf pages"] },
    { name: "Docker", category: "cloud_infra", defaultWeight: 90, aliases: ["containerization", "containers"] },
    { name: "Kubernetes", category: "cloud_infra", defaultWeight: 92, aliases: ["k8s"] },
    { name: "AWS", category: "cloud_infra", defaultWeight: 91, aliases: ["amazon web services", "s3", "lambda", "ec2"] },
    { name: "Google Cloud", category: "cloud_infra", defaultWeight: 86, aliases: ["gcp"] },
    { name: "Azure", category: "cloud_infra", defaultWeight: 83 },
    { name: "Terraform", category: "cloud_infra", defaultWeight: 88, aliases: ["iac", "infrastructure as code"] },
    { name: "CI/CD", category: "cloud_infra", defaultWeight: 89, aliases: ["github actions", "gitlab ci", "continuous integration"] },
    { name: "Linux", category: "cloud_infra", defaultWeight: 87, aliases: ["bash", "unix", "shell scripting"] },
    { name: "Serverless", category: "cloud_infra", defaultWeight: 90, aliases: ["edge computing", "edge functions"] },

    // Frameworks & Libraries
    { name: "Hono", category: "frameworks", defaultWeight: 94, aliases: ["hono.js", "honojs"] },
    { name: "React", category: "frameworks", defaultWeight: 92, aliases: ["react.js", "reactjs"] },
    { name: "Next.js", category: "frameworks", defaultWeight: 93, aliases: ["nextjs"] },
    { name: "Node.js", category: "frameworks", defaultWeight: 91, aliases: ["nodejs", "node"] },
    { name: "Vue.js", category: "frameworks", defaultWeight: 82, aliases: ["vue", "vuejs"] },
    { name: "FastAPI", category: "frameworks", defaultWeight: 90, aliases: ["fast api"] },
    { name: "Express", category: "frameworks", defaultWeight: 83, aliases: ["express.js", "expressjs"] },
    { name: "NestJS", category: "frameworks", defaultWeight: 85, aliases: ["nest.js"] },
    { name: "Tailwind CSS", category: "frameworks", defaultWeight: 88, aliases: ["tailwind", "tailwindcss"] },
    { name: "Svelte", category: "frameworks", defaultWeight: 84, aliases: ["sveltekit"] },
    { name: "Astro", category: "frameworks", defaultWeight: 89 },
    { name: "Remix", category: "frameworks", defaultWeight: 87, aliases: ["remix.run"] },
    { name: "SolidJS", category: "frameworks", defaultWeight: 84, aliases: ["solid.js"] },
    { name: "tRPC", category: "frameworks", defaultWeight: 90 },
    { name: "Django", category: "frameworks", defaultWeight: 81 },
    { name: "Spring Boot", category: "frameworks", defaultWeight: 83, aliases: ["spring", "springboot"] },
    { name: "Flask", category: "frameworks", defaultWeight: 77 },
    { name: "ASP.NET", category: "frameworks", defaultWeight: 79, aliases: ["aspnet", ".net core"] },
    { name: "React Native", category: "frameworks", defaultWeight: 89, aliases: ["react-native"] },
    { name: "Flutter", category: "frameworks", defaultWeight: 88 },
    { name: "SwiftUI", category: "frameworks", defaultWeight: 87 },
    { name: "Jetpack Compose", category: "frameworks", defaultWeight: 86 },

    // Databases & Messaging
    { name: "PostgreSQL", category: "database", defaultWeight: 93, aliases: ["postgres", "pgsql"] },
    { name: "Cloudflare D1", category: "database", defaultWeight: 94, aliases: ["d1 database", "cf d1", "d1"] },
    { name: "Cloudflare KV", category: "database", defaultWeight: 90, aliases: ["workers kv", "cf kv"] },
    { name: "Redis", category: "database", defaultWeight: 90 },
    { name: "Kafka", category: "database", defaultWeight: 91, aliases: ["apache kafka"] },
    { name: "MySQL", category: "database", defaultWeight: 82 },
    { name: "MongoDB", category: "database", defaultWeight: 79, aliases: ["mongo"] },
    { name: "SQLite", category: "database", defaultWeight: 84, aliases: ["sqlite3"] },
    { name: "DuckDB", category: "database", defaultWeight: 91 },
    { name: "Polars", category: "database", defaultWeight: 90 },
    { name: "Prisma", category: "database", defaultWeight: 88, aliases: ["prisma orm"] },
    { name: "Drizzle ORM", category: "database", defaultWeight: 92, aliases: ["drizzle"] },
    { name: "DynamoDB", category: "database", defaultWeight: 85 },
    { name: "Elasticsearch", category: "database", defaultWeight: 83, aliases: ["elastic", "opensearch"] },
    { name: "RabbitMQ", category: "database", defaultWeight: 81 },
    { name: "ClickHouse", category: "database", defaultWeight: 88 },
    { name: "Snowflake", category: "database", defaultWeight: 87 },

    // Architecture & Core Practices
    { name: "Distributed Systems", category: "architecture", defaultWeight: 95, aliases: ["distributed computing", "consensus", "raft", "hệ thống phân tán"] },
    { name: "Durable Objects", category: "architecture", defaultWeight: 95, aliases: ["durable object"] },
    { name: "Microservices", category: "architecture", defaultWeight: 89, aliases: ["microservice architecture", "kiến trúc microservices"] },
    { name: "Clean Architecture", category: "architecture", defaultWeight: 90, aliases: ["hexagonal architecture", "onion architecture"] },
    { name: "Domain-Driven Design", category: "architecture", defaultWeight: 89, aliases: ["ddd"] },
    { name: "CQRS", category: "architecture", defaultWeight: 88 },
    { name: "REST APIs", category: "architecture", defaultWeight: 88, aliases: ["rest", "restful", "rest api"] },
    { name: "GraphQL", category: "architecture", defaultWeight: 85 },
    { name: "gRPC", category: "architecture", defaultWeight: 88, aliases: ["protobuf", "protocol buffers"] },
    { name: "WebSockets", category: "architecture", defaultWeight: 87, aliases: ["websocket", "socket.io"] },
    { name: "WebAssembly", category: "architecture", defaultWeight: 88, aliases: ["wasm"] },
    { name: "Event-Driven", category: "architecture", defaultWeight: 90, aliases: ["event-driven architecture", "pub/sub", "pubsub"] },
    { name: "High Concurrency", category: "architecture", defaultWeight: 91, aliases: ["concurrency", "multithreading", "async", "asynchronous programming", "chịu tải cao", "xử lý đồng thời"] },
    { name: "0-to-1 Build", category: "architecture", defaultWeight: 92, aliases: ["0-to-1", "0 to 1", "mvp", "rapid prototyping"] },
    { name: "Automated Testing", category: "architecture", defaultWeight: 87, aliases: ["unit testing", "integration testing", "tdd", "vitest", "jest", "kiểm thử tự động"] },

    // Tools & Observability
    { name: "Git", category: "tools", defaultWeight: 88, aliases: ["github", "gitlab"] },
    { name: "OpenTelemetry", category: "tools", defaultWeight: 92, aliases: ["otel", "opentelemetry sdk"] },
    { name: "Prometheus", category: "tools", defaultWeight: 86 },
    { name: "Grafana", category: "tools", defaultWeight: 86 },
    { name: "Bun", category: "tools", defaultWeight: 91 },
    { name: "Deno", category: "tools", defaultWeight: 85 },
    { name: "Zod", category: "tools", defaultWeight: 91 },
    { name: "Vite", category: "tools", defaultWeight: 86 },
    { name: "Webpack", category: "tools", defaultWeight: 75 },
    { name: "Postman", category: "tools", defaultWeight: 78 },

    // Deprecated / Outdated Tech (Flagged for downranking or removal)
    { name: "jQuery", category: "other", defaultWeight: 35, isDeprecated: true },
    { name: "SVN", category: "tools", defaultWeight: 30, aliases: ["subversion"], isDeprecated: true },
    { name: "CVS", category: "tools", defaultWeight: 20, isDeprecated: true },
    { name: "AngularJS", category: "frameworks", defaultWeight: 35, aliases: ["angular 1", "angularjs 1.x"], isDeprecated: true },
    { name: "PHP 5", category: "languages", defaultWeight: 25, isDeprecated: true },
    { name: "SOAP", category: "architecture", defaultWeight: 35, aliases: ["xml-rpc", "wsdl"], isDeprecated: true },
    { name: "Flash", category: "other", defaultWeight: 10, aliases: ["actionscript"], isDeprecated: true },
    { name: "Bower", category: "tools", defaultWeight: 25, isDeprecated: true },
  ];

  /**
   * Extract all matched skills and build a weighted tag cloud from text
   */
  public extractTagCloudFromText(content: string): SkillTag[] {
    if (!content || !content.trim()) return [];

    // Bounded input length prevents CPU starvation on massive documents
    const safeContent = content.length > 100_000 ? content.slice(0, 100_000) : content;
    const lowerText = ` ${safeContent.toLowerCase()} `;
    const tagsMap = new Map<string, SkillTag>();

    for (const def of CvTagCloudService.LEXICON) {
      const namesToTest = [def.name.toLowerCase(), ...(def.aliases || []).map((a) => a.toLowerCase())];
      let matchesCount = 0;

      for (const alias of namesToTest) {
        // Special case for single-letter language "c":
        // Guard against false positives like (c) copyright, c/o, c-suite, vitamin c, section c
        if (alias === "c") {
          const isFalsePositive =
            lowerText.includes("(c)") ||
            lowerText.includes("c/o") ||
            lowerText.includes("c-level") ||
            lowerText.includes("c-suite") ||
            lowerText.includes("vitamin c");

          const hasTechnicalC =
            /\b(?:c\/c\+\+|c\s+language|c\s+programming|ansi\s+c|c99|c11|embedded\s+c)\b/i.test(lowerText) ||
            /\bc\s*,\s*(?:c\+\+|c#|python|rust|go|java|assembly)\b/i.test(lowerText) ||
            /\bc\s+and\s+(?:c\+\+|c#|python|rust|go|java|assembly)\b/i.test(lowerText) ||
            /\b(?:proficient|experience|expert|programming|coded|written)\s+in\s+c\b/i.test(lowerText);

          if (hasTechnicalC || (!isFalsePositive && /\bc\b/i.test(lowerText) && (lowerText.includes("c,") || lowerText.includes("c/")))) {
            matchesCount += 1;
          }
          continue;
        }

        // Safe regex escaping
        const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        // Word boundary or punctuation boundary including angle brackets
        const regex = new RegExp(`(?:^|[\\s,;:.()/\\-\\[\\]<>])(${escaped})(?=[\\s,;:.()/\\-\\[\\]<>]|$)`, "gi");
        const found = lowerText.match(regex);
        if (found) {
          matchesCount += found.length;
        }
      }

      if (matchesCount > 0) {
        const calculatedWeight = def.isDeprecated
          ? Math.max(10, Math.round(def.defaultWeight - matchesCount * 2))
          : Math.min(100, Math.max(20, Math.round(def.defaultWeight + Math.min(matchesCount, 5) * 3)));

        tagsMap.set(def.name, {
          name: def.name,
          category: def.category,
          weight: calculatedWeight,
          frequency: matchesCount,
          status: def.isDeprecated ? "deprecated" : undefined,
        });
      }
    }

    // Sort by weight descending, then by frequency
    return Array.from(tagsMap.values()).sort((a, b) => {
      if (b.weight !== a.weight) return b.weight - a.weight;
      return b.frequency - a.frequency;
    });
  }

  /**
   * Perform comprehensive Tag Cloud analysis on a CV
   */
  public analyzeCv(
    content: string,
    meta: { cvId?: string | undefined; title?: string | undefined } = {}
  ): CvTagCloudAnalysis {
    const tags = this.extractTagCloudFromText(content);
    const topSkills = tags
      .filter((t) => t.status !== "deprecated")
      .slice(0, 12)
      .map((t) => t.name);

    // Compute category breakdown
    const categoryBreakdown: Record<SkillCategory, number> = {
      languages: 0,
      frameworks: 0,
      cloud_infra: 0,
      ai_ml: 0,
      database: 0,
      architecture: 0,
      tools: 0,
      other: 0,
    };

    for (const tag of tags) {
      categoryBreakdown[tag.category] = (categoryBreakdown[tag.category] || 0) + 1;
    }

    // Calculate Target Group Fit based on extracted skill tags
    const detectedTargetGroupFit: Record<TargetGroup, number> = {
      early_stage_startups: 50,
      scaleups_growth: 50,
      ai_first_innovators: 50,
      midwest_regional: 50,
      new_grad_junior: 50,
      remote_first_boutique: 50,
    };

    const tagNamesSet = new Set(tags.map((t) => t.name.toLowerCase()));
    const lowerContent = content.toLowerCase();

    // 1. AI-First Innovators Fit
    if (tagNamesSet.has("workers ai") || tagNamesSet.has("model context protocol") || tagNamesSet.has("llm") || tagNamesSet.has("rag")) {
      detectedTargetGroupFit.ai_first_innovators += 45;
    }
    if (categoryBreakdown.ai_ml >= 2) detectedTargetGroupFit.ai_first_innovators += 15;

    // 2. High-Growth Scale-Ups Fit
    if (tagNamesSet.has("distributed systems") || tagNamesSet.has("kafka") || tagNamesSet.has("kubernetes") || tagNamesSet.has("microservices")) {
      detectedTargetGroupFit.scaleups_growth += 45;
    }
    if (categoryBreakdown.database >= 2 && categoryBreakdown.cloud_infra >= 2) {
      detectedTargetGroupFit.scaleups_growth += 15;
    }

    // 3. Early-Stage Startups Fit
    if (tagNamesSet.has("0-to-1 build") || tagNamesSet.has("typescript") || tagNamesSet.has("next.js") || tagNamesSet.has("cloudflare workers")) {
      detectedTargetGroupFit.early_stage_startups += 40;
    }
    if (lowerContent.includes("mvp") || lowerContent.includes("founding") || lowerContent.includes("0-to-1")) {
      detectedTargetGroupFit.early_stage_startups += 18;
    }

    // 4. US-Midwest Regional Fit
    if (lowerContent.includes("chicago") || lowerContent.includes("midwest") || lowerContent.includes("illinois") || lowerContent.includes("wisconsin")) {
      detectedTargetGroupFit.midwest_regional += 45;
    } else if (tagNamesSet.has("java") || tagNamesSet.has("c#") || tagNamesSet.has("spring boot")) {
      detectedTargetGroupFit.midwest_regional += 30;
    }

    // 5. New Grad & Junior Tech Fit
    if (lowerContent.includes("student") || lowerContent.includes("intern") || lowerContent.includes("graduate") || lowerContent.includes("gpa")) {
      detectedTargetGroupFit.new_grad_junior += 45;
    } else if (tags.length <= 8 && (tagNamesSet.has("git") || tagNamesSet.has("sql"))) {
      detectedTargetGroupFit.new_grad_junior += 25;
    }

    // 6. Remote-First Boutique Fit
    if (lowerContent.includes("remote") || lowerContent.includes("async") || tagNamesSet.has("clean code")) {
      detectedTargetGroupFit.remote_first_boutique += 40;
    }

    // Cap fits
    for (const k of Object.keys(detectedTargetGroupFit) as TargetGroup[]) {
      detectedTargetGroupFit[k] = Math.min(100, Math.max(10, detectedTargetGroupFit[k]));
    }

    // Determine primary target group
    let primaryTargetGroup: TargetGroup = "early_stage_startups";
    let maxFit = -1;
    for (const [grp, fit] of Object.entries(detectedTargetGroupFit) as [TargetGroup, number][]) {
      if (fit > maxFit) {
        maxFit = fit;
        primaryTargetGroup = grp;
      }
    }

    // Infer Role Title
    let extractedRole: string | undefined = undefined;
    const roleMatches =
      content.match(/(?:title|role|position|experience as|profile|vị trí|chức danh):\s*([^\n\r]+)/i) ||
      content.match(/^#\s+[^\n\-–—]+\s*[-–—]\s*([^\n\r]+)/m);
    if (roleMatches && roleMatches[1]) {
      extractedRole = roleMatches[1].trim();
    }

    return {
      cvId: meta.cvId,
      title: meta.title,
      totalTags: tags.length,
      tags,
      categoryBreakdown,
      topSkills,
      detectedTargetGroupFit,
      primaryTargetGroup,
      extractedRole,
    };
  }

  /**
   * Extract tag cloud from a Job Description
   */
  public extractTagCloudFromJob(job: Job): SkillTag[] {
    const combinedText = [
      job.title,
      ...(job.skills || []),
      job.descriptionSummary || "",
      job.rawContent || "",
    ].join(" ");

    const tags = this.extractTagCloudFromText(combinedText);

    // Boost skills that appear in explicit job.skills array
    if (Array.isArray(job.skills)) {
      const explicitSet = new Set(job.skills.map((s) => s.toLowerCase().trim()));
      for (const t of tags) {
        if (explicitSet.has(t.name.toLowerCase())) {
          t.weight = Math.min(100, t.weight + 15);
          t.frequency += 2;
        }
      }
    }

    return tags;
  }

  /**
   * Synchronized comparison between CV tags and target JD / Market demand
   */
  public compareCvWithJd(
    cvInput: string | SkillTag[],
    target: {
      job?: Job | undefined;
      targetGroup?: TargetGroup | undefined;
      report?: RealtimeJdRankingReport | undefined;
    } = {}
  ): SynchronizedTagCloudComparison {
    const cvTags = Array.isArray(cvInput) ? cvInput : this.extractTagCloudFromText(cvInput);

    let jdTags: SkillTag[] = [];
    let targetContextType: "job" | "target_group" | "market" = "market";
    let targetTitle = "Real-time Off-Radar Tech Market Index";
    let targetCompany: string | undefined = undefined;
    let targetGroup = target.targetGroup;

    if (target.job) {
      targetContextType = "job";
      targetTitle = target.job.title;
      targetCompany = target.job.companyName ?? undefined;
      jdTags = this.extractTagCloudFromJob(target.job);
    } else if (target.targetGroup && TARGET_GROUPS[target.targetGroup]) {
      targetContextType = "target_group";
      const profile = TARGET_GROUPS[target.targetGroup];
      targetTitle = `${profile.name} Archetype`;

      // Build JD tags from profile keywords and market segment report
      const profileText = `${profile.recommendedKeywords.join(" ")} ${profile.keyAttributes.join(" ")} ${profile.description}`;
      jdTags = this.extractTagCloudFromText(profileText);

      if (target.report && target.report.targetGroupBreakdown[target.targetGroup]) {
        const topSegmentSkills = target.report.targetGroupBreakdown[target.targetGroup].topSkills;
        const segmentText = topSegmentSkills.join(" ");
        const segmentTags = this.extractTagCloudFromText(segmentText);
        for (const st of segmentTags) {
          if (!jdTags.some((t) => t.name.toLowerCase() === st.name.toLowerCase())) {
            jdTags.push(st);
          }
        }
      }
    } else if (target.report && target.report.trendingSkills.length > 0) {
      targetContextType = "market";
      targetTitle = "Live Market JD Aggregation";
      // Construct tags from trendingSkills
      for (const ts of target.report.trendingSkills) {
        const matchedLex = CvTagCloudService.LEXICON.find(
          (l) => l.name.toLowerCase() === ts.skill.toLowerCase() || (l.aliases || []).includes(ts.skill.toLowerCase())
        );
        jdTags.push({
          name: matchedLex ? matchedLex.name : ts.skill,
          category: matchedLex ? matchedLex.category : "other",
          weight: Math.min(100, Math.max(50, 70 + ts.frequency * 2)),
          frequency: ts.frequency,
          marketGrowth: ts.demandGrowth,
        });
      }
    } else {
      // Fallback: top 15 lexicon skills
      jdTags = CvTagCloudService.LEXICON.filter((l) => !l.isDeprecated)
        .slice(0, 15)
        .map((l) => ({
          name: l.name,
          category: l.category,
          weight: l.defaultWeight,
          frequency: 5,
        }));
    }

    // Set comparison mappings
    const cvNamesMap = new Map<string, SkillTag>();
    for (const t of cvTags) {
      cvNamesMap.set(t.name.toLowerCase(), t);
    }

    const jdNamesMap = new Map<string, SkillTag>();
    for (const t of jdTags) {
      jdNamesMap.set(t.name.toLowerCase(), t);
    }

    const matchedTags: SkillTag[] = [];
    const missingTags: SkillTag[] = [];
    const cvOnlyTags: SkillTag[] = [];
    const deprecatedTags: SkillTag[] = [];

    // Classify CV tags
    for (const t of cvTags) {
      if (t.status === "deprecated") {
        deprecatedTags.push({ ...t, status: "deprecated" });
        continue;
      }

      if (jdNamesMap.has(t.name.toLowerCase())) {
        matchedTags.push({ ...t, status: "matched" });
      } else {
        cvOnlyTags.push({ ...t, status: "cv_only" });
      }
    }

    // Classify JD tags to find missing skills in CV
    for (const t of jdTags) {
      if (!cvNamesMap.has(t.name.toLowerCase())) {
        missingTags.push({ ...t, status: "missing" });
      }
    }

    // Sort missing tags by weight descending (highest priority to add)
    missingTags.sort((a, b) => b.weight - a.weight);

    // Compute match percentage
    let matchPercentage = 0;
    if (jdTags.length > 0) {
      if (matchedTags.length === 0) {
        matchPercentage = 0;
      } else {
        const matchRatio = matchedTags.length / jdTags.length;
        matchPercentage = Math.min(100, Math.max(10, Math.round(matchRatio * 100)));
      }
    } else {
      matchPercentage = 75;
    }

    // Compute Importance-Weighted Fit Score
    const totalJdWeight = jdTags.reduce((sum, t) => sum + t.weight, 0);
    const matchedJdWeight = matchedTags.reduce((sum, t) => {
      const jdTag = jdNamesMap.get(t.name.toLowerCase());
      return sum + (jdTag ? jdTag.weight : t.weight);
    }, 0);
    const weightedFitScore = matchedTags.length === 0
      ? 0
      : (totalJdWeight > 0
        ? Math.min(100, Math.max(10, Math.round((matchedJdWeight / totalJdWeight) * 100)))
        : matchPercentage);

    // Compute Category Match Breakdown
    const ALL_CATEGORIES: SkillCategory[] = [
      "languages",
      "frameworks",
      "cloud_infra",
      "ai_ml",
      "database",
      "architecture",
      "tools",
      "other",
    ];
    const categoryMatchBreakdown: Record<SkillCategory, { matched: number; totalJd: number; percentage: number }> = {
      languages: { matched: 0, totalJd: 0, percentage: 100 },
      frameworks: { matched: 0, totalJd: 0, percentage: 100 },
      cloud_infra: { matched: 0, totalJd: 0, percentage: 100 },
      ai_ml: { matched: 0, totalJd: 0, percentage: 100 },
      database: { matched: 0, totalJd: 0, percentage: 100 },
      architecture: { matched: 0, totalJd: 0, percentage: 100 },
      tools: { matched: 0, totalJd: 0, percentage: 100 },
      other: { matched: 0, totalJd: 0, percentage: 100 },
    };

    for (const t of jdTags) {
      categoryMatchBreakdown[t.category].totalJd += 1;
    }
    for (const t of matchedTags) {
      categoryMatchBreakdown[t.category].matched += 1;
    }
    for (const cat of ALL_CATEGORIES) {
      const data = categoryMatchBreakdown[cat];
      data.percentage = data.totalJd > 0 ? Math.round((data.matched / data.totalJd) * 100) : 100;
    }

    // Compute ATS Readability & Structural Score
    let atsScore = 82;
    if (deprecatedTags.length > 0) {
      atsScore -= deprecatedTags.length * 15;
    }
    if (matchedTags.length >= 5) {
      atsScore += 8;
    }
    if (cvTags.length >= 8 && cvTags.length <= 35) {
      atsScore += 6;
    } else if (cvTags.length < 4) {
      atsScore -= 15;
    }
    const atsReadabilityScore = Math.min(99, Math.max(20, atsScore));

    // Dynamic Actionable Strategic Summary
    let recommendationSummary = "";
    if (matchPercentage >= 75) {
      recommendationSummary = `CV exhibits high compatibility (${matchPercentage}% standard, ${weightedFitScore}% weighted fit) with hiring requirements. Continue strengthening architectural impact and quantified achievement metrics.`;
    } else if (matchPercentage >= 50) {
      const topMissing = missingTags.slice(0, 3).map((t) => t.name).join(", ");
      recommendationSummary = `CV achieves moderate alignment (${matchPercentage}%), but lacks key high-demand skills: ${topMissing || "market technologies"}. Add these keywords in concrete project bullets to pass ATS parsing.`;
    } else {
      const topMissing = missingTags.slice(0, 4).map((t) => t.name).join(", ");
      recommendationSummary = `CV exhibits significant divergence from the target hiring archetype. Strongly recommend incorporating required core technologies: ${topMissing || "core stack"} and removing obsolete tooling.`;
    }

    return {
      cvTags,
      jdTags,
      matchedTags,
      missingTags,
      cvOnlyTags,
      deprecatedTags,
      matchPercentage,
      weightedFitScore,
      categoryMatchBreakdown,
      atsReadabilityScore,
      recommendationSummary,
      targetContext: {
        type: targetContextType,
        id: target.job?.id,
        title: targetTitle,
        companyName: targetCompany,
        targetGroup,
      },
    };
  }

  /**
   * Parse uploaded CV documents (TXT, MD, JSON, PDF text streams, DOCX XML)
   */
  public parseUploadedDocument(
    fileName: string,
    rawContent: string,
    contentType?: string | undefined
  ): {
    title: string;
    targetRole?: string | undefined;
    content: string;
    skills: string[];
    tagCloud: CvTagCloudAnalysis;
  } {
    let extractedText = rawContent;

    // Detect Base64 encoding
    if (rawContent.startsWith("data:") && rawContent.includes(";base64,")) {
      const base64Data = rawContent.split(";base64,")[1] || "";
      try {
        extractedText = atob(base64Data);
      } catch {
        extractedText = rawContent;
      }
    }

    const lowerName = fileName.toLowerCase();

    // 1. JSON file
    let explicitRole: string | undefined = undefined;
    if (lowerName.endsWith(".json")) {
      try {
        const parsed = JSON.parse(extractedText);
        if (typeof parsed === "object" && parsed !== null) {
          if (parsed.content || parsed.resume || parsed.cv) {
            extractedText = parsed.content || parsed.resume || parsed.cv;
          } else if (Array.isArray(parsed.skills) || parsed.basics) {
            // Standard JSON Resume schema
            const lines: string[] = [];
            if (parsed.basics?.name) lines.push(`# ${parsed.basics.name}`);
            if (parsed.basics?.label) {
              lines.push(`Role: ${parsed.basics.label}`);
              explicitRole = parsed.basics.label;
            }
            if (parsed.basics?.summary) lines.push(parsed.basics.summary);
            if (Array.isArray(parsed.skills)) {
              lines.push("## Technical Skills");
              for (const sk of parsed.skills) {
                const kw = Array.isArray(sk.keywords) ? sk.keywords.join(", ") : "";
                lines.push(`- ${sk.name || ""}: ${kw}`);
              }
            }
            extractedText = lines.join("\n\n");
          } else {
            extractedText = JSON.stringify(parsed, null, 2);
          }
        }
      } catch {}
    }

    // 2. PDF text stream extraction
    if (lowerName.endsWith(".pdf") || contentType?.includes("pdf")) {
      extractedText = this.extractTextFromPdfStream(extractedText);
    }

    // 3. DOCX text stream extraction (word/document.xml <w:t> tags)
    if (lowerName.endsWith(".docx") || contentType?.includes("wordprocessingml")) {
      extractedText = this.extractTextFromDocxXml(extractedText);
    }

    // Clean whitespace and sanitize
    const cleanedContent = this.cleanExtractedCvText(extractedText);

    // Infer title from file name or heading
    let title = fileName.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ").trim();
    if (!title || title.toLowerCase() === "cv" || title.toLowerCase() === "resume") {
      title = "Imported Master CV";
    }

    const firstHeading = cleanedContent.match(/^#\s+([^\n\r]+)/m);
    if (firstHeading && firstHeading[1]) {
      const candidateName = firstHeading[1].trim();
      title = `${candidateName} CV`;
    }

    // Generate tag cloud
    const tagCloud = this.analyzeCv(cleanedContent, { title });

    return {
      title,
      targetRole: explicitRole || tagCloud.extractedRole || (tagCloud.primaryTargetGroup ? TARGET_GROUPS[tagCloud.primaryTargetGroup]?.name : undefined),
      content: cleanedContent,
      skills: tagCloud.topSkills,
      tagCloud,
    };
  }

  // --- Internal Parsing Helpers ---

  private extractTextFromPdfStream(pdfRaw: string): string {
    const textChunks: string[] = [];

    // Match text blocks between BT (Begin Text) and ET (End Text)
    const btEtRegex = /BT[\s\S]*?ET/g;
    const blocks = pdfRaw.match(btEtRegex) || [];

    for (const block of blocks) {
      // Match parenthesized text literals: (Hello World) Tj or (Text) '
      const tjMatches = block.match(/\(([^()]*)\)\s*(?:Tj|'|")/g) || [];
      for (const tj of tjMatches) {
        const cleaned = tj.replace(/\s*(?:Tj|'|")$/, "").replace(/^\(/, "").replace(/\)$/, "").trim();
        if (cleaned) textChunks.push(cleaned);
      }

      // Match array of texts: [(Hello) 20 (World)] TJ
      const arrayMatches = block.match(/\[([\s\S]*?)\]\s*TJ/g) || [];
      for (const arr of arrayMatches) {
        const innerStrings = arr.match(/\(([^()]*)\)/g) || [];
        const combined = innerStrings.map((s) => s.slice(1, -1)).join("");
        if (combined.trim()) textChunks.push(combined.trim());
      }
    }

    if (textChunks.length >= 8) {
      return textChunks.join(" ");
    }

    // Fallback: extract continuous printable text tokens from binary
    const printableWords = pdfRaw.match(/[A-Za-z0-9+#./-]{3,}/g) || [];
    const filteredWords = printableWords.filter(
      (w) => !w.startsWith("obj") && !w.startsWith("endobj") && !w.startsWith("xref") && !w.startsWith("stream")
    );

    return filteredWords.length > 20 ? filteredWords.join(" ") : pdfRaw;
  }

  private extractTextFromDocxXml(docxRaw: string): string {
    // DOCX stores text inside <w:t> tags
    const wtRegex = /<w:t(?:\s+[^>]*)?>([\s\S]*?)<\/w:t>/g;
    const matches: string[] = [];
    let match: RegExpExecArray | null;

    while ((match = wtRegex.exec(docxRaw)) !== null) {
      if (match[1] && match[1].trim()) {
        matches.push(match[1]);
      }
    }

    if (matches.length > 0) {
      return matches.join(" ");
    }

    // Strip generic XML tags
    return docxRaw.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  }

  private cleanExtractedCvText(raw: string): string {
    let text = raw.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

    // Remove excessive null bytes or control characters
    text = text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");

    // Sanitize HTML block tags to newlines and strip inline tags
    text = text.replace(/<(?:br|p|div|li|\/li|\/p|\/div)[^>]*>/gi, "\n");
    text = text.replace(/<[^>]+>/g, " ");

    // If it looks like raw plain text without markdown headings, format into readable markdown
    if (!text.includes("#") && !text.includes("##")) {
      const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
      if (lines.length > 0 && lines[0]) {
        lines[0] = `# ${lines[0]}`;
      }
      text = lines.join("\n\n");
    }

    return text.trim();
  }
}
