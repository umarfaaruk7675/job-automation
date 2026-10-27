"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireUser } from "./session";
import { extractResumeText } from "@/lib/resume/extract";
import { parseResume } from "@/lib/resume/parse";
import type { Profile, ResumeData } from "@/lib/types";

const MAX_BYTES = 5 * 1024 * 1024;

export type ParseResult =
  | { ok: true; data: ResumeData; method: "ai" | "basic"; fileName: string }
  | { ok: false; error: string };

/**
 * Reads a resume the browser has already uploaded to the user's private
 * folder (uploading from the browser avoids the 4.5 MB request limit on
 * serverless functions) and turns it into a draft profile.
 */
export async function parseStoredResume(path: string, fileName: string): Promise<ParseResult> {
  const { supabase, userId } = await requireUser();
  if (!path.startsWith(`${userId}/`) || path.includes("..")) return { ok: false, error: "That file isn't in your folder." };
  if (!/\.(pdf|docx)$/i.test(fileName)) return { ok: false, error: "Save your resume as PDF or DOCX and try again." };

  const { data: blob, error: dlErr } = await supabase.storage.from("resumes").download(path);
  if (dlErr || !blob) return { ok: false, error: "We couldn't open the uploaded file. Try uploading it again." };
  if (blob.size > MAX_BYTES) return { ok: false, error: "Resumes need to be 5 MB or smaller." };

  let text = "";
  try {
    text = await extractResumeText(await blob.arrayBuffer(), fileName);
  } catch {
    return { ok: false, error: "We couldn't read text from that file. If it's a scanned image, export it again as a text PDF." };
  }
  if (text.length < 80) return { ok: false, error: "That file has almost no readable text. If it's a scanned image, export it again as a text PDF." };

  const { data, method } = await parseResume(text);

  // Keep only the newest resume file.
  const { data: old } = await supabase.storage.from("resumes").list(userId);
  const stale = (old ?? []).map((f) => `${userId}/${f.name}`).filter((p) => p !== path);
  if (stale.length) await supabase.storage.from("resumes").remove(stale);

  await supabase.from("resume_profiles").upsert({
    user_id: userId,
    summary: data.summary,
    skills: data.skills,
    experience: data.experience,
    education: data.education,
    projects: data.projects,
    certifications: data.certifications,
    links: data.links,
    source_path: path,
    parse_method: method,
    parsed_at: new Date().toISOString(),
  });

  return { ok: true, data, method, fileName };
}

type ProfileFields = Partial<Omit<Profile, "id" | "email" | "onboarding_completed_at">>;
type ResumeFields = Partial<Pick<ResumeData, "summary" | "skills" | "experience" | "education" | "projects" | "certifications" | "links">>;

/** Saves one onboarding step so people can leave and come back. */
export async function saveStep(step: number, profile: ProfileFields, resume?: ResumeFields) {
  const { supabase, userId } = await requireUser();
  const { error } = await supabase.from("profiles").update({ ...clean(profile), onboarding_step: step }).eq("id", userId);
  if (error) return { ok: false as const, error: error.message };
  if (resume) {
    const { error: rErr } = await supabase.from("resume_profiles").upsert({ user_id: userId, ...resume });
    if (rErr) return { ok: false as const, error: rErr.message };
  }
  return { ok: true as const };
}

export async function completeOnboarding() {
  const { supabase, userId } = await requireUser();
  const now = new Date().toISOString();
  await supabase.from("resume_profiles").upsert({ user_id: userId, confirmed_at: now });
  await supabase.from("profiles").update({ onboarding_completed_at: now }).eq("id", userId);
  revalidatePath("/dashboard", "layout");
  redirect("/dashboard?welcome=1");
}

// Only allow the columns the form is meant to change.
const ALLOWED: (keyof ProfileFields)[] = [
  "full_name", "phone", "country", "city", "headline", "target_roles", "experience_level", "years_experience",
  "work_modes", "preferred_locations", "willing_to_relocate", "expected_salary", "salary_currency", "notice_period",
  "needs_sponsorship", "authorized_countries", "excluded_companies", "match_threshold", "daily_limit",
  "submission_mode", "digest_emails",
];
function clean(p: ProfileFields) {
  const out: Record<string, unknown> = {};
  for (const k of ALLOWED) if (k in p) out[k] = p[k];
  if (out.submission_mode === "autopilot") out.submission_mode = "review"; // unlocked later, not at sign-up
  return out;
}
