"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { m } from "framer-motion";
import { ArrowUpRight, Gauge, MapPin } from "lucide-react";
import { reviewMatch, scoreJob } from "@/app/actions/app";
import { ScoreRing } from "@/components/app/bits";
import { timeAgo } from "@/lib/states";

export type JobItem = {
  id: number; title: string; company: string; location: string | null; remote: boolean;
  source: string; sourceLabel: string; sourceSite: string | null; applyUrl: string; postedAt: string;
  matchId: number | null; score: number | null; reason: string | null; applicationId: number | null;
};

export function JobList({ items, threshold }: { items: JobItem[]; threshold: number }) {
  return (
    <ul className="space-y-3">
      {items.map((it, i) => <Row key={it.id} it={it} index={i} threshold={threshold} />)}
    </ul>
  );
}

function Row({ it, index, threshold }: { it: JobItem; index: number; threshold: number }) {
  const [state, setState] = useState({ matchId: it.matchId, score: it.score, reason: it.reason, appId: it.applicationId });
  const [error, setError] = useState("");
  const [busy, start] = useTransition();

  const check = () =>
    start(async () => {
      setError("");
      const r = await scoreJob(it.id);
      if (r.ok) setState((s) => ({ ...s, matchId: r.matchId, score: r.score, reason: r.reasons?.[0] ?? null }));
      else setError("Couldn't score this job. Try again.");
    });
  const review = () =>
    start(async () => {
      if (!state.matchId) return;
      const r = await reviewMatch(state.matchId);
      if (r.ok && r.applicationId) setState((s) => ({ ...s, appId: r.applicationId }));
    });

  const btn = "inline-flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-control px-3 text-sm font-semibold transition-colors disabled:opacity-60";
  return (
    <m.li initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(index, 10) * 0.025, duration: 0.2 }}
      className="flex flex-col gap-3 rounded-panel border border-rule bg-sheet p-4 sm:flex-row sm:items-center">
      <div className="flex min-w-0 flex-1 items-start gap-4">
        {state.score != null ? <ScoreRing score={state.score} size={46} /> : (
          <span className="grid h-[46px] w-[46px] shrink-0 place-items-center rounded-full border border-dashed border-rule text-muted" aria-hidden>
            <Gauge className="h-5 w-5" />
          </span>
        )}
        <div className="min-w-0">
          <a href={it.applyUrl} target="_blank" rel="noopener noreferrer" className="font-semibold hover:underline">{it.title}</a>
          <p className="truncate text-sm text-muted">{it.company}</p>
          <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
            <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" aria-hidden />{it.location || (it.remote ? "Remote" : "Location not listed")}</span>
            {it.remote && <span className="rounded-full bg-sent-soft px-2 py-0.5 font-semibold text-sent">Remote</span>}
            <span>{timeAgo(it.postedAt)}</span>
            <span>
              via {it.sourceSite ? <a href={it.sourceSite} target="_blank" rel="noopener noreferrer" className="underline-offset-2 hover:underline">{it.sourceLabel}</a> : it.sourceLabel}
            </span>
          </p>
          {state.reason && <p className="mt-1 line-clamp-2 text-sm text-muted">{state.reason}</p>}
          {error && <p className="mt-1 text-sm text-hold" role="alert">{error}</p>}
        </div>
      </div>
      <div className="flex shrink-0 gap-2">
        {state.appId ? (
          <Link href={`/dashboard/applications/${state.appId}`} className={`${btn} border border-rule hover:border-ink`}>
            Open <ArrowUpRight className="h-4 w-4" aria-hidden />
          </Link>
        ) : state.matchId ? (
          <button type="button" onClick={review} disabled={busy} className={`${btn} bg-primary text-primary-fg hover:bg-primary-hover`}>
            {busy ? "Adding…" : (state.score ?? 0) >= threshold ? "Apply" : "Apply anyway"}
          </button>
        ) : (
          <button type="button" onClick={check} disabled={busy} className={`${btn} border border-rule hover:border-ink`}>
            {busy && <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden />}
            {busy ? "Scoring…" : "Check my match"}
          </button>
        )}
      </div>
    </m.li>
  );
}
