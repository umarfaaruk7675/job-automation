import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PROTECTED = ["/dashboard"];
const AUTH_PAGES = ["/signin", "/signup"];

/**
 * Refreshes the Supabase session on every request and routes people:
 * signed-out visitors can't open the dashboard, and signed-in users skip the
 * sign-in pages. Pages still check the user themselves; this is a convenience.
 */
export async function middleware(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return NextResponse.next({ request });

  let response = NextResponse.next({ request });
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  // Must run before anything else so the session is refreshed.
  const { data } = await supabase.auth.getClaims();
  const signedIn = Boolean(data?.claims?.sub);
  const path = request.nextUrl.pathname;

  const redirect = (to: string, next?: string) => {
    const target = request.nextUrl.clone();
    target.pathname = to;
    target.search = next ? `?next=${encodeURIComponent(next)}` : "";
    const res = NextResponse.redirect(target);
    response.cookies.getAll().forEach((c) => res.cookies.set(c));
    return res;
  };

  if (!signedIn && PROTECTED.some((p) => path.startsWith(p))) return redirect("/signin", path);
  if (signedIn && AUTH_PAGES.includes(path)) return redirect("/dashboard");
  return response;
}

export const config = {
  matcher: ["/dashboard/:path*", "/signin", "/signup"],
};
