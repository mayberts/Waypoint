"use client";

import { useEffect, useRef, useState } from "react";
import { useDndMonitor } from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { useBookmarks, type BookmarkQuery } from "@/lib/use-bookmarks";
import type { BookmarkDTO } from "@/lib/types";
import { api } from "@/lib/api-client";
import { isViewMode, loadLocalView, saveLocalView, applyViewToAllLocalKeys, type ViewMode } from "@/lib/view-prefs";
import { isSortMode, loadLocalSort, saveLocalSort, type SortMode } from "@/lib/sort-prefs";
import { parseBookmarkDndId } from "@/lib/dnd-ids";
import { gridPatternStyle } from "@/lib/grid-patterns";
import { BookmarkCard } from "./BookmarkCard";
import { BookmarkRow } from "./BookmarkRow";
import { BookmarkMoodboard } from "./BookmarkMoodboard";
import { BookmarkGridSkeleton } from "./BookmarkGridSkeleton";
import { BookmarkEditDrawer } from "./BookmarkEditDrawer";
import { ViewSwitcher } from "./ViewSwitcher";
import { SortMenu } from "./SortMenu";
import { BulkActionBar } from "./BulkActionBar";
import { KeyboardShortcutsHelp } from "./KeyboardShortcutsHelp";
import { ShareCollectionButton } from "./ShareCollectionButton";
import { CollectionHero } from "./CollectionHero";
import { useAppData } from "./providers";

const COLLECTION_VIEW_PREFIX = "collection:";

