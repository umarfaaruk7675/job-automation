import { ArrowRight, BadgeCheck, FileText, Gauge, MessageCircleQuestion, Radar, ShieldCheck } from "lucide-react";
import { site } from "@/content/site";
import { GlowCard } from "@/components/ui/GlowCard";
import { Reveal, RevealItem } from "@/components/motion/Reveal";

const ICONS = { radar: Radar, gauge: Gauge, file: FileText, message: MessageCircleQuestion, check: BadgeCheck, shield: ShieldCheck } as const;

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

export function Features() {
  return (
    <section id="features" aria-labelledby="features-title" className="mx-auto max-w-page px-4 py-20 sm:px-6 lg:py-28">
      <SectionHead id="features-title" title="Everything a careful applicant would do" body="Shortlist does the searching, scoring and rewriting. You make the decisions." />
      <Reveal as="ul" className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {site.features.map((f) => {
          const Icon = ICONS[f.icon];
          return (
            <RevealItem as="li" key={f.title}>
              <GlowCard className="h-full p-6">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary/15 text-[rgb(147,197,253)]" aria-hidden>
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="mt-5 text-lg font-semibold">{f.title}</h3>
                <p className="mt-2 text-muted">{f.body}</p>
              </GlowCard>
            </RevealItem>
          );
        })}
      </Reveal>
    </section>
  );
}

export function HowItWorks() {
  return (
    <section id="how-it-works" aria-labelledby="how-title" className="relative border-y border-rule bg-sheet/40">
      <div className="mx-auto max-w-page px-4 py-20 sm:px-6 lg:py-28">
        <SectionHead id="how-title" title="How it works" body="Three steps, about ten minutes to set up, then a few minutes a day." />
        <Reveal as="ol" className="relative mt-14 grid gap-6 md:grid-cols-3">
          <div className="absolute left-[16%] right-[16%] top-6 hidden h-px bg-gradient-to-r from-primary/0 via-primary/60 to-primary/0 md:block" aria-hidden />
          {site.steps.map((s, i) => (
            <RevealItem as="li" key={s.title} className="relative text-center">
              <span className="relative mx-auto grid h-12 w-12 place-items-center rounded-full border border-primary/50 bg-paper text-lg font-bold text-[rgb(147,197,253)] shadow-glow">
                {i + 1}
              </span>
              <h3 className="mt-5 text-lg font-semibold">{s.title}</h3>
              <p className="mx-auto mt-2 max-w-xs text-muted">{s.body}</p>
            </RevealItem>
          ))}
        </Reveal>
      </div>
    </section>
  );
}

export function Pricing() {
  const included = ["Daily job matches from company career pages", "Match scores with reasons", "Resume tailored for each job", "Questions instead of guesses", "Application tracking and email receipts"];
  return (
    <section id="pricing" aria-labelledby="pricing-title" className="mx-auto max-w-page px-4 py-20 sm:px-6 lg:py-28">
      <SectionHead id="pricing-title" title="Free while in beta" body="Everything is included while we build. If paid plans come later, prices will be listed here first." />
      <Reveal className="mx-auto mt-12 max-w-md"><RevealItem>
        <GlowCard className="p-7">
          <p className="text-sm font-semibold text-[rgb(147,197,253)]">Beta</p>
          <p className="mt-2 text-5xl font-extrabold tabular-nums">₹0<span className="text-lg font-semibold text-muted"> / month</span></p>
          <ul className="mt-6 space-y-3">
            {included.map((x) => (
              <li key={x} className="flex gap-3"><BadgeCheck className="mt-0.5 h-5 w-5 shrink-0 text-sent" aria-hidden />{x}</li>
            ))}
          </ul>
          <a href={site.primaryCta.href} className="mt-7 flex h-12 items-center justify-center gap-2 rounded-2xl bg-primary font-semibold text-white transition-colors hover:bg-primary-hover">
            {site.primaryCta.label} <ArrowRight className="h-4 w-4" aria-hidden />
          </a>
        </GlowCard>
      </RevealItem></Reveal>
    </section>
  );
}

export function FinalCta() {
  return (
    <section aria-labelledby="cta-title" className="px-4 pb-20 sm:px-6 lg:pb-28">
      <Reveal className="mx-auto max-w-page"><RevealItem
        className="relative overflow-hidden rounded-3xl border border-primary/30 bg-gradient-to-br from-primary/25 via-sheet to-sheet px-6 py-14 text-center sm:px-12">
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/30 blur-3xl" aria-hidden />
        <h2 id="cta-title" className="relative text-h2 font-extrabold tracking-tight">Start your shortlist today.</h2>
        <p className="relative mx-auto mt-3 max-w-xl text-lede text-muted">Upload your resume and see your first matches in minutes.</p>
        <a href={site.primaryCta.href} className="relative mt-8 inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-primary px-7 font-semibold text-white shadow-glow transition-colors hover:bg-primary-hover">
          {site.primaryCta.label} <ArrowRight className="h-4 w-4" aria-hidden />
        </a>
      </RevealItem></Reveal>
    </section>
  );
}

export function Footer() {
  const cols = [
    { title: "Product", links: [{ label: "Features", href: "#features" }, { label: "How it works", href: "#how-it-works" }, { label: "Pricing", href: "#pricing" }, { label: "FAQ", href: "#faq" }] },
    { title: "Account", links: [{ label: "Create an account", href: "/signup" }, { label: "Log in", href: "/signin" }, { label: "Dashboard", href: "/dashboard" }] },
  ];
  return (
    <footer className="border-t border-rule">
      <div className="mx-auto grid max-w-page gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.5fr_1fr_1fr]">
        <div>
          <p className="text-lg font-extrabold">{site.name}</p>
          <p className="mt-2 max-w-xs text-sm text-muted">Fresh jobs, honest tailoring, and nothing sent without your approval.</p>
        </div>
        {cols.map((c) => (
          <nav key={c.title} aria-label={c.title}>
            <p className="text-sm font-semibold">{c.title}</p>
            <ul className="mt-3 space-y-2">
              {c.links.map((l) => (
                <li key={l.label}><a href={l.href} className="text-sm text-muted transition-colors hover:text-ink">{l.label}</a></li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <p className="border-t border-rule px-4 py-5 text-center text-xs text-muted">© {new Date().getFullYear()} {site.name}. All rights reserved.</p>
    </footer>
  );
}
