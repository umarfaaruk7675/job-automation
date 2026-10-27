import { ArrowRight, Check, Sparkles } from "lucide-react";
import { site } from "@/content/site";
import { TextType } from "@/components/ui/TextType";


export function Hero() {
  const { hero, primaryCta, signIn } = site;
  return (
    <section aria-labelledby="hero-title" className="relative overflow-hidden">
      <div className="grid-backdrop pointer-events-none absolute inset-0" aria-hidden />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[640px]" style={{ background: "radial-gradient(60% 55% at 50% 0%, rgb(37 99 235 / 0.28), transparent 70%)" }} aria-hidden />

      <div className="relative mx-auto grid max-w-page grid-cols-1 items-center gap-14 px-4 pb-20 pt-12 sm:px-6 md:pt-16 lg:grid-cols-[1.05fr_1fr] lg:pb-28 lg:pt-24">
        <div className="min-w-0">
          <p className="enter inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-sm font-medium text-[rgb(147,197,253)]">
            <Sparkles className="h-4 w-4" aria-hidden /> {hero.eyebrow}
          </p>
          <h1 id="hero-title" className="mt-5 text-[clamp(2.4rem,3.6vw+1rem,3.9rem)] font-extrabold leading-[1.05] tracking-tight">
            {hero.headline}{" "}
            <TextType phrases={[...hero.typed]} className="block min-h-[1.96em] bg-gradient-to-r from-[rgb(96,165,250)] to-[rgb(74,222,128)] bg-clip-text pb-1 text-transparent" />
          </h1>
          <p className="mt-6 max-w-prose text-lede text-muted">
            {hero.body}
          </p>
          <div className="enter enter-2 mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
            <a href={primaryCta.href}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-primary px-6 font-semibold text-white shadow-glow transition-[background-color,transform] hover:-translate-y-0.5 hover:bg-primary-hover active:scale-[0.98]">
              {primaryCta.label} <ArrowRight className="h-4 w-4" aria-hidden />
            </a>
            <a href={signIn.href}
              className="inline-flex h-12 items-center justify-center rounded-2xl border border-white/20 px-6 font-semibold transition-[border-color,background-color,transform] hover:-translate-y-0.5 hover:border-white/50 hover:bg-white/5 active:scale-[0.98]">
              {signIn.label}
            </a>
          </div>
          <p className="enter enter-3 mt-4 text-sm text-muted">{hero.note}</p>
        </div>

        <ProductPreview />
      </div>
    </section>
  );
}

/** A still picture of the dashboard with example data; nothing here is interactive. */
function ProductPreview() {
  const card = "rounded-2xl border border-rule bg-sheet p-4 shadow-lift";
  return (
    <div
      className="enter enter-2 relative min-w-0"
      role="img"
      aria-label="Preview of the Shortlist dashboard with example jobs"
    >
      <div className="grid grid-cols-2 gap-3 sm:gap-4" aria-hidden>
        <div className={`${card} float-a col-span-2`}>
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">Ready for review</p>
            <p className="text-xs text-muted">Today</p>
          </div>
          {[
            { t: "Data Analyst", c: "Northwind Labs, Bengaluru", s: 91 },
            { t: "Backend Engineer", c: "Orbital Freight, Remote", s: 86 },
          ].map((j) => (
            <div key={j.t} className="mt-3 flex items-center gap-3 rounded-xl bg-paper/70 px-3 py-2.5">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border-2 border-sent text-xs font-bold tabular-nums">{j.s}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{j.t}</p>
                <p className="truncate text-xs text-muted">{j.c}</p>
              </div>
              <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[11px] font-semibold text-[rgb(147,197,253)]">Review</span>
            </div>
          ))}
        </div>

        <div className={`${card} float-b`}>
          <p className="text-xs font-semibold text-hold">Needs your answer</p>
          <p className="mt-2 text-sm leading-snug">This job asks for Power BI. Have you used it?</p>
          <div className="mt-3 flex gap-1.5">
            <span className="rounded-lg bg-primary px-2.5 py-1 text-xs font-semibold text-white">Yes</span>
            <span className="rounded-lg border border-rule px-2.5 py-1 text-xs font-semibold">Skip</span>
          </div>
        </div>

        <div className={`${card} float-c`}>
          <p className="text-xs font-semibold text-muted">This week</p>
          <p className="mt-1 text-3xl font-extrabold tabular-nums">12</p>
          <p className="text-xs text-muted">applications sent</p>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-paper">
            <div className="grow-bar h-full w-[72%] rounded-full bg-gradient-to-r from-primary to-sent" />
          </div>
        </div>

        <div className={`${card} float-b col-span-2`}>
          <p className="text-xs font-semibold text-muted">Resume tailored for Data Analyst</p>
          <ul className="mt-2 space-y-1.5 text-sm">
            {["Moved SQL and Tableau to the top", "Reworded your dashboard bullet to match the role", "Nothing added that isn't on your profile"].map((x) => (
              <li key={x} className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-sent" />{x}</li>
            ))}
          </ul>
        </div>
      </div>
      <p className="mt-3 text-center text-xs text-muted">Example data</p>
    </div>
  );
}
