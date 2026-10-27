/** Placeholder shown instantly while a dashboard page loads on the server. */
export function PageSkeleton({ rows = 5, filters = false }: { rows?: number; filters?: boolean }) {
  const bar = "animate-pulse rounded-control bg-sheet";
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading">
      <div className="space-y-2">
        <div className={`${bar} h-9 w-56`} />
        <div className={`${bar} h-4 w-full max-w-md`} />
      </div>
      {filters && <div className={`${bar} h-28 w-full rounded-panel`} />}
      <ul className="space-y-3">
        {Array.from({ length: rows }, (_, i) => (
          <li key={i} className="flex items-center gap-4 rounded-panel border border-rule bg-sheet/60 p-4" style={{ opacity: 1 - i * 0.12 }}>
            <div className="h-11 w-11 shrink-0 animate-pulse rounded-full bg-rule/60" />
            <div className="min-w-0 flex-1 space-y-2">
              <div className="h-4 w-2/3 animate-pulse rounded bg-rule/60" />
              <div className="h-3 w-1/3 animate-pulse rounded bg-rule/40" />
            </div>
            <div className="hidden h-10 w-28 animate-pulse rounded-control bg-rule/40 sm:block" />
          </li>
        ))}
      </ul>
    </div>
  );
}
