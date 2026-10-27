"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, m, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/cn";

/*
 * The hero's one orchestrated moment: a week's applications moving through
 * Shortlist's real states. Companies are fictional. The held row is a working
 * control — answering it shows what happens to a held application.
 */

type Tone = "neutral" | "sent" | "hold";
type Stage = { at: number; label: string; tone: Tone };
type Row = {
  role: string;
  company: string;
  place: string;
  posted: string;
  match: number;
  stages: Stage[];
  question?: string;
};

const ROWS: Row[] = [
  {
    role: "Frontend Developer",
    company: "Northwind Labs",
    place: "Bengaluru, remote",
    posted: "Posted today",
    match: 91,
    stages: [
      { at: 0, label: "Matching", tone: "neutral" },
      { at: 2, label: "Resume tailored", tone: "neutral" },
      { at: 4, label: "Sent, receipt saved", tone: "sent" },
    ],
  },
  {
    role: "Data Analyst",
    company: "Lumen Health",
    place: "Pune",
    posted: "Posted 1 day ago",
    match: 84,
    question: "This job asks for Power BI. Have you used it?",
    stages: [
      { at: 1, label: "Matching", tone: "neutral" },
      { at: 3, label: "Needs you", tone: "hold" },
    ],
  },
  {
    role: "Backend Engineer",
    company: "Orbital Freight",
    place: "Hyderabad",
    posted: "Posted 2 days ago",
    match: 88,
    stages: [
      { at: 2, label: "Matching", tone: "neutral" },
      { at: 4, label: "Resume tailored", tone: "neutral" },
      { at: 6, label: "Sent, receipt saved", tone: "sent" },
    ],
  },
  {
    role: "Product Designer",
    company: "Kestrel Pay",
    place: "Remote",
    posted: "Posted 3 days ago",
    match: 64,
    stages: [
      { at: 3, label: "Matching", tone: "neutral" },
      { at: 5, label: "Below your 80% bar, not sent", tone: "neutral" },
    ],
  },
];

const LAST_STEP = 6;

export function ApplicationLedger() {
  const reduce = useReducedMotion();
  const [step, setStep] = useState(reduce ? LAST_STEP : -1);
  const [answer, setAnswer] = useState<"yes" | "skip" | null>(null);

  useEffect(() => {
    if (reduce) {
      setStep(LAST_STEP);
      return;
    }
    const start = setTimeout(() => setStep(0), 700);
    return () => clearTimeout(start);
  }, [reduce]);

  useEffect(() => {
    if (step < 0 || step >= LAST_STEP) return;
    const t = setTimeout(() => setStep((s) => s + 1), 850);
    return () => clearTimeout(t);
  }, [step]);

  const sentCount = ROWS.filter((r) => current(r, step)?.tone === "sent").length + (answer === "yes" ? 1 : 0);

  return (
    <m.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
      className="relative min-w-0"
    >
      <div className="rounded-panel border border-rule bg-sheet shadow-lift">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-rule px-5 py-4">
          <p className="font-semibold">This week</p>
          <p className="text-sm text-muted" aria-live="polite">
            {sentCount} sent, {answer ? 0 : step >= 3 ? 1 : 0} waiting for you
          </p>
        </div>

        <ul className="divide-y divide-rule">
          {ROWS.map((row, i) => {
            const stage = current(row, step);
            const isHold = stage?.tone === "hold";
            const resolved = isHold && answer;
            return (
              <m.li
                key={row.role}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.45, delay: reduce ? 0 : 0.35 + i * 0.08 }}
                className="px-5 py-4"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{row.role}</p>
                    <p className="truncate text-sm text-muted">
                      {row.company}, {row.place}
                    </p>
                    <p className="mt-0.5 text-xs text-muted">{row.posted}</p>
                  </div>
                  <div className="flex shrink-0 flex-row-reverse items-center justify-end gap-3 sm:flex-col sm:items-end sm:gap-1.5">
                    <MatchMeter value={row.match} shown={step > row.stages[0].at} />
                    <AnimatePresence mode="wait" initial={false}>
                      {stage && (
                        <m.span
                          key={resolved ? `resolved-${answer}` : stage.label}
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -6 }}
                          transition={{ duration: 0.25 }}
                        >
                          {resolved ? (
                            <Chip tone={answer === "yes" ? "sent" : "neutral"}>
                              {answer === "yes" ? "Added to profile, sent" : "Skipped"}
                            </Chip>
                          ) : (
                            <Chip tone={stage.tone}>{stage.label}</Chip>
                          )}
                        </m.span>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                <AnimatePresence initial={false}>
                  {isHold && !answer && row.question && (
                    <m.div
                      key="question"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="mt-3 rounded-control bg-hold-soft p-3">
                        <p className="text-sm">{row.question}</p>
                        <div className="mt-2.5 flex gap-2">
                          <m.button
                            type="button"
                            whileHover={{ y: -1 }}
                            whileTap={{ scale: 0.96 }}
                            onClick={() => setAnswer("yes")}
                            className="rounded-control bg-ink px-3 py-1.5 text-sm font-semibold text-paper"
                          >
                            Yes, add it
                          </m.button>
                          <m.button
                            type="button"
                            whileHover={{ y: -1 }}
                            whileTap={{ scale: 0.96 }}
                            onClick={() => setAnswer("skip")}
                            className="rounded-control border border-hold/40 px-3 py-1.5 text-sm font-semibold"
                          >
                            Skip this job
                          </m.button>
                        </div>
                      </div>
                    </m.div>
                  )}
                </AnimatePresence>
              </m.li>
            );
          })}
        </ul>
      </div>
      <p className="mt-3 text-center text-xs text-muted">Example applications. Company names are fictional.</p>
    </m.div>
  );
}

function current(row: Row, step: number): Stage | undefined {
  return [...row.stages].reverse().find((s) => step >= s.at);
}

function Chip({ tone, children }: { tone: Tone; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold",
        tone === "sent" && "bg-sent-soft text-sent",
        tone === "hold" && "bg-hold-soft text-hold",
        tone === "neutral" && "bg-paper text-muted",
      )}
    >
      {tone === "sent" && (
        <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden>
          <path d="M2.5 6.2l2.2 2.2L9.5 3.6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
      {tone === "hold" && <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />}
      {children}
    </span>
  );
}

function MatchMeter({ value, shown }: { value: number; shown: boolean }) {
  const pass = value >= 80;
  return (
    <span className="flex items-center gap-2 text-sm font-semibold tabular-nums" aria-label={`${value}% match`}>
      <span className="relative h-1.5 w-14 overflow-hidden rounded-full bg-rule/60" aria-hidden>
        <m.span
          className={cn("absolute inset-y-0 left-0 rounded-full", pass ? "bg-ink" : "bg-muted/60")}
          initial={{ width: 0 }}
          animate={{ width: shown ? `${value}%` : 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        />
      </span>
      <span className={cn(!shown && "opacity-0", "transition-opacity duration-300")}>{value}%</span>
    </span>
  );
}
