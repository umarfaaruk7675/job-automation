import { redirect } from "next/navigation";
import { AppHeader } from "@/components/app/AppHeader";
import { requireUser } from "@/app/actions/session";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { supabase, userId, email } = await requireUser();
  const { data: profile } = await supabase.from("profiles").select("full_name, onboarding_completed_at").eq("id", userId).maybeSingle();
  if (!profile?.onboarding_completed_at) redirect("/onboarding");
  return (
    <>
      <AppHeader name={profile.full_name || email} email={email} showNav />
      <main id="main" className="mx-auto max-w-page px-4 pb-28 pt-8 sm:px-6 lg:pb-16 lg:pt-10">
        {children}
      </main>
    </>
  );
}
