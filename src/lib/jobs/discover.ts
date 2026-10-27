import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createHash } from "crypto";
import { fetchBoard, type Ats } from "./ats";
import { SEED_COMPANIES } from "./seed";

const KEEP_DAYS = 30; // jobs older than this aren't stored
const FAILURES_BEFORE_OFF = 3;

type Company = { id: number; name: string; ats: Ats; slug: string; payload_hash: string | null; failure_count: number };

export async function seedCompanies(db: SupabaseClient) {
  await db.from("companies").upsert(
    SEED_COMPANIES.map((c) => ({ ...c })),
    { onConflict: "ats,slug", ignoreDuplicates: true },
  );
}

/** Polls the least recently checked boards until the time budget runs out. */
export async function discoverJobs(db: SupabaseClient, { budgetMs = 40_000, batch = 6 } = {}) {
  const started = Date.now();
  const report = { boards: 0, unchanged: 0, upserted: 0, closed: 0, failed: [] as string[] };

  const { data: companies } = await db
    .from("companies")
    .select("id, name, ats, slug, payload_hash, failure_count")
    .eq("active", true)
    .order("last_polled_at", { ascending: true, nullsFirst: true })
    .limit(60);

  const queue = (companies ?? []) as Company[];
  while (queue.length && Date.now() - started < budgetMs) {
    const group = queue.splice(0, batch);
    await Promise.all(group.map((c) => pollOne(db, c, report)));
  }
  return report;
}

async function pollOne(db: SupabaseClient, c: Company, report: { boards: number; unchanged: number; upserted: number; closed: number; failed: string[] }) {
  const now = new Date().toISOString();
  try {
    const { name, jobs } = await fetchBoard(c.ats, c.slug);
    report.boards++;
    const cutoff = Date.now() - KEEP_DAYS * 864e5;
    const fresh = jobs.filter((j) => j.apply_url && (!j.posted_at || Date.parse(j.posted_at) >= cutoff));
    const hash = createHash("sha1").update(fresh.map((j) => `${j.external_id}:${j.title}`).sort().join("|")).digest("hex");

    await db
      .from("companies")
      .update({ last_polled_at: now, failure_count: 0, payload_hash: hash, ...(name ? { name } : {}) })
      .eq("id", c.id);

    if (hash === c.payload_hash) {
      report.unchanged++;
      await db.from("jobs").update({ last_seen_at: now, missed_polls: 0 }).eq("company_id", c.id).eq("status", "open");
      return;
    }

    if (fresh.length) {
      const rows = fresh.map((j) => ({
        company_id: c.id,
        external_id: j.external_id,
        title: j.title.slice(0, 300),
        location: j.location?.slice(0, 300) ?? null,
        remote: j.remote,
        department: j.department?.slice(0, 200) ?? null,
        description: j.description.slice(0, 8000),
        apply_url: j.apply_url,
        posted_at: j.posted_at,
        last_seen_at: now,
        missed_polls: 0,
        status: "open",
        content_hash: createHash("sha1").update(j.title + j.description).digest("hex"),
      }));
      for (let i = 0; i < rows.length; i += 200) {
        const { error } = await db.from("jobs").upsert(rows.slice(i, i + 200), { onConflict: "company_id,external_id" });
        if (error) throw new Error(error.message);
      }
      report.upserted += rows.length;
    }

    // Jobs missing from this poll: close them after two misses in a row.
    const seen = new Set(fresh.map((j) => j.external_id));
    const { data: open } = await db.from("jobs").select("id, external_id, missed_polls").eq("company_id", c.id).eq("status", "open");
    for (const j of open ?? []) {
      if (seen.has(j.external_id)) continue;
      const missed = j.missed_polls + 1;
      await db.from("jobs").update({ missed_polls: missed, status: missed >= 2 ? "closed" : "open" }).eq("id", j.id);
      if (missed >= 2) report.closed++;
    }
  } catch (e) {
    const failures = c.failure_count + 1;
    report.failed.push(`${c.ats}/${c.slug}: ${(e as Error).message}`);
    await db
      .from("companies")
      .update({ last_polled_at: now, failure_count: failures, active: failures < FAILURES_BEFORE_OFF })
      .eq("id", c.id);
  }
}
