"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { m } from "framer-motion";
import { Briefcase, LayoutDashboard, LogOut, Settings, Sparkles, UserRound } from "lucide-react";
import { cn } from "@/lib/cn";

const NAV = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/applications", label: "Applications", icon: Briefcase },
  { href: "/dashboard/matches", label: "Matches", icon: Sparkles },
  { href: "/dashboard/profile", label: "Profile", icon: UserRound },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export function AppHeader({ name, email, showNav = false }: { name: string; email: string; showNav?: boolean }) {
  const path = usePathname();
  const active = (href: string) => (href === "/dashboard" ? path === href : path.startsWith(href));
  return (
    <>
      <header className="sticky top-0 z-40 border-b border-rule bg-paper/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-page items-center justify-between gap-4 px-4 sm:px-6">
          <Link href={showNav ? "/dashboard" : "/"} className="flex items-center gap-2 text-lg font-extrabold tracking-tight">
            <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden className="shrink-0">
              <path d="M3 3h11l5 5v11H3z" fill="rgb(var(--ink))" />
              <path d="M14 3v5h5" fill="rgb(var(--paper))" />
              <path d="M7 12.5l2.6 2.6L15 9.7" fill="none" stroke="rgb(var(--paper))" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Shortlist
          </Link>

          {showNav && (
            <nav aria-label="App" className="hidden items-center gap-1 lg:flex">
              {NAV.map((n) => (
                <Link key={n.href} href={n.href} aria-current={active(n.href) ? "page" : undefined}
                  className={cn("relative rounded-control px-3 py-2 text-sm font-semibold transition-colors", active(n.href) ? "text-ink" : "text-muted hover:text-ink")}>
                  {active(n.href) && <m.span layoutId="nav-pill" className="absolute inset-0 rounded-control bg-sheet shadow-[0_0_0_1px_rgb(var(--rule))]" transition={{ type: "spring", stiffness: 400, damping: 34 }} />}
                  <span className="relative">{n.label}</span>
                </Link>
              ))}
            </nav>
          )}

          <div className="flex min-w-0 items-center gap-3">
            <div className="hidden min-w-0 text-right sm:block">
              <p className="max-w-[14rem] truncate text-sm font-semibold">{name}</p>
              <p className="max-w-[14rem] truncate text-xs text-muted">{email}</p>
            </div>
            <form action="/auth/signout" method="post">
              <button type="submit" className="inline-flex h-10 items-center gap-2 rounded-control border border-rule bg-sheet px-3 text-sm font-semibold transition-colors hover:border-ink">
                <LogOut className="h-4 w-4" aria-hidden />
                <span className="hidden sm:inline">Sign out</span>
              </button>
            </form>
          </div>
        </div>
      </header>

      {showNav && (
        <nav aria-label="App" className="fixed inset-x-0 bottom-0 z-40 border-t border-rule bg-paper/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden">
          <ul className="mx-auto grid max-w-md grid-cols-5">
            {NAV.map((n) => (
              <li key={n.href}>
                <Link href={n.href} aria-current={active(n.href) ? "page" : undefined}
                  className={cn("flex flex-col items-center gap-0.5 py-2 text-[11px] font-semibold", active(n.href) ? "text-ink" : "text-muted")}>
                  <n.icon className="h-5 w-5" aria-hidden />
                  {n.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </>
  );
}
