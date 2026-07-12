"use client";

import { useEffect, useMemo, useState } from "react";
import { useDndContext, useDraggable, useDroppable } from "@dnd-kit/core";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api-client";
import { buildTree, isIconImagePath, type TreeNode } from "@/lib/collection-tree";
import { collectionDndId, parseBookmarkDndId, parseCollectionDndId } from "@/lib/dnd-ids";
import { useAppData } from "./providers";
import { IconPicker } from "./IconPicker";

type DropZone = "before" | "nest" | "after";

const COLLAPSED_STORAGE_KEY = "waypoint-collapsed-collections";

export function CollectionTree({ selectedId }: { selectedId?: string }) {
  const { collections, refreshCollections } = useAppData();
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    try {
      const raw = localStorage.getItem(COLLAPSED_STORAGE_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- load-on-mount from localStorage
      if (raw) setCollapsedIds(new Set(JSON.parse(raw)));
    } catch {
      // ignore malformed storage
    }
  }, []);

  function toggleCollapse(id: string) {
    setCollapsedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      localStorage.setItem(COLLAPSED_STORAGE_KEY, JSON.stringify([...next]));
      return next;
    });
  }

  const tree = useMemo(() => buildTree(collections), [collections]);
  const visibleFlat = useMemo(() => {
    const out: TreeNode[] = [];
    const walk = (list: TreeNode[]) => {
      for (const n of list) {
        out.push(n);
        if (!collapsedIds.has(n.id)) walk(n.children);
      }
    };
    walk(tree);
    return out;
  }, [tree, collapsedIds]);

  async function createRoot() {
    const name = window.prompt("New collection name")?.trim();
    if (!name) return;
    await api.post("/api/collections", { name, parentId: null });
    await refreshCollections();
  }

  async function createChild(parentId: string) {
    const name = window.prompt("New subfolder name")?.trim();
    if (!name) return;
    await api.post("/api/collections", { name, parentId });
    await refreshCollections();
  }

  async function commitRename(id: string) {
    const name = editValue.trim();
    setEditingId(null);
    if (!name) return;
    await api.patch(`/api/collections/${id}`, { name });
    await refreshCollections();
  }

  async function removeCollection(id: string) {
    if (!window.confirm("Delete this collection and all its subfolders? Bookmarks inside move to Unsorted.")) return;
    await api.delete(`/api/collections/${id}`);
    await refreshCollections();
    if (selectedId === id) router.push("/");
  }

  return (
    <div className="flex flex-col gap-0.5">
      <div className="flex items-center justify-between px-2 pt-3 pb-1">
        <span className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Collections</span>
        <button
          onClick={createRoot}
          className="text-[var(--text-muted)] hover:text-[var(--text-primary)] text-base leading-none px-1"
          title="New collection"
        >
          +
        </button>
      </div>
      {visibleFlat.map((node) => (
        <Row
          key={node.id}
          node={node}
          selected={selectedId === node.id}
          editing={editingId === node.id}
          editValue={editValue}
          collapsed={collapsedIds.has(node.id)}
          onToggleCollapse={() => toggleCollapse(node.id)}
          onStartEdit={() => {
            setEditingId(node.id);
            setEditValue(node.name);
          }}
          onEditChange={setEditValue}
          onCommitEdit={() => commitRename(node.id)}
          onCancelEdit={() => setEditingId(null)}
          onAddChild={() => createChild(node.id)}
          onDelete={() => removeCollection(node.id)}
          onIconChanged={refreshCollections}
        />
      ))}
    </div>
  );
}

