import Link from "next/link";
import { cn } from "@/lib/cn";

/** Shortlist mark and wordmark, same as the landing page. */
export function Logo({ href = "/", className }: { href?: string; className?: string }) {
  return (
    <Link href={href} aria-label="Shortlist home" className={cn("flex items-center gap-2.5 text-[15px] font-bold uppercase tracking-[0.24em]", className)}>
      <span className="grid h-[30px] w-[30px] shrink-0 place-items-center rounded-[9px] bg-primary" aria-hidden>
        <svg width="17" height="17" viewBox="0 0 22 22">
          <path d="M3 3h11l5 5v11H3z" fill="rgb(var(--primary-fg))" />
          <path d="M7 12.5l2.6 2.6L15 9.7" fill="none" stroke="#b98a6a" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      <span className="max-[420px]:tracking-[0.12em]">Shortlist</span>
    </Link>
  );
}
