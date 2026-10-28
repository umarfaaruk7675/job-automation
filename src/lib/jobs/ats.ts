import "server-only";
/* eslint-disable @typescript-eslint/no-explicit-any -- third-party job board JSON, normalized below */
import { cleanUntrusted } from "@/lib/ai/gemini";

export type Ats = "greenhouse" | "lever" | "ashby" | "workable" | "smartrecruiters" | "recruitee";
export const BOARD_ATS: Ats[] = ["greenhouse", "lever", "ashby", "workable", "smartrecruiters", "recruitee"];

export type NormalizedJob = {
  external_id: string;
  title: string;
  location: string | null;
  remote: boolean;
  department: string | null;
  description: string;
  apply_url: string;
  posted_at: string | null;
};

export const UA = "ShortlistJobBot/1.0 (+https://job-automation-jet.vercel.app)";

export async function getJson(url: string, timeoutMs = 12000) {
  const res = await fetch(url, {
    headers: { "User-Agent": UA, Accept: "application/json" },
    cache: "no-store",
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!res.ok) throw new Error(`${res.status} from ${new URL(url).host}`);
  return res.json();
}

export function decodeEntities(html: string) {
  return html.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, "&");
}

export const looksRemote = (s?: string | null) => /remote|anywhere|work from home|wfh/i.test(s ?? "");
const iso = (v: unknown) => {
  if (v == null || v === "") return null;
  const d = typeof v === "number" ? new Date(v < 1e12 ? v * 1000 : v) : new Date(String(v));
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
};
const join = (...parts: (string | null | undefined)[]) => parts.filter(Boolean).join(", ") || null;

/** Fetches every open job on one company's public job board. */
export async function fetchBoard(ats: Ats, slug: string): Promise<{ name?: string; jobs: NormalizedJob[] }> {
  const s = encodeURIComponent(slug);

  if (ats === "greenhouse") {
    const [board, data] = await Promise.all([
      getJson(`https://boards-api.greenhouse.io/v1/boards/${s}`).catch(() => null),
      getJson(`https://boards-api.greenhouse.io/v1/boards/${s}/jobs?content=true`),
    ]);
    return {
      name: board?.name,
      jobs: (data.jobs ?? []).map((j: any) => ({
        external_id: String(j.id),
        title: j.title,
        location: j.location?.name ?? null,
        remote: looksRemote(j.location?.name),
        department: j.departments?.[0]?.name ?? null,
        description: cleanUntrusted(decodeEntities(j.content ?? "")),
        apply_url: j.absolute_url,
        posted_at: j.first_published ?? j.updated_at ?? null,
      })),
    };
  }

  if (ats === "lever") {
    const host = slug.startsWith("eu:") ? "api.eu.lever.co" : "api.lever.co";
    const site = encodeURIComponent(slug.replace(/^eu:/, ""));
    const data = await getJson(`https://${host}/v0/postings/${site}?mode=json`);
    return {
      jobs: (data ?? []).map((j: any) => {
        const lists = (j.lists ?? []).map((l: any) => `${l.text}: ${cleanUntrusted(l.content ?? "", 3000)}`).join(" ");
        return {
          external_id: j.id,
          title: j.text,
          location: j.categories?.location ?? null,
          remote: j.workplaceType === "remote" || looksRemote(j.categories?.location),
          department: j.categories?.team ?? null,
          description: cleanUntrusted(`${j.descriptionPlain ?? ""} ${lists} ${j.additionalPlain ?? ""}`),
          apply_url: j.hostedUrl ?? j.applyUrl,
          posted_at: iso(j.createdAt),
        };
      }),
    };
  }

  if (ats === "ashby") {
    const data = await getJson(`https://api.ashbyhq.com/posting-api/job-board/${s}?includeCompensation=true`);
    return {
      jobs: (data.jobs ?? [])
        .filter((j: any) => j.isListed !== false)
        .map((j: any) => ({
          external_id: j.id,
          title: j.title,
          location: j.location ?? null,
          remote: Boolean(j.isRemote) || j.workplaceType === "Remote" || looksRemote(j.location),
          department: j.department ?? j.team ?? null,
          description: cleanUntrusted(j.descriptionPlain ?? j.descriptionHtml ?? ""),
          apply_url: j.jobUrl ?? j.applyUrl,
          posted_at: j.publishedAt ?? null,
        })),
    };
  }

  if (ats === "workable") {
    const data = await getJson(`https://apply.workable.com/api/v1/widget/accounts/${s}?details=true`);
    return {
      name: data.name,
      jobs: (data.jobs ?? []).map((j: any) => ({
        external_id: j.shortcode ?? String(j.id),
        title: j.title,
        location: join(j.city, j.state, j.country),
        remote: Boolean(j.telecommuting) || looksRemote(j.city),
        department: j.department || null,
        description: cleanUntrusted(decodeEntities(j.description ?? "")),
        apply_url: j.url ?? j.application_url ?? `https://apply.workable.com/${slug}/j/${j.shortcode}/`,
        posted_at: j.published_on ?? j.created_at ?? null,
      })),
    };
  }

  if (ats === "smartrecruiters") {
    const data = await getJson(`https://api.smartrecruiters.com/v1/companies/${s}/postings?limit=100`);
    const postings: any[] = data.content ?? [];
    // Descriptions need one call per posting; fetch them for the newest ones.
    const newest = [...postings].sort((a, b) => String(b.releasedDate).localeCompare(String(a.releasedDate))).slice(0, 40);
    const details = new Map<string, string>();
    await Promise.all(
      newest.map(async (p) => {
        try {
          const d = await getJson(`https://api.smartrecruiters.com/v1/companies/${s}/postings/${p.id}`, 8000);
          const sec = d.jobAd?.sections ?? {};
          details.set(p.id, cleanUntrusted(decodeEntities(`${sec.jobDescription?.text ?? ""} ${sec.qualifications?.text ?? ""}`)));
        } catch {
          /* description stays empty */
        }
      }),
    );
    return {
      name: postings[0]?.company?.name,
      jobs: postings.map((p) => ({
        external_id: p.id,
        title: p.name,
        location: join(p.location?.city, p.location?.region, p.location?.country?.toUpperCase?.()),
        remote: Boolean(p.location?.remote) || looksRemote(p.location?.city),
        department: p.department?.label ?? null,
        description: details.get(p.id) ?? "",
        apply_url: `https://jobs.smartrecruiters.com/${slug}/${p.id}`,
        posted_at: p.releasedDate ?? null,
      })),
    };
  }

  // recruitee
  const data = await getJson(`https://${s}.recruitee.com/api/offers/`);
  return {
    jobs: (data.offers ?? []).map((j: any) => ({
      external_id: String(j.id),
      title: j.title,
      location: j.location || join(j.city, j.country),
      remote: Boolean(j.remote) || looksRemote(j.location),
      department: j.department ?? null,
      description: cleanUntrusted(decodeEntities(`${j.description ?? ""} ${j.requirements ?? ""}`)),
      apply_url: j.careers_url ?? j.careers_apply_url,
      posted_at: j.published_at ?? j.created_at ?? null,
    })),
  };
}

