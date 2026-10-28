import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { safeNext } from "@/lib/safe-next";

/** Finishes Google, LinkedIn and GitHub sign-in and email confirmation links. */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const next = safeNext(searchParams.get("next"));

  if (code) {
    const supabase = createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // New people go to onboarding first; returning people go where they were headed.
      const { data: profile } = await supabase
        .from("profiles")
        .select("onboarding_completed_at")
        .eq("id", data.user.id)
        .maybeSingle();
      const target = profile?.onboarding_completed_at ? next : "/onboarding";
      return NextResponse.redirect(`${origin}${target}`);
    }
  }

  const message = searchParams.get("error_description") ?? "That sign-in link didn't work. Try signing in again.";
  return NextResponse.redirect(`${origin}/signin?error=${encodeURIComponent(message)}`);
}
