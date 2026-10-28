import { describe, expect, it, vi } from "vitest";
import { tailorResume } from "@/lib/tailor";
import { mockFetch, resume } from "./helpers";

const ai = (out: unknown) => {
  vi.stubEnv("GEMINI_API_KEY", "k");
  mockFetch({ generativelanguage: { candidates: [{ content: { parts: [{ text: JSON.stringify(out) }] } }] } });
};
const jobInfo = { title: "Data Analyst", company: "Beta", description: "Needs Tableau and SQL" };

describe("tailorResume keeps the resume truthful", () => {
  it("never adds a skill the user doesn't have, and keeps every real one", async () => {
    ai({ summary: "S", skills: ["tableau", "Kubernetes", "SQL", "sql"], experience: [], changes: ["Moved Tableau up"] });
    const r = await tailorResume(resume(), jobInfo);
    expect(r!.skills).toEqual(["Tableau", "SQL", "Python", "Excel"]);
    expect(r!.skills).not.toContain("Kubernetes");
  });

  it("keeps original titles and companies even if the model changes them", async () => {
    ai({ summary: "S", skills: [], experience: [{ title: "Head of Data", company: "Acme", bullets: ["Built Tableau dashboards"] }], changes: [] });
    const r = await tailorResume(resume(), jobInfo);
    expect(r!.experience[0]).toEqual({ title: "Analyst", company: "Acme", bullets: ["Built Tableau dashboards"] });
  });

  it("falls back to the original bullets when the model mixes up roles", async () => {
    ai({ summary: "", skills: [], experience: [{ title: "Analyst", company: "Some Other Co", bullets: ["Invented"] }], changes: [] });
    const r = await tailorResume(resume(), jobInfo);
    expect(r!.experience[0].bullets).toEqual(["Built dashboards"]);
    expect(r!.summary).toBe("Analyst");
  });

  it("keeps roles the model dropped", async () => {
    const two = resume({ experience: [{ title: "A", company: "X", bullets: ["x"] }, { title: "B", company: "Y", bullets: ["y"] }] });
    ai({ summary: "S", skills: [], experience: [{ title: "A", company: "X", bullets: ["x2"] }], changes: [] });
    const r = await tailorResume(two, jobInfo);
    expect(r!.experience).toHaveLength(2);
    expect(r!.experience[1].bullets).toEqual(["y"]);
  });

  it("returns null when AI is unavailable", async () => {
    vi.stubEnv("GEMINI_API_KEY", "");
    expect(await tailorResume(resume(), jobInfo)).toBeNull();
  });
});
