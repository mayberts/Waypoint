"use client";

import Link from "next/link";

// Shared by the Stats page (top tags, count-sorted) and the Tags browsing
// page (every tag, alphabetical) — font size scales with how often a tag is
// used, and each pill links into the filtered /tag/<name> view.
export function TagCloud({ tags }: { tags: { name: string; count: number }[] }) {
  const max = Math.max(1, ...tags.map((t) => t.count));

  function tier(count: number): string {
    const ratio = count / max;
    if (ratio > 0.66) return "text-base font-semibold";
    if (ratio > 0.33) return "text-sm font-medium";
    return "text-xs";
  }

  if (tags.length === 0) {
    return <p className="text-xs text-[var(--text-faint)]">No tagged bookmarks yet.</p>;
  }

  return (
    <div className="flex flex-wrap gap-2 items-center">
      {tags.map((t) => (
        <Link
          key={t.name}
          href={`/tag/${encodeURIComponent(t.name)}`}
          title={`${t.count} bookmark${t.count === 1 ? "" : "s"}`}
          className={`px-2.5 py-1 rounded-full bg-[var(--surface-2)] text-[var(--text-body)] hover:bg-[var(--surface-2-a60)] hover:text-[var(--text-primary)] transition-colors ${tier(t.count)}`}
        >
          {t.name}
        </Link>
      ))}
    </div>
  );
}
