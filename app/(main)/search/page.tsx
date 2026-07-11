"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { BookmarkGrid } from "@/components/BookmarkGrid";

function SearchResults() {
  const searchParams = useSearchParams();
  const q = searchParams.get("q") ?? "";

  if (!q) return <p className="p-6 text-sm text-neutral-500">Type something to search.</p>;
  return <BookmarkGrid title={`Search: “${q}”`} query={{ q }} />;
}

export default function SearchPage() {
  return (
    <Suspense fallback={<p className="p-6 text-sm text-neutral-500">Loading…</p>}>
      <SearchResults />
    </Suspense>
  );
}
