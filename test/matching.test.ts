import { describe, expect, it, vi } from "vitest";
import { basicScore, locationOk, nearby, remoteOpenTo, titleMatches } from "@/lib/matching";
import { job, profile, resume } from "./helpers";

describe("titleMatches", () => {
  it("matches the exact role and common variants", () => {
    expect(titleMatches("Data Analyst", ["Data Analyst"])).toBe(true);
    expect(titleMatches("Senior Data Analyst II", ["Data Analyst"])).toBe(true);
    expect(titleMatches("Data Analyst - Marketing", ["data analyst"])).toBe(true);
  });

  it("needs both words of a two-word role", () => {
    expect(titleMatches("Data Engineer", ["Data Analyst"])).toBe(false);
    expect(titleMatches("KYB/AML Analyst", ["Data Analyst"])).toBe(false);
  });

  it("needs two of three words for a three-word role", () => {
    expect(titleMatches("Machine Learning Engineer (L3)", ["Machine Learning Engineer"])).toBe(true);
    expect(titleMatches("Machine Learning Manager", ["Machine Learning Engineer"])).toBe(true);
    expect(titleMatches("Software Engineer", ["Machine Learning Engineer"])).toBe(false);
  });

  it("matches any of several roles", () => {
    expect(titleMatches("ML Platform Engineer", ["Data Analyst", "Platform Engineer"])).toBe(true);
  });

  it("treats no target roles as match-everything", () => {
    expect(titleMatches("Anything", [])).toBe(true);
  });

  it("ignores roles made only of seniority words", () => {
    expect(titleMatches("Senior Accountant", ["Senior"])).toBe(false);
  });
});

describe("remoteOpenTo", () => {
  const p = profile();
  it("accepts worldwide and plain remote jobs", () => {
    for (const location of [null, "", "Remote", "Anywhere", "Worldwide", "Global (remote)"]) {
      expect(remoteOpenTo(job({ remote: true, location }), p), String(location)).toBe(true);
    }
  });
  it("accepts remote jobs in the user's country or city", () => {
    expect(remoteOpenTo(job({ remote: true, location: "Remote - India" }), p)).toBe(true);
    expect(remoteOpenTo(job({ remote: true, location: "Hyderabad (remote)" }), p)).toBe(true);
  });
  it("accepts APAC / Asia remote jobs for users in India", () => {
    expect(remoteOpenTo(job({ remote: true, location: "Remote, APAC" }), p)).toBe(true);
    expect(remoteOpenTo(job({ remote: true, location: "Asia" }), p)).toBe(true);
  });
  it("rejects remote jobs limited to other countries", () => {
    expect(remoteOpenTo(job({ remote: true, location: "Remote - US" }), p)).toBe(false);
    expect(remoteOpenTo(job({ remote: true, location: "UK" }), p)).toBe(false);
    expect(remoteOpenTo(job({ remote: true, location: "Germany" }), p)).toBe(false);
  });
});

describe("locationOk", () => {
  it("keeps on-site jobs in a preferred city", () => {
    expect(locationOk(job({ location: "Hyderabad, Telangana" }), profile())).toBe(true);
  });
  it("drops on-site jobs elsewhere unless the user will relocate", () => {
    const boston = job({ location: "Boston, MA" });
    expect(locationOk(boston, profile())).toBe(false);
    expect(locationOk(boston, profile({ willing_to_relocate: true }))).toBe(true);
  });
  it("remote-only users only get remote jobs they can take", () => {
    const p = profile({ work_modes: ["remote"] });
    expect(locationOk(job({ remote: false, location: "Hyderabad" }), p)).toBe(false);
    expect(locationOk(job({ remote: true, location: "Remote - India" }), p)).toBe(true);
    expect(locationOk(job({ remote: true, location: "Remote - US" }), p)).toBe(false);
  });
  it("users who didn't pick remote still see on-site jobs", () => {
    const p = profile({ work_modes: ["onsite"] });
    expect(locationOk(job({ remote: false, location: "Hyderabad" }), p)).toBe(true);
  });
});

describe("nearby", () => {
  const p = profile();
  it("ranks the user's city above the country above open remote", () => {
    const city = nearby(job({ location: "Hyderabad" }), p);
    const country = nearby(job({ location: "Bengaluru, India" }), p);
    const indianCityOnly = nearby(job({ location: "Pune" }), p);
    const remote = nearby(job({ remote: true, location: "Remote" }), p);
    const abroad = nearby(job({ location: "Paris" }), p);
    expect(city).toBeGreaterThan(country);
    expect(indianCityOnly).toBe(country);
    expect(country).toBeGreaterThan(remote);
    expect(remote).toBeGreaterThan(abroad);
    expect(abroad).toBe(0);
  });
});

describe("basicScore", () => {
  it("scores higher when the title fits and skills appear", () => {
    const good = basicScore(job(), resume(), profile());
    const off = basicScore(job({ title: "Office Manager", description: "Manage the office." }), resume(), profile());
    expect(good.score).toBeGreaterThan(off.score);
    expect(good.method).toBe("basic");
    expect(good.reasons[1]).toMatch(/SQL/);
  });
  it("stays between 0 and 95", () => {
    const r = resume({ skills: ["SQL"] });
    const s = basicScore(job({ description: "SQL SQL SQL" }), r, profile());
    expect(s.score).toBeGreaterThanOrEqual(0);
    expect(s.score).toBeLessThanOrEqual(95);
  });
  it("doesn't count a skill hidden inside another word", () => {
    const s = basicScore(job({ title: "Analyst", description: "We use Rust and Grafana." }), resume({ skills: ["R"] }), profile());
    expect(s.reasons[1]).toMatch(/Few of your listed skills/);
  });
  it("handles a resume with no skills", () => {
    const s = basicScore(job(), resume({ skills: [] }), profile());
    expect(Number.isFinite(s.score)).toBe(true);
  });
});

describe("aiScore", () => {
  it("clamps the score and drops gaps for skills the user already has", async () => {
    vi.stubEnv("GEMINI_API_KEY", "test");
    const { mockFetch } = await import("./helpers");
    mockFetch({
      generativelanguage: {
        candidates: [{ content: { parts: [{ text: JSON.stringify({
          score: 140, eligible: true, reasons: ["a", "b", "c", "d"],
          gaps: [{ skill: "sql", question: "Used SQL?" }, { skill: "Docker", question: "Used Docker?" }],
        }) }] } }],
      },
    });
    const { aiScore } = await import("@/lib/matching");
    const s = await aiScore(job(), resume(), profile());
    expect(s).not.toBeNull();
    expect(s!.score).toBe(100);
    expect(s!.reasons).toHaveLength(3);
    expect(s!.gaps.map((g) => g.skill)).toEqual(["Docker"]);
    expect(s!.method).toBe("ai");
  });
  it("returns null when the model call fails, so callers fall back", async () => {
    vi.stubEnv("GEMINI_API_KEY", "test");
    const { mockFetch } = await import("./helpers");
    mockFetch({ generativelanguage: 500 });
    vi.spyOn(console, "error").mockImplementation(() => {});
    const { aiScore } = await import("@/lib/matching");
    expect(await aiScore(job(), resume(), profile())).toBeNull();
  });
});
