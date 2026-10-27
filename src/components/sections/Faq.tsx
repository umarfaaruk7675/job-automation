"use client";

import { useState } from "react";
import { AnimatePresence, m } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { site } from "@/content/site";
import { Reveal, RevealItem } from "@/components/motion/Reveal";
import { cn } from "@/lib/cn";

function SectionHead({ id, title, body }: { id: string; title: string; body: string }) {
  return (
    <Reveal className="mx-auto max-w-2xl text-center">
      <RevealItem as="h2" className="text-h2 font-extrabold tracking-tight">
        <span id={id}>{title}</span>
      </RevealItem>
      <RevealItem as="p" className="mt-3 text-lede text-muted">{body}</RevealItem>
    </Reveal>
  );
}

export function Faq() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section id="faq" aria-labelledby="faq-title" className="border-t border-rule">
      <div className="mx-auto max-w-3xl px-4 py-20 sm:px-6 lg:py-28">
        <SectionHead id="faq-title" title="Questions, answered" body="What people ask before they upload a resume." />
        <ul className="mt-10 space-y-3">
          {site.faq.map((item, i) => {
            const isOpen = open === i;
            return (
              <li key={item.q} className="rounded-2xl border border-rule bg-sheet">
                <button type="button" aria-expanded={isOpen} aria-controls={`faq-${i}`} onClick={() => setOpen(isOpen ? null : i)}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left font-semibold">
                  {item.q}
                  <ChevronDown className={cn("h-5 w-5 shrink-0 text-muted transition-transform duration-300", isOpen && "rotate-180")} aria-hidden />
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <m.div id={`faq-${i}`} initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }} className="overflow-hidden">
                      <p className="px-5 pb-5 text-muted">{item.a}</p>
                    </m.div>
                  )}
                </AnimatePresence>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

