import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createHash } from "crypto";
import { fetchBoard, type Ats, type NormalizedJob } from "./ats";
import { FEEDS, fetchFeed, type Feed, type FeedJob } from "./feeds";
import { SEED_COMPANIES } from "./seed";

const KEEP_DAYS = 30; // jobs older than this aren't stored
const FAILURES_BEFORE_OFF = 3;

type Company = { id: number; name: string; ats: Ats; slug: string; payload_hash: string | null; failure_count: number };
export type Report = { boards: number; unchanged: number; upserted: number; closed: number; feeds: Record<string, number | string>; failed: string[] };

const sha1 = (s: string) => createHash("sha1").update(s).digest("hex");
const slugify = (s: string) => s.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80) || "unknown";
const fresh = <T extends NormalizedJob>(jobs: T[]) => {
  const cutoff = Date.now() - KEEP_DAYS * 864e5;
  return jobs.filter((j) => j.apply_url && j.title && (!j.posted_at || Date.parse(j.posted_at) >= cutoff));
};

function toRow(companyId: number, source: string, j: NormalizedJob, now: string) {
  return {
    company_id: companyId,
    source,
    external_id: j.external_id.slice(0, 200),
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
    content_hash: sha1(j.title + j.description),
  };
}

async function upsertJobs(db: SupabaseClient, rows: ReturnType<typeof toRow>[]) {
  for (let i = 0; i < rows.length; i += 200) {
    const { error } = await db.from("jobs").upsert(rows.slice(i, i + 200), { onConflict: "company_id,external_id" });
    if (error) throw new Error(error.message);
  }
}

/** Marks jobs missing from a full fetch; closes them after two misses in a row. */
async function closeMissing(db: SupabaseClient, filter: { company_id?: number; source?: string }, seen: Set<string>) {
  let q = db.from("jobs").select("id, company_id, external_id, missed_polls").eq("status", "open");
  if (filter.company_id) q = q.eq("company_id", filter.company_id);
  if (filter.source) q = q.eq("source", filter.source);
  const { data } = await q.limit(5000);
  let closed = 0;
  for (const j of data ?? []) {
    if (seen.has(`${j.company_id}:${j.external_id}`)) continue;
    const missed = j.missed_polls + 1;
    await db.from("jobs").update({ missed_polls: missed, status: missed >= 2 ? "closed" : "open" }).eq("id", j.id);
    if (missed >= 2) closed++;
  }
  return closed;
}

export async function seedCompanies(db: SupabaseClient) {
  await db.from("companies").upsert(SEED_COMPANIES.map((c) => ({ ...c, kind: "board" })), { onConflict: "ats,slug", ignoreDuplicates: true });
}

/** Refreshes multi-company feeds, then individual company boards, within a time budget. */
export async function discoverJobs(db: SupabaseClient, { budgetMs = 40_000, batch = 6, queries = [] as string[] } = {}) {
  const started = Date.now();
  const report: Report = { boards: 0, unchanged: 0, upserted: 0, closed: 0, feeds: {}, failed: [] };

  await Promise.all(FEEDS.map((f) => pollFeed(db, f, queries, report)));

  const { data: companies } = await db
    .from("companies")
    .select("id, name, ats, slug, payload_hash, failure_count")
    .eq("active", true)
    .eq("kind", "board")
    .order("last_polled_at", { ascending: true, nullsFirst: true })
    .limit(80);

  const queue = (companies ?? []) as Company[];
  while (queue.length && Date.now() - started < budgetMs) {
    const group = queue.splice(0, batch);
    await Promise.all(group.map((c) => pollBoard(db, c, report)));
  }
  return report;
}

async function pollFeed(db: SupabaseClient, feed: Feed, queries: string[], report: Report) {
  const now = new Date().toISOString();
  try {
    const jobs = fresh(await fetchFeed(feed, queries)) as FeedJob[];
    if (!jobs.length) {
      report.feeds[feed] = 0;
      return;
    }
    // One company row per employer named in the feed.
    const names = new Map<string, string>();
    for (const j of jobs) names.set(slugify(j.company || "unknown"), (j.company || "Unknown").slice(0, 200));
    const ids = new Map<string, number>();
    const entries = Array.from(names.entries());
    for (let i = 0; i < entries.length; i += 300) {
      const { data, error } = await db
        .from("companies")
        .upsert(entries.slice(i, i + 300).map(([slug, name]) => ({ ats: feed, slug, name, kind: "feed", active: true })), { onConflict: "ats,slug" })
        .select("id, slug");
      if (error) throw new Error(error.message);
      for (const c of data ?? []) ids.set(c.slug, c.id);
    }
    const rows = jobs
      .map((j) => ({ id: ids.get(slugify(j.company || "unknown")), j }))
      .filter((x): x is { id: number; j: FeedJob } => Boolean(x.id))
      .map(({ id, j }) => toRow(id, feed, j, now));
    // A feed can repeat a job; keep the last copy so the upsert doesn't conflict with itself.
    const unique = Array.from(new Map(rows.map((r) => [`${r.company_id}:${r.external_id}`, r])).values());
    await upsertJobs(db, unique);
    report.upserted += unique.length;
    report.feeds[feed] = unique.length;
    // Search-style feeds only return what we asked for, so absence doesn't mean closed.
    if (feed !== "adzuna") report.closed += await closeMissing(db, { source: feed }, new Set(unique.map((r) => `${r.company_id}:${r.external_id}`)));
  } catch (e) {
    report.feeds[feed] = `failed: ${(e as Error).message}`;
  }
}

async function pollBoard(db: SupabaseClient, c: Company, report: Report) {
  const now = new Date().toISOString();
  try {
    const { name, jobs } = await fetchBoard(c.ats, c.slug);
    report.boards++;
    const keep = fresh(jobs);
    const hash = sha1(keep.map((j) => `${j.external_id}:${j.title}`).sort().join("|"));

    await db
      .from("companies")
      .update({ last_polled_at: now, failure_count: 0, payload_hash: hash, ...(name ? { name } : {}) })
      .eq("id", c.id);

    if (hash === c.payload_hash) {
      report.unchanged++;
      await db.from("jobs").update({ last_seen_at: now, missed_polls: 0 }).eq("company_id", c.id).eq("status", "open");
      return;
    }
    if (keep.length) {
      const rows = keep.map((j) => toRow(c.id, c.ats, j, now));
      await upsertJobs(db, Array.from(new Map(rows.map((r) => [r.external_id, r])).values()));
      report.upserted += rows.length;
    }
    report.closed += await closeMissing(db, { company_id: c.id }, new Set(keep.map((j) => `${c.id}:${j.external_id}`)));
  } catch (e) {
    const failures = c.failure_count + 1;
    report.failed.push(`${c.ats}/${c.slug}: ${(e as Error).message}`);
    await db.from("companies").update({ last_polled_at: now, failure_count: failures, active: failures < FAILURES_BEFORE_OFF }).eq("id", c.id);
  }
}
