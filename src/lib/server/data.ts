import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { AppListItem } from "@/components/app/bits";

type Row = {
  id: number;
  state: string;
  created_at: string;
  matches: { score: number } | null;
  jobs: { title: string; location: string | null; remote: boolean; companies: { name: string } | null } | null;
};

export async function listApplications(db: SupabaseClient, userId: string, states?: string[], limit = 100): Promise<AppListItem[]> {
  let q = db
    .from("applications")
    .select("id, state, created_at, matches(score), jobs(title, location, remote, companies(name))")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (states) q = q.in("state", states);
  const { data } = await q;
  return ((data ?? []) as unknown as Row[]).map((r) => ({
    id: r.id,
    state: r.state,
    created_at: r.created_at,
    score: r.matches?.score ?? null,
    title: r.jobs?.title ?? "Job",
    company: r.jobs?.companies?.name ?? "",
    location: r.jobs?.location ?? null,
    remote: r.jobs?.remote ?? false,
  }));
}