export function BookmarkGrid({
  title,
  query,
  viewKey,
  defaultCollectionId = null,
  extraActions,
}: {
  title: string;
  query: BookmarkQuery;
  /** Identifies where the view preference is stored: "all" | "unsorted" | "search" | "collection:<id>". */
  viewKey: string;
  defaultCollectionId?: string | null;
  /** Extra buttons rendered in the header, before the view switcher (e.g. "Save this search"). */
  extraActions?: React.ReactNode;
}) {
  const { collections, refreshCollections, appearance, bookmarksVersion, openQuickAdd, quickAddOpen } = useAppData();
  const collectionId = viewKey.startsWith(COLLECTION_VIEW_PREFIX) ? viewKey.slice(COLLECTION_VIEW_PREFIX.length) : null;
  const collectionRecord = collectionId ? collections.find((c) => c.id === collectionId) : null;
  const isSearchQuery = !!query.q;
  // A collection with subfolders shows bookmarks from all of them together
  // (see the ?collectionId= handling in /api/bookmarks), so — same as "All
  // bookmarks" or search — there's no longer one well-defined group for
  // "manual" order to mean anything within.
  const hasChildren = collectionId ? collections.some((c) => c.parentId === collectionId) : false;
  // Manual ordering only means something within one well-defined group of
  // bookmarks — a single childless collection, or Unsorted. "All bookmarks",
  // search results, and the smart collections span multiple groups (or
  // aren't a real stored set at all), so there's no single coherent manual order.
  const allowManualSort = !isSearchQuery && !hasChildren && (!!collectionId || !!query.unsorted);

  const [localSort, setLocalSort] = useState<SortMode>("newest");
  const [optimisticSort, setOptimisticSort] = useState<SortMode | null>(null);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reading a client-only localStorage preference after mount
    setLocalSort(loadLocalSort(viewKey, allowManualSort ? "manual" : "newest"));
    setOptimisticSort(null);
  }, [viewKey, allowManualSort]);
  const rawSort: SortMode =
    optimisticSort ?? (collectionId ? (isSortMode(collectionRecord?.sort) ? (collectionRecord!.sort as SortMode) : "manual") : localSort);
  const sort: SortMode = hasChildren && rawSort === "manual" ? "newest" : rawSort;

  const { bookmarks, setBookmarks, loading, refresh } = useBookmarks(
    isSearchQuery ? query : { ...query, sort }
  );
  useEffect(() => {
    if (bookmarksVersion > 0) refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-run on the shared change signal, not on every `refresh` identity change
  }, [bookmarksVersion]);
  const [editing, setEditing] = useState<BookmarkDTO | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
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

  const view: ViewMode =
    optimisticView ?? (collectionId ? (isViewMode(collectionRecord?.view) ? collectionRecord!.view : "cards") : localView);

  async function handleSortChange(newSort: SortMode) {
    setOptimisticSort(newSort);
    if (collectionId) {
      await api.patch(`/api/collections/${collectionId}`, { sort: newSort });
      await refreshCollections();
    } else {
      saveLocalSort(viewKey, newSort);
      setLocalSort(newSort);
    }
  }

  // Bookmark-onto-bookmark drops (AppShell's own onDragEnd ignores these —
  // it only acts on bookmark-onto-collection and collection-onto-collection)
  // reorder within the current manual-sort list.
  useDndMonitor({
    async onDragEnd(event) {
      if (!allowManualSort || sort !== "manual") return;
      const draggedId = parseBookmarkDndId(event.active.id);
      const overId = parseBookmarkDndId(event.over?.id);
      if (!draggedId || !overId || draggedId === overId) return;
      const oldIndex = bookmarks.findIndex((b) => b.id === draggedId);
      const newIndex = bookmarks.findIndex((b) => b.id === overId);
      if (oldIndex === -1 || newIndex === -1) return;
      const reordered = arrayMove(bookmarks, oldIndex, newIndex);
      setBookmarks(reordered);
      await api.post("/api/bookmarks/reorder", { collectionId: collectionId ?? null, orderedIds: reordered.map((b) => b.id) });
    },
  });

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

  function handleUpdated() {
    refresh();
    refreshCollections();
  }

  function handleDeleted() {
    refresh();
    refreshCollections();
  }

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function clearSelection() {
    setSelected(new Set());
  }

  function handleBulkDone() {
    clearSelection();
    refresh();
    refreshCollections();
  }

  async function trashFocused(bookmark: BookmarkDTO) {
    if (!window.confirm("Move this bookmark to trash?")) return;
    await api.delete(`/api/bookmarks/${bookmark.id}`);
    setFocusedId(null);
    refresh();
    refreshCollections();
  }

  function focusIndex(index: number) {
    const target = bookmarks[index];
    if (!target) return;
    setFocusedId(target.id);
    requestAnimationFrame(() => {
      scrollRef.current?.querySelector(`[data-bookmark-id="${target.id}"]`)?.scrollIntoView({ block: "nearest" });
    });
  }

  // j/k (or arrow keys) move a keyboard focus ring through the list; Enter
  // opens it, e edits, x/Space toggles selection, Delete trashes it. Ignored
  // whenever a modal is open or the event originated in an editable field
  // (a text input, including the command palette's own search box), so this
  // never fights with typing elsewhere on the page.
  useEffect(() => {
    function isEditableTarget(el: EventTarget | null): boolean {
      if (!(el instanceof HTMLElement)) return false;
      return el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.tagName === "SELECT" || el.isContentEditable;
    }

    function onKeyDown(e: KeyboardEvent) {
      if (editing || quickAddOpen) return;
      if (isEditableTarget(e.target)) return;

      if (showShortcuts) {
        if (e.key === "Escape" || e.key === "?") {
          e.preventDefault();
          setShowShortcuts(false);
        }
        return;
      }
      if (e.key === "?") {
        e.preventDefault();
        setShowShortcuts(true);
        return;
      }
      if (bookmarks.length === 0) return;

      const currentIndex = focusedId ? bookmarks.findIndex((b) => b.id === focusedId) : -1;

      if (e.key === "j" || e.key === "ArrowDown") {
        e.preventDefault();
        focusIndex(currentIndex === -1 ? 0 : Math.min(currentIndex + 1, bookmarks.length - 1));
      } else if (e.key === "k" || e.key === "ArrowUp") {
        e.preventDefault();
        focusIndex(currentIndex === -1 ? 0 : Math.max(currentIndex - 1, 0));
      } else if (currentIndex === -1) {
        return;
      } else if (e.key === "Enter" || e.key === "o") {
        e.preventDefault();
        window.open(bookmarks[currentIndex].url, "_blank", "noopener,noreferrer");
      } else if (e.key === "e") {
        e.preventDefault();
        setEditing(bookmarks[currentIndex]);
      } else if (e.key === "x" || e.key === " ") {
        e.preventDefault();
        toggleSelect(bookmarks[currentIndex].id);
      } else if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        trashFocused(bookmarks[currentIndex]);
      } else if (e.key === "Escape") {
        if (selected.size > 0) clearSelection();
        else setFocusedId(null);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- re-subscribes each render so the closure always sees current bookmarks/focus/selection; cheap for a single window listener
  }, [bookmarks, focusedId, quickAddOpen, editing, selected, showShortcuts]);

  return (
    <div className="flex-1 flex flex-col min-w-0" style={gridPatternStyle(appearance.gridPattern)}>
      {collectionRecord && (
        <CollectionHero
          name={collectionRecord.name}
          icon={collectionRecord.icon}
          color={collectionRecord.color}
          // The actual fetched count (which includes subfolders), not the
          // sidebar's direct-only count — falls back to that while loading
          // so this doesn't flash "0 bookmarks" before the fetch resolves.
          count={loading ? (collectionRecord._count?.bookmarks ?? 0) : bookmarks.length}
        />
      )}
      <div className="flex items-center justify-between gap-3 flex-wrap px-4 pt-4 pb-3 sm:px-6 sm:pt-6 sm:pb-4">
        {collectionRecord ? <div className="min-w-0" /> : (
          <h1 className="text-lg font-semibold text-[var(--text-primary)] min-w-0 truncate">{title}</h1>
        )}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowShortcuts(true)}
            title="Keyboard shortcuts (?)"
            className="flex items-center justify-center h-8 w-8 rounded-md border border-[var(--border)] text-[var(--text-faint)] hover:text-[var(--text-secondary)] hover:bg-[var(--surface-2)] shrink-0"
          >
            ⌨
          </button>
          {collectionId && <ShareCollectionButton collectionId={collectionId} />}
          {extraActions}
          {!isSearchQuery && <SortMenu value={sort} onChange={handleSortChange} allowManual={allowManualSort} />}
          <ViewSwitcher value={view} onChange={handleViewChange} onApplyToAll={handleApplyToAll} />
          <button
            onClick={() => openQuickAdd(defaultCollectionId)}
            className="px-3 py-1.5 text-sm rounded-md bg-[var(--accent-strong)] text-white hover:bg-[var(--accent)] whitespace-nowrap"
          >
            + Add bookmark
          </button>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 pb-4 flex flex-col sm:px-6 sm:pb-6">
        <div className="flex-1">
          {loading ? (
            <BookmarkGridSkeleton view={view} />
          ) : bookmarks.length === 0 ? (
            <p className="text-sm text-[var(--text-faint)]">No bookmarks here yet.</p>
          ) : (
            <div key={view} className="animate-fade-in">
              {view === "cards" ? (
                <div
                  className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))]"
                  style={{ gap: "var(--card-gap)" }}
                >
                  {bookmarks.map((b) => (
                    <BookmarkCard
                      key={b.id}
                      bookmark={b}
                      onEdit={() => setEditing(b)}
                      selected={selected.has(b.id)}
                      onToggleSelect={() => toggleSelect(b.id)}
                      focused={b.id === focusedId}
                    />
                  ))}
                </div>
              ) : view === "moodboard" ? (
                <BookmarkMoodboard
                  bookmarks={bookmarks}
                  onEdit={setEditing}
                  selected={selected}
                  onToggleSelect={toggleSelect}
                  focusedId={focusedId}
                />
              ) : (
                <div className="flex flex-col">
                  {bookmarks.map((b) => (
                    <BookmarkRow
                      key={b.id}
                      bookmark={b}
                      dense={view === "headlines"}
                      onEdit={() => setEditing(b)}
                      selected={selected.has(b.id)}
                      onToggleSelect={() => toggleSelect(b.id)}
                      focused={b.id === focusedId}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {selected.size > 0 && (
          <BulkActionBar
            count={selected.size}
            selectedIds={Array.from(selected)}
            onClear={clearSelection}
            onDone={handleBulkDone}
          />
        )}
      </div>

      {editing && (
        <BookmarkEditDrawer
          bookmark={editing}
          onClose={() => setEditing(null)}
          onUpdated={handleUpdated}
          onDeleted={handleDeleted}
        />
      )}

      {showShortcuts && <KeyboardShortcutsHelp onClose={() => setShowShortcuts(false)} />}
    </div>
  );
}
