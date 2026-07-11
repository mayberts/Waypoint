"use client";

import type { BookmarkDTO } from "@/lib/types";
import { Favicon } from "./Favicon";

export function BookmarkRow({
  bookmark,
  dense,
  onEdit,
}: {
  bookmark: BookmarkDTO;
  dense: boolean;
  onEdit: () => void;
}) {
  return (
    <div
      className="group flex items-center gap-3 border-b border-[var(--border-a70)] hover:bg-[var(--surface-1-a60)]"
      style={{ paddingTop: dense ? "0.5rem" : "var(--list-row-py)", paddingBottom: dense ? "0.5rem" : "var(--list-row-py)" }}
    >
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
        <span className="shrink-0 text-xs text-[var(--text-faint)] truncate max-w-[200px]">{bookmark.domain}</span>
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
        className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-[var(--text-muted)] hover:text-[var(--text-primary)] text-xs px-2 py-1 rounded-md border border-[var(--border-strong)]"
      >
        Edit
      </button>
    </div>
  );
}
