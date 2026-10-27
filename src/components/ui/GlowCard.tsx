"use client";

import { useRef } from "react";
import { cn } from "@/lib/cn";

/** A panel whose border glows where the pointer is. Static for touch and reduced motion. */
export function GlowCard({ children, className, as: Tag = "div" }: { children: React.ReactNode; className?: string; as?: "div" | "li" | "article" | "section" }) {
  const ref = useRef<HTMLElement>(null);
  const set = (e: React.PointerEvent, on: boolean) => {
    const el = ref.current;
    if (!el || e.pointerType !== "mouse") return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--gx", `${e.clientX - r.left}px`);
    el.style.setProperty("--gy", `${e.clientY - r.top}px`);
    el.style.setProperty("--gi", on ? "1" : "0");
  };
  return (
    <Tag
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ref={ref as any}
      onPointerMove={(e: React.PointerEvent) => set(e, true)}
      onPointerLeave={(e: React.PointerEvent) => set(e, false)}
      className={cn("glow-card rounded-2xl border border-rule bg-sheet transition-[transform,box-shadow] duration-300 hover:-translate-y-0.5 hover:shadow-glow", className)}
    >
      {children}
    </Tag>
  );
}
