import { describe, expect, it, vi } from "vitest";
import { FEEDS, SOURCES, adzunaEnabled, fetchFeed } from "@/lib/jobs/feeds";
import { BOARD_ATS } from "@/lib/jobs/ats";
import { mockFetch } from "./helpers";

describe("source list", () => {
  it("has a label for every board and feed", () => {
    for (const s of [...BOARD_ATS, ...FEEDS]) expect(SOURCES[s]?.label, s).toBeTruthy();
  });
  it("gives every feed an attribution link", () => {
    for (const f of FEEDS) expect(SOURCES[f].site, f).toMatch(/^https:\/\//);
  });
});

describe("fetchFeed", () => {
  it("remotive", async () => {
    mockFetch({ remotive: { jobs: [{ id: 1, company_name: "Acme", title: "Data Analyst", candidate_required_location: "India", category: "Data", description: "<p>SQL</p>", url: "https://r/1", publication_date: "2026-10-27T10:00:00" }] } });
    const [j] = await fetchFeed("remotive");
    expect(j).toMatchObject({ external_id: "1", company: "Acme", location: "India", remote: true, description: "SQL", apply_url: "https://r/1" });
    expect(j.posted_at).toMatch(/^2026-10-27/);
  });

  it("arbeitnow follows next-page links up to 3 pages", async () => {
    const page = (n: number, next: string | null) => ({ data: [{ slug: `job-${n}`, company_name: "Co", title: "T", location: "Berlin", remote: false, tags: [], description: "", url: `u${n}`, created_at: 1792800000 }], links: { next } });
    const f = vi.fn(async (u: string) => {
      const n = u.includes("page=3") ? 3 : u.includes("page=2") ? 2 : u.includes("page=4") ? 4 : 1;
      return new Response(JSON.stringify(page(n, `https://www.arbeitnow.com/api/job-board-api?page=${n + 1}`)));
    });
    vi.stubGlobal("fetch", f);
    const jobs = await fetchFeed("arbeitnow");
    expect(jobs.map((j) => j.external_id)).toEqual(["job-1", "job-2", "job-3"]);
    expect(f).toHaveBeenCalledTimes(3);
    expect(jobs[0].posted_at).toBe(new Date(1792800000 * 1000).toISOString());
  });

  it("remoteok skips its legal-notice first row", async () => {
    mockFetch({ remoteok: [{ legal: "notice" }, { id: 5, company: "X", position: "ML Engineer", tags: ["ml"], description: "", url: "https://ro/5", epoch: 1792800000 }] });
    const jobs = await fetchFeed("remoteok");
    expect(jobs).toHaveLength(1);
    expect(jobs[0]).toMatchObject({ external_id: "5", title: "ML Engineer", location: "Remote", department: "ml" });
  });

  it("himalayas stops paging on a short page", async () => {
    const f = mockFetch({ himalayas: { jobs: [{ guid: "g1", companyName: "H", title: "Analyst", locationRestrictions: ["India", "Nepal"], applicationLink: "https://h/1", pubDate: 1792800000 }] } });
    const jobs = await fetchFeed("himalayas");
    expect(f).toHaveBeenCalledTimes(1);
    expect(jobs[0]).toMatchObject({ location: "India, Nepal", apply_url: "https://h/1" });
  });

  it("jobicy decodes entities in titles", async () => {
    mockFetch({ jobicy: { jobs: [{ id: 3, companyName: "J", jobTitle: "Data &amp; AI Analyst", jobGeo: "APAC", jobIndustry: ["Data"], jobDescription: "x", url: "https://j/3" }] } });
    const [j] = await fetchFeed("jobicy");
    expect(j.title).toBe("Data & AI Analyst");
    expect(j.location).toBe("APAC");
  });

  it("the muse keeps the pages that load when one fails", async () => {
    const f = vi.fn(async (u: string) =>
      u.includes("page=2") ? new Response("x", { status: 500 }) : new Response(JSON.stringify({ results: [{ id: Number(u.match(/page=(\d)/)![1]), name: "Analyst", company: { name: "M" }, locations: [{ name: "Flexible / Remote" }], categories: [{ name: "Data" }], contents: "", refs: { landing_page: "https://m" } }] })),
    );
    vi.stubGlobal("fetch", f);
    const jobs = await fetchFeed("themuse");
    expect(jobs).toHaveLength(4);
    expect(jobs[0].remote).toBe(true);
  });

  describe("adzuna", () => {
    it("is off without keys and makes no calls", async () => {
      vi.stubEnv("ADZUNA_APP_ID", "");
      vi.stubEnv("ADZUNA_APP_KEY", "");
      const f = mockFetch({});
      expect(adzunaEnabled()).toBe(false);
      expect(await fetchFeed("adzuna", ["data analyst"])).toEqual([]);
      expect(f).not.toHaveBeenCalled();
    });

    it("searches each distinct role once, in India by default", async () => {
      vi.stubEnv("ADZUNA_APP_ID", "id");
      vi.stubEnv("ADZUNA_APP_KEY", "key");
      vi.stubEnv("ADZUNA_COUNTRY", "");
      const f = mockFetch({ "api.adzuna.com": { results: [{ id: 11, company: { display_name: "A" }, title: "<strong>Data</strong> Analyst", location: { display_name: "Hyderabad, Telangana" }, category: { label: "IT Jobs" }, description: "d", redirect_url: "https://az/11", created: "2026-10-27T00:00:00Z" }] } });
      const jobs = await fetchFeed("adzuna", ["Data Analyst", "data analyst ", "ML Engineer", ""]);
      expect(f).toHaveBeenCalledTimes(2);
      expect(String(f.mock.calls[0][0])).toContain("/jobs/in/search/1");
      expect(String(f.mock.calls[0][0])).toContain("what=data%20analyst");
      expect(jobs[0]).toMatchObject({ title: "Data Analyst", location: "Hyderabad, Telangana", apply_url: "https://az/11" });
    });
  });
});
