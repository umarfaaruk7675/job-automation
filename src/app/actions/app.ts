"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "./session";
import { matchUser, scoreOne } from "@/lib/matching";
import { tailorResume } from "@/lib/tailor";
import { aiEnabled } from "@/lib/ai/gemini";
import { detectBoard, fetchBoard } from "@/lib/jobs/ats";
import { esc, layout, sendEmail } from "@/lib/email";
import type { Gap, Profile, ResumeData } from "@/lib/types";

const refresh = () => revalidatePath("/dashboard", "layout");

async function logEvent(supabase: Awaited<ReturnType<typeof requireUser>>["supabase"], userId: string, applicationId: number, state: string, detail: string) {
  await supabase.from("application_events").insert({ application_id: applicationId, user_id: userId, state, detail });
}

/** Scores fresh jobs for the signed-in user now. */
export async function findMatches() {
  const { supabase, userId } = await requireUser();
  const result = await matchUser(supabase, userId);
  refresh();
  return result;
}

/** Answers one "Have you used X?" question on a held application. */
export async function answerHold(applicationId: number, skill: string, hasIt: boolean) {
  const { supabase, userId } = await requireUser();
  if (!validId(applicationId) || typeof skill !== "string" || !skill.trim() || skill.length > 80) return { ok: false, error: "That answer wasn't valid." };
  const { data: app } = await supabase.from("applications").select("id, hold_questions").eq("id", applicationId).eq("user_id", userId).single();
  if (!app) return { ok: false, error: "That application wasn't found." };

  await supabase.from("answer_bank").upsert({ user_id: userId, question_key: `skill:${skill.toLowerCase()}`, answer: hasIt ? "yes" : "no" });

  if (!hasIt) {
    await supabase.from("applications").update({ state: "skipped", hold_questions: [] }).eq("id", applicationId).eq("user_id", userId);
    await logEvent(supabase, userId, applicationId, "skipped", `You rejected this job: no experience with ${skill}`);
    refresh();
    return { ok: true, state: "skipped" };
  }

  // Add the confirmed skill to the profile so it's never asked again.
  const { data: resume } = await supabase.from("resume_profiles").select("skills").eq("user_id", userId).single();
  const skills = Array.from(new Set([...(resume?.skills ?? []), skill]));
  await supabase.from("resume_profiles").update({ skills }).eq("user_id", userId);

  const remaining = ((app.hold_questions as Gap[]) ?? []).filter((q) => q.skill.toLowerCase() !== skill.toLowerCase());
  const state = remaining.length ? "hold" : "queued";
  await supabase.from("applications").update({ hold_questions: remaining, state }).eq("id", applicationId).eq("user_id", userId);
  await logEvent(supabase, userId, applicationId, state, remaining.length ? `You confirmed ${skill}; added to your profile` : `You approved. ${skill} added to your profile and the AI will apply`);
  refresh();
  return { ok: true, state };
}

/** Writes a resume version for this job using only confirmed facts. */
export async function tailorApplication(applicationId: number) {
  const { supabase, userId } = await requireUser();
  if (!validId(applicationId)) return { ok: false, error: "That application wasn't found." };
  if (!aiEnabled()) return { ok: false, error: "Tailoring turns on once the Gemini API key is added." };
  const { data: app } = await supabase
    .from("applications")
    .select("id, jobs(title, description, companies(name))")
    .eq("id", applicationId)
    .eq("user_id", userId)
    .single();
  const { data: resume } = await supabase.from("resume_profiles").select("*").eq("user_id", userId).single();
  if (!app || !resume) return { ok: false, error: "That application wasn't found." };
  const job = app.jobs as unknown as { title: string; description: string | null; companies: { name: string } | null };
  const tailored = await tailorResume(resume as unknown as ResumeData, {
    title: job.title,
    company: job.companies?.name ?? "",
    description: job.description ?? "",
  });
  if (!tailored) return { ok: false, error: "Tailoring didn't finish. Try again in a minute." };
  await supabase.from("applications").update({ tailored }).eq("id", applicationId).eq("user_id", userId);
  refresh();
  return { ok: true, tailored };
}

/** Server actions take whatever the browser sends, so ids are checked before use. */
function validId(id: unknown): id is number {
  return typeof id === "number" && Number.isSafeInteger(id) && id > 0;
}

const NEXT_STATES = ["approved", "applied", "skipped", "queued", "interview", "offer", "rejected", "closed"] as const;
type NextState = (typeof NEXT_STATES)[number];

const DETAIL: Record<NextState, string> = {
  approved: "You opened the company's page to finish",
  applied: "You confirmed it was submitted",
  skipped: "You rejected this job",
  queued: "Moved back to the queue",
  interview: "Interview",
  offer: "Offer",
  rejected: "Not selected",
  closed: "Closed",
};

