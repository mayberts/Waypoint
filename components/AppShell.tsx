"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { DndContext, DragEndEvent, PointerSensor, pointerWithin, useSensor, useSensors } from "@dnd-kit/core";
import { Sidebar } from "./Sidebar";
import { Logo } from "./Logo";
import { CommandPalette } from "./CommandPalette";
import { AddBookmarkModal } from "./AddBookmarkModal";
import { useAppData } from "./providers";
import { api } from "@/lib/api-client";
import { buildTree, flattenTree, descendantIds } from "@/lib/collection-tree";
import { UNSORTED_DROP_ID, parseBookmarkDndId, parseCollectionDndId } from "@/lib/dnd-ids";

function isEditableTarget(el: EventTarget | null): boolean {
  if (!(el instanceof HTMLElement)) return false;
  return el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.tagName === "SELECT" || el.isContentEditable;
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const {
    collections,
    refreshCollections,
    notifyBookmarksChanged,
    quickAddOpen,
    quickAddCollectionId,
    openQuickAdd,
    closeQuickAdd,
  } = useAppData();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- close the mobile drawer whenever the route changes
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      // Ctrl+K everywhere — including Mac's Cmd+K under the hood, but the UI
      // never shows the ⌘ symbol, only "Ctrl+K" text, per the user's request.
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((v) => !v);
        return;
      }
      // Bare "n" opens quick-add from anywhere in the app — guarded against
      // typing in any text field (unlike Ctrl+K, a bare letter key collides
      // with normal typing constantly) and against reopening on top of itself.
      if (e.key === "n" && !e.ctrlKey && !e.metaKey && !e.altKey && !isEditableTarget(e.target)) {
        if (paletteOpen || quickAddOpen) return;
        e.preventDefault();
        // Defaults to the collection currently being viewed (so pressing "n"
        // while browsing a collection saves into it, not Unsorted) — the same
        // rule the "+ Add bookmark" button on that page already follows.
        openQuickAdd(pathname?.startsWith("/collection/") ? pathname.split("/")[2] : null);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [paletteOpen, quickAddOpen, pathname, openQuickAdd]);

  function handleQuickAdded() {
    void refreshCollections();
    notifyBookmarksChanged();
  }

  // The sidebar's collection tree (drag-to-reorder/nest) and the bookmark
  // grid (drag-onto-a-collection) both need to see each other's drag
  // sources/targets, so there's exactly one DndContext for the whole shell —
  // this handler branches on which kind of item (by its dnd-ids.ts prefix)
  // was dragged.
  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;

    const draggedBookmarkId = parseBookmarkDndId(active.id);
    if (draggedBookmarkId) {
      let targetCollectionId: string | null;
      if (over.id === UNSORTED_DROP_ID) {
        targetCollectionId = null;
      } else {
        const parsed = parseCollectionDndId(over.id);
        if (!parsed) return; // dropped somewhere that isn't a valid target
        targetCollectionId = parsed;
      }
      await api.patch(`/api/bookmarks/${draggedBookmarkId}`, { collectionId: targetCollectionId });
      await refreshCollections();
      notifyBookmarksChanged();
      return;
    }

    const draggedCollectionId = parseCollectionDndId(active.id);
    if (!draggedCollectionId) return;
    const targetCollectionId = parseCollectionDndId(over.id);
    if (!targetCollectionId || targetCollectionId === draggedCollectionId) return;

    const flat = flattenTree(buildTree(collections));
    const draggedNode = flat.find((n) => n.id === draggedCollectionId);
    const targetNode = flat.find((n) => n.id === targetCollectionId);
    if (!draggedNode || !targetNode) return;
    if (descendantIds(draggedNode).has(targetNode.id)) return; // can't drop into your own subtree

    const activeRect = active.rect.current.translated;
    let zone: "before" | "nest" | "after" = "nest";
    if (activeRect) {
      const pointerCenterY = activeRect.top + activeRect.height / 2;
      const relative = (pointerCenterY - over.rect.top) / over.rect.height;
      zone = relative < 0.25 ? "before" : relative > 0.75 ? "after" : "nest";
    }

    const newParentId = zone === "nest" ? targetNode.id : targetNode.parentId;
    const siblings = collections
      .filter((c) => (c.parentId ?? null) === (newParentId ?? null) && c.id !== draggedCollectionId)
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((c) => c.id);

    let orderedIds: string[];
    if (zone === "nest") {
      orderedIds = [...siblings, draggedCollectionId];
    } else {
      const idx = siblings.indexOf(targetNode.id);
      const insertAt = zone === "before" ? idx : idx + 1;
      orderedIds = [...siblings.slice(0, insertAt), draggedCollectionId, ...siblings.slice(insertAt)];
    }

    await api.post("/api/collections/reorder", { parentId: newParentId ?? null, orderedIds });
    await refreshCollections();
  }

  return (
    // pointerWithin (not the default rectIntersection) — bookmark cards are
    // much taller than a sidebar row, so comparing full dragged-rect overlap
    // would let the card's bulk "claim" a neighboring row even when the
    // cursor itself is over the intended one.
    <DndContext sensors={sensors} collisionDetection={pointerWithin} onDragEnd={handleDragEnd}>
      <div className="flex h-screen">
        {open && <div className="fixed inset-0 z-30 bg-black/50 md:hidden" onClick={() => setOpen(false)} />}

        <div
          className={`fixed inset-y-0 left-0 z-40 w-64 transition-transform duration-200 md:static md:z-auto md:translate-x-0 ${
            open ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <Sidebar onOpenPalette={() => setPaletteOpen(true)} />
        </div>

        <div className="flex-1 min-w-0 h-screen overflow-hidden flex flex-col">
          <div className="flex items-center gap-2 border-b border-[var(--border)] px-3 py-2.5 shrink-0 md:hidden">
            <button
              onClick={() => setOpen(true)}
              aria-label="Open menu"
              className="flex items-center justify-center h-8 w-8 rounded-md text-[var(--text-body)] hover:bg-[var(--surface-2)] -ml-1"
            >
              <span className="text-lg leading-none">☰</span>
            </button>
            <Logo size={18} />
            <span className="text-sm font-semibold text-[var(--text-primary)]">Waypoint</span>
          </div>

          <main className="flex-1 min-w-0 overflow-hidden flex">{children}</main>
        </div>

        <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />

        {quickAddOpen && (
          <AddBookmarkModal
            defaultCollectionId={quickAddCollectionId}
            onClose={closeQuickAdd}
            onCreated={handleQuickAdded}
          />
        )}
      </div>
    </DndContext>
  );
}
