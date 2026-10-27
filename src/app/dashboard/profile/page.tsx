import type { Metadata } from "next";
import { requireUser } from "@/app/actions/session";
import { OnboardingWizard } from "@/components/onboarding/OnboardingWizard";
import { aiEnabled } from "@/lib/ai/gemini";
import { EMPTY_RESUME, type Profile, type ResumeData } from "@/lib/types";

export const metadata: Metadata = { title: "Profile | Shortlist" };
export const maxDuration = 60;

export default async function ProfilePage() {
  const { supabase, userId } = await requireUser();
  const [{ data: profile }, { data: resume }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", userId).single(),
    supabase.from("resume_profiles").select("*").eq("user_id", userId).maybeSingle(),
  ]);
  return (
    <div className="-mx-4 -mt-8 sm:-mx-6 lg:-mt-10">
      <OnboardingWizard
        editing
        userId={userId}
        profile={profile as Profile}
        resume={resume ? ({ ...EMPTY_RESUME, ...resume } as unknown as ResumeData) : EMPTY_RESUME}
        aiEnabled={aiEnabled()}
        hasResumeFile={Boolean(resume?.source_path)}
      />
    </div>
  );
}
