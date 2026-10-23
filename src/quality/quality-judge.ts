import { z } from "zod";
import { Job } from "../types/domain.js";
import { jobSearchText } from "../matching/job-text.js";
import { RuleAssessment } from "./quality-rules.js";

export const QUALITY_JUDGE_MODEL = "@cf/meta/llama-3.1-8b-instruct";

export interface WorkersAiBinding {
  run(model: string, inputs: Record<string, unknown>): Promise<unknown>;
}

export const QualityJudgeSchema = z.object({
  authenticity: z.enum(["real", "stale", "spam", "duplicate", "uncertain"]),
  completeness: z.number().min(0).max(100),
  sponsorship: z.enum(["yes", "no", "unknown"]),
  action: z.enum(["keep", "enrich", "drop"]),
  rationale: z.string().min(1).max(500),
});
export type QualityJudgeVerdict = z.infer<typeof QualityJudgeSchema>;

function responseText(payload: unknown): string {
  if (!payload || typeof payload !== "object") return "";
  const record = payload as Record<string, unknown>;
  if (typeof record["response"] === "string") return record["response"];
  if (typeof record["text"] === "string") return record["text"];
  return "";
}

export async function judgeJobQuality(
  job: Job,
  rules: RuleAssessment,
  ai: WorkersAiBinding | undefined
): Promise<{ verdict: QualityJudgeVerdict | null; invoked: boolean }> {
  if (!ai || rules.disposition !== "review") return { verdict: null, invoked: false };

  const prompt = `Classify this gathered job posting. Return only JSON with keys authenticity (real|stale|spam|duplicate|uncertain), completeness (0-100), sponsorship (yes|no|unknown), action (keep|enrich|drop), rationale (short).
Rule findings: ${rules.findings.join(", ") || "none"}.
Rule completeness: ${rules.completeness}. Rule sponsorship: ${rules.sponsorship}.
Title: ${job.title}
Status: ${job.status}
Location: ${job.location ?? ""}
Remote: ${job.isRemote ? "yes" : "no"}
Skills: ${job.skills.join(", ")}
Apply: ${job.applyTarget}
Posting:
${jobSearchText(job).slice(0, 2_000)}`;

  try {
    const payload = await ai.run(QUALITY_JUDGE_MODEL, {
      messages: [
        { role: "system", content: "You classify job-posting quality. You respond only with JSON." },
        { role: "user", content: prompt },
      ],
      max_tokens: 400,
      temperature: 0,
    });
    const text = responseText(payload);
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return { verdict: null, invoked: true };
    const raw = JSON.parse(jsonMatch[0]) as Record<string, unknown>;
    if (typeof raw["rationale"] === "string") raw["rationale"] = raw["rationale"].slice(0, 500);
    if (typeof raw["completeness"] === "number") raw["completeness"] = Math.max(0, Math.min(100, Math.round(raw["completeness"])));
    const parsed = QualityJudgeSchema.safeParse(raw);
    return { verdict: parsed.success ? parsed.data : null, invoked: true };
  } catch (error) {
    console.warn("[JobQualityJudge] Workers AI inference skipped:", error);
    return { verdict: null, invoked: true };
  }
}
