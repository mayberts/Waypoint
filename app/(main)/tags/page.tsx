"use client";

import { useState } from "react";
import { TagCloud } from "@/components/TagCloud";
import { useAppData } from "@/components/providers";

export default function TagsPage() {
  const { tags } = useAppData();
  const [filter, setFilter] = useState("");

  const sorted = [...tags]
    .filter((t) => t.name.toLowerCase().includes(filter.trim().toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((t) => ({ name: t.name, count: t._count?.bookmarks ?? 0 }));

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 max-w-5xl flex flex-col gap-4 sm:px-6 sm:py-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-lg font-semibold text-[var(--text-primary)]">Tags</h1>
        <span className="text-xs text-[var(--text-faint)]">
          {tags.length} tag{tags.length === 1 ? "" : "s"}
        </span>
      </div>

      {tags.length > 0 && (
        <input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filter tags…"
          className="w-full max-w-xs rounded-md bg-[var(--surface-1)] border border-[var(--border)] px-2.5 py-1.5 text-sm text-[var(--text-secondary)] placeholder:text-[var(--text-faint)] focus:outline-none focus:border-[var(--border-stronger)]"
        />
      )}

      <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-0)] p-4">
        {tags.length === 0 ? (
          <p className="text-xs text-[var(--text-faint)]">No tags yet — tag a bookmark to see it here.</p>
        ) : sorted.length === 0 ? (
          <p className="text-xs text-[var(--text-faint)]">No tags match &quot;{filter}&quot;.</p>
        ) : (
          <TagCloud tags={sorted} />
        )}
      </div>
    </div>
  );
}
