"use client";

import type { BookmarkDTO } from "@/lib/types";
import { faviconFallbackColor } from "@/lib/favicon-color";
import { Favicon } from "./Favicon";

export function BookmarkCard({
  bookmark,
  onEdit,
  selected,
  onToggleSelect,
}: {
  bookmark: BookmarkDTO;
  onEdit: () => void;
  selected: boolean;
  onToggleSelect: () => void;
}) {
  return (
    <div
      className={`group relative flex flex-col rounded-lg border bg-[var(--surface-1)] overflow-hidden transition-[color,background-color,border-color,box-shadow,transform] duration-150 hover:-translate-y-0.5 hover:shadow-lg ${
        selected ? "border-[var(--accent)]" : "border-[var(--border)] hover:border-[var(--border-strong)]"
      }`}
    >
      <input
        type="checkbox"
        checked={selected}
        onChange={onToggleSelect}
        onClick={(e) => e.stopPropagation()}
        className={`absolute top-2 left-2 z-10 h-4 w-4 rounded cursor-pointer accent-[var(--accent)] ${
          selected ? "" : "opacity-100 md:opacity-0 md:group-hover:opacity-100"
        }`}
      />
      <a href={bookmark.url} target="_blank" rel="noopener noreferrer" className="block">
        <div className="h-28 w-full bg-[var(--surface-2)] overflow-hidden">
          {bookmark.coverImagePath ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={bookmark.coverImagePath} alt="" className="h-full w-full object-cover" />
          ) : (
            <div
              className="h-full w-full flex items-center justify-center text-[var(--text-faint)] text-xs"
              style={{ background: `linear-gradient(135deg, ${faviconFallbackColor(bookmark.domain)}33, transparent)` }}
            >
              {bookmark.domain}
            </div>
          )}
        </div>
      </a>

      <div className="flex flex-col gap-1.5 flex-1" style={{ padding: "var(--card-pad)" }}>
        <div className="flex items-start gap-2">
          <Favicon faviconPath={bookmark.faviconPath} domain={bookmark.domain} size={16} className="mt-0.5" />
          <a
            href={bookmark.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-[var(--text-primary)] leading-snug line-clamp-2 hover:underline"
          >
            {bookmark.title}
          </a>
        </div>

        {(bookmark.domain || bookmark.isBroken) && (
          <div className="flex items-center gap-1.5">
            {bookmark.domain && <div className="text-xs text-[var(--text-faint)] truncate">{bookmark.domain}</div>}
            {bookmark.isBroken && (
              <span
                title="This link appears to be broken"
                className="text-[11px] px-1.5 py-0.5 rounded-full bg-red-500/15 text-red-400 shrink-0"
              >
                Broken
              </span>
            )}
          </div>
        )}

        {bookmark.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-0.5">
            {bookmark.tags.map((t) => (
              <span key={t.id} className="text-[11px] px-1.5 py-0.5 rounded-full bg-[var(--surface-2)] text-[var(--text-muted)]">
                {t.name}
              </span>
            ))}
          </div>
        )}
      </div>

      <button
        onClick={onEdit}
        className="absolute top-2 right-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity bg-[var(--surface-0-a80)] hover:bg-[var(--surface-2)] text-[var(--text-secondary)] text-xs px-2 py-1 rounded-md border border-[var(--border-strong)]"
      >
        Edit
      </button>
    </div>
  );
}
