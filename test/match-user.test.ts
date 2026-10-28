/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, it, vi } from "vitest";
import { matchUser } from "@/lib/matching";
import { arg, fakeDb, has, type Op } from "./fake-db";
import { job, profile, resume } from "./helpers";

function setup({ jobs, p = profile(), alreadyMatched = [] as number[], appsToday = 0 }: { jobs: any[]; p?: any; alreadyMatched?: number[]; appsToday?: number }) {
  vi.stubEnv("GEMINI_API_KEY", ""); // basic scoring keeps the test deterministic
  let id = 100;
  const db = fakeDb((op: Op) => {
    if (op.table === "profiles") return { data: p };
    if (op.table === "resume_profiles") return { data: resume() };
    if (op.table === "jobs") return { data: jobs };
    if (op.table === "matches" && has(op, "upsert")) return { data: (arg(op, "upsert") as any[]).map((m) => ({ id: id++, job_id: m.job_id, score: m.score, gaps: m.gaps })) };
    if (op.table === "matches") return { data: alreadyMatched.map((job_id) => ({ job_id })) };
    if (op.table === "applications" && has(op, "upsert")) return { data: (arg(op, "upsert") as any[]).map((a, i) => ({ id: 500 + i, state: a.state })) };
    if (op.table === "applications") return { count: appsToday };
    return { data: null };
  });
  return db;
}

const upserted = (db: ReturnType<typeof setup>, table: string) => (arg(db.log.find((o) => o.table === table && has(o, "upsert"))!, "upsert") as any[]) ?? [];

describe("matchUser", () => {
  const good = (id: number, over = {}) => job({ id, title: "Data Analyst", location: "Hyderabad", description: "SQL Python Tableau Excel", ...over });

  it("filters out wrong titles, far-away jobs, excluded companies and jobs already scored", async () => {
    const db = setup({
      p: profile({ excluded_companies: ["Blocked Co"] }),
      alreadyMatched: [4],
      jobs: [
        good(1),
        good(2, { title: "Data Engineer" }),
        good(3, { location: "Boston, MA" }),
        good(4),
        good(5, { companies: { name: "blocked co" } }),
        good(6, { remote: true, location: "Remote - US" }),
      ],
    });
    const r = await matchUser(db as any, "u1");
    expect(upserted(db, "matches").map((m) => m.job_id)).toEqual([1]);
    expect(r.scored).toBe(1);
  });

  it("only jobs at or above the match bar become applications", async () => {
    const db = setup({ p: profile({ match_threshold: 100 }), jobs: [good(1)] });
    const r = await matchUser(db as any, "u1");
    expect(upserted(db, "matches")[0].score).toBeLessThan(100);
    expect(r.created).toBe(0);
    expect(db.log.some((o) => o.table === "applications" && has(o, "upsert"))).toBe(false);
  });

  it("creates review applications and logs an event for each", async () => {
    const db = setup({ p: profile({ match_threshold: 50 }), jobs: [good(1), good(2)] });
    const r = await matchUser(db as any, "u1");
    expect(r.created).toBe(2);
    expect(upserted(db, "applications").every((a) => a.state === "review")).toBe(true);
    const events = arg(db.log.find((o) => o.table === "application_events")!, "insert") as any[];
    expect(events).toHaveLength(2);
  });

  it("respects the daily limit, counting what was already created today", async () => {
    const db = setup({ p: profile({ match_threshold: 50, daily_limit: 3 }), appsToday: 2, jobs: [good(1), good(2), good(3)] });
    await matchUser(db as any, "u1");
    expect(upserted(db, "applications")).toHaveLength(1);
  });

  it("never scores more than 40 jobs in one run", async () => {
    const db = setup({ jobs: Array.from({ length: 60 }, (_, i) => good(i + 1)) });
    const r = await matchUser(db as any, "u1");
    expect(r.scored).toBe(40);
  });

  it("stops quietly when the user has no resume yet", async () => {
    const db = fakeDb((op) => (op.table === "profiles" ? { data: profile() } : { data: null }));
    expect(await matchUser(db as any, "u1")).toEqual({ scored: 0, created: 0 });
  });

  it("puts a job on hold with questions when a must-have skill is missing", async () => {
    const db = setup({ p: profile({ match_threshold: 70 }), jobs: [good(1)] });
    vi.stubEnv("GEMINI_API_KEY", "k");
    const { mockFetch } = await import("./helpers");
    mockFetch({ generativelanguage: { candidates: [{ content: { parts: [{ text: JSON.stringify({ score: 85, eligible: true, reasons: ["Good fit"], gaps: [{ skill: "Power BI", question: "Have you used Power BI?" }] }) }] } }] } });
    await matchUser(db as any, "u1");
    const [app] = upserted(db, "applications");
    expect(app.state).toBe("hold");
    expect(app.hold_questions).toEqual([{ skill: "Power BI", question: "Have you used Power BI?" }]);
  });

  it("caps the score at 40 when the AI finds a hard blocker", async () => {
    const db = setup({ p: profile({ match_threshold: 50 }), jobs: [good(1)] });
    vi.stubEnv("GEMINI_API_KEY", "k");
    const { mockFetch } = await import("./helpers");
    mockFetch({ generativelanguage: { candidates: [{ content: { parts: [{ text: JSON.stringify({ score: 92, eligible: false, reasons: ["Needs US citizenship"], gaps: [] }) }] } }] } });
    const r = await matchUser(db as any, "u1");
    expect(upserted(db, "matches")[0].score).toBe(40);
    expect(r.created).toBe(0);
  });
});
