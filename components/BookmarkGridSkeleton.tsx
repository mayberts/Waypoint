import type { ViewMode } from "@/lib/view-prefs";
import { Skeleton } from "./Skeleton";

export function BookmarkGridSkeleton({ view }: { view: ViewMode }) {
  if (view === "moodboard") {
    const heights = [140, 90, 170, 110, 150, 100, 130, 160];
    return (
      <div className="columns-2 sm:columns-3 lg:columns-4 gap-4">
        {heights.map((h, i) => (
          <div key={i} className="mb-4 break-inside-avoid">
            <Skeleton className="w-full" style={{ height: h }} />
          </div>
        ))}
      </div>
    );
  }

  if (view === "cards") {
    return (
      <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))]" style={{ gap: "var(--card-gap)" }}>
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="flex flex-col rounded-lg border border-[var(--border)] overflow-hidden">
            <Skeleton className="h-28 w-full rounded-none" />
            <div className="flex flex-col gap-2" style={{ padding: "var(--card-pad)" }}>
              <Skeleton className="h-4 w-4/5" />
              <Skeleton className="h-3 w-1/3" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // list / headlines
  return (
    <div className="flex flex-col">
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 py-2.5 border-b border-[var(--border-a70)]">
          <Skeleton className="h-5 w-5 shrink-0 rounded" />
          <Skeleton className="h-3.5 flex-1 max-w-xs" />
          <Skeleton className="h-3 w-16 shrink-0 hidden sm:block" />
        </div>
      ))}
    </div>
  );
}
