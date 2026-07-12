"use client";

import { BookmarkGrid } from "@/components/BookmarkGrid";

export default function UntaggedPage() {
  return <BookmarkGrid title="Untagged" query={{ untagged: true }} viewKey="smart:untagged" />;
}
