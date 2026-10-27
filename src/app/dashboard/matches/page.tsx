import type { Metadata } from "next";
import { requireUser } from "@/app/actions/session";
import { EmptyState } from "@/components/app/bits";
import { MatchList, type MatchItem } from "@/components/app/MatchList";
import { FindMatchesButton } from "@/components/app/FindMatchesButton";

export const metadata: Metadata = { title: "Matches | Shortlist" };
export const maxDuration = 60;

export default async function MatchesPage() {
  const { supabase, userId } = await requireUser();
  const [{ data: profile }, { data: matches }, { data: apps }] = await Promise.all([
    supabase.from("profiles").select("match_threshold").eq("id", userId).single(),
    supabase
      .from("matches")
      .select("id, score, reasons, method, created_at, job_id, jobs(title, location, remote, apply_url, status, companies(name))")
      .eq("user_id", userId)
      .order("score", { ascending: false })
      .limit(150),
    supabase.from("applications").select("id, job_id").eq("user_id", userId),
  ]);
  const appByJob = new Map((apps ?? []).map((a) => [a.job_id, a.id]));
  const items: MatchItem[] = (matches ?? [])
    .map((m) => {
      const j = m.jobs as unknown as { title: string; location: string | null; remote: boolean; apply_url: string; status: string; companies: { name: string } | null };
      return {
        id: m.id,
        jobId: m.job_id,
        score: m.score,
        reasons: (m.reasons as string[]) ?? [],
        title: j.title,
        company: j.companies?.name ?? "",
        location: j.location,
        remote: j.remote,
        open: j.status === "open",
        applicationId: appByJob.get(m.job_id) ?? null,
      };
    })
    .filter((m) => m.open);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-h2 font-extrabold">Matches</h1>
          <p className="mt-1 max-w-prose text-muted">
            Every fresh job we scored for you, best first. Jobs at {profile?.match_threshold ?? 80}% or more go to review automatically; you can pull in any other one.
          </p>
        </div>
        <FindMatchesButton />
      </div>
      {items.length ? <MatchList items={items} threshold={profile?.match_threshold ?? 80} /> : (
        <EmptyState title="No matches yet" body="Run a search. If nothing appears, try adding more target roles or cities in your profile." />
      )}
    </div>
  );
}