export async function setApplicationState(applicationId: number, state: NextState) {
  if (!validId(applicationId) || !NEXT_STATES.includes(state)) return { ok: false };
  const { supabase, userId, email } = await requireUser();
  const patch: Record<string, unknown> = { state };
  if (state === "applied") patch.applied_at = new Date().toISOString();
  const { data: app } = await supabase
    .from("applications")
    .update(patch)
    .eq("id", applicationId)
    .eq("user_id", userId)
    .select("id, jobs(title, apply_url, companies(name))")
    .single();
  if (!app) return { ok: false };
  await logEvent(supabase, userId, applicationId, state, DETAIL[state]);

  if (state === "applied") {
    const { data: profile } = await supabase.from("profiles").select("digest_emails").eq("id", userId).single();
    const job = app.jobs as unknown as { title: string; apply_url: string; companies: { name: string } | null };
    if (profile?.digest_emails !== false) {
      await sendEmail(
        email,
        `Applied: ${job.title} at ${job.companies?.name ?? ""}`,
        layout("Application recorded", `<p>You applied for <b>${esc(job.title)}</b> at <b>${esc(job.companies?.name ?? "")}</b> on ${new Date().toDateString()}.</p><p><a href="${esc(job.apply_url)}">View the job posting</a></p>`),
      );
    }
  }
  refresh();
  return { ok: true };
}

/** Follows a company's job board from a careers link. */
export async function addCompany(careersUrl: string) {
  const { supabase, userId } = await requireUser();
  const board = detectBoard(careersUrl);
  if (!board) {
    return { ok: false, error: "That link isn't a Greenhouse, Lever or Ashby job board yet. Links look like jobs.lever.co/company." };
  }
  let name = board.slug;
  try {
    const res = await fetchBoard(board.ats, board.slug);
    name = res.name ?? board.slug.replace(/^eu:/, "").replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  } catch {
    return { ok: false, error: "We couldn't reach that job board. Check the link and try again." };
  }
  const { error } = await supabase.from("companies").insert({ name, ats: board.ats, slug: board.slug, careers_url: careersUrl, added_by: userId });
  if (error && !/duplicate/i.test(error.message)) return { ok: false, error: error.message };
  return { ok: true, name, existed: Boolean(error) };
}

type SettingsInput = Pick<Profile, "match_threshold" | "daily_limit" | "digest_emails" | "excluded_companies">;

export async function saveSettings(input: SettingsInput) {
  const { supabase, userId } = await requireUser();
  const threshold = Math.max(50, Math.min(100, Math.round(input.match_threshold)));
  const daily = Math.max(1, Math.min(50, Math.round(input.daily_limit)));

  const { error } = await supabase
    .from("profiles")
    .update({ match_threshold: threshold, daily_limit: daily, digest_emails: input.digest_emails, excluded_companies: input.excluded_companies })
    .eq("id", userId);
  if (error) return { ok: false, error: error.message };
  refresh();
  return { ok: true };
}

/** Applies to a scored job the user picked, even if it's below the bar. */
export async function reviewMatch(matchId: number) {
  const { supabase, userId } = await requireUser();
  if (!validId(matchId)) return { ok: false as const };
  const { data: match } = await supabase.from("matches").select("id, job_id, gaps").eq("id", matchId).eq("user_id", userId).single();
  if (!match) return { ok: false as const };
  // An application that already exists keeps its state; pressing Apply again must not restart one that was sent.
  const { data: existing } = await supabase.from("applications").select("id").eq("user_id", userId).eq("job_id", match.job_id).maybeSingle();
  if (existing) return { ok: true as const, applicationId: existing.id };
  const gaps = (match.gaps as Gap[]) ?? [];
  const { data: app, error } = await supabase
    .from("applications")
    .insert({ user_id: userId, job_id: match.job_id, match_id: match.id, state: gaps.length ? "hold" : "queued", hold_questions: gaps })
    .select("id, state")
    .single();
  if (error || !app) return { ok: false as const };
  await logEvent(supabase, userId, app.id, app.state, app.state === "hold" ? "You chose this job. It needs your answer first" : "You chose this job. The AI will apply");
  refresh();
  return { ok: true as const, applicationId: app.id };
}

export async function scoreJob(jobId: number) {
  const { supabase, userId } = await requireUser();
  if (!validId(jobId)) return { ok: false as const };
  const match = await scoreOne(supabase, userId, jobId);
  if (!match) return { ok: false as const };
  revalidatePath("/dashboard/matches");
  return { ok: true as const, matchId: match.id, score: match.score, reasons: match.reasons };
}
