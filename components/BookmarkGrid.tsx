"use client";

import { useEffect, useState } from "react";
import { useBookmarks, type BookmarkQuery } from "@/lib/use-bookmarks";
import type { BookmarkDTO } from "@/lib/types";
import { api } from "@/lib/api-client";
import { isViewMode, loadLocalView, saveLocalView, applyViewToAllLocalKeys, type ViewMode } from "@/lib/view-prefs";
import { BookmarkCard } from "./BookmarkCard";
import { BookmarkRow } from "./BookmarkRow";
import { BookmarkMoodboard } from "./BookmarkMoodboard";
import { AddBookmarkModal } from "./AddBookmarkModal";
import { BookmarkEditDrawer } from "./BookmarkEditDrawer";
import { ViewSwitcher } from "./ViewSwitcher";
import { useAppData } from "./providers";

const COLLECTION_VIEW_PREFIX = "collection:";

export function BookmarkGrid({
  title,
  query,
  viewKey,
  defaultCollectionId = null,
}: {
  title: string;
  query: BookmarkQuery;
  /** Identifies where the view preference is stored: "all" | "unsorted" | "search" | "collection:<id>". */
  viewKey: string;
  defaultCollectionId?: string | null;
}) {
  const { bookmarks, loading, refresh } = useBookmarks(query);
  const { collections, refreshCollections } = useAppData();
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<BookmarkDTO | null>(null);
  // Starts at "cards" to match the server-rendered shell (localStorage isn't
  // available during SSR), then picks up the real stored preference on mount.
  const [localView, setLocalView] = useState<ViewMode>("cards");
  // Set synchronously on every change so "Apply to all" (which reuses the
  // displayed view) can't race an in-flight PATCH/refetch and read a stale value.
  const [optimisticView, setOptimisticView] = useState<ViewMode | null>(null);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reading a client-only localStorage preference after mount
    setLocalView(loadLocalView(viewKey));
    setOptimisticView(null);
  }, [viewKey]);

  const collectionId = viewKey.startsWith(COLLECTION_VIEW_PREFIX) ? viewKey.slice(COLLECTION_VIEW_PREFIX.length) : null;
  const collectionRecord = collectionId ? collections.find((c) => c.id === collectionId) : null;
  const view: ViewMode =
    optimisticView ?? (collectionId ? (isViewMode(collectionRecord?.view) ? collectionRecord!.view : "cards") : localView);

  async function handleViewChange(newView: ViewMode) {
    setOptimisticView(newView);
    if (collectionId) {
      await api.patch(`/api/collections/${collectionId}`, { view: newView });
      await refreshCollections();
    } else {
      saveLocalView(viewKey, newView);
      setLocalView(newView);
    }
  }

  async function handleApplyToAll(newView: ViewMode) {
    setOptimisticView(newView);
    await api.post("/api/collections/apply-view", { view: newView });
    applyViewToAllLocalKeys(newView);
    setLocalView(newView);
    await refreshCollections();
  }

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
        <div className="flex items-center gap-2">
          <ViewSwitcher value={view} onChange={handleViewChange} onApplyToAll={handleApplyToAll} />
          <button
            onClick={() => setAdding(true)}
            className="px-3 py-1.5 text-sm rounded-md bg-[var(--accent-strong)] text-white hover:bg-[var(--accent)]"
          >
            + Add bookmark
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-6">
        {loading ? (
          <p className="text-sm text-neutral-500">Loading…</p>
        ) : bookmarks.length === 0 ? (
          <p className="text-sm text-neutral-500">No bookmarks here yet.</p>
        ) : view === "cards" ? (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-4">
            {bookmarks.map((b) => (
              <BookmarkCard key={b.id} bookmark={b} onEdit={() => setEditing(b)} />
            ))}
          </div>
        ) : view === "moodboard" ? (
          <BookmarkMoodboard bookmarks={bookmarks} onEdit={setEditing} />
        ) : (
          <div className="flex flex-col">
            {bookmarks.map((b) => (
              <BookmarkRow key={b.id} bookmark={b} dense={view === "headlines"} onEdit={() => setEditing(b)} />
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
