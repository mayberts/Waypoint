"use client";

import { BookmarkGrid } from "@/components/BookmarkGrid";

export default function UnsortedPage() {
  return <BookmarkGrid title="Unsorted" query={{ unsorted: true }} />;
}
