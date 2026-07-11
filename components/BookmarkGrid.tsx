"use client";

import { useState } from "react";
import { useBookmarks, type BookmarkQuery } from "@/lib/use-bookmarks";
import type { BookmarkDTO } from "@/lib/types";
import { BookmarkCard } from "./BookmarkCard";
import { AddBookmarkModal } from "./AddBookmarkModal";
import { BookmarkEditDrawer } from "./BookmarkEditDrawer";
import { useAppData } from "./providers";

export function BookmarkGrid({
  title,
  query,
  defaultCollectionId = null,
}: {
  title: string;
  query: BookmarkQuery;
  defaultCollectionId?: string | null;
}) {
  const { bookmarks, loading, refresh } = useBookmarks(query);
  const { refreshCollections } = useAppData();
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<BookmarkDTO | null>(null);

  function handleCreated() {
    refresh();
    refreshCollections();
  }

  function handleUpdated() {
    refresh();
    refreshCollections();
  }

  function handleDeleted() {
    refresh();
    refreshCollections();
  }

  return (
    <div className="flex-1 flex flex-col min-w-0">
      <div className="flex items-center justify-between px-6 pt-6 pb-4">
        <h1 className="text-lg font-semibold text-neutral-100">{title}</h1>
        <button
          onClick={() => setAdding(true)}
          className="px-3 py-1.5 text-sm rounded-md bg-blue-600 text-white hover:bg-blue-500"
        >
          + Add bookmark
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-6">
        {loading ? (
          <p className="text-sm text-neutral-500">Loading…</p>
        ) : bookmarks.length === 0 ? (
          <p className="text-sm text-neutral-500">No bookmarks here yet.</p>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-4">
            {bookmarks.map((b) => (
              <BookmarkCard key={b.id} bookmark={b} onEdit={() => setEditing(b)} />
            ))}
          </div>
        )}
      </div>

      {adding && (
        <AddBookmarkModal
          defaultCollectionId={defaultCollectionId}
          onClose={() => setAdding(false)}
          onCreated={handleCreated}
        />
      )}

      {editing && (
        <BookmarkEditDrawer
          bookmark={editing}
          onClose={() => setEditing(null)}
          onUpdated={handleUpdated}
          onDeleted={handleDeleted}
        />
      )}
    </div>
  );
}
