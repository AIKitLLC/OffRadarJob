import { z } from "zod";
import { CvTagCloudService } from "../services/cv-tag-cloud.js";
import { SeniorityLevel, SeniorityLevelEnum } from "../types/domain.js";

export const RemotePreferenceSchema = z.enum(["required", "preferred", "any"]);
export type RemotePreference = z.infer<typeof RemotePreferenceSchema>;

export const SponsorshipPreferenceSchema = z.enum(["required", "not_needed", "any"]);
export type SponsorshipPreference = z.infer<typeof SponsorshipPreferenceSchema>;

export const CandidateProfileSchema = z.object({
  headline: z.string(),
  summary: z.string(),
  skills: z.array(z.string()),
  seniorityLevels: z.array(SeniorityLevelEnum),
  locations: z.array(z.string()),
  remote: RemotePreferenceSchema,
  sponsorship: SponsorshipPreferenceSchema,
  keywords: z.array(z.string()),
});
export type CandidateProfile = z.infer<typeof CandidateProfileSchema>;

const ProfileInputSchema = z
  .object({
    headline: z.string().max(200).optional(),
    summary: z.string().max(8_000).optional(),
    text: z.string().max(20_000).optional(),
    skills: z.array(z.string().min(1).max(80)).max(80).optional(),
    seniority: SeniorityLevelEnum.optional(),
    seniorityLevels: z.array(SeniorityLevelEnum).max(7).optional(),
    locations: z.array(z.string().min(1).max(80)).max(12).optional(),
    remote: RemotePreferenceSchema.optional(),
    sponsorship: SponsorshipPreferenceSchema.optional(),
    keywords: z.array(z.string().min(1).max(80)).max(30).optional(),
  })
  .strict();

export type ProfileInput = z.infer<typeof ProfileInputSchema>;

const SENIORITY_PATTERNS: Array<{ level: SeniorityLevel; pattern: RegExp }> = [
  { level: "founding", pattern: /\bfounding\b/i },
  { level: "intern", pattern: /\bintern(ship)?\b/i },
  { level: "new_grad", pattern: /\bnew\s*grad|\bentry[- ]level\b|\bgraduate program\b/i },
  { level: "lead", pattern: /\b(lead|staff|principal)\b/i },
  { level: "senior", pattern: /\bsenior\b|\bsr\.?\b/i },
  { level: "junior", pattern: /\bjunior\b|\bjr\.?\b/i },
  { level: "mid", pattern: /\bmid[- ]level\b|\bmid\b/i },
];

const tagCloud = new CvTagCloudService();

function unique(values: readonly string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const value of values) {
    const trimmed = value.trim();
    const key = trimmed.toLowerCase();
    if (!trimmed || seen.has(key)) continue;
    seen.add(key);
    result.push(trimmed);
  }
  return result;
}

export function detectSeniority(text: string): SeniorityLevel | null {
  for (const entry of SENIORITY_PATTERNS) {
    if (entry.pattern.test(text)) return entry.level;
  }
  return null;
}

export function detectRemotePreference(text: string): RemotePreference {
  if (/fully remote|remote-first|remote only|remote-only/i.test(text)) return "required";
  if (/\bremote\b/i.test(text)) return "preferred";
  return "any";
}

export function detectSponsorshipPreference(text: string): SponsorshipPreference {
  if (/no sponsorship|do not require sponsorship|doesn't require sponsorship|without sponsorship|authorized to work/i.test(text)) {
    return "not_needed";
  }
  if (/sponsorship required|requires? (?:visa )?sponsorship|need(?:s)? sponsorship|visa sponsorship/i.test(text)) {
    return "required";
  }
  return "any";
}

function detectLocations(text: string): string[] {
  const found: string[] = [];
  const labeled = text.match(/location\s*:\s*([^\n]+)/i);
  if (labeled?.[1]) found.push(labeled[1].replace(/[.\s]+$/g, "").trim());
  const based = text.match(/based in ([A-Za-z][A-Za-z .,-]{1,60})/i);
  if (based?.[1]) found.push(based[1].replace(/[.\s]+$/g, "").trim());
  return unique(found).slice(0, 4);
}

function canonicalSkillName(skill: string): string {
  const tags = tagCloud.extractTagCloudFromText(skill);
  return tags[0]?.name ?? skill.trim();
}

export function skillsFromText(text: string): string[] {
  return tagCloud
    .extractTagCloudFromText(text)
    .filter((tag) => tag.status !== "deprecated")
    .map((tag) => tag.name);
}

export function parseCandidateProfile(input: unknown): { ok: true; value: CandidateProfile } | { ok: false; error: string } {
  const parsed = ProfileInputSchema.safeParse(input);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return { ok: false, error: issue?.message ?? "Invalid candidate profile" };
  }

  const body = parsed.data;
  const text = (body.text ?? "").slice(0, 20_000);
  const hasContent = Boolean(text.trim() || body.summary?.trim() || body.headline?.trim() || (body.skills && body.skills.length > 0));
  if (!hasContent) return { ok: false, error: "Profile needs text, a summary, a headline, or skills" };

  const explicitSkills = (body.skills ?? []).map((skill) => canonicalSkillName(skill));
  const extractedSkills = text ? skillsFromText(text) : [];
  const skills = unique([...explicitSkills, ...extractedSkills]);

  const detectedSeniority = detectSeniority(text);
  const seniorityLevels = uniqueSeniority(
    body.seniorityLevels && body.seniorityLevels.length > 0
      ? body.seniorityLevels
      : body.seniority
        ? [body.seniority]
        : detectedSeniority
          ? [detectedSeniority]
          : []
  );

  const locations = body.locations && body.locations.length > 0 ? unique(body.locations) : detectLocations(text);
  const headline = (body.headline ?? firstHeadline(text)).trim();
  const summary = (body.summary ?? text.slice(0, 500)).trim();

  return {
    ok: true,
    value: {
      headline,
      summary,
      skills,
      seniorityLevels,
      locations,
      remote: body.remote ?? detectRemotePreference(text),
      sponsorship: body.sponsorship ?? detectSponsorshipPreference(text),
      keywords: unique(body.keywords ?? []),
    },
  };
}

function uniqueSeniority(levels: readonly SeniorityLevel[]): SeniorityLevel[] {
  const seen = new Set<SeniorityLevel>();
  const result: SeniorityLevel[] = [];
  for (const level of levels) {
    if (seen.has(level)) continue;
    seen.add(level);
    result.push(level);
  }
  return result;
}

function firstHeadline(text: string): string {
  const line = text
    .split("\n")
    .map((part) => part.trim())
    .find((part) => part.length > 0);
  return (line ?? "").slice(0, 120);
}
