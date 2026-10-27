import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/app/actions/session";
import { EmptyState } from "@/components/app/bits";
import { JobFilters } from "@/components/app/JobFilters";
import { JobList, type JobItem } from "@/components/app/JobList";
import { SOURCES } from "@/lib/jobs/feeds";

export const metadata: Metadata = { title: "Live jobs | Shortlist" };
export const maxDuration = 30;

const PAGE = 30;
const SOURCE_KEYS = Object.keys(SOURCES);

type Search = { q?: string; where?: string; remote?: string; source?: string; mine?: string; page?: string };

export default async function JobsPage({ searchParams }: { searchParams: Search }) {
  const { supabase, userId } = await requireUser();
  const q = (searchParams.q ?? "").trim().slice(0, 80);
  const where = (searchParams.where ?? "").trim().slice(0, 60);
  const remote = searchParams.remote === "1";
  const source = SOURCE_KEYS.includes(searchParams.source ?? "") ? searchParams.source! : "";
  const mine = searchParams.mine !== "0";
  const page = Math.max(0, Math.min(50, Number(searchParams.page) || 0));

  const { data: profile } = await supabase.from("profiles").select("target_roles, match_threshold").eq("id", userId).single();
  const roles: string[] = profile?.target_roles ?? [];
  const since = new Date(Date.now() - 30 * 864e5).toISOString();
  const like = (s: string) => `%${s.replace(/[%_,()]/g, " ")}%`;

  let query = supabase
    .from("jobs")
    .select("id, title, location, remote, source, apply_url, posted_at, first_seen_at, companies(name)", { count: "estimated" })
    .eq("status", "open")
    .gte("first_seen_at", since);
  if (q) query = query.ilike("title", like(q));
  else if (mine && roles.length) query = query.or(roles.slice(0, 8).map((r) => `title.ilike.${like(r)}`).join(","));
  if (where) query = query.ilike("location", like(where));
  if (remote) query = query.eq("remote", true);
  if (source) query = query.eq("source", source);
  const { data: jobs, count } = await query
    .order("posted_at", { ascending: false, nullsFirst: false })
    .range(page * PAGE, page * PAGE + PAGE - 1);

  const ids = (jobs ?? []).map((j) => j.id);
  const [{ data: matches }, { data: apps }] = ids.length
    ? await Promise.all([
        supabase.from("matches").select("id, job_id, score, reasons").eq("user_id", userId).in("job_id", ids),
        supabase.from("applications").select("id, job_id").eq("user_id", userId).in("job_id", ids),
      ])
    : [{ data: [] }, { data: [] }];
  const matchBy = new Map((matches ?? []).map((m) => [m.job_id, m]));
  const appBy = new Map((apps ?? []).map((a) => [a.job_id, a.id]));

  const items: JobItem[] = (jobs ?? []).map((j) => {
    const mt = matchBy.get(j.id);
    return {
      id: j.id,
      title: j.title,
      company: (j.companies as unknown as { name: string } | null)?.name ?? "",
      location: j.location,
      remote: j.remote,
      source: j.source,
      sourceLabel: SOURCES[j.source]?.label ?? j.source,
      sourceSite: SOURCES[j.source]?.site ?? null,
      applyUrl: j.apply_url,
      postedAt: j.posted_at ?? j.first_seen_at,
      matchId: mt?.id ?? null,
      score: mt?.score ?? null,
      reason: (mt?.reasons as string[] | undefined)?.[0] ?? null,
      applicationId: appBy.get(j.id) ?? null,
    };
  });

  const params = (p: number) => {
    const u = new URLSearchParams();
    for (const [k, v] of Object.entries({ ...searchParams, page: String(p) })) if (v) u.set(k, String(v));
    return `/dashboard/jobs?${u}`;
  };
  const total = count ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-h2 font-extrabold">Live jobs</h1>
        <p className="mt-1 max-w-prose text-muted">
          Every open job we've found in the last 30 days, newest first, from company career pages and {SOURCE_KEYS.length - 6} job boards. Check your match on any of them.
        </p>
      </div>
      <JobFilters
        initial={{ q, where, remote, source, mine }}
        roles={roles}
        sources={SOURCE_KEYS.map((k) => ({ value: k, label: SOURCES[k].label }))}
      />
      <p className="text-sm text-muted" aria-live="polite">
        {total ? `About ${total.toLocaleString("en-IN")} job${total === 1 ? "" : "s"}` : "No jobs"}
        {!q && mine && roles.length ? ` matching ${roles.join(", ")}` : ""}
      </p>
      {items.length ? (
        <JobList items={items} threshold={profile?.match_threshold ?? 80} />
      ) : (
        <EmptyState title="No jobs match these filters" body="Try a broader title, clear the location, or switch off “My target roles”." />
      )}
      {(page > 0 || (page + 1) * PAGE < total) && (
        <nav aria-label="Pages" className="flex items-center justify-between gap-3">
          {page > 0 ? <Link href={params(page - 1)} className="rounded-control border border-rule bg-sheet px-4 py-2 text-sm font-semibold hover:border-ink">Newer</Link> : <span />}
          <span className="text-sm text-muted">Page {page + 1}</span>
          {(page + 1) * PAGE < total ? <Link href={params(page + 1)} className="rounded-control border border-rule bg-sheet px-4 py-2 text-sm font-semibold hover:border-ink">Older</Link> : <span />}
        </nav>
      )}
    </div>
  );
}
