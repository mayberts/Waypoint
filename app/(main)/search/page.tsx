"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { BookmarkGrid } from "@/components/BookmarkGrid";
import { SaveSearchButton } from "@/components/SaveSearchButton";

function SearchResults() {
  const searchParams = useSearchParams();
  const q = searchParams.get("q") ?? "";

  if (!q) return <p className="p-6 text-sm text-[var(--text-faint)]">Type something to search.</p>;
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
