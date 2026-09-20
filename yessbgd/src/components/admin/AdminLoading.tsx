import { Loader2 } from "lucide-react";

/** Small inline spinner used across admin screens. */
export function AdminSpinner({ className = "h-4 w-4" }: { className?: string }) {
  return <Loader2 className={`animate-spin ${className}`} aria-hidden="true" />;
}

/**
 * Full-panel loading state. Rendered as a route `pendingComponent` and while
 * an admin screen is still fetching its rows.
 */
export function AdminLoadingState({
  label = "Loading…",
  labelBn = "লোড হচ্ছে…",
}: {
  label?: string;
  labelBn?: string;
}) {
  return (
    <div
      data-testid="admin-loading"
      role="status"
      aria-live="polite"
      aria-busy="true"
      className="grid min-h-[240px] place-items-center rounded-2xl glass-card p-10 text-center"
    >
      <div className="flex flex-col items-center gap-3">
        <AdminSpinner className="h-6 w-6 text-primary" />
        <div>
          <div className="text-sm font-medium text-foreground">{label}</div>
          <div className="text-xs text-muted-foreground">{labelBn}</div>
        </div>
      </div>
    </div>
  );
}

/** Skeleton rows that mimic the CMS list table while data loads. */
export function AdminTableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div
      data-testid="admin-loading"
      role="status"
      aria-live="polite"
      aria-busy="true"
      className="overflow-hidden rounded-2xl glass-card"
    >
      <span className="sr-only">Loading content… · লোড হচ্ছে…</span>
      {Array.from({ length: rows }).map((_, r) => (
        <div
          key={r}
          className="flex items-center gap-4 border-b border-glass-border/50 px-4 py-4 last:border-0"
        >
          {Array.from({ length: cols }).map((_, c) => (
            <div
              key={c}
              className="h-3 animate-pulse rounded bg-muted-foreground/15"
              style={{ width: c === 0 ? "28%" : `${Math.max(10, 22 - c * 3)}%` }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

/** Skeleton form used by the CMS edit screen. */
export function AdminFormSkeleton({ fields = 6 }: { fields?: number }) {
  return (
    <div
      data-testid="admin-loading"
      role="status"
      aria-live="polite"
      aria-busy="true"
      className="space-y-5 rounded-2xl glass-card p-6 sm:p-8"
    >
      <span className="sr-only">Loading entry… · লোড হচ্ছে…</span>
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-2">
          <div className="h-2.5 w-28 animate-pulse rounded bg-muted-foreground/15" />
          <div className="h-9 w-full animate-pulse rounded-lg bg-muted-foreground/10" />
        </div>
      ))}
    </div>
  );
}
