"use client";

import type { BookmarkDTO } from "@/lib/types";
import { faviconFallbackColor } from "@/lib/favicon-color";
import { Favicon } from "./Favicon";

export function BookmarkCard({ bookmark, onEdit }: { bookmark: BookmarkDTO; onEdit: () => void }) {
  return (
    <div className="group relative flex flex-col rounded-lg border border-neutral-800 bg-neutral-900 overflow-hidden hover:border-neutral-700 transition-colors">
      <a href={bookmark.url} target="_blank" rel="noopener noreferrer" className="block">
        <div className="h-28 w-full bg-neutral-800 overflow-hidden">
          {bookmark.coverImagePath ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={bookmark.coverImagePath} alt="" className="h-full w-full object-cover" />
          ) : (
            <div
              className="h-full w-full flex items-center justify-center text-neutral-500 text-xs"
              style={{ background: `linear-gradient(135deg, ${faviconFallbackColor(bookmark.domain)}33, transparent)` }}
            >
              {bookmark.domain}
            </div>
          )}
        </div>
      </a>

      <div className="p-3 flex flex-col gap-1.5 flex-1">
        <div className="flex items-start gap-2">
          <Favicon faviconPath={bookmark.faviconPath} domain={bookmark.domain} size={16} className="mt-0.5" />
          <a
            href={bookmark.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-neutral-100 leading-snug line-clamp-2 hover:underline"
          >
            {bookmark.title}
          </a>
        </div>

        {bookmark.domain && <div className="text-xs text-neutral-500 truncate">{bookmark.domain}</div>}

        {bookmark.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-0.5">
            {bookmark.tags.map((t) => (
              <span key={t.id} className="text-[11px] px-1.5 py-0.5 rounded-full bg-neutral-800 text-neutral-400">
                {t.name}
              </span>
            ))}
          </div>
        )}
      </div>

      <button
        onClick={onEdit}
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-neutral-950/80 hover:bg-neutral-800 text-neutral-200 text-xs px-2 py-1 rounded-md border border-neutral-700"
      >
        Edit
      </button>
    </div>
  );
}
