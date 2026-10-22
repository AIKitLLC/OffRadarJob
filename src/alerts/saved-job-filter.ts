import { z } from "zod";
import { SeniorityLevelEnum } from "../types/domain.js";
import { RemotePreferenceSchema } from "../matching/candidate-profile.js";

export const SavedJobFilterSchema = z.object({
  id: z.string().min(1),
  userId: z.string().min(1),
  profileId: z.string().min(1),
  keywords: z.array(z.string()),
  seniorityLevels: z.array(SeniorityLevelEnum),
  locations: z.array(z.string()),
  remote: RemotePreferenceSchema,
  sponsorship: z.enum(["required", "any"]),
  minScore: z.number().int().min(0).max(100),
  isActive: z.boolean(),
});
export type SavedJobFilter = z.infer<typeof SavedJobFilterSchema>;

const FilterInputSchema = z
  .object({
    id: z.string().min(1).max(80).optional(),
    profileId: z.string().min(1),
    keywords: z.array(z.string().min(1).max(80)).max(30).optional(),
    seniorityLevels: z.array(SeniorityLevelEnum).max(7).optional(),
    locations: z.array(z.string().min(1).max(80)).max(12).optional(),
    remote: RemotePreferenceSchema.optional(),
    sponsorship: z.enum(["required", "any"]).optional(),
    minScore: z.number().int().min(0).max(100).optional(),
    isActive: z.boolean().optional(),
  })
  .strict();

export function parseSavedJobFilterInput(
  input: unknown,
  userId: string
): { ok: true; value: Omit<SavedJobFilter, "id"> & { id?: string } } | { ok: false; error: string } {
  const parsed = FilterInputSchema.safeParse(input);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return { ok: false, error: issue?.message ?? "Invalid job filter" };
  }
  const body = parsed.data;
  return {
    ok: true,
    value: {
      ...(body.id ? { id: body.id } : {}),
      profileId: body.profileId,
      keywords: (body.keywords ?? []).map((keyword) => keyword.trim()).filter((keyword) => keyword.length > 0),
      seniorityLevels: body.seniorityLevels ?? [],
      locations: (body.locations ?? []).map((location) => location.trim()).filter((location) => location.length > 0),
      remote: body.remote ?? "any",
      sponsorship: body.sponsorship ?? "any",
      minScore: body.minScore ?? 55,
      isActive: body.isActive ?? true,
      userId,
    },
  };
}
