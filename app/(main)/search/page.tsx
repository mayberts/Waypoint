"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { BookmarkGrid } from "@/components/BookmarkGrid";
import { SaveSearchButton } from "@/components/SaveSearchButton";

function SearchResults() {
  const searchParams = useSearchParams();
  const q = searchParams.get("q") ?? "";

  if (!q) {
    return (
      <div className="p-6 flex flex-col gap-1.5">
        <p className="text-sm text-[var(--text-faint)]">Type something to search.</p>
        <p className="text-xs text-[var(--text-faint)]">
          Narrow it down with <code className="text-[var(--text-muted)]">tag:name</code>,{" "}
          <code className="text-[var(--text-muted)]">site:domain.com</code>, or{" "}
          <code className="text-[var(--text-muted)]">is:favorite</code> / <code className="text-[var(--text-muted)]">broken</code> /{" "}
          <code className="text-[var(--text-muted)]">untagged</code>.
        </p>
      </div>
    );
  }
  return (
    <BookmarkGrid
      title={`Search: “${q}”`}
      query={{ q }}
      viewKey="search"
      extraActions={<SaveSearchButton query={q} />}
    />
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<p className="p-6 text-sm text-[var(--text-faint)]">Loading…</p>}>
      <SearchResults />
    </Suspense>
  );
}
