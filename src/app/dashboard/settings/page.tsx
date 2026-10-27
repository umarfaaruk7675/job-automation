import type { Metadata } from "next";
import { requireUser } from "@/app/actions/session";
import { SettingsForm } from "@/components/app/SettingsForm";
import type { Profile } from "@/lib/types";

export const metadata: Metadata = { title: "Settings | Shortlist" };

export default async function SettingsPage() {
  const { supabase, userId } = await requireUser();
  const [{ data: profile }, { count: approved }, { data: companies }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", userId).single(),
    supabase.from("applications").select("id", { count: "exact", head: true }).eq("user_id", userId).in("state", ["approved", "applied", "interview", "offer", "rejected"]),
    supabase.from("companies").select("name, ats").eq("added_by", userId).order("created_at", { ascending: false }),
  ]);
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-h2 font-extrabold">Settings</h1>
        <p className="mt-1 text-muted">How many jobs you see, how they reach you, and what happens automatically.</p>
      </div>
      <SettingsForm profile={profile as Profile} approvedCount={approved ?? 0} followed={(companies ?? []).map((c) => c.name)} />
    </div>
  );
}
