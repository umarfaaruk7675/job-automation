import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireUser } from "@/app/actions/session";
import { ApplicationReview } from "@/components/app/ApplicationReview";
import { aiEnabled } from "@/lib/ai/gemini";
import { autoApplyEnabled } from "@/lib/flags";
import type { Gap, TailoredResume } from "@/lib/types";

export const metadata: Metadata = { title: "Application | Shortlist" };
export const maxDuration = 60;

export default async function ApplicationPage({ params }: { params: { id: string } }) {
  const { supabase, userId } = await requireUser();
  const id = Number(params.id);
  if (!Number.isFinite(id)) notFound();

  const [{ data: app }, { data: events }] = await Promise.all([
    supabase
      .from("applications")
      .select("id, state, hold_questions, tailored, applied_at, created_at, matches(score, reasons, gaps, method), jobs(title, location, remote, department, description, apply_url, posted_at, status, companies(name))")
      .eq("id", id)
      .eq("user_id", userId)
      .maybeSingle(),
    supabase.from("application_events").select("id, state, detail, created_at").eq("application_id", id).order("created_at", { ascending: false }).limit(20),
  ]);
  if (!app) notFound();

  const job = app.jobs as unknown as {
    title: string; location: string | null; remote: boolean; department: string | null; description: string | null;
    apply_url: string; posted_at: string | null; status: string; companies: { name: string } | null;
  };
  const match = app.matches as unknown as { score: number; reasons: string[]; gaps: Gap[]; method: string } | null;

  return (
    <div className="space-y-6">
      <Link href="/dashboard/applications" className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-ink">
        <ArrowLeft className="h-4 w-4" aria-hidden /> All applications
      </Link>
      <ApplicationReview
        id={app.id}
        state={app.state}
        holdQuestions={(app.hold_questions as Gap[]) ?? []}
        tailored={app.tailored as TailoredResume | null}
        appliedAt={app.applied_at}
        job={{ ...job, company: job.companies?.name ?? "" }}
        match={match}
        events={events ?? []}
        aiEnabled={aiEnabled()}
        autoApply={autoApplyEnabled()}
      />
    </div>
  );
}
