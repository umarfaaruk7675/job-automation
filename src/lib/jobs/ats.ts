import "server-only";
/* eslint-disable @typescript-eslint/no-explicit-any -- third-party job board JSON, normalized below */
import { cleanUntrusted } from "@/lib/ai/gemini";

export type Ats = "greenhouse" | "lever" | "ashby";

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

const UA = "ShortlistJobBot/1.0 (+https://job-automation-jet.vercel.app)";

async function getJson(url: string) {
  const res = await fetch(url, { headers: { "User-Agent": UA, Accept: "application/json" }, cache: "no-store" });
  if (!res.ok) throw new Error(`${res.status} from ${new URL(url).host}`);
  return res.json();
}

function decodeEntities(html: string) {
  return html.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, "&");
}

const looksRemote = (s?: string | null) => /remote|anywhere|work from home/i.test(s ?? "");

/** Fetches every open job on one company's public job board. */
export async function fetchBoard(ats: Ats, slug: string): Promise<{ name?: string; jobs: NormalizedJob[] }> {
  if (ats === "greenhouse") {
    const [board, data] = await Promise.all([
      getJson(`https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(slug)}`).catch(() => null),
      getJson(`https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(slug)}/jobs?content=true`),
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
    const site = slug.replace(/^eu:/, "");
    const data = await getJson(`https://${host}/v0/postings/${encodeURIComponent(site)}?mode=json`);
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
          posted_at: j.createdAt ? new Date(j.createdAt).toISOString() : null,
        };
      }),
    };
  }

  const data = await getJson(`https://api.ashbyhq.com/posting-api/job-board/${encodeURIComponent(slug)}?includeCompensation=true`);
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

/**
 * Works out the job board from a careers link, for example
 * boards.greenhouse.io/acme, jobs.lever.co/acme or jobs.ashbyhq.com/acme.
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
  if ((host === "boards.greenhouse.io" || host === "job-boards.greenhouse.io" || host.endsWith(".greenhouse.io")) && (first || forParam)) {
    const slug = forParam ?? first!;
    if (slug !== "embed") return { ats: "greenhouse", slug: slug.toLowerCase() };
  }
  if ((host === "jobs.lever.co" || host === "jobs.eu.lever.co") && first) {
    return { ats: "lever", slug: (host.includes(".eu.") ? "eu:" : "") + first.toLowerCase() };
  }
  if (host === "jobs.ashbyhq.com" && first) return { ats: "ashby", slug: first };
  return null;
}
