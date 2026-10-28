import { vi } from "vitest";
import type { Profile, ResumeData } from "@/lib/types";
import type { JobRow } from "@/lib/matching";

export function profile(over: Partial<Profile> = {}): Profile {
  return {
    id: "u1", full_name: "Test User", email: "t@example.com", phone: null,
    country: "India", city: "Hyderabad", headline: null,
    target_roles: ["Data Analyst"], experience_level: null, years_experience: null,
    work_modes: ["remote", "hybrid"], preferred_locations: ["hyderabad"], willing_to_relocate: false,
    expected_salary: null, salary_currency: null, notice_period: null, needs_sponsorship: false,
    authorized_countries: [], excluded_companies: [],
    match_threshold: 80, daily_limit: 10, digest_emails: true, submission_mode: "review",
    ...over,
  } as Profile;
}

export function resume(over: Partial<ResumeData> = {}): ResumeData {
  return {
    summary: "Analyst", skills: ["SQL", "Python", "Tableau", "Excel"],
    experience: [{ title: "Analyst", company: "Acme", bullets: ["Built dashboards"] }],
    education: [], projects: [], certifications: [], links: {}, ...over,
  };
}

export function job(over: Partial<JobRow> = {}): JobRow {
  return {
    id: 1, title: "Data Analyst", location: "Hyderabad, India", remote: false,
    description: "We use SQL, Python and Tableau.", posted_at: null,
    first_seen_at: new Date().toISOString(), companies: { name: "Acme" }, ...over,
  };
}

/** Replaces global fetch with a router: each key is a URL substring, value is the JSON body (or a status number). */
export function mockFetch(routes: Record<string, unknown>) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const fn = vi.fn(async (input: string | URL | Request, _init?: RequestInit) => {
    const url = String(input instanceof Request ? input.url : input);
    const key = Object.keys(routes).find((k) => url.includes(k));
    if (!key) return new Response("not found", { status: 404 });
    const body = routes[key];
    if (typeof body === "number") return new Response("err", { status: body });
    return new Response(JSON.stringify(body), { status: 200, headers: { "content-type": "application/json" } });
  });
  vi.stubGlobal("fetch", fn);
  return fn;
}
