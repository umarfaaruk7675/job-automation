import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { discoverJobs, seedCompanies } from "@/lib/jobs/discover";
import { matchUser } from "@/lib/matching";
import { esc, layout, sendEmail } from "@/lib/email";
import { generateJson } from "@/lib/ai/gemini";

export const dynamic = "force-dynamic";
export const maxDuration = 60;
export const fetchCache = "force-no-store";

/**
 * Daily job: refresh job boards, match every onboarded user, and email a
 * digest of applications waiting for them. Vercel Cron calls this with
 * "Authorization: Bearer <CRON_SECRET>".
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  const key = request.nextUrl.searchParams.get("key"); // for a manual run from the browser
  if (!secret || (auth !== `Bearer ${secret}` && key !== secret)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = createAdminClient();
  if (!db) return NextResponse.json({ error: "SUPABASE_SECRET_KEY is not set" }, { status: 500 });

  // ?check=1 only verifies the AI key and returns.
  if (request.nextUrl.searchParams.get("check")) {
    const ai = await generateJson<{ ok: boolean }>({
      system: "Reply with JSON only.",
      prompt: 'Return {"ok": true}.',
      schema: { type: "OBJECT", properties: { ok: { type: "BOOLEAN" } }, required: ["ok"] },
      maxOutputTokens: 20,
    });
    return NextResponse.json({ ai: ai?.ok === true, model: process.env.GEMINI_MODEL || "gemini-flash-lite-latest", email: Boolean(process.env.RESEND_API_KEY) });
  }

  const started = Date.now();
  await seedCompanies(db);
  const discovery = await discoverJobs(db, { budgetMs: 30_000 });

  const { data: users } = await db
    .from("profiles")
    .select("id, email, digest_emails")
    .not("onboarding_completed_at", "is", null)
    .order("updated_at", { ascending: true })
    .limit(50);

  let matched = 0;
  let emailed = 0;
  for (const u of users ?? []) {
    if (Date.now() - started > 52_000) break;
    try {
      const r = await matchUser(db, u.id);
      matched += r.created;
    } catch (e) {
      console.error("match failed", u.id, (e as Error).message);
    }
    if (!u.digest_emails || !u.email) continue;
    const { data: waiting } = await db
      .from("applications")
      .select("state, jobs(title, companies(name))")
      .eq("user_id", u.id)
      .in("state", ["review", "hold"])
      .order("created_at", { ascending: false })
      .limit(10);
    if (waiting?.length) {
      const items = waiting
        .map((a) => {
          const j = a.jobs as unknown as { title: string; companies: { name: string } | null };
          return `<li>${esc(j.title)} at ${esc(j.companies?.name ?? "")}${a.state === "hold" ? " <b>(needs your answer)</b>" : ""}</li>`;
        })
        .join("");
      if (await sendEmail(u.email, `${waiting.length} job${waiting.length > 1 ? "s" : ""} waiting for you`, layout("Jobs waiting for your review", `<ul>${items}</ul>`))) emailed++;
    }
  }

  return NextResponse.json({ discovery, users: users?.length ?? 0, newApplications: matched, emailed, ms: Date.now() - started });
}
