"use client";

import { m, type Variants } from "framer-motion";
import { site } from "@/content/site";
import { Reveal, RevealItem } from "@/components/motion/Reveal";

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
    <>
      <section aria-labelledby="hero-title">
        <m.div
          variants={intro}
          initial="hidden"
          animate="show"
          className="mx-auto max-w-page px-4 pb-16 pt-12 sm:px-6 md:pt-20 lg:pb-24 lg:pt-28"
        >
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
      </section>

      <section id="how-it-works" aria-labelledby="how-title" className="border-t border-rule">
        <div className="mx-auto max-w-page px-4 py-16 sm:px-6 lg:py-20">
          <h2 id="how-title" className="text-h2 font-extrabold">
            How it works
          </h2>
          <Reveal as="ol" className="mt-10 grid gap-8 md:grid-cols-3 md:gap-10">
            {hero.steps.map((step, i) => (
              <RevealItem as="li" key={step.title} className="border-t-2 border-ink pt-5">
                <p className="text-sm font-semibold text-muted">Step {i + 1}</p>
                <h3 className="mt-1 text-h3 font-bold">{step.title}</h3>
                <p className="mt-2 text-muted">{step.body}</p>
              </RevealItem>
            ))}
          </Reveal>
        </div>
      </section>
    </>
  );
}
