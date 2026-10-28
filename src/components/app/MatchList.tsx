"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { m } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { reviewMatch } from "@/app/actions/app";
import { ScoreRing } from "@/components/app/bits";

export type MatchItem = {
  id: number; jobId: number; score: number; reasons: string[]; title: string; company: string;
  location: string | null; remote: boolean; open: boolean; applicationId: number | null;
};

export function MatchList({ items, threshold }: { items: MatchItem[]; threshold: number }) {
  return (
    <ul className="space-y-3">
      {items.map((it, i) => <Row key={it.id} it={it} index={i} threshold={threshold} />)}
    </ul>
  );
}

function Row({ it, index, threshold }: { it: MatchItem; index: number; threshold: number }) {
  const [appId, setAppId] = useState(it.applicationId);
  const [busy, start] = useTransition();
  return (
    <m.li initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(index, 10) * 0.03 }}
      className="flex flex-col gap-3 rounded-panel border border-rule bg-sheet p-4 sm:flex-row sm:items-center">
      <div className="flex min-w-0 flex-1 items-center gap-4">
        <ScoreRing score={it.score} size={46} />
        <div className="min-w-0">
          <p className="truncate font-semibold">{it.title}</p>
          <p className="truncate text-sm text-muted">{it.company}{it.location ? `, ${it.location}` : ""}</p>
          {it.reasons[0] && <p className="mt-0.5 line-clamp-1 text-sm text-muted">{it.reasons[0]}</p>}
        </div>
      </div>
      {appId ? (
        <Link href={`/dashboard/applications/${appId}`} className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-control border border-rule px-3 text-sm font-semibold hover:border-ink">
          Open <ArrowUpRight className="h-4 w-4" aria-hidden />
        </Link>
      ) : (
        <button type="button" disabled={busy}
          onClick={() => start(async () => { const r = await reviewMatch(it.id); if (r.ok && r.applicationId) setAppId(r.applicationId); })}
          className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-control bg-primary px-3 text-sm font-semibold text-primary-fg transition-colors hover:bg-primary-hover disabled:opacity-60">
          {busy ? "Adding…" : it.score >= threshold ? "Review" : "Review anyway"}
        </button>
      )}
    </m.li>
  );
}
