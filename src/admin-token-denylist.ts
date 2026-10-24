/**
 * SHA-256 hashes of admin tokens that must never be accepted (leaked values).
 * Internal module: not re-exported from src/index.ts. Seeded by src/index.ts.
 */
export const DENYLISTED_ADMIN_TOKEN_HASHES = new Set<string>();
