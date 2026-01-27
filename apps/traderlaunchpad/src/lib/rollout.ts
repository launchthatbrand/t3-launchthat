/**
 * Deterministic rollout utilities for feature flags.
 *
 * These are intentionally pure functions so they can be reused from:
 * - Convex backend (enforcement)
 * - UI (optional preview / diagnostics)
 */

// Deterministic, fast, non-crypto hash -> 0..99 bucket.
export const bucketForUser = (flagKey: string, userId: string): number => {
  const input = `${flagKey}::${userId}`;
  // FNV-1a 32-bit
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  // Convert to unsigned and bucketize
  return (hash >>> 0) % 100;
};

export const clampPercent = (n: unknown): number => {
  const v = typeof n === "number" && Number.isFinite(n) ? n : 0;
  return Math.max(0, Math.min(100, v));
};

export const isUserInRollout = (
  flagKey: string,
  userId: string,
  rolloutPercent: number,
): boolean => {
  const pct = clampPercent(rolloutPercent);
  if (pct <= 0) return false;
  if (pct >= 100) return true;
  return bucketForUser(flagKey, userId) < pct;
};

