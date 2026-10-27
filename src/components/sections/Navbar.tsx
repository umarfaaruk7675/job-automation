"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, m, useMotionValueEvent, useScroll } from "framer-motion";
import { site } from "@/content/site";
import { cn } from "@/lib/cn";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { scrollY } = useScroll();
  useMotionValueEvent(scrollY, "change", (y) => setScrolled(y > 8));

  // A Supabase session cookie means the visitor is probably signed in. Checking
  // the cookie avoids loading the auth SDK on the landing page; the dashboard
  // verifies the session properly.
  const [signedIn, setSignedIn] = useState(false);
  useEffect(() => setSignedIn(/(^|; )sb-[^=]+-auth-token(\.0)?=/.test(document.cookie)), []);
  const cta = signedIn ? { label: "Open dashboard", href: "/dashboard" } : site.primaryCta;
  const menuLinks = signedIn ? site.nav : [...site.nav, site.signIn];

  return (
    <header
      className={cn(
        "sticky top-0 z-50 transition-[background-color,border-color] duration-300",
        "border-b",
        scrolled || open ? "border-rule bg-paper/85 backdrop-blur-md" : "border-transparent bg-paper/0",
      )}
    >
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:rounded-control focus:bg-ink focus:px-3 focus:py-2 focus:text-paper"
      >
        Skip to content
      </a>
      <nav className="mx-auto flex h-16 max-w-page items-center justify-between px-4 sm:px-6" aria-label="Main">
        <a href="/" className="flex items-center gap-2 text-lg font-extrabold tracking-tight">
          <Mark />
          {site.name}
        </a>

        <ul className="hidden items-center gap-8 md:flex">
          {site.nav.map((l) => (
            <li key={l.href}>
              <NavLink href={l.href}>{l.label}</NavLink>
            </li>
          ))}
        </ul>

        <div className="hidden items-center gap-3 md:flex">
          {!signedIn && <NavLink href={site.signIn.href}>{site.signIn.label}</NavLink>}
          <m.a
            href={cta.href}
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.97 }}
            className="rounded-control bg-ink px-4 py-2 text-sm font-semibold text-paper transition-colors hover:bg-sent"
          >
            {cta.label}
          </m.a>
        </div>

        <button
          type="button"
          className="-mr-2 grid h-11 w-11 place-items-center rounded-control md:hidden"
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((v) => !v)}
        >
          <span className="relative block h-3 w-5" aria-hidden>
            <m.span
              className="absolute left-0 top-0 h-0.5 w-5 rounded bg-ink"
              animate={open ? { rotate: 45, y: 5 } : { rotate: 0, y: 0 }}
            />
            <m.span
              className="absolute bottom-0 left-0 h-0.5 w-5 rounded bg-ink"
              animate={open ? { rotate: -45, y: -5 } : { rotate: 0, y: 0 }}
            />
          </span>
        </button>
      </nav>

      <AnimatePresence initial={false}>
        {open && (
          <m.div
            id="mobile-menu"
            key="menu"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden border-t border-rule md:hidden"
          >
            <ul className="flex flex-col px-4 py-3">
              {menuLinks.map((l) => (
                <li key={l.href}>
                  <a
                    href={l.href}
                    onClick={() => setOpen(false)}
                    className="block py-3 text-lg font-medium"
                  >
                    {l.label}
                  </a>
                </li>
              ))}
              <li className="pb-2 pt-3">
                <a
                  href={cta.href}
                  onClick={() => setOpen(false)}
                  className="block rounded-control bg-ink px-4 py-3 text-center font-semibold text-paper"
                >
                  {cta.label}
                </a>
              </li>
            </ul>
          </m.div>
        )}
      </AnimatePresence>
    </header>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} className="group relative text-sm font-medium text-muted transition-colors hover:text-ink">
      {children}
      <span
        aria-hidden
        className="absolute -bottom-1 left-0 h-px w-full origin-left scale-x-0 bg-ink transition-transform duration-300 group-hover:scale-x-100"
      />
    </a>
  );
}

/** A tick inside a folded corner: an application that has been checked and sent. */
function Mark() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden className="shrink-0">
      <path d="M3 3h11l5 5v11H3z" fill="rgb(var(--ink))" />
      <path d="M14 3v5h5" fill="rgb(var(--paper))" />
      <path d="M7 12.5l2.6 2.6L15 9.7" fill="none" stroke="rgb(var(--paper))" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
