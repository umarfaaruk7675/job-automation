"use client";

import { m, type Variants } from "framer-motion";
import { site } from "@/content/site";
import { ApplicationLedger } from "./ApplicationLedger";

const intro: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
};
// Text that may be the LCP element only moves; it never starts invisible.
const lift: Variants = {
  hidden: { y: 14 },
  show: { y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
};
const rise: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
};

export function Hero() {
  const { hero, primaryCta } = site;
  return (
    <section className="relative overflow-hidden" aria-labelledby="hero-title">
      <div className="mx-auto grid max-w-page grid-cols-1 items-center gap-12 px-4 pb-20 pt-10 sm:px-6 md:pt-16 lg:grid-cols-[1.05fr_1fr] lg:gap-16 lg:pb-28 lg:pt-24">
        <m.div variants={intro} initial="hidden" animate="show" className="min-w-0">
          <m.h1 id="hero-title" variants={lift} className="max-w-[15ch] text-display font-extrabold">
            {hero.headline}
          </m.h1>
          <m.p variants={lift} className="mt-6 max-w-prose text-lede text-muted">
            {hero.body}
          </m.p>
          <m.div variants={rise} className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
            <m.a
              href={primaryCta.href}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              className="inline-flex h-12 items-center justify-center rounded-control bg-ink px-6 font-semibold text-paper shadow-lift transition-colors hover:bg-sent"
            >
              {primaryCta.label}
            </m.a>
            <m.a
              href={hero.secondaryCta.href}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              className="inline-flex h-12 items-center justify-center rounded-control border border-rule bg-sheet px-6 font-semibold transition-colors hover:border-ink"
            >
              {hero.secondaryCta.label}
            </m.a>
          </m.div>
          <m.p variants={rise} className="mt-4 text-sm text-muted">
            {hero.note}
          </m.p>
        </m.div>

        <ApplicationLedger />
      </div>
    </section>
  );
}
