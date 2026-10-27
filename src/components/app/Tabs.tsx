"use client";

import Link from "next/link";
import { m } from "framer-motion";
import { cn } from "@/lib/cn";

export function Tabs({ tabs, active }: { tabs: { key: string; label: string; count: number; href: string }[]; active: string }) {
  return (
    <div role="tablist" className="flex gap-1 overflow-x-auto rounded-control border border-rule bg-sheet p-1">
      {tabs.map((t) => (
        <Link key={t.key} role="tab" aria-selected={t.key === active} href={t.href} scroll={false}
          className={cn("relative flex-1 whitespace-nowrap rounded-[0.375rem] px-3 py-2 text-center text-sm font-semibold transition-colors", t.key === active ? "text-paper" : "text-muted hover:text-ink")}>
          {t.key === active && <m.span layoutId="tab-pill" className="absolute inset-0 rounded-[0.375rem] bg-primary" transition={{ type: "spring", stiffness: 420, damping: 34 }} />}
          <span className="relative">
            {t.label} <span className="tabular-nums opacity-70">{t.count}</span>
          </span>
        </Link>
      ))}
    </div>
  );
}
