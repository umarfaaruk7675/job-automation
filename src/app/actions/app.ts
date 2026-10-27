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
  const { data: app } = await supabase.from("applications").select("id, hold_questions").eq("id", applicationId).eq("user_id", userId).single();
  if (!app) return { ok: false, error: "That application wasn't found." };

  await supabase.from("answer_bank").upsert({ user_id: userId, question_key: `skill:${skill.toLowerCase()}`, answer: hasIt ? "yes" : "no" });

  if (!hasIt) {
    await supabase.from("applications").update({ state: "skipped", hold_questions: [] }).eq("id", applicationId);
    await logEvent(supabase, userId, applicationId, "skipped", `Skipped: no experience with ${skill}`);
    refresh();
    return { ok: true, state: "skipped" };
  }

  // Add the confirmed skill to the profile so it's never asked again.
  const { data: resume } = await supabase.from("resume_profiles").select("skills").eq("user_id", userId).single();
  const skills = Array.from(new Set([...(resume?.skills ?? []), skill]));
  await supabase.from("resume_profiles").update({ skills }).eq("user_id", userId);

  const remaining = ((app.hold_questions as Gap[]) ?? []).filter((q) => q.skill.toLowerCase() !== skill.toLowerCase());
  const state = remaining.length ? "hold" : "review";
  await supabase.from("applications").update({ hold_questions: remaining, state }).eq("id", applicationId);
  await logEvent(supabase, userId, applicationId, state, `You confirmed ${skill}; added to your profile`);
  refresh();
  return { ok: true, state };
}

/** Writes a resume version for this job using only confirmed facts. */
export async function tailorApplication(applicationId: number) {
  const { supabase, userId } = await requireUser();
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
  await supabase.from("applications").update({ tailored }).eq("id", applicationId);
  refresh();
  return { ok: true, tailored };
}

const NEXT_STATES = ["approved", "applied", "skipped", "review", "interview", "offer", "rejected", "closed"] as const;
type NextState = (typeof NEXT_STATES)[number];

const DETAIL: Record<NextState, string> = {
  approved: "You approved it. Finish on the company's page.",
  applied: "You confirmed it was submitted",
  skipped: "You skipped this job",
  review: "Moved back to review",
  interview: "Interview",
  offer: "Offer",
  rejected: "Not selected",
  closed: "Closed",
};

export async function setApplicationState(applicationId: number, state: NextState) {
  if (!NEXT_STATES.includes(state)) return { ok: false };
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

type SettingsInput = Pick<Profile, "match_threshold" | "daily_limit" | "digest_emails" | "excluded_companies"> & { submission_mode: "review" | "autopilot" };

export async function saveSettings(input: SettingsInput) {
  const { supabase, userId } = await requireUser();
  const threshold = Math.max(50, Math.min(100, Math.round(input.match_threshold)));
  const daily = Math.max(1, Math.min(50, Math.round(input.daily_limit)));

  let mode: "review" | "autopilot" = "review";
  if (input.submission_mode === "autopilot") {
    // Autopilot unlocks after the user has approved enough matches themselves.
    const { count } = await supabase
      .from("applications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .in("state", ["approved", "applied", "interview", "offer", "rejected"]);
    if ((count ?? 0) < 10) return { ok: false, error: `Autopilot unlocks after you've approved 10 applications. You've approved ${count ?? 0}.` };
    mode = "autopilot";
  }
  const { error } = await supabase
    .from("profiles")
    .update({ match_threshold: threshold, daily_limit: daily, digest_emails: input.digest_emails, excluded_companies: input.excluded_companies, submission_mode: mode })
    .eq("id", userId);
  if (error) return { ok: false, error: error.message };
  refresh();
  return { ok: true };
}

/** Pulls a scored match into the review list, even if it's below the bar. */
export async function reviewMatch(matchId: number) {
  const { supabase, userId } = await requireUser();
  const { data: match } = await supabase.from("matches").select("id, job_id, gaps").eq("id", matchId).eq("user_id", userId).single();
  if (!match) return { ok: false as const };
  const gaps = (match.gaps as Gap[]) ?? [];
  const { data: app, error } = await supabase
    .from("applications")
    .upsert({ user_id: userId, job_id: match.job_id, match_id: match.id, state: gaps.length ? "hold" : "review", hold_questions: gaps }, { onConflict: "user_id,job_id", ignoreDuplicates: false })
    .select("id, state")
    .single();
  if (error || !app) return { ok: false as const };
  await logEvent(supabase, userId, app.id, app.state, "You added this job to review");
  refresh();
  return { ok: true as const, applicationId: app.id };
}

export async function scoreJob(jobId: number) {
  const { supabase, userId } = await requireUser();
  const match = await scoreOne(supabase, userId, jobId);
  if (!match) return { ok: false as const };
  revalidatePath("/dashboard/matches");
  return { ok: true as const, matchId: match.id, score: match.score, reasons: match.reasons };
}
