"use client";

import Link from "next/link";
import { m } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/cn";
import { STATE_LABEL, STATE_TONE, timeAgo } from "@/lib/states";

export function StateChip({ state }: { state: string }) {
  const tone = STATE_TONE[state] ?? "neutral";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold",
        tone === "sent" && "bg-sent-soft text-sent",
        tone === "hold" && "bg-hold-soft text-hold",
        tone === "ink" && "bg-ink text-paper",
        tone === "neutral" && "bg-paper text-muted",
      )}
    >
      {tone === "hold" && <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />}
      {STATE_LABEL[state] ?? state}
    </span>
  );
}

export function ScoreRing({ score, size = 52 }: { score: number; size?: number }) {
  const r = (size - 6) / 2;
  const c = 2 * Math.PI * r;
  return (
    <span className="relative inline-grid shrink-0 place-items-center" style={{ width: size, height: size }} aria-label={`${score}% match`}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgb(var(--rule))" strokeWidth="5" />
        <m.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={score >= 80 ? "rgb(var(--sent))" : "rgb(var(--ink))"}
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c * (1 - score / 100) }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>
      <span className="absolute text-sm font-extrabold tabular-nums">{score}</span>
    </span>
  );
}

export type AppListItem = {
  id: number;
  state: string;
  created_at: string;
  score: number | null;
  title: string;
  company: string;
  location: string | null;
  remote: boolean;
};

export function ApplicationRow({ a, index = 0 }: { a: AppListItem; index?: number }) {
  return (
    <m.li initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(index, 8) * 0.04, duration: 0.35 }}>
      <Link
        href={`/dashboard/applications/${a.id}`}
        className="group flex items-center gap-4 rounded-panel border border-rule bg-sheet px-4 py-3.5 transition-[border-color,transform,box-shadow] hover:-translate-y-0.5 hover:border-ink/40 hover:shadow-lift"
      >
        {a.score != null && <ScoreRing score={a.score} size={46} />}
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">{a.title}</p>
          <p className="truncate text-sm text-muted">
            {a.company}
            {a.location ? `, ${a.location}` : ""}
            {a.remote && !/remote/i.test(a.location ?? "") ? ", remote" : ""}
          </p>
        </div>
        <div className="hidden flex-col items-end gap-1 sm:flex">
          <StateChip state={a.state} />
          <span className="text-xs text-muted">{timeAgo(a.created_at)}</span>
        </div>
        <ArrowUpRight className="h-4 w-4 shrink-0 text-muted transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden />
      </Link>
    </m.li>
  );
}

export function EmptyState({ title, body, children }: { title: string; body: string; children?: React.ReactNode }) {
  return (
    <m.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-panel border border-dashed border-rule px-6 py-10 text-center">
      <p className="font-semibold">{title}</p>
      <p className="mx-auto mt-1 max-w-md text-muted">{body}</p>
      {children && <div className="mt-5 flex justify-center">{children}</div>}
    </m.div>
  );
}
