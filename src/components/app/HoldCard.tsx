"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { AnimatePresence, m } from "framer-motion";
import { answerHold } from "@/app/actions/app";
import type { Gap } from "@/lib/types";

export function HoldCard({ id, title, company, questions }: { id: number; title: string; company: string; questions: Gap[] }) {
  const [left, setLeft] = useState(questions);
  const [done, setDone] = useState<string | null>(null);
  const [busy, start] = useTransition();
  const q = left[0];

  const answer = (yes: boolean) =>
    start(async () => {
      const res = await answerHold(id, q.skill, yes);
      if (!res.ok) return;
      if (!yes) return setDone("Skipped. We won't suggest this one again.");
      const rest = left.slice(1);
      setLeft(rest);
      if (!rest.length) setDone(`Added ${q.skill} to your profile. This job is ready for review.`);
    });

  return (
    <m.li layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: 20 }} className="rounded-panel border border-hold/30 bg-hold-soft/60 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Link href={`/dashboard/applications/${id}`} className="font-semibold hover:underline">{title}</Link>
          <p className="text-sm text-muted">{company}</p>
        </div>
        {left.length > 1 && <span className="text-xs font-semibold text-hold">{left.length} questions</span>}
      </div>
      <AnimatePresence mode="wait" initial={false}>
        {done ? (
          <m.p key="done" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-3 text-sm">{done}</m.p>
        ) : q ? (
          <m.div key={q.skill} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className="mt-3">
            <p className="text-sm">{q.question}</p>
            <div className="mt-2.5 flex gap-2">
              <button type="button" disabled={busy} onClick={() => answer(true)} className="rounded-control bg-primary px-3 py-1.5 text-sm font-semibold text-white transition-transform active:scale-95 disabled:opacity-60">
                Yes, add it
              </button>
              <button type="button" disabled={busy} onClick={() => answer(false)} className="rounded-control border border-hold/40 bg-sheet/60 px-3 py-1.5 text-sm font-semibold transition-transform active:scale-95 disabled:opacity-60">
                No, skip this job
              </button>
            </div>
          </m.div>
        ) : null}
      </AnimatePresence>
    </m.li>
  );
}
