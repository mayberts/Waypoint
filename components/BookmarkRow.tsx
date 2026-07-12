"use client";

import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import type { BookmarkDTO } from "@/lib/types";
import { bookmarkDndId } from "@/lib/dnd-ids";
import { Favicon } from "./Favicon";

export function BookmarkRow({
  bookmark,
  dense,
  onEdit,
  selected,
  onToggleSelect,
}: {
  bookmark: BookmarkDTO;
  dense: boolean;
  onEdit: () => void;
  selected: boolean;
  onToggleSelect: () => void;
}) {
  const { listeners, setNodeRef, isDragging, transform } = useDraggable({ id: bookmarkDndId(bookmark.id) });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      className={`group flex items-center gap-3 border-b border-[var(--border-a70)] transition-colors duration-150 hover:bg-[var(--surface-1-a60)] ${
        selected ? "bg-[var(--surface-1-a60)]" : ""
      } ${isDragging ? "relative opacity-70 bg-[var(--surface-1)] shadow-lg" : ""}`}
      style={{
        paddingTop: dense ? "0.5rem" : "var(--list-row-py)",
        paddingBottom: dense ? "0.5rem" : "var(--list-row-py)",
        transform: CSS.Translate.toString(transform),
        zIndex: isDragging ? 50 : undefined,
      }}
    >
      <input
        type="checkbox"
        checked={selected}
        onChange={onToggleSelect}
        className={`shrink-0 h-4 w-4 rounded cursor-pointer accent-[var(--accent)] ${
          selected ? "" : "opacity-100 md:opacity-0 md:group-hover:opacity-100"
        }`}
      />
      <Favicon
        faviconPath={bookmark.faviconPath}
        domain={bookmark.domain}
        size={dense ? 18 : "var(--list-row-icon)"}
      />

      <a
        href={bookmark.url}
        target="_blank"
        rel="noopener noreferrer"
        className={`min-w-0 truncate text-[var(--text-primary)] hover:underline ${dense ? "text-sm" : "text-sm font-medium"}`}
      >
        {bookmark.title}
      </a>

      {bookmark.domain && (
        <span className="hidden shrink-0 text-xs text-[var(--text-faint)] truncate max-w-[200px] sm:block">
          {bookmark.domain}
        </span>
      )}

      {bookmark.isBroken && (
        <span
          title="This link appears to be broken"
          className="shrink-0 text-[11px] px-1.5 py-0.5 rounded-full bg-red-500/15 text-red-400"
        >
          Broken
        </span>
      )}

      {!dense && bookmark.tags.length > 0 && (
        <div className="hidden sm:flex flex-wrap gap-1 shrink-0">
          {bookmark.tags.map((t) => (
            <span key={t.id} className="text-[11px] px-1.5 py-0.5 rounded-full bg-[var(--surface-2)] text-[var(--text-muted)]">
              {t.name}
            </span>
          ))}
        </div>
      )}

      <div className="flex-1" />

      <button
        onClick={onEdit}
        className="shrink-0 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity text-[var(--text-muted)] hover:text-[var(--text-primary)] text-xs px-2 py-1 rounded-md border border-[var(--border-strong)]"
      >
        Edit
      </button>
    </div>
  );
}
