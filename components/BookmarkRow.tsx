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
      className={`group flex items-center gap-3 border-b border-neutral-800/70 hover:bg-neutral-900/60 ${
        dense ? "py-2" : "py-3"
      }`}
    >
      <Favicon faviconPath={bookmark.faviconPath} domain={bookmark.domain} size={dense ? 18 : 24} />

      <a
        href={bookmark.url}
        target="_blank"
        rel="noopener noreferrer"
        className={`min-w-0 truncate text-neutral-100 hover:underline ${dense ? "text-sm" : "text-sm font-medium"}`}
      >
        {bookmark.title}
      </a>

      {bookmark.domain && (
        <span className="shrink-0 text-xs text-neutral-500 truncate max-w-[200px]">{bookmark.domain}</span>
      )}

      {!dense && bookmark.tags.length > 0 && (
        <div className="hidden sm:flex flex-wrap gap-1 shrink-0">
          {bookmark.tags.map((t) => (
            <span key={t.id} className="text-[11px] px-1.5 py-0.5 rounded-full bg-neutral-800 text-neutral-400">
              {t.name}
            </span>
          ))}
        </div>
      )}

      <div className="flex-1" />

      <button
        onClick={onEdit}
        className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-neutral-400 hover:text-neutral-100 text-xs px-2 py-1 rounded-md border border-neutral-700"
      >
        Edit
      </button>
    </div>
  );
}
