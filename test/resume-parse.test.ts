import { describe, expect, it, vi } from "vitest";
import { parseResume } from "@/lib/resume/parse";
import { mockFetch } from "./helpers";

const TEXT = `Priya Sharma
Data Analyst | priya.sharma+jobs@example.co.in | +91 98765 43210
linkedin.com/in/priya-sharma  github.com/priyas
Experience
Analyst at Acme 2022 - present`;

describe("parseResume", () => {
  it("falls back to pattern matching without AI", async () => {
    vi.stubEnv("GEMINI_API_KEY", "");
    const { data, method } = await parseResume(TEXT);
    expect(method).toBe("basic");
    expect(data.full_name).toBe("Priya Sharma");
    expect(data.email).toBe("priya.sharma+jobs@example.co.in");
    expect(data.phone).toBe("+91 98765 43210");
    expect(data.links).toEqual({ linkedin: "https://linkedin.com/in/priya-sharma", github: "https://github.com/priyas" });
    expect(data.skills).toEqual([]);
  });

  it("cleans AI output: unique trimmed skills (max 40) and missing lists filled in", async () => {
    vi.stubEnv("GEMINI_API_KEY", "k");
    const skills = [" SQL ", "SQL", "", ...Array.from({ length: 50 }, (_, i) => `S${i}`)];
    mockFetch({ generativelanguage: { candidates: [{ content: { parts: [{ text: JSON.stringify({ summary: "x", skills, experience: [{ title: "A", company: "B", bullets: ["b", "b ", ""] }] }) }] } }] } });
    const { data, method } = await parseResume(TEXT);
    expect(method).toBe("ai");
    expect(data.skills[0]).toBe("SQL");
    expect(data.skills).toHaveLength(40);
    expect(new Set(data.skills).size).toBe(40);
    expect(data.experience[0].bullets).toEqual(["b"]);
    expect(data.education).toEqual([]);
    expect(data.links).toEqual({});
  });
});
