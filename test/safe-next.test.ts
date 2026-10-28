import { describe, expect, it } from "vitest";
import { safeNext } from "@/lib/safe-next";

describe("safeNext (redirect after sign-in)", () => {
  it("keeps on-site paths", () => {
    expect(safeNext("/dashboard/jobs")).toBe("/dashboard/jobs");
    expect(safeNext("/dashboard/applications/12?tab=1")).toBe("/dashboard/applications/12?tab=1");
  });
  it("defaults to the dashboard", () => {
    expect(safeNext(null)).toBe("/dashboard");
    expect(safeNext(undefined)).toBe("/dashboard");
    expect(safeNext("")).toBe("/dashboard");
  });
  it("blocks links to other sites", () => {
    for (const bad of ["https://evil.com", "//evil.com", "/\\evil.com", "\\\\evil.com", "/\t/evil.com", "javascript:alert(1)", "evil.com"]) {
      const out = safeNext(bad);
      expect(out, bad).toMatch(/^\//);
      // Resolving against our origin must never leave our site.
      expect(new URL(out, "https://job-automation-jet.vercel.app").host, bad).toBe("job-automation-jet.vercel.app");
    }
  });
});
