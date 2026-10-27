import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AppHeader } from "@/components/app/AppHeader";
import { ApplicationLedger } from "@/components/app/ApplicationLedger";
import { ResumePanel, type StoredResume } from "@/components/app/ResumePanel";
import { createClient, getSignedInUser } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Dashboard | Shortlist" };
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await getSignedInUser();
  if (!user) redirect("/signin?next=/dashboard");

  const supabase = createClient();
  const { data: files } = await supabase.storage
    .from("resumes")
    .list(user.id, { limit: 1, sortBy: { column: "created_at", order: "desc" } });
  const latest = files?.find((f) => f.id);
  const resume: StoredResume | null = latest
    ? {
        path: `${user.id}/${latest.name}`,
        name: latest.name.replace(/^\d+-/, ""),
        size: (latest.metadata?.size as number) ?? 0,
        updatedAt: latest.created_at ?? null,
      }
    : null;

  const firstName = user.name.includes("@") ? "" : user.name.split(" ")[0];

  return (
    <>
      <AppHeader name={user.name} email={user.email} />
      <main id="main" className="mx-auto max-w-page px-4 pb-20 pt-10 sm:px-6 lg:pt-14">
        <h1 className="text-h2 font-extrabold">{firstName ? `Welcome, ${firstName}.` : "Welcome."}</h1>
        <p className="mt-2 max-w-prose text-muted">
          {resume
            ? "Your resume is saved. Matching starts once your profile is confirmed."
            : "Add your resume to get started. Nothing is sent to employers until you approve it."}
        </p>

        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1.1fr] lg:items-start">
          <ResumePanel userId={user.id} initial={resume} />

          <section aria-labelledby="apps-title" className="min-w-0">
            <h2 id="apps-title" className="text-h3 font-bold">
              Applications
            </h2>
            <p className="mt-1 text-muted">
              None yet. Once matching is on, jobs land here with a score, and any that need your answer wait for you.
              This is what the list will look like:
            </p>
            <div className="mt-5">
              <ApplicationLedger />
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
