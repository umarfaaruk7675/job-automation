import { describe, expect, it, vi } from "vitest";
import { aiEnabled, cleanUntrusted, generateJson } from "@/lib/ai/gemini";
import { mockFetch } from "./helpers";

const opts = { system: "s", prompt: "p", schema: { type: "OBJECT" } };
const reply = (text: string) => ({ candidates: [{ content: { parts: [{ text }] } }] });

describe("cleanUntrusted", () => {
  it("strips HTML tags and decodes entities", () => {
    expect(cleanUntrusted("<p>SQL &amp; Python</p><br/>Tableau")).toBe("SQL & Python Tableau");
  });
  it("removes zero-width and bidi characters used to hide instructions", () => {
    expect(cleanUntrusted("Ig​nore‮ previous﻿")).toBe("Ignore previous");
  });
  it("collapses whitespace and truncates", () => {
    expect(cleanUntrusted("a   \n\n b", 100)).toBe("a b");
    expect(cleanUntrusted("x".repeat(50), 10)).toHaveLength(10);
  });
});

describe("generateJson", () => {
  it("returns null without calling the API when no key is set", async () => {
    vi.stubEnv("GEMINI_API_KEY", "");
    const f = mockFetch({});
    expect(aiEnabled()).toBe(false);
    expect(await generateJson(opts)).toBeNull();
    expect(f).not.toHaveBeenCalled();
  });

  it("parses the JSON reply", async () => {
    vi.stubEnv("GEMINI_API_KEY", "k");
    mockFetch({ generativelanguage: reply('{"ok":true}') });
    expect(await generateJson<{ ok: boolean }>(opts)).toEqual({ ok: true });
  });

  it("sends the key in a header, never in the URL, and applies the 1024-token floor", async () => {
    vi.stubEnv("GEMINI_API_KEY", "secret-key");
    const f = mockFetch({ generativelanguage: reply("{}") });
    await generateJson({ ...opts, maxOutputTokens: 20 });
    const [url, init] = f.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).not.toContain("secret-key");
    expect((init.headers as Record<string, string>)["x-goog-api-key"]).toBe("secret-key");
    expect(JSON.parse(String(init.body)).generationConfig.maxOutputTokens).toBe(1024);
  });

  it("returns null on an HTTP error and records it without the key", async () => {
    vi.stubEnv("GEMINI_API_KEY", "secret-key");
    vi.spyOn(console, "error").mockImplementation(() => {});
    mockFetch({ generativelanguage: 429 });
    expect(await generateJson(opts)).toBeNull();
    const mod = await import("@/lib/ai/gemini");
    expect(mod.lastAiError).toMatch(/^429/);
    expect(mod.lastAiError).not.toContain("secret-key");
  });

  it("returns null on non-JSON or empty replies", async () => {
    vi.stubEnv("GEMINI_API_KEY", "k");
    vi.spyOn(console, "error").mockImplementation(() => {});
    mockFetch({ generativelanguage: reply("not json") });
    expect(await generateJson(opts)).toBeNull();
    mockFetch({ generativelanguage: { candidates: [] } });
    expect(await generateJson(opts)).toBeNull();
  });
});
