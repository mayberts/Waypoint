"use client";

import { useMemo, useState } from "react";
import {
  DndContext,
  DragEndEvent,
  DragMoveEvent,
  DragStartEvent,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api-client";
import { buildTree, flattenTree, descendantIds, type TreeNode } from "@/lib/collection-tree";
import { useAppData } from "./providers";

type DropZone = "before" | "nest" | "after";

export function CollectionTree({ selectedId }: { selectedId?: string }) {
  const { collections, refreshCollections } = useAppData();
  const router = useRouter();
  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [dropZone, setDropZone] = useState<DropZone | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  const tree = useMemo(() => buildTree(collections), [collections]);
  const flat = useMemo(() => flattenTree(tree), [tree]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  function handleDragStart(event: DragStartEvent) {
    setDragId(event.active.id as string);
  }

  function handleDragMove(event: DragMoveEvent) {
    const { over, delta, activatorEvent } = event;
    if (!over) {
      setOverId(null);
      setDropZone(null);
      return;
    }
    setOverId(over.id as string);
    const pointerEvent = activatorEvent as PointerEvent;
    const pointerY = pointerEvent.clientY + delta.y;
    const relative = (pointerY - over.rect.top) / over.rect.height;
    setDropZone(relative < 0.25 ? "before" : relative > 0.75 ? "after" : "nest");
  }

  async function handleDragEnd(event: DragEndEvent) {
    const draggedId = event.active.id as string;
    const targetId = overId;
    const zone = dropZone;
    setDragId(null);
    setOverId(null);
    setDropZone(null);
    if (!targetId || targetId === draggedId) return;

    const draggedNode = flat.find((n) => n.id === draggedId);
    const targetNode = flat.find((n) => n.id === targetId);
    if (!draggedNode || !targetNode) return;

    const blocked = descendantIds(draggedNode);
    if (blocked.has(targetNode.id)) return; // can't drop into your own subtree

    const newParentId = zone === "nest" ? targetNode.id : targetNode.parentId;

    const siblings = collections
      .filter((c) => (c.parentId ?? null) === (newParentId ?? null) && c.id !== draggedId)
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((c) => c.id);

    let orderedIds: string[];
    if (zone === "nest") {
      orderedIds = [...siblings, draggedId];
    } else {
      const idx = siblings.indexOf(targetNode.id);
      const insertAt = zone === "before" ? idx : idx + 1;
      orderedIds = [...siblings.slice(0, insertAt), draggedId, ...siblings.slice(insertAt)];
    }

    await api.post("/api/collections/reorder", { parentId: newParentId ?? null, orderedIds });
    await refreshCollections();
  }

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
        <span className="text-xs font-semibold uppercase tracking-wide text-neutral-400">Collections</span>
        <button
          onClick={createRoot}
          className="text-neutral-400 hover:text-neutral-100 text-base leading-none px-1"
          title="New collection"
        >
          +
        </button>
      </div>
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragMove={handleDragMove}
        onDragEnd={handleDragEnd}
      >
        {flat.map((node) => (
          <Row
            key={node.id}
            node={node}
            selected={selectedId === node.id}
            isDragging={dragId === node.id}
            dropIndicator={overId === node.id && dragId !== node.id ? dropZone : null}
            editing={editingId === node.id}
            editValue={editValue}
            onStartEdit={() => {
              setEditingId(node.id);
              setEditValue(node.name);
            }}
            onEditChange={setEditValue}
            onCommitEdit={() => commitRename(node.id)}
            onCancelEdit={() => setEditingId(null)}
            onAddChild={() => createChild(node.id)}
            onDelete={() => removeCollection(node.id)}
          />
        ))}
      </DndContext>
    </div>
  );
}

function Row({
  node,
  selected,
  isDragging,
  dropIndicator,
  editing,
  editValue,
  onStartEdit,
  onEditChange,
  onCommitEdit,
  onCancelEdit,
  onAddChild,
  onDelete,
}: {
  node: TreeNode;
  selected: boolean;
  isDragging: boolean;
  dropIndicator: DropZone | null;
  editing: boolean;
  editValue: string;
  onStartEdit: () => void;
  onEditChange: (v: string) => void;
  onCommitEdit: () => void;
  onCancelEdit: () => void;
  onAddChild: () => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef: setDragRef } = useDraggable({ id: node.id });
  const { setNodeRef: setDropRef } = useDroppable({ id: node.id });

  return (
    <div
      ref={(el) => {
        setDragRef(el);
        setDropRef(el);
      }}
      className={`group relative flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm cursor-default ${
        selected ? "bg-neutral-800 text-white" : "text-neutral-300 hover:bg-neutral-800/60"
      } ${isDragging ? "opacity-40" : ""}`}
      style={{ paddingLeft: `${8 + node.depth * 16}px` }}
    >
      {dropIndicator === "before" && (
        <div className="absolute left-2 right-2 -top-px h-0.5 bg-blue-500 rounded" />
      )}
      {dropIndicator === "after" && (
        <div className="absolute left-2 right-2 -bottom-px h-0.5 bg-blue-500 rounded" />
      )}
      {dropIndicator === "nest" && <div className="absolute inset-0.5 rounded-md ring-2 ring-blue-500" />}

      <span
        {...listeners}
        {...attributes}
        className="cursor-grab active:cursor-grabbing text-neutral-500 hover:text-neutral-300 shrink-0"
        title="Drag to move"
      >
        ⠿
      </span>

      <span className="shrink-0">{node.icon || "📁"}</span>

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
          className="flex-1 min-w-0 bg-neutral-900 border border-neutral-700 rounded px-1 text-sm"
        />
      ) : (
        <Link href={`/collection/${node.id}`} className="flex-1 min-w-0 truncate" onDoubleClick={onStartEdit}>
          {node.name}
        </Link>
      )}

      {node._count && (
        <span className="text-xs text-neutral-500 tabular-nums shrink-0">{node._count.bookmarks}</span>
      )}

      <div className="hidden group-hover:flex items-center gap-1 shrink-0">
        <button onClick={onAddChild} title="Add subfolder" className="text-neutral-500 hover:text-neutral-200 px-0.5">
          +
        </button>
        <button onClick={onDelete} title="Delete" className="text-neutral-500 hover:text-red-400 px-0.5">
          ×
        </button>
      </div>
    </div>
  );
}
