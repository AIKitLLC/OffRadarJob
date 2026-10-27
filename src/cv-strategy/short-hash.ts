// Synchronous 64-bit identifier hash (two FNV-1a 32-bit passes with different
// offsets). Used for stable bullet and section ids, not for security or for
// stored content hashes, which use SHA-256 from src/matching/stable-hash.ts.

function fnv1a32(value: string, offset: number): number {
  let hash = offset >>> 0;
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash >>> 0;
}

export function shortHash(value: string): string {
  const a = fnv1a32(value, 0x811c9dc5).toString(16).padStart(8, "0");
  const b = fnv1a32(value, 0x050c5d1f).toString(16).padStart(8, "0");
  return a + b;
}
