// Public entry point of the cv-strategy package (ADR 0004). Import from here only.

export { parseCvBullets } from "./parse-cv-bullets.js";
export {
  CV_TEXT_MAX_CHARS,
  CV_STRATEGY_RULESET_VERSION,
  BulletMarkerSchema,
  CvBulletSchema,
  CvSectionSchema,
  ParsedCvSchema,
} from "./types.js";
export type { BulletMarker, CvBullet, CvSection, ParsedCv } from "./types.js";
