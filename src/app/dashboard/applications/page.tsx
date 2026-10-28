import type { Metadata } from "next";
import { requireUser } from "@/app/actions/session";
import { listApplications } from "@/lib/server/data";
import { ApplicationRow, EmptyState } from "@/components/app/bits";
import { Tabs } from "@/components/app/Tabs";
import { FindMatchesButton } from "@/components/app/FindMatchesButton";

export const metadata: Metadata = { title: "Applications | Shortlist" };
export const maxDuration = 60;

const GROUPS = {
  hold: { label: "Needs your answer", states: ["hold"] },
  queued: { label: "Applying", states: ["queued", "review", "approved"] },
  applied: { label: "Applied", states: ["applied", "interview", "offer", "rejected"] },
  skipped: { label: "Rejected", states: ["skipped", "closed"] },
} as const;
type Key = keyof typeof GROUPS;

export default async function ApplicationsPage({ searchParams }: { searchParams: { tab?: string } }) {
  const { supabase, userId } = await requireUser();
  const all = await listApplications(supabase, userId, undefined, 300);
  const holdCount = all.filter((a) => a.state === "hold").length;
  const tab: Key = (searchParams.tab && searchParams.tab in GROUPS ? searchParams.tab : holdCount ? "hold" : "queued") as Key;
  const rows = all.filter((a) => (GROUPS[tab].states as readonly string[]).includes(a.state));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-h2 font-extrabold">Applications</h1>
          <p className="mt-1 text-muted">The AI applies to every match. Jobs that need your answer wait here.</p>
        </div>
        <FindMatchesButton />
      </div>
      <Tabs
        active={tab}
        tabs={(Object.keys(GROUPS) as Key[]).map((k) => ({
          key: k,
          label: GROUPS[k].label,
          count: all.filter((a) => (GROUPS[k].states as readonly string[]).includes(a.state)).length,
          href: `/dashboard/applications?tab=${k}`,
        }))}
      />
      <ul className="space-y-3">
        {rows.length ? rows.map((a, i) => <ApplicationRow key={a.id} a={a} index={i} />) : (
          <EmptyState title="Nothing here yet" body={tab === "hold" ? "When a job needs something that isn't on your profile, it waits here for your yes or no." : tab === "queued" ? "New matches above your bar are lined up here every day." : "Applications move here as they progress."} />
        )}
      </ul>
    </div>
  );
}
