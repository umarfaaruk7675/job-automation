import "server-only";

/**
 * Minimal Gemini client: one call, JSON in and out, validated by the caller.
 * Returns null when no key is configured so features can fall back.
 * Job descriptions and resumes are passed as data inside the prompt and the
 * model has no tools, so injected instructions can't trigger actions.
 */
const MODEL = process.env.GEMINI_MODEL || "gemini-flash-lite-latest";

/** The last error from Gemini, for the health check (never includes the key). */
export let lastAiError: string | null = null;

export function aiEnabled() {
  return Boolean(process.env.GEMINI_API_KEY);
}

export async function generateJson<T>(opts: {
  system: string;
  prompt: string;
  schema: Record<string, unknown>;
  maxOutputTokens?: number;
}): Promise<T | null> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;

  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": key },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: opts.system }] },
      contents: [{ role: "user", parts: [{ text: opts.prompt }] }],
      generationConfig: {
        temperature: 0.2,
        // A floor leaves room for models that spend tokens thinking before answering.
        maxOutputTokens: Math.max(1024, opts.maxOutputTokens ?? 4096),
        responseMimeType: "application/json",
        responseSchema: opts.schema,
      },
    }),
    cache: "no-store",
  });

  if (!res.ok) {
    lastAiError = `${res.status}: ${(await res.text()).slice(0, 300)}`;
    console.error("Gemini error", lastAiError);
    return null;
  }
  lastAiError = null;
  const data = await res.json();
  const text: string | undefined = data?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? "").join("");
  if (!text) return null;
  try {
    return JSON.parse(text) as T;
  } catch {
    console.error("Gemini returned non-JSON");
    return null;
  }
}

/** Removes hidden or control characters that could smuggle instructions. */
export function cleanUntrusted(text: string, max = 12000) {
  return text
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/[​-‏‪-‮⁠-⁯﻿]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}
