"use client";

import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import type { BookmarkDTO } from "@/lib/types";
import { faviconFallbackColor } from "@/lib/favicon-color";
import { bookmarkDndId } from "@/lib/dnd-ids";
import { Favicon } from "./Favicon";

export function BookmarkMoodboard({
  bookmarks,
  onEdit,
  selected,
  onToggleSelect,
  focusedId = null,
}: {
  bookmarks: BookmarkDTO[];
  onEdit: (bookmark: BookmarkDTO) => void;
  selected: Set<string>;
  onToggleSelect: (id: string) => void;
  focusedId?: string | null;
}) {
  return (
    <div className="columns-2 sm:columns-3 lg:columns-4 gap-4">
      {bookmarks.map((b) => (
        <MoodboardItem
          key={b.id}
          bookmark={b}
          selected={selected.has(b.id)}
          focused={b.id === focusedId}
          onEdit={() => onEdit(b)}
          onToggleSelect={() => onToggleSelect(b.id)}
        />
      ))}
    </div>
  );
}

function MoodboardItem({
  bookmark: b,
  selected: isSelected,
  focused,
  onEdit,
  onToggleSelect,
}: {
  bookmark: BookmarkDTO;
  selected: boolean;
  focused: boolean;
  onEdit: () => void;
  onToggleSelect: () => void;
}) {
  const { listeners, setNodeRef, isDragging, transform } = useDraggable({ id: bookmarkDndId(b.id) });

  const checkbox = (
    <input
      type="checkbox"
      checked={isSelected}
      onChange={onToggleSelect}
      onClick={(e) => e.stopPropagation()}
      className={`absolute top-2 left-2 z-10 h-4 w-4 rounded cursor-pointer accent-[var(--accent)] ${
        isSelected ? "" : "opacity-100 md:opacity-0 md:group-hover:opacity-100"
      }`}
    />
  );

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      data-bookmark-id={b.id}
      className={`mb-4 break-inside-avoid ${isDragging ? "opacity-40" : ""}`}
      style={{ transform: CSS.Translate.toString(transform), zIndex: isDragging ? 50 : undefined, position: isDragging ? "relative" : undefined }}
    >
      {b.coverImagePath ? (
        <div
          className={`group relative rounded-lg overflow-hidden border transition-[border-color,box-shadow,transform] duration-150 hover:-translate-y-0.5 hover:shadow-lg ${
            isSelected ? "border-[var(--accent)]" : "border-[var(--border)] hover:border-[var(--border-strong)]"
          } ${focused ? "ring-2 ring-[var(--accent)]" : ""}`}
        >
          {checkbox}
          <a href={b.url} target="_blank" rel="noopener noreferrer">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={b.coverImagePath} alt="" className="w-full h-auto block" />
          </a>
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent p-3 pt-8">
            <div className="flex items-center gap-1.5 flex-wrap">
              <Favicon faviconPath={b.faviconPath} domain={b.domain} size={14} />
              <a
                href={b.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-white leading-snug line-clamp-2 hover:underline"
              >
                {b.title}
              </a>
              {b.isBroken && (
                <span
                  title="This link appears to be broken"
                  className="text-[11px] px-1.5 py-0.5 rounded-full bg-red-500/25 text-red-300 shrink-0"
                >
                  Broken
                </span>
              )}
            </div>
          </div>
          <button
            onClick={onEdit}
            className="absolute top-2 right-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity bg-[var(--surface-0-a80)] hover:bg-[var(--surface-2)] text-[var(--text-secondary)] text-xs px-2 py-1 rounded-md border border-[var(--border-strong)]"
          >
            Edit
          </button>
        </div>
      ) : (
        <div
          className={`group relative flex flex-col gap-1.5 rounded-lg border p-3 bg-[var(--surface-1)] transition-[border-color,box-shadow,transform] duration-150 hover:-translate-y-0.5 hover:shadow-lg ${
            isSelected ? "border-[var(--accent)]" : "border-[var(--border)] hover:border-[var(--border-strong)]"
          } ${focused ? "ring-2 ring-[var(--accent)]" : ""}`}
        >
          {checkbox}
          <div
            className="h-16 w-full rounded flex items-center justify-center text-[var(--text-faint)] text-xs"
            style={{ background: `linear-gradient(135deg, ${faviconFallbackColor(b.domain)}33, transparent)` }}
          >
            {b.domain}
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <Favicon faviconPath={b.faviconPath} domain={b.domain} size={14} />
            <a
              href={b.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-[var(--text-primary)] leading-snug line-clamp-2 hover:underline"
            >
              {b.title}
            </a>
            {b.isBroken && (
              <span
                title="This link appears to be broken"
                className="text-[11px] px-1.5 py-0.5 rounded-full bg-red-500/15 text-red-400 shrink-0"
              >
                Broken
              </span>
            )}
          </div>
          <button
            onClick={onEdit}
            className="absolute top-2 right-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity bg-[var(--surface-0-a80)] hover:bg-[var(--surface-2)] text-[var(--text-secondary)] text-xs px-2 py-1 rounded-md border border-[var(--border-strong)]"
          >
            Edit
          </button>
        </div>
      )}
    </div>
  );
}
