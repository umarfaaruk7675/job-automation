import { describe, expect, it } from "vitest";
import { fresh, sha1, slugify, toRow } from "@/lib/jobs/discover";
import type { NormalizedJob } from "@/lib/jobs/ats";

const nj = (over: Partial<NormalizedJob> = {}): NormalizedJob => ({
  external_id: "1", title: "Analyst", location: "Pune", remote: false, department: null,
  description: "desc", apply_url: "https://x", posted_at: new Date().toISOString(), ...over,
});

describe("slugify", () => {
  it("makes stable company keys", () => {
    expect(slugify("Acme, Inc.")).toBe("acme-inc");
    expect(slugify("  Zoë & Co  ")).toBe("zoe-co");
    expect(slugify("Tata Consultancy Services (TCS)")).toBe("tata-consultancy-services-tcs");
  });
  it("never returns an empty slug", () => {
    expect(slugify("")).toBe("unknown");
    expect(slugify("株式会社")).toBe("unknown");
  });
  it("caps the length", () => {
    expect(slugify("a".repeat(200)).length).toBeLessThanOrEqual(80);
  });
});

describe("fresh", () => {
  it("keeps jobs from the last 30 days and undated jobs", () => {
    const old = new Date(Date.now() - 40 * 864e5).toISOString();
    const recent = new Date(Date.now() - 5 * 864e5).toISOString();
    const out = fresh([nj({ external_id: "old", posted_at: old }), nj({ external_id: "new", posted_at: recent }), nj({ external_id: "undated", posted_at: null })]);
    expect(out.map((j) => j.external_id)).toEqual(["new", "undated"]);
  });
  it("drops jobs with no title or apply link", () => {
    expect(fresh([nj({ title: "" }), nj({ apply_url: "" })])).toEqual([]);
  });
});

describe("toRow", () => {
  it("truncates long fields to fit the database", () => {
    const r = toRow(5, "remotive", nj({ title: "t".repeat(500), description: "d".repeat(10000), external_id: "e".repeat(300) }), "2026-10-28T00:00:00Z");
    expect(r.title).toHaveLength(300);
    expect(r.description).toHaveLength(8000);
    expect(r.external_id).toHaveLength(200);
    expect(r).toMatchObject({ company_id: 5, source: "remotive", status: "open", missed_polls: 0, last_seen_at: "2026-10-28T00:00:00Z" });
  });
  it("hashes content so edits are detected", () => {
    const a = toRow(1, "lever", nj(), "now");
    const b = toRow(1, "lever", nj({ description: "changed" }), "now");
    expect(a.content_hash).not.toBe(b.content_hash);
    expect(a.content_hash).toBe(sha1("Analyst" + "desc"));
  });
});
