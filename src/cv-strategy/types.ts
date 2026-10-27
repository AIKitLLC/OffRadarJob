import { z } from "zod";

// Contracts for the cv-strategy package (ADR 0004, #16).

/** Longest CV text accepted. Longer input is rejected, not truncated. */
export const CV_TEXT_MAX_CHARS = 20_000;

/** Bump when any rule in this package changes; stored results record it (ADR 0002 convention). */
export const CV_STRATEGY_RULESET_VERSION = "cv-strategy-2026-10-27.1";

export const BulletMarkerSchema = z.enum(["dash", "star", "dot", "number"]);
export type BulletMarker = z.infer<typeof BulletMarkerSchema>;

export const CvBulletSchema = z.object({
  id: z.string().min(1),
  sectionId: z.string().min(1),
  text: z.string().min(1),
  marker: BulletMarkerSchema,
});
export type CvBullet = z.infer<typeof CvBulletSchema>;

export const CvSectionSchema = z.object({
  id: z.string().min(1),
  /** Empty for text before the first heading. */
  title: z.string(),
  bulletIds: z.array(z.string().min(1)),
});
export type CvSection = z.infer<typeof CvSectionSchema>;

export const ParsedCvSchema = z.object({
  sections: z.array(CvSectionSchema),
  bullets: z.array(CvBulletSchema),
});
export type ParsedCv = z.infer<typeof ParsedCvSchema>;