/**
 * Works out the job board from a careers link, for example
 * boards.greenhouse.io/acme, jobs.lever.co/acme, jobs.ashbyhq.com/acme,
 * apply.workable.com/acme, careers.smartrecruiters.com/Acme or acme.recruitee.com.
 */
export function detectBoard(input: string): { ats: Ats; slug: string } | null {
  let url: URL;
  try {
    url = new URL(input.trim().startsWith("http") ? input.trim() : `https://${input.trim()}`);
  } catch {
    return null;
  }
  const host = url.hostname.toLowerCase();
  const first = url.pathname.split("/").filter(Boolean)[0];
  const forParam = url.searchParams.get("for");
  if ((host === "greenhouse.io" || host.endsWith(".greenhouse.io")) && (first || forParam)) {
    const slug = forParam ?? first!;
    if (slug !== "embed") return { ats: "greenhouse", slug: slug.toLowerCase() };
  }
  if ((host === "jobs.lever.co" || host === "jobs.eu.lever.co") && first) {
    return { ats: "lever", slug: (host.includes(".eu.") ? "eu:" : "") + first.toLowerCase() };
  }
  if (host === "jobs.ashbyhq.com" && first) return { ats: "ashby", slug: first };
  if (host === "apply.workable.com" && first) return { ats: "workable", slug: first.toLowerCase() };
  if ((host === "careers.smartrecruiters.com" || host === "jobs.smartrecruiters.com") && first) return { ats: "smartrecruiters", slug: first };
  const rc = host.match(/^([a-z0-9-]+)\.recruitee\.com$/);
  if (rc && rc[1] !== "www") return { ats: "recruitee", slug: rc[1] };
  return null;
}