function Row({
  node,
  selected,
  editing,
  editValue,
  collapsed,
  onToggleCollapse,
  onStartEdit,
  onEditChange,
  onCommitEdit,
  onCancelEdit,
  onAddChild,
  onDelete,
  onIconChanged,
}: {
  node: TreeNode;
  selected: boolean;
  editing: boolean;
  editValue: string;
  collapsed: boolean;
  onToggleCollapse: () => void;
  onStartEdit: () => void;
  onEditChange: (v: string) => void;
  onCommitEdit: () => void;
  onCancelEdit: () => void;
  onAddChild: () => void;
  onDelete: () => void;
  onIconChanged: () => void;
}) {
  const dndId = collectionDndId(node.id);
  const { attributes, listeners, setNodeRef: setDragRef, isDragging } = useDraggable({ id: dndId });
  const { setNodeRef: setDropRef } = useDroppable({ id: dndId });
  const { active, over, activeNodeRect } = useDndContext();
  const [iconAnchor, setIconAnchor] = useState<{ top: number; left: number; bottom: number } | null>(null);

  const overThisRow = over?.id === dndId;
  const draggedCollectionId = parseCollectionDndId(active?.id);
  const draggedBookmarkId = parseBookmarkDndId(active?.id);

  let dropZone: DropZone | null = null;
  if (overThisRow && draggedCollectionId && draggedCollectionId !== node.id && activeNodeRect && over) {
    const pointerCenterY = activeNodeRect.top + activeNodeRect.height / 2;
    const relative = (pointerCenterY - over.rect.top) / over.rect.height;
    dropZone = relative < 0.25 ? "before" : relative > 0.75 ? "after" : "nest";
  }
  const bookmarkDropHighlight = overThisRow && !!draggedBookmarkId;

  return (
    <div
      ref={(el) => {
        setDragRef(el);
        setDropRef(el);
      }}
      className={`group relative flex items-center gap-2.5 rounded-md px-2 text-sm cursor-default ${
        selected ? "bg-[var(--surface-2)] text-[var(--text-primary)]" : "text-[var(--text-body)] hover:bg-[var(--surface-2-a60)]"
      } ${isDragging ? "opacity-40" : ""}`}
      style={{
        paddingLeft: `${8 + node.depth * 16}px`,
        paddingTop: "var(--sidebar-row-py)",
        paddingBottom: "var(--sidebar-row-py)",
      }}
    >
      {dropZone === "before" && (
        <div className="absolute left-2 right-2 -top-px h-0.5 bg-[var(--accent)] rounded" />
      )}
      {dropZone === "after" && (
        <div className="absolute left-2 right-2 -bottom-px h-0.5 bg-[var(--accent)] rounded" />
      )}
      {(dropZone === "nest" || bookmarkDropHighlight) && (
        <div className="absolute inset-0.5 rounded-md ring-2 ring-[var(--accent)]" />
      )}

      <span
        {...listeners}
        {...attributes}
        className="cursor-grab active:cursor-grabbing text-[var(--text-faint)] hover:text-[var(--text-body)] shrink-0"
        title="Drag to move"
      >
        ⠿
      </span>

      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onToggleCollapse();
        }}
        className={`flex items-center justify-center h-4 w-4 shrink-0 text-[var(--text-faint)] hover:text-[var(--text-secondary)] ${
          node.children.length === 0 ? "invisible" : ""
        }`}
        tabIndex={node.children.length === 0 ? -1 : 0}
        title={collapsed ? "Expand" : "Collapse"}
      >
        <span className={`inline-block text-[10px] transition-transform ${collapsed ? "" : "rotate-90"}`}>▶</span>
      </button>

      <span className="relative shrink-0">
        <button
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            setIconAnchor((current) => (current ? null : { top: rect.top, left: rect.left, bottom: rect.bottom }));
          }}
          style={{ height: "var(--sidebar-row-icon)", width: "var(--sidebar-row-icon)" }}
          className="flex items-center justify-center text-lg leading-none rounded hover:ring-1 hover:ring-[var(--border-stronger)]"
          title="Change icon"
        >
          {isIconImagePath(node.icon) ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={node.icon}
              alt=""
              style={{ height: "var(--sidebar-row-icon)", width: "var(--sidebar-row-icon)" }}
              className="rounded object-cover"
            />
          ) : (
            node.icon || "📁"
          )}
        </button>
        {iconAnchor && (
          <IconPicker
            collectionId={node.id}
            anchorRect={iconAnchor}
            onChanged={onIconChanged}
            onClose={() => setIconAnchor(null)}
          />
        )}
      </span>

      {editing ? (
        <input
          autoFocus
          value={editValue}
          onChange={(e) => onEditChange(e.target.value)}
          onBlur={onCommitEdit}
          onKeyDown={(e) => {
            if (e.key === "Enter") onCommitEdit();
            if (e.key === "Escape") onCancelEdit();
          }}
          className="flex-1 min-w-0 bg-[var(--surface-1)] border border-[var(--border-strong)] rounded px-1 text-sm"
        />
      ) : (
        <Link href={`/collection/${node.id}`} className="flex-1 min-w-0 truncate" onDoubleClick={onStartEdit}>
          {node.name}
        </Link>
      )}

      {node._count && (
        <span className="text-xs text-[var(--text-faint)] tabular-nums shrink-0">{node._count.bookmarks}</span>
      )}

      <div className="flex items-center gap-1 shrink-0 md:hidden md:group-hover:flex">
        <button onClick={onAddChild} title="Add subfolder" className="text-[var(--text-faint)] hover:text-[var(--text-secondary)] px-0.5">
          +
        </button>
        <button onClick={onDelete} title="Delete" className="text-[var(--text-faint)] hover:text-red-400 px-0.5">
          ×
        </button>
      </div>
    </div>
  );
}
