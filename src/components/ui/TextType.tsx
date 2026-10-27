"use client";

import { useEffect, useState } from "react";
import { useReducedMotion } from "framer-motion";

/** Types each phrase, pauses, deletes it, then moves to the next. */
export function TextType({ phrases, className }: { phrases: string[]; className?: string }) {
  const reduce = useReducedMotion();
  const [i, setI] = useState(0);
  const [n, setN] = useState(phrases[0].length);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (reduce) return;
    const word = phrases[i];
    let delay = deleting ? 35 : 70;
    if (!deleting && n === word.length) delay = 1800;
    if (deleting && n === 0) delay = 300;
    const t = setTimeout(() => {
      if (!deleting && n === word.length) setDeleting(true);
      else if (deleting && n === 0) {
        setDeleting(false);
        setI((i + 1) % phrases.length);
      } else setN(n + (deleting ? -1 : 1));
    }, delay);
    return () => clearTimeout(t);
  }, [n, deleting, i, phrases, reduce]);

  const text = reduce ? phrases[0] : phrases[i].slice(0, n);
  return (
    <span className={className}>
      <span aria-hidden>{text}</span>
      <span className="sr-only">{phrases[0]}</span>
      <span aria-hidden className="ml-1 inline-block w-[0.07em] animate-pulse bg-[rgb(96,165,250)] align-[-0.08em]" style={{ height: "0.9em" }} />
    </span>
  );
}
