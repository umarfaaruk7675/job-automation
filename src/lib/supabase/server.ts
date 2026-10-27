import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/** Supabase client for Server Components, Route Handlers and Server Actions. */
export function createClient() {
  const cookieStore = cookies();
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
    // Next.js 14 caches fetch() by default; database reads must always be fresh.
    global: { fetch: noStoreFetch },
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Called from a Server Component, which can't write cookies.
          // The middleware refreshes sessions, so this is safe to ignore.
        }
      },
    },
  });
}

export function supabaseConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
}

/** The signed-in user's verified claims, or null. */
export async function getSignedInUser() {
  if (!supabaseConfigured()) return null;
  const supabase = createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims?.sub) return null;
  const meta = (claims.user_metadata ?? {}) as Record<string, unknown>;
  const name = (meta.full_name as string) || (meta.name as string) || (claims.email as string) || "there";
  return { id: claims.sub as string, email: (claims.email as string) ?? "", name };
}

export const noStoreFetch: typeof fetch = (input, init) => fetch(input, { ...init, cache: "no-store" });
