import { describe, expect, it } from "vitest";
import { decodeEntities, detectBoard, fetchBoard, looksRemote } from "@/lib/jobs/ats";
import { mockFetch } from "./helpers";

describe("detectBoard", () => {
  it.each([
    ["https://boards.greenhouse.io/Stripe", { ats: "greenhouse", slug: "stripe" }],
    ["job-boards.greenhouse.io/figma/jobs/123", { ats: "greenhouse", slug: "figma" }],
    ["https://boards.greenhouse.io/embed/job_board?for=airbnb", { ats: "greenhouse", slug: "airbnb" }],
    ["https://jobs.lever.co/Meesho/abc", { ats: "lever", slug: "meesho" }],
    ["https://jobs.eu.lever.co/acme", { ats: "lever", slug: "eu:acme" }],
    ["https://jobs.ashbyhq.com/openai", { ats: "ashby", slug: "openai" }],
    ["https://apply.workable.com/HuggingFace/", { ats: "workable", slug: "huggingface" }],
    ["https://careers.smartrecruiters.com/Visa", { ats: "smartrecruiters", slug: "Visa" }],
    ["https://acme.recruitee.com/o/analyst", { ats: "recruitee", slug: "acme" }],
  ])("%s", (url, expected) => {
    expect(detectBoard(url)).toEqual(expected);
  });

  it.each(["https://www.linkedin.com/jobs/view/1", "https://example.com/careers", "not a url at all", "https://www.recruitee.com/", "https://boards.greenhouse.io/"])(
    "rejects %s",
    (url) => expect(detectBoard(url)).toBeNull(),
  );

  it("doesn't trust look-alike hosts", () => {
    expect(detectBoard("https://jobs.lever.co.evil.com/acme")).toBeNull();
    expect(detectBoard("https://evilgreenhouse.io/acme")).toBeNull();
  });
});

describe("helpers", () => {
  it("decodeEntities decodes &amp; last so &amp;lt; stays literal", () => {
    expect(decodeEntities("&lt;b&gt; &quot;x&quot; &#39;y&#39; &amp;lt;")).toBe(`<b> "x" 'y' &lt;`);
  });
  it("looksRemote", () => {
    expect(looksRemote("Remote - India")).toBe(true);
    expect(looksRemote("Work from home")).toBe(true);
    expect(looksRemote("Hyderabad")).toBe(false);
    expect(looksRemote(null)).toBe(false);
  });
});

describe("fetchBoard normalizes each ATS", () => {
  it("greenhouse", async () => {
    mockFetch({
      "boards/acme/jobs": { jobs: [{ id: 7, title: "Data Analyst", location: { name: "Remote - India" }, departments: [{ name: "Data" }], content: "&lt;p&gt;SQL&lt;/p&gt;", absolute_url: "https://x/7", first_published: "2026-10-20T00:00:00Z" }] },
      "boards/acme": { name: "Acme Inc" },
    });
    const r = await fetchBoard("greenhouse", "acme");
    expect(r.name).toBe("Acme Inc");
    expect(r.jobs[0]).toEqual({ external_id: "7", title: "Data Analyst", location: "Remote - India", remote: true, department: "Data", description: "SQL", apply_url: "https://x/7", posted_at: "2026-10-20T00:00:00Z" });
  });

  it("greenhouse still works when the board name call fails", async () => {
    mockFetch({ "boards/acme/jobs": { jobs: [] }, "boards/acme": 500 });
    expect(await fetchBoard("greenhouse", "acme")).toEqual({ name: undefined, jobs: [] });
  });

  it("lever (epoch ms dates, EU host)", async () => {
    const f = mockFetch({ "api.eu.lever.co/v0/postings/acme": [{ id: "a1", text: "ML Engineer", categories: { location: "Pune", team: "AI" }, workplaceType: "remote", descriptionPlain: "Build", lists: [{ text: "Need", content: "<li>Python</li>" }], hostedUrl: "https://l/a1", createdAt: 1792800000000 }] });
    const r = await fetchBoard("lever", "eu:acme");
    expect(String(f.mock.calls[0][0])).toContain("api.eu.lever.co/v0/postings/acme");
    expect(r.jobs[0]).toMatchObject({ external_id: "a1", remote: true, department: "AI", apply_url: "https://l/a1", posted_at: new Date(1792800000000).toISOString() });
    expect(r.jobs[0].description).toBe("Build Need: Python");
  });

  it("ashby skips unlisted jobs", async () => {
    mockFetch({ "job-board/acme": { jobs: [{ id: "1", title: "A", isListed: true, isRemote: true, jobUrl: "u1" }, { id: "2", title: "B", isListed: false, jobUrl: "u2" }] } });
    const r = await fetchBoard("ashby", "acme");
    expect(r.jobs.map((j) => j.external_id)).toEqual(["1"]);
    expect(r.jobs[0].remote).toBe(true);
  });

  it("workable builds a location and a fallback URL", async () => {
    mockFetch({ "accounts/acme": { name: "Acme", jobs: [{ shortcode: "ABC", title: "Analyst", city: "Hyderabad", state: "Telangana", country: "India", telecommuting: false, description: "Hi" }] } });
    const r = await fetchBoard("workable", "acme");
    expect(r.jobs[0]).toMatchObject({ external_id: "ABC", location: "Hyderabad, Telangana, India", remote: false, apply_url: "https://apply.workable.com/acme/j/ABC/" });
  });

  it("smartrecruiters fetches descriptions and survives a failed detail call", async () => {
    mockFetch({
      "postings/p1": { jobAd: { sections: { jobDescription: { text: "<b>SQL</b>" }, qualifications: { text: "Python" } } } },
      "postings/p2": 500,
      "companies/Acme/postings?limit": { content: [
        { id: "p1", name: "Analyst", releasedDate: "2026-10-27", location: { city: "Bengaluru", country: "in", remote: false }, company: { name: "Acme" } },
        { id: "p2", name: "Engineer", releasedDate: "2026-10-26", location: { city: "Remote", country: "in" } },
      ] },
    });
    const r = await fetchBoard("smartrecruiters", "Acme");
    expect(r.name).toBe("Acme");
    expect(r.jobs[0]).toMatchObject({ location: "Bengaluru, IN", description: "SQL Python", apply_url: "https://jobs.smartrecruiters.com/Acme/p1" });
    expect(r.jobs[1]).toMatchObject({ remote: true, description: "" });
  });

  it("recruitee", async () => {
    mockFetch({ "acme.recruitee.com/api/offers": { offers: [{ id: 9, title: "Analyst", city: "Chennai", country: "India", remote: true, description: "a", requirements: "b", careers_url: "https://c/9" }] } });
    const r = await fetchBoard("recruitee", "acme");
    expect(r.jobs[0]).toMatchObject({ external_id: "9", location: "Chennai, India", remote: true, description: "a b" });
  });

  it("throws a readable error on a missing board", async () => {
    mockFetch({});
    await expect(fetchBoard("lever", "nobody")).rejects.toThrow("404 from api.lever.co");
  });
});
