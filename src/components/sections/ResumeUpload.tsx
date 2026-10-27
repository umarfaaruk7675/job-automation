"use client";

import { useState } from "react";
import { AnimatePresence, m } from "framer-motion";
import FileUpload, { type ResumeFile } from "@/components/ui/file-upload";
import { Reveal, RevealItem } from "@/components/motion/Reveal";

const STEPS = [
  "We read your resume and turn it into a profile you check and correct.",
  "You set where you want to work and the lowest match you'll accept.",
  "Fresh jobs arrive every day, each with a match score and the reasons for it.",
];

export function ResumeUpload() {
  const [resume, setResume] = useState<ResumeFile | null>(null);

  return (
    <section id="start" aria-labelledby="start-title" className="border-y border-rule bg-sheet/60">
      <div className="mx-auto grid max-w-page grid-cols-1 gap-10 px-4 py-20 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16 lg:py-28">
        <Reveal className="min-w-0">
          <RevealItem as="h2" className="text-h2 font-extrabold">
            <span id="start-title">Start with the resume you already have.</span>
          </RevealItem>
          <RevealItem as="p" className="mt-5 max-w-prose text-lede text-muted">
            Nothing is sent anywhere until you create an account and confirm your profile.
          </RevealItem>
          <RevealItem as="div" className="mt-8">
            <ol className="space-y-4">
              {STEPS.map((s, i) => (
                <li key={s} className="flex gap-4">
                  <span
                    className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-rule bg-sheet text-sm font-bold"
                    aria-hidden
                  >
                    {i + 1}
                  </span>
                  <span className="pt-0.5">{s}</span>
                </li>
              ))}
            </ol>
          </RevealItem>
        </Reveal>

        <m.div
          className="min-w-0"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "0px 0px -15% 0px" }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <FileUpload onReady={setResume} />
          <AnimatePresence initial={false}>
            {resume && (
              <m.div
                key="continue"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <m.a
                  href="/signup?from=resume"
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className="mt-2 flex h-12 items-center justify-center rounded-control bg-ink px-6 font-semibold text-paper shadow-lift transition-colors hover:bg-sent"
                >
                  Create your account to continue
                </m.a>
                <p className="mt-3 text-center text-sm text-muted">
                  You&apos;ll add the file again after signing in. Nothing has been uploaded yet.
                </p>
              </m.div>
            )}
          </AnimatePresence>
        </m.div>
      </div>
    </section>
  );
}
