import { z } from "zod";
import { CareerPageTypeEnum } from "./domain.js";

// -----------------------------------------------------------------------------
// Type-safe Queue Message Contracts
// -----------------------------------------------------------------------------

export const DiscoveryMessageSchema = z.object({
  type: z.literal("DISCOVER_SEED"),
  traceId: z.string().min(1),
  source: z.enum(["manual", "seed_list", "hn_whoishiring", "github", "indie_hackers"]),
  sourceUrl: z.string().url(),
  domainHint: z.string().min(1).optional(),
  timestamp: z.number().int().positive(),
  retryCount: z.number().int().nonnegative().default(0),
});
export type DiscoveryMessage = z.infer<typeof DiscoveryMessageSchema>;

export const ProfileMessageSchema = z.object({
  type: z.literal("PROFILE_COMPANY"),
  traceId: z.string().min(1),
  domain: z.string().min(1),
  originUrl: z.string().url(),
  discoverySource: z.string(),
  timestamp: z.number().int().positive(),
  retryCount: z.number().int().nonnegative().default(0),
});
export type ProfileMessage = z.infer<typeof ProfileMessageSchema>;

export const HuntMessageSchema = z.object({
  type: z.literal("HUNT_CAREERS"),
  traceId: z.string().min(1),
  companyId: z.string().min(1),
  domain: z.string().min(1),
  baseUrl: z.string().url(),
  candidateLinks: z.array(z.string().url()).default([]),
  timestamp: z.number().int().positive(),
  retryCount: z.number().int().nonnegative().default(0),
});
export type HuntMessage = z.infer<typeof HuntMessageSchema>;

export const ExtractMessageSchema = z.object({
  type: z.literal("EXTRACT_JOBS"),
  traceId: z.string().min(1),
  companyId: z.string().min(1),
  careerPageId: z.string().min(1),
  careerPageUrl: z.string().url(),
  pageType: CareerPageTypeEnum,
  timestamp: z.number().int().positive(),
  retryCount: z.number().int().nonnegative().default(0),
});
export type ExtractMessage = z.infer<typeof ExtractMessageSchema>;

export const DlqMessageSchema = z.object({
  type: z.literal("DEAD_LETTER"),
  failedQueue: z.string().min(1),
  originalMessage: z.record(z.unknown()),
  errorMessage: z.string(),
  stackTrace: z.string().optional(),
  failedAt: z.number().int().positive(),
  attemptCount: z.number().int().positive(),
});
export type DlqMessage = z.infer<typeof DlqMessageSchema>;

export type DecoupledQueueMessage =
  | DiscoveryMessage
  | ProfileMessage
  | HuntMessage
  | ExtractMessage
  | DlqMessage;
