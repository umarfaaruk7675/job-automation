"use client";

import { useState, useTransition } from "react";
import { AnimatePresence, m } from "framer-motion";
import { Check, ChevronDown, Download, ExternalLink, FileText, Sparkles, X } from "lucide-react";
import { setApplicationState, tailorApplication } from "@/app/actions/app";
import { Button } from "@/components/ui/form";
import { ScoreRing, StateChip } from "@/components/app/bits";
import { HoldCard } from "@/components/app/HoldCard";
import { timeAgo } from "@/lib/states";
import { cn } from "@/lib/cn";
import type { Gap, TailoredResume } from "@/lib/types";

type Props = {
  id: number;
  state: string;
  holdQuestions: Gap[];
  tailored: TailoredResume | null;
  appliedAt: string | null;
  job: { title: string; company: string; location: string | null; remote: boolean; department: string | null; description: string | null; apply_url: string; posted_at: string | null; status: string };
  match: { score: number; reasons: string[]; gaps: Gap[]; method: string } | null;
  events: { id: number; state: string; detail: string | null; created_at: string }[];
  aiEnabled: boolean;
};

export function ApplicationReview(props: Props) {
  const { id, job, match, events, aiEnabled } = props;
  const [state, setState] = useState(props.state);
  const [tailored, setTailored] = useState(props.tailored);
  const [error, setError] = useState<string | null>(null);
  const [showDesc, setShowDesc] = useState(false);
  const [busy, start] = useTransition();
  const [tailoring, startTailor] = useTransition();

  const move = (next: Parameters<typeof setApplicationState>[1]) =>
    start(async () => {
      setError(null);
      const res = await setApplicationState(id, next);
      if (res.ok) setState(next);
      else setError("That didn't save. Try again.");
    });

  const tailor = () =>
    startTailor(async () => {
      setError(null);
      const res = await tailorApplication(id);
      if (res.ok && res.tailored) setTailored(res.tailored);
      else setError(res.error ?? "Tailoring didn't finish.");
    });

  const closed = job.status === "closed";

  return (
    <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr] lg:items-start">
      <div className="space-y-6">
        <m.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-panel border border-rule bg-sheet p-5 sm:p-7">
          <div className="flex items-start gap-4">
            {match && <ScoreRing score={match.score} size={64} />}
            <div className="min-w-0 flex-1">
              <h1 className="text-h3 font-extrabold sm:text-h2">{job.title}</h1>
              <p className="mt-1 text-muted">
                {job.company}
                {job.location ? `, ${job.location}` : ""}
                {job.remote && !/remote/i.test(job.location ?? "") ? ", remote" : ""}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <StateChip state={state} />
                {job.posted_at && <span className="text-xs text-muted">Posted {timeAgo(job.posted_at)}</span>}
                {closed && <span className="text-xs font-semibold text-hold">This job has closed</span>}
              </div>
            </div>
          </div>

          {match && (
            <div className="mt-6">
              <h2 className="font-semibold">Why it fits</h2>
              <ul className="mt-2 space-y-1.5">
                {match.reasons.map((r) => (
                  <li key={r} className="flex gap-2 text-muted"><Check className="mt-1 h-4 w-4 shrink-0 text-sent" aria-hidden />{r}</li>
                ))}
              </ul>
              {match.method === "basic" && <p className="mt-2 text-xs text-muted">Scored by keywords. Detailed reasons appear once AI scoring is on.</p>}
            </div>
          )}

          <button type="button" onClick={() => setShowDesc((v) => !v)} aria-expanded={showDesc} className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold">
            <ChevronDown className={cn("h-4 w-4 transition-transform", showDesc && "rotate-180")} aria-hidden />
            {showDesc ? "Hide" : "Read"} the job description
          </button>
          <AnimatePresence initial={false}>
            {showDesc && (
              <m.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-muted">{job.description}</p>
              </m.div>
            )}
          </AnimatePresence>
        </m.section>

        {state === "hold" && props.holdQuestions.length > 0 && (
          <ul><HoldCard id={id} title="Before this can go out" company="Answer honestly. A yes adds the skill to your profile." questions={props.holdQuestions} /></ul>
        )}

        <m.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="rounded-panel border border-rule bg-sheet p-5 sm:p-7">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-h3 font-bold">Resume for this job</h2>
              <p className="mt-1 text-sm text-muted">Reordered and reworded for this posting, using only facts from your profile.</p>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={tailor} busy={tailoring} disabled={!aiEnabled}>
                {!tailoring && <Sparkles className="h-4 w-4" aria-hidden />}
                {tailored ? "Tailor again" : "Tailor my resume"}
              </Button>
              <a href={`/api/applications/${id}/resume`} className="inline-flex h-11 items-center gap-2 rounded-control border border-rule bg-sheet px-4 font-semibold transition-colors hover:border-ink">
                <Download className="h-4 w-4" aria-hidden /> DOCX
              </a>
            </div>
          </div>
          {!aiEnabled && <p className="mt-3 text-sm text-muted">Tailoring turns on once the Gemini key is working. The download uses your current profile.</p>}

          <AnimatePresence mode="wait">
            {tailoring ? (
              <m.div key="busy" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mt-5 space-y-2">
                {[0, 1, 2, 3].map((i) => (
                  <m.div key={i} className="h-3 rounded-full bg-paper" style={{ width: `${90 - i * 12}%` }} animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.15 }} />
                ))}
              </m.div>
            ) : tailored ? (
              <m.div key="t" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-5 space-y-5">
                {tailored.changes.length > 0 && (
                  <div className="rounded-control bg-sent-soft p-4">
                    <p className="text-sm font-semibold">What changed</p>
                    <ul className="mt-1.5 list-disc space-y-1 pl-5 text-sm">{tailored.changes.map((c) => <li key={c}>{c}</li>)}</ul>
                  </div>
                )}
                <div>
                  <p className="text-sm font-semibold text-muted">Summary</p>
                  <p className="mt-1">{tailored.summary}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-muted">Skills, most relevant first</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {tailored.skills.map((s, i) => (
                      <span key={s} className={cn("rounded-full px-2.5 py-1 text-sm", i < 6 ? "bg-primary text-white" : "bg-paper")}>{s}</span>
                    ))}
                  </div>
                </div>
                {tailored.experience.map((e) => (
                  <div key={e.company + e.title}>
                    <p className="font-semibold">{e.title}, {e.company}</p>
                    <ul className="mt-1 list-disc space-y-1 pl-5 text-sm">{e.bullets.map((b) => <li key={b}>{b}</li>)}</ul>
                  </div>
                ))}
              </m.div>
            ) : (
              <m.p key="none" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-5 flex items-center gap-2 text-sm text-muted">
                <FileText className="h-4 w-4" aria-hidden /> Not tailored yet.
              </m.p>
            )}
          </AnimatePresence>
        </m.section>
      </div>

      <aside className="space-y-6 lg:sticky lg:top-24">
        <m.section initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} className="rounded-panel border border-rule bg-sheet p-5">
          <h2 className="font-semibold">Next step</h2>
          {state === "review" && (
            <>
              <p className="mt-1 text-sm text-muted">Approve to open the company's application page with your tailored resume ready to download. You submit it there.</p>
              <div className="mt-4 flex flex-col gap-2">
                <Button busy={busy} disabled={closed} onClick={() => { move("approved"); window.open(job.apply_url, "_blank", "noopener"); }}>
                  Approve and open application <ExternalLink className="h-4 w-4" aria-hidden />
                </Button>
                <Button variant="ghost" busy={busy} onClick={() => move("skipped")}><X className="h-4 w-4" aria-hidden /> Skip this job</Button>
              </div>
            </>
          )}
          {state === "hold" && <p className="mt-1 text-sm text-muted">Answer the question on this page first.</p>}
          {state === "approved" && (
            <>
              <p className="mt-1 text-sm text-muted">Did you submit it on the company's site? Confirming records it and emails you a receipt.</p>
              <div className="mt-4 flex flex-col gap-2">
                <Button busy={busy} onClick={() => move("applied")}><Check className="h-4 w-4" aria-hidden /> Yes, I submitted it</Button>
                <a href={job.apply_url} target="_blank" rel="noopener noreferrer" className="inline-flex h-11 items-center justify-center gap-2 rounded-control border border-rule font-semibold hover:border-ink">
                  Open the application again <ExternalLink className="h-4 w-4" aria-hidden />
                </a>
                <Button variant="ghost" busy={busy} onClick={() => move("review")}>Undo approval</Button>
              </div>
            </>
          )}
          {["applied", "interview", "offer", "rejected"].includes(state) && (
            <>
              <p className="mt-1 text-sm text-muted">{props.appliedAt ? `Applied ${timeAgo(props.appliedAt)}. ` : ""}Update it when you hear back.</p>
              <div className="mt-4 grid grid-cols-3 gap-2">
                {(["interview", "offer", "rejected"] as const).map((s) => (
                  <button key={s} type="button" disabled={busy} onClick={() => move(s)}
                    className={cn("rounded-control border px-2 py-2 text-sm font-semibold transition-colors", state === s ? "border-ink bg-primary text-white" : "border-rule hover:border-ink")}>
                    {s === "interview" ? "Interview" : s === "offer" ? "Offer" : "No luck"}
                  </button>
                ))}
              </div>
            </>
          )}
          {["skipped", "closed"].includes(state) && (
            <div className="mt-3"><Button variant="secondary" busy={busy} onClick={() => move("review")}>Move back to review</Button></div>
          )}
          {error && <p role="alert" className="mt-3 text-sm text-hold">{error}</p>}
        </m.section>

        <m.section initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.08 }} className="rounded-panel border border-rule bg-sheet p-5">
          <h2 className="font-semibold">History</h2>
          <ol className="mt-3 space-y-3 border-l border-rule pl-4">
            {events.map((e) => (
              <li key={e.id} className="relative">
                <span className="absolute -left-[1.3rem] top-1.5 h-2 w-2 rounded-full bg-primary" aria-hidden />
                <p className="text-sm">{e.detail ?? e.state}</p>
                <p className="text-xs text-muted">{timeAgo(e.created_at)}</p>
              </li>
            ))}
          </ol>
        </m.section>
      </aside>
    </div>
  );
}
