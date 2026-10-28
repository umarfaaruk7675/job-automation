/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, it, vi } from "vitest";
import { discoverJobs, sha1 } from "@/lib/jobs/discover";
import { arg, fakeDb, has, type Op } from "./fake-db";
import * as feeds from "@/lib/jobs/feeds";
import * as ats from "@/lib/jobs/ats";

// Every feed returns nothing unless a test says otherwise.
vi.mock("@/lib/jobs/feeds", async (orig) => {
  const real: any = await orig();
  return { ...real, FEEDS: ["remotive", "adzuna"], fetchFeed: vi.fn(async () => []) };
});
vi.mock("@/lib/jobs/ats", async (orig) => {
  const real: any = await orig();
  return { ...real, fetchBoard: vi.fn() };
});


function db(companies: any[], openJobs: any[] = []) {
  return fakeDb((op: Op) => {
    if (op.table === "companies" && has(op, "select") && !has(op, "upsert")) return { data: companies };
    if (op.table === "companies" && has(op, "upsert")) return { data: (arg(op, "upsert") as any[]).map((c, i) => ({ id: 900 + i, slug: c.slug })) };
    if (op.table === "jobs" && has(op, "select")) return { data: openJobs };
    return { data: null, error: null };
  });
}
const updatesTo = (d: ReturnType<typeof db>, table: string) => d.log.filter((o) => o.table === table && has(o, "update")).map((o) => arg(o, "update"));
const recent = new Date().toISOString();

describe("discoverJobs", () => {
  it("only polls board companies, not feed employers", async () => {
    const d = db([]);
    await discoverJobs(d as any, { budgetMs: 1000 });
    const q = d.log.find((o) => o.table === "companies" && has(o, "order"))!;
    expect(q.calls.filter((c) => c.method === "eq").map((c) => c.args)).toEqual([["active", true], ["kind", "board"]]);
  });

  it("counts failures and switches a board off after the third", async () => {
    vi.mocked(ats.fetchBoard).mockRejectedValue(new Error("404 from api.lever.co"));
    const d = db([{ id: 1, name: "A", ats: "lever", slug: "a", payload_hash: null, failure_count: 2 }, { id: 2, name: "B", ats: "lever", slug: "b", payload_hash: null, failure_count: 0 }]);
    const r = await discoverJobs(d as any, { budgetMs: 5000 });
    expect(r.failed).toHaveLength(2);
    const ups = updatesTo(d, "companies");
    expect(ups).toContainEqual(expect.objectContaining({ failure_count: 3, active: false }));
    expect(ups).toContainEqual(expect.objectContaining({ failure_count: 1, active: true }));
  });

  it("skips writing jobs when a board hasn't changed", async () => {
    const jobs = [{ external_id: "1", title: "Analyst", location: null, remote: false, department: null, description: "", apply_url: "u", posted_at: recent }];
    vi.mocked(ats.fetchBoard).mockResolvedValue({ jobs });
    const hash = sha1(jobs.map((j) => `${j.external_id}:${j.title}`).sort().join("|"));
    const d = db([{ id: 1, name: "A", ats: "greenhouse", slug: "a", payload_hash: hash, failure_count: 0 }]);
    const r = await discoverJobs(d as any, { budgetMs: 5000 });
    expect(r.unchanged).toBe(1);
    expect(d.log.some((o) => o.table === "jobs" && has(o, "upsert"))).toBe(false);
  });

  it("writes new jobs and closes ones that vanished twice", async () => {
    vi.mocked(ats.fetchBoard).mockResolvedValue({ name: "Acme", jobs: [{ external_id: "new", title: "Analyst", location: null, remote: false, department: null, description: "", apply_url: "u", posted_at: recent }] });
    const d = db([{ id: 1, name: "A", ats: "greenhouse", slug: "a", payload_hash: "old", failure_count: 0 }], [
      { id: 10, company_id: 1, external_id: "gone", missed_polls: 1 },
      { id: 11, company_id: 1, external_id: "new", missed_polls: 0 },
    ]);
    const r = await discoverJobs(d as any, { budgetMs: 5000 });
    expect(r.upserted).toBe(1);
    expect(r.closed).toBe(1);
    expect(updatesTo(d, "jobs")).toContainEqual({ missed_polls: 2, status: "closed" });
  });

  it("feed jobs get one company per employer and carry their source", async () => {
    vi.mocked(ats.fetchBoard).mockReset();
    vi.mocked(feeds.fetchFeed).mockImplementation(async (f: string) =>
      f === "remotive"
        ? [
            { external_id: "r1", company: "Acme, Inc.", title: "Analyst", location: "Remote", remote: true, department: null, description: "", apply_url: "u1", posted_at: recent },
            { external_id: "r2", company: "Acme Inc", title: "Engineer", location: "Remote", remote: true, department: null, description: "", apply_url: "u2", posted_at: recent },
          ]
        : [],
    );
    const d = db([]);
    const r = await discoverJobs(d as any, { budgetMs: 1000 });
    expect(r.feeds.remotive).toBe(2);
    const companyRows = arg(d.log.find((o) => o.table === "companies" && has(o, "upsert"))!, "upsert") as any[];
    expect(companyRows).toEqual([{ ats: "remotive", slug: "acme-inc", name: "Acme Inc", kind: "feed", active: true }]);
    const jobRows = arg(d.log.find((o) => o.table === "jobs" && has(o, "upsert"))!, "upsert") as any[];
    expect(jobRows.every((j) => j.source === "remotive" && j.company_id === 900)).toBe(true);
  });

  it("doesn't close Adzuna jobs just because a search didn't return them", async () => {
    vi.mocked(feeds.fetchFeed).mockImplementation(async (f: string) =>
      f === "adzuna" ? [{ external_id: "a1", company: "X", title: "Analyst", location: "Pune", remote: false, department: null, description: "", apply_url: "u", posted_at: recent }] : [],
    );
    const d = db([], [{ id: 1, company_id: 900, external_id: "older", missed_polls: 1 }]);
    await discoverJobs(d as any, { budgetMs: 1000, queries: ["data analyst"] });
    expect(vi.mocked(feeds.fetchFeed)).toHaveBeenCalledWith("adzuna", ["data analyst"]);
    expect(updatesTo(d, "jobs")).toEqual([]);
  });

  it("one broken feed doesn't stop the others", async () => {
    vi.mocked(feeds.fetchFeed).mockImplementation(async (f: string) => {
      if (f === "remotive") throw new Error("timeout");
      return [];
    });
    const r = await discoverJobs(db([]) as any, { budgetMs: 1000 });
    expect(r.feeds.remotive).toBe("failed: timeout");
    expect(r.feeds.adzuna).toBe(0);
  });
});
