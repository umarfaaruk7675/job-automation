import { timingSafeEqual } from "node:crypto";

/** Compares two secrets in constant time so response timing can't leak a match. */
export function secretsMatch(given: string | null | undefined, expected: string | null | undefined) {
  if (!given || !expected) return false;
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}
