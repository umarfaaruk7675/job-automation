"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { AnimatePresence, m } from "framer-motion";
import { Search } from "lucide-react";
import { findMatches } from "@/app/actions/app";
import { Button } from "@/components/ui/form";

/** Runs matching now. With autoRun it starts by itself once (first visit). */
export function FindMatchesButton({ autoRun = false, label = "Find new matches" }: { autoRun?: boolean; label?: string }) {
  const [busy, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const ran = useRef(false);

  const run = () =>
    start(async () => {
      setMsg(null);
      try {
        const r = await findMatches();
        setMsg(
          r.created > 0
            ? `${r.created} new job${r.created === 1 ? "" : "s"} ready for you.`
            : r.scored > 0
              ? `Checked ${r.scored} jobs. None reached your match bar yet; see them under Matches.`
              : "No new jobs fit your roles and locations yet. We check every day.",
        );
      } catch {
        setMsg("Matching didn't finish. Try again in a minute.");
      }
    });

  useEffect(() => {
    if (autoRun && !ran.current) {
      ran.current = true;
      run();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRun]);

  return (
    <div className="flex flex-col items-start gap-2">
      <Button onClick={run} busy={busy}>
        {!busy && <Search className="h-4 w-4" aria-hidden />}
        {busy ? "Checking fresh jobs…" : label}
      </Button>
      <AnimatePresence>
        {msg && (
          <m.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="text-sm text-muted" aria-live="polite">
            {msg}
          </m.p>
        )}
      </AnimatePresence>
    </div>
  );
}
