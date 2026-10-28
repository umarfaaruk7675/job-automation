import { describe, expect, it } from "vitest";
import { secretsMatch } from "@/lib/secret";
import { safeNext } from "@/lib/safe-next";

describe("secretsMatch", () => {
  it("accepts only the exact secret", () => {
    expect(secretsMatch("abc123", "abc123")).toBe(true);
    expect(secretsMatch("abc124", "abc123")).toBe(false);
    expect(secretsMatch("abc12", "abc123")).toBe(false);
    expect(secretsMatch("abc1234", "abc123")).toBe(false);
  });
  it("never matches when either side is missing or empty", () => {
    expect(secretsMatch(null, "abc")).toBe(false);
    expect(secretsMatch("abc", undefined)).toBe(false);
    expect(secretsMatch("", "")).toBe(false);
    expect(secretsMatch(undefined, undefined)).toBe(false);
  });
});

describe("safeNext", () => {
  it("keeps same-site paths and rejects anything that leaves the site", () => {
    expect(safeNext("/dashboard/applications?tab=hold")).toBe("/dashboard/applications?tab=hold");
    for (const bad of ["//evil.com", "/\\evil.com", "https://evil.com", "javascript:alert(1)", "", null, undefined, "/\t/evil.com"]) {
      expect(safeNext(bad as string | null)).toBe("/dashboard");
    }
  });
});
