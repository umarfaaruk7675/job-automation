import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** Finishes Google, LinkedIn and GitHub sign-in and email confirmation links. */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const next = safeNext(searchParams.get("next"));

  if (code) {
    const supabase = createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${next}`);
  }

  const message = searchParams.get("error_description") ?? "That sign-in link didn't work. Try signing in again.";
  return NextResponse.redirect(`${origin}/signin?error=${encodeURIComponent(message)}`);
}

// Only allow redirects to paths on this site.
function safeNext(value: string | null) {
  return value && value.startsWith("/") && !value.startsWith("//") ? value : "/dashboard";
}
