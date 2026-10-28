import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PROTECTED = ["/dashboard", "/onboarding"];
const PROTECTED_API = ["/api/applications"];

/** True for the folder itself or anything under it, so "/dashboardx" is not treated as "/dashboard". */
const under = (path: string, root: string) => path === root || path.startsWith(root + "/");
const AUTH_PAGES = ["/signin", "/signup"];

/**
 * Refreshes the Supabase session on every request and routes people:
 * signed-out visitors can't open the dashboard, and signed-in users skip the
 * sign-in pages. Every page, action and API route also checks the user itself,
 * so this is the first of two locks, not the only one.
 */
export async function middleware(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const path = request.nextUrl.pathname;
  const isProtected = PROTECTED.some((p) => under(path, p));
  const isProtectedApi = PROTECTED_API.some((p) => under(path, p));
  // Without auth settings nobody can be verified, so protected paths stay closed.
  if (!url || !key) {
    if (isProtectedApi) return NextResponse.json({ error: "Sign in first" }, { status: 401 });
    if (isProtected) return NextResponse.redirect(new URL("/signin", request.url));
    return NextResponse.next({ request });
  }

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

  const redirect = (to: string, next?: string) => {
    const target = request.nextUrl.clone();
    target.pathname = to;
    target.search = next ? `?next=${encodeURIComponent(next)}` : "";
    const res = NextResponse.redirect(target);
    response.cookies.getAll().forEach((c) => res.cookies.set(c));
    return res;
  };

  if (!signedIn && isProtectedApi) return NextResponse.json({ error: "Sign in first" }, { status: 401 });
  if (!signedIn && isProtected) return redirect("/signin", path);
  if (signedIn && AUTH_PAGES.includes(path)) return redirect("/dashboard");
  return response;
}

export const config = {
  matcher: ["/dashboard/:path*", "/onboarding/:path*", "/api/applications/:path*", "/signin", "/signup"],
};
