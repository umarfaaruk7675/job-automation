import { afterEach, describe, expect, it, vi } from "vitest";
import { esc, layout, sendEmail } from "@/lib/email";
import { STATE_LABEL, STATE_TONE, timeAgo } from "@/lib/states";
import { cn } from "@/lib/cn";
import { mockFetch } from "./helpers";

describe("email", () => {
  it("escapes HTML so job titles can't inject markup", () => {
    expect(esc(`<img src=x onerror="alert(1)"> & co`)).toBe("&lt;img src=x onerror=&quot;alert(1)&quot;&gt; &amp; co");
  });
  it("escapes the title inside the layout", () => {
    expect(layout("<b>Hi</b>", "")).toContain("&lt;b&gt;Hi&lt;/b&gt;");
  });
  it("does nothing without a Resend key", async () => {
    vi.stubEnv("RESEND_API_KEY", "");
    const f = mockFetch({});
    expect(await sendEmail("a@b.com", "s", "h")).toBe(false);
    expect(f).not.toHaveBeenCalled();
  });
  it("sends through Resend with the key in the header", async () => {
    vi.stubEnv("RESEND_API_KEY", "re_test");
    const f = mockFetch({ "api.resend.com": { id: "1" } });
    expect(await sendEmail("a@b.com", "Subject", "<p>x</p>")).toBe(true);
    const init = f.mock.calls[0][1] as RequestInit;
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer re_test");
    expect(JSON.parse(String(init.body))).toMatchObject({ to: ["a@b.com"], subject: "Subject" });
  });
  it("reports failure on a Resend error", async () => {
    vi.stubEnv("RESEND_API_KEY", "re_test");
    vi.spyOn(console, "error").mockImplementation(() => {});
    mockFetch({ "api.resend.com": 403 });
    expect(await sendEmail("a@b.com", "s", "h")).toBe(false);
  });
});

describe("states", () => {
  afterEach(() => vi.useRealTimers());
  it("every state has a label and a colour", () => {
    expect(Object.keys(STATE_TONE).sort()).toEqual(Object.keys(STATE_LABEL).sort());
  });
  it("timeAgo", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-28T12:00:00Z"));
    expect(timeAgo(null)).toBe("");
    expect(timeAgo("2026-10-28T11:59:50Z")).toBe("1 min ago");
    expect(timeAgo("2026-10-28T11:30:00Z")).toBe("30 min ago");
    expect(timeAgo("2026-10-28T09:00:00Z")).toBe("3 h ago");
    expect(timeAgo("2026-10-27T10:00:00Z")).toBe("yesterday");
    expect(timeAgo("2026-10-20T12:00:00Z")).toBe("8 days ago");
  });
});

describe("cn", () => {
  it("merges conflicting Tailwind classes, last wins", () => {
    expect(cn("px-2 bg-sheet", false && "hidden", "px-4")).toBe("bg-sheet px-4");
  });
});
