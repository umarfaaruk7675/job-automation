import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * Server-only client with the secret key. It bypasses row-level security, so
 * use it only for shared job data and scheduled work, never with user input
 * that decides whose rows are touched.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
