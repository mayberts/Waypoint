"use client";

import { BookmarkGrid } from "@/components/BookmarkGrid";

export default function BrokenLinksPage() {
  return <BookmarkGrid title="Broken links" query={{ broken: true }} viewKey="smart:broken" />;
}
