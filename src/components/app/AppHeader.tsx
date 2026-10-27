import Link from "next/link";
import { LogOut } from "lucide-react";

export function AppHeader({ name, email }: { name: string; email: string }) {
  return (
    <header className="sticky top-0 z-40 border-b border-rule bg-paper/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-page items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/dashboard" className="flex items-center gap-2 text-lg font-extrabold tracking-tight">
          <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden className="shrink-0">
            <path d="M3 3h11l5 5v11H3z" fill="rgb(var(--ink))" />
            <path d="M14 3v5h5" fill="rgb(var(--paper))" />
            <path d="M7 12.5l2.6 2.6L15 9.7" fill="none" stroke="rgb(var(--paper))" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Shortlist
        </Link>
        <div className="flex min-w-0 items-center gap-3">
          <div className="hidden min-w-0 text-right sm:block">
            <p className="truncate text-sm font-semibold">{name}</p>
            <p className="truncate text-xs text-muted">{email}</p>
          </div>
          <form action="/auth/signout" method="post">
            <button
              type="submit"
              className="inline-flex h-10 items-center gap-2 rounded-control border border-rule bg-sheet px-3 text-sm font-semibold transition-colors hover:border-ink"
            >
              <LogOut className="h-4 w-4" aria-hidden />
              Sign out
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
