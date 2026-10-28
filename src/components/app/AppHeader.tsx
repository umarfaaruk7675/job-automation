"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { m } from "framer-motion";
import { Briefcase, LayoutDashboard, LogOut, Search, Settings, Sparkles, UserRound } from "lucide-react";
import { cn } from "@/lib/cn";
import { Logo } from "@/components/ui/Logo";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

const NAV = [
  { href: "/dashboard", label: "Overview", short: "Home", icon: LayoutDashboard },
  { href: "/dashboard/jobs", label: "Live jobs", short: "Jobs", icon: Search },
  { href: "/dashboard/matches", label: "Matches", short: "Matches", icon: Sparkles },
  { href: "/dashboard/applications", label: "Applications", short: "Applied", icon: Briefcase },
  { href: "/dashboard/profile", label: "Profile", short: "Profile", icon: UserRound },
  { href: "/dashboard/settings", label: "Settings", short: "Settings", icon: Settings },
];

export function AppHeader({ name, email, showNav = false }: { name: string; email: string; showNav?: boolean }) {
  const path = usePathname();
  const active = (href: string) => (href === "/dashboard" ? path === href : path.startsWith(href));
  return (
    <>
      <header className="sticky top-3 z-40 px-3 sm:px-4">
        <div className="mx-auto flex max-w-page items-center justify-between gap-3 rounded-full border border-rule bg-paper/85 py-2 pl-4 pr-2 shadow-[0_12px_34px_-16px_rgb(94_64_34/0.3)] backdrop-blur-xl sm:pl-5">
          <Logo href={showNav ? "/dashboard" : "/"} />

          {showNav && (
            <nav aria-label="App" className="hidden items-center gap-1 lg:flex">
              {NAV.map((n) => (
                <Link key={n.href} href={n.href} prefetch aria-current={active(n.href) ? "page" : undefined}
                  className={cn("relative rounded-full px-3.5 py-2 text-sm font-semibold transition-colors", active(n.href) ? "text-ink" : "text-muted hover:text-ink")}>
                  {active(n.href) && <m.span layoutId="nav-pill" className="absolute inset-0 rounded-full bg-sand shadow-[0_0_0_1px_rgb(var(--rule))]" transition={{ type: "spring", stiffness: 400, damping: 34 }} />}
                  <span className="relative">{n.label}</span>
                </Link>
              ))}
            </nav>
          )}

          <div className="flex min-w-0 items-center gap-2">
            <div className="hidden min-w-0 text-right xl:block">
              <p className="max-w-[12rem] truncate text-sm font-semibold leading-tight">{name}</p>
              <p className="max-w-[12rem] truncate text-xs text-muted">{email}</p>
            </div>
            <ThemeToggle />
            <form action="/auth/signout" method="post">
              <button type="submit" className="inline-flex h-10 items-center gap-2 rounded-full border border-rule bg-sheet px-4 text-sm font-semibold transition-colors hover:bg-sand">
                <LogOut className="h-4 w-4" aria-hidden />
                <span className="hidden sm:inline">Sign out</span>
              </button>
            </form>
          </div>
        </div>
      </header>

      {showNav && (
        <nav aria-label="App" className="fixed inset-x-0 bottom-0 z-40 border-t border-rule bg-paper/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden">
          <ul className="mx-auto grid max-w-lg grid-cols-6">
            {NAV.map((n) => (
              <li key={n.href}>
                <Link href={n.href} aria-current={active(n.href) ? "page" : undefined}
                  className={cn("flex flex-col items-center gap-0.5 py-2 text-[10.5px] font-semibold", active(n.href) ? "text-ink" : "text-muted")}>
                  <n.icon className="h-5 w-5" aria-hidden />
                  {n.short}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </>
  );
}
