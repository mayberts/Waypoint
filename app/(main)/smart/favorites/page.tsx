"use client";

import { BookmarkGrid } from "@/components/BookmarkGrid";

export default function FavoritesPage() {
  return <BookmarkGrid title="Favorites" query={{ favorite: true }} viewKey="smart:favorites" />;
}
