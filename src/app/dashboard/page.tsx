import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/app/actions/session";
import { listApplications } from "@/lib/server/data";
import { ApplicationRow, EmptyState } from "@/components/app/bits";
import { FindMatchesButton } from "@/components/app/FindMatchesButton";
import { HoldCard } from "@/components/app/HoldCard";
import { Reveal, RevealItem } from "@/components/motion/Reveal";
import { aiEnabled } from "@/lib/ai/gemini";
import type { Gap } from "@/lib/types";

export const metadata: Metadata = { title: "Overview | Shortlist" };
export const maxDuration = 60;

export default async function Overview({ searchParams }: { searchParams: { welcome?: string } }) {
  const { supabase, userId } = await requireUser();
  const [{ data: profile }, apps, { data: holds }, { count: matchCount }, { count: jobCount }] = await Promise.all([
    supabase.from("profiles").select("full_name, match_threshold, target_roles").eq("id", userId).single(),
    listApplications(supabase, userId, undefined, 200),
    supabase.from("applications").select("id, hold_questions, jobs(title, companies(name))").eq("user_id", userId).eq("state", "hold").order("created_at", { ascending: false }).limit(6),
    supabase.from("matches").select("id", { count: "exact", head: true }).eq("user_id", userId),
    supabase.from("jobs").select("id", { count: "exact", head: true }).eq("status", "open"),
  ]);

  const count = (states: string[]) => apps.filter((a) => states.includes(a.state)).length;
  const stats = [
    { label: "Applying", value: count(["queued", "review", "approved"]), href: "/dashboard/applications?tab=queued" },
    { label: "Need your answer", value: count(["hold"]), href: "/dashboard/applications?tab=hold" },
    { label: "Applied", value: count(["applied"]), href: "/dashboard/applications?tab=applied" },
    { label: "Interviews and offers", value: count(["interview", "offer"]), href: "/dashboard/applications?tab=applied" },
  ];
  const ready = apps.filter((a) => ["queued", "review", "approved", "applied"].includes(a.state)).slice(0, 6);
  const first = (profile?.full_name ?? "").split(" ")[0];

  return (
    <div className="space-y-10">
      <Reveal className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <RevealItem as="h2" className="text-h2 font-extrabold">{first ? `Hello, ${first}.` : "Hello."}</RevealItem>
          <RevealItem as="p" className="mt-2 max-w-prose text-muted">
            {jobCount ? `We're watching ${jobCount.toLocaleString()} open jobs on company career pages. ` : ""}
            The AI applies to jobs at {profile?.match_threshold ?? 80}% match or above for {profile?.target_roles?.slice(0, 3).join(", ") || "your roles"}.
          </RevealItem>
        </div>
        <RevealItem>
          <FindMatchesButton autoRun={Boolean(searchParams.welcome) && !matchCount} />
        </RevealItem>
      </Reveal>

      {!aiEnabled() && (
        <p className="rounded-control bg-hold-soft px-4 py-3 text-sm">Scoring is using basic keyword matching until the Gemini key is working.</p>
      )}

      <Reveal as="ul" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((s) => (
          <RevealItem as="li" key={s.label}>
            <Link href={s.href} className="block rounded-panel border border-rule bg-sheet p-4 transition-[transform,box-shadow] hover:-translate-y-0.5 hover:shadow-lift">
              <p className="text-h2 font-extrabold tabular-nums">{s.value}</p>
              <p className="text-sm text-muted">{s.label}</p>
            </Link>
          </RevealItem>
        ))}
      </Reveal>

      <div className="grid gap-10 lg:grid-cols-[1fr_1.3fr]">
        <section aria-labelledby="holds-title">
          <h2 id="holds-title" className="text-h3 font-bold">Needs your answer</h2>
          <p className="mt-1 text-sm text-muted">These fit you well but ask for something that isn't on your profile. Yes and the AI applies, no and it's rejected.</p>
          <ul className="mt-4 space-y-3">
            {(holds ?? []).length ? (
              (holds ?? []).map((h) => {
                const j = h.jobs as unknown as { title: string; companies: { name: string } | null };
                return <HoldCard key={h.id} id={h.id} title={j.title} company={j.companies?.name ?? ""} questions={(h.hold_questions as Gap[]) ?? []} />;
              })
            ) : (
              <EmptyState title="Nothing waiting" body="When a good job asks for a skill you haven't listed, the question shows up here." />
            )}
          </ul>
        </section>

        <section aria-labelledby="ready-title">
          <div className="flex items-baseline justify-between">
            <h2 id="ready-title" className="text-h3 font-bold">Applying and applied</h2>
            <Link href="/dashboard/applications" className="text-sm font-semibold underline-offset-4 hover:underline">See all</Link>
          </div>
          <ul className="mt-4 space-y-3">
            {ready.length ? (
              ready.map((a, i) => <ApplicationRow key={a.id} a={a} index={i} />)
            ) : (
              <EmptyState title="Nothing applied to yet" body="Run a search now, or wait for tomorrow's daily check. Matches the AI applies to appear here." />
            )}
          </ul>
        </section>
      </div>
    </div>
  );
}
