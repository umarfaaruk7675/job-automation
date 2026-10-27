"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/cn";

type Filters = { q: string; where: string; remote: boolean; source: string; mine: boolean };

export function JobFilters({ initial, roles, sources }: { initial: Filters; roles: string[]; sources: { value: string; label: string }[] }) {
  const router = useRouter();
  const path = usePathname();
  const [f, setF] = useState(initial);
  const [pending, start] = useTransition();
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const t = setTimeout(() => {
      const u = new URLSearchParams();
      if (f.q) u.set("q", f.q);
      if (f.where) u.set("where", f.where);
      if (f.remote) u.set("remote", "1");
      if (f.source) u.set("source", f.source);
      if (!f.mine) u.set("mine", "0");
      start(() => router.replace(`${path}${u.size ? `?${u}` : ""}`, { scroll: false }));
    }, 300);
    return () => clearTimeout(t);
  }, [f, path, router]);

  const pill = (on: boolean) =>
    cn("rounded-full border px-3.5 py-2 text-sm font-semibold transition-colors", on ? "border-primary bg-primary/15 text-[rgb(147,197,253)]" : "border-rule bg-sheet text-muted hover:border-ink hover:text-ink");

  return (
    <div className="space-y-3 rounded-panel border border-rule bg-sheet/60 p-4">
      <div className="grid gap-3 sm:grid-cols-[1fr_14rem]">
        <label className="relative block">
          <span className="sr-only">Job title</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden />
          <input value={f.q} onChange={(e) => setF({ ...f, q: e.target.value })} placeholder="Job title, e.g. Data Analyst"
            className="w-full rounded-control border border-rule bg-sheet py-2.5 pl-9 pr-3 placeholder:text-muted/70 focus:border-ink focus:outline-none" />
          {pending && <span className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin rounded-full border-2 border-primary border-t-transparent" aria-label="Loading" />}
        </label>
        <label className="block">
          <span className="sr-only">Location</span>
          <input value={f.where} onChange={(e) => setF({ ...f, where: e.target.value })} placeholder="City or country"
            className="w-full rounded-control border border-rule bg-sheet px-3 py-2.5 placeholder:text-muted/70 focus:border-ink focus:outline-none" />
        </label>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {roles.length > 0 && (
          <button type="button" aria-pressed={f.mine && !f.q} disabled={Boolean(f.q)} onClick={() => setF({ ...f, mine: !f.mine })} className={cn(pill(f.mine && !f.q), "disabled:opacity-50")}>
            My target roles
          </button>
        )}
        <button type="button" aria-pressed={f.remote} onClick={() => setF({ ...f, remote: !f.remote })} className={pill(f.remote)}>
          Remote only
        </button>
        <select value={f.source} onChange={(e) => setF({ ...f, source: e.target.value })} aria-label="Source"
          className="rounded-full border border-rule bg-sheet px-3.5 py-2 text-sm font-semibold text-muted focus:border-ink focus:outline-none">
          <option value="">All sources</option>
          {sources.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </div>
    </div>
  );
}
