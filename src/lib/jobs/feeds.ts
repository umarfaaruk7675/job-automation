import "server-only";
/* eslint-disable @typescript-eslint/no-explicit-any -- third-party feed JSON, normalized below */
import { cleanUntrusted } from "@/lib/ai/gemini";
import { decodeEntities, getJson, looksRemote, type NormalizedJob } from "./ats";

export type Feed = "remotive" | "arbeitnow" | "remoteok" | "himalayas" | "jobicy" | "themuse" | "adzuna";
export type FeedJob = NormalizedJob & { company: string };

/** Display names and the link each source asks us to credit. */
export const SOURCES: Record<string, { label: string; site?: string }> = {
  greenhouse: { label: "Greenhouse" },
  lever: { label: "Lever" },
  ashby: { label: "Ashby" },
  workable: { label: "Workable" },
  smartrecruiters: { label: "SmartRecruiters" },
  recruitee: { label: "Recruitee" },
  remotive: { label: "Remotive", site: "https://remotive.com" },
  arbeitnow: { label: "Arbeitnow", site: "https://www.arbeitnow.com" },
  remoteok: { label: "Remote OK", site: "https://remoteok.com" },
  himalayas: { label: "Himalayas", site: "https://himalayas.app" },
  jobicy: { label: "Jobicy", site: "https://jobicy.com" },
  themuse: { label: "The Muse", site: "https://www.themuse.com" },
  adzuna: { label: "Adzuna", site: "https://www.adzuna.in" },
};

const iso = (v: unknown) => {
  if (v == null || v === "") return null;
  const d = typeof v === "number" ? new Date(v < 1e12 ? v * 1000 : v) : new Date(String(v));
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
};
const clean = (html?: string) => cleanUntrusted(decodeEntities(html ?? ""));

export function adzunaEnabled() {
  return Boolean(process.env.ADZUNA_APP_ID && process.env.ADZUNA_APP_KEY);
}

/**
 * Fetches one multi-company feed. `queries` are role keywords from users'
 * profiles, used by search-style sources (Adzuna) so we only pull relevant jobs.
 */
export async function fetchFeed(feed: Feed, queries: string[] = []): Promise<FeedJob[]> {
  switch (feed) {
    case "remotive": {
      const d = await getJson("https://remotive.com/api/remote-jobs?limit=300");
      return (d.jobs ?? []).map((j: any) => ({
        external_id: String(j.id),
        company: j.company_name,
        title: j.title,
        location: j.candidate_required_location || "Remote",
        remote: true,
        department: j.category ?? null,
        description: clean(j.description),
        apply_url: j.url,
        posted_at: iso(j.publication_date),
      }));
    }
    case "arbeitnow": {
      const out: FeedJob[] = [];
      let url: string | null = "https://www.arbeitnow.com/api/job-board-api";
      for (let page = 0; url && page < 3; page++) {
        const d: any = await getJson(url);
        for (const j of d.data ?? []) {
          out.push({
            external_id: j.slug,
            company: j.company_name,
            title: j.title,
            location: j.location || null,
            remote: Boolean(j.remote) || looksRemote(j.location),
            department: (j.tags ?? [])[0] ?? null,
            description: clean(j.description),
            apply_url: j.url,
            posted_at: iso(j.created_at),
          });
        }
        url = d.links?.next ?? null;
      }
      return out;
    }
    case "remoteok": {
      const d = await getJson("https://remoteok.com/api");
      return (Array.isArray(d) ? d : [])
        .filter((j: any) => j && j.id && j.position)
        .map((j: any) => ({
          external_id: String(j.id),
          company: j.company,
          title: j.position,
          location: j.location || "Remote",
          remote: true,
          department: (j.tags ?? [])[0] ?? null,
          description: clean(j.description),
          apply_url: j.url ?? j.apply_url,
          posted_at: iso(j.epoch ?? j.date),
        }));
    }
    case "himalayas": {
      const out: FeedJob[] = [];
      for (let offset = 0; offset < 300; offset += 100) {
        const d = await getJson(`https://himalayas.app/jobs/api?limit=100&offset=${offset}`);
        const jobs = d.jobs ?? [];
        for (const j of jobs) {
          out.push({
            external_id: String(j.guid ?? j.applicationLink),
            company: j.companyName,
            title: j.title,
            location: (j.locationRestrictions ?? []).join(", ") || "Remote",
            remote: true,
            department: (j.categories ?? [])[0] ?? null,
            description: clean(j.description ?? j.excerpt),
            apply_url: j.applicationLink ?? j.guid,
            posted_at: iso(j.pubDate),
          });
        }
        if (jobs.length < 100) break;
      }
      return out;
    }
    case "jobicy": {
      const d = await getJson("https://jobicy.com/api/v2/remote-jobs?count=100");
      return (d.jobs ?? []).map((j: any) => ({
        external_id: String(j.id),
        company: j.companyName,
        title: decodeEntities(j.jobTitle ?? ""),
        location: j.jobGeo || "Remote",
        remote: true,
        department: Array.isArray(j.jobIndustry) ? j.jobIndustry[0] : null,
        description: clean(j.jobDescription ?? j.jobExcerpt),
        apply_url: j.url,
        posted_at: iso(j.pubDate),
      }));
    }
    case "themuse": {
      const pages = await Promise.all(
        [0, 1, 2, 3, 4].map((p) => getJson(`https://www.themuse.com/api/public/jobs?page=${p}&descending=true`).catch(() => ({ results: [] }))),
      );
      return pages.flatMap((d: any) =>
        (d.results ?? []).map((j: any) => {
          const loc = (j.locations ?? []).map((l: any) => l.name).join(", ");
          return {
            external_id: String(j.id),
            company: j.company?.name ?? "Unknown",
            title: j.name,
            location: loc || null,
            remote: looksRemote(loc),
            department: (j.categories ?? [])[0]?.name ?? null,
            description: clean(j.contents),
            apply_url: j.refs?.landing_page,
            posted_at: iso(j.publication_date),
          };
        }),
      );
    }
    case "adzuna": {
      if (!adzunaEnabled()) return [];
      const id = process.env.ADZUNA_APP_ID!;
      const key = process.env.ADZUNA_APP_KEY!;
      const country = process.env.ADZUNA_COUNTRY || "in";
      const terms = Array.from(new Set(queries.map((q) => q.trim().toLowerCase()).filter(Boolean))).slice(0, 8);
      const results = await Promise.all(
        terms.map((what) =>
          getJson(
            `https://api.adzuna.com/v1/api/jobs/${country}/search/1?app_id=${id}&app_key=${key}&results_per_page=50&max_days_old=7&sort_by=date&what=${encodeURIComponent(what)}&content-type=application/json`,
          ).catch(() => ({ results: [] })),
        ),
      );
      return results.flatMap((d: any) =>
        (d.results ?? []).map((j: any) => ({
          external_id: String(j.id),
          company: j.company?.display_name ?? "Unknown",
          title: decodeEntities(j.title ?? "").replace(/<\/?strong>/g, ""),
          location: j.location?.display_name ?? null,
          remote: looksRemote(`${j.title} ${j.location?.display_name}`),
          department: j.category?.label ?? null,
          description: clean(j.description),
          apply_url: j.redirect_url,
          posted_at: iso(j.created),
        })),
      );
    }
  }
}

export const FEEDS: Feed[] = ["remotive", "arbeitnow", "remoteok", "himalayas", "jobicy", "themuse", "adzuna"];
