import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { OnboardingWizard } from "@/components/onboarding/OnboardingWizard";
import { AppHeader } from "@/components/app/AppHeader";
import { requireUser } from "@/app/actions/session";
import { aiEnabled } from "@/lib/ai/gemini";
import { EMPTY_RESUME, type Profile, type ResumeData } from "@/lib/types";

export const metadata: Metadata = { title: "Set up your profile | Shortlist" };
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export default async function OnboardingPage() {
  const { supabase, userId, email } = await requireUser();
  const [{ data: profile }, { data: resume }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
    supabase.from("resume_profiles").select("*").eq("user_id", userId).maybeSingle(),
  ]);
  if (profile?.onboarding_completed_at) redirect("/dashboard");

  const p = (profile ?? { id: userId, email, target_roles: [], work_modes: [], preferred_locations: [], authorized_countries: [], excluded_companies: [], match_threshold: 80, daily_limit: 10, submission_mode: "review", digest_emails: true, onboarding_step: 0 }) as Profile;
  const r: ResumeData = resume ? ({ ...EMPTY_RESUME, ...resume } as unknown as ResumeData) : EMPTY_RESUME;

  return (
    <>
      <AppHeader name={p.full_name || email} email={email} />
      <main id="main">
        <OnboardingWizard userId={userId} profile={p} resume={r} aiEnabled={aiEnabled()} hasResumeFile={Boolean(resume?.source_path)} />
      </main>
    </>
  );
}
