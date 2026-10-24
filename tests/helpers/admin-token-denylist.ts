import { DENYLISTED_ADMIN_TOKEN_HASHES } from "../../src/admin-token-denylist.js";

/**
 * Test-only: denylist an extra SHA-256 hash so the leaked-token rejection path can be
 * exercised on CI with a synthetic fixture. Returns a function that removes it again.
 */
export function denylistAdminTokenHashForTests(sha256Hex: string): () => void {
  const h = sha256Hex.toLowerCase();
  const added = !DENYLISTED_ADMIN_TOKEN_HASHES.has(h);
  DENYLISTED_ADMIN_TOKEN_HASHES.add(h);
  return () => {
    if (added) DENYLISTED_ADMIN_TOKEN_HASHES.delete(h);
  };
}
