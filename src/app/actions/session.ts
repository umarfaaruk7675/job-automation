import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/** The verified signed-in user and a database client acting as them. */
export async function requireUser() {
  const supabase = createClient();
  const { data } = await supabase.auth.getClaims();
  const id = data?.claims?.sub as string | undefined;
  if (!id) redirect("/signin");
  return { supabase, userId: id, email: (data!.claims.email as string) ?? "" };
}
