"use client";

import type { BookmarkDTO } from "@/lib/types";
import { faviconFallbackColor } from "@/lib/favicon-color";
import { Favicon } from "./Favicon";

export function BookmarkMoodboard({
  bookmarks,
  onEdit,
}: {
  bookmarks: BookmarkDTO[];
  onEdit: (bookmark: BookmarkDTO) => void;
}) {
  return (
    <div className="columns-2 sm:columns-3 lg:columns-4 gap-4">
      {bookmarks.map((b) => (
        <div key={b.id} className="mb-4 break-inside-avoid">
          {b.coverImagePath ? (
            <div className="group relative rounded-lg overflow-hidden border border-[var(--border)] hover:border-[var(--border-strong)]">
              <a href={b.url} target="_blank" rel="noopener noreferrer">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={b.coverImagePath} alt="" className="w-full h-auto block" />
              </a>
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent p-3 pt-8">
                <div className="flex items-center gap-1.5">
                  <Favicon faviconPath={b.faviconPath} domain={b.domain} size={14} />
                  <a
                    href={b.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-white leading-snug line-clamp-2 hover:underline"
                  >
                    {b.title}
                  </a>
                </div>
              </div>
              <button
                onClick={() => onEdit(b)}
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-[var(--surface-0-a80)] hover:bg-[var(--surface-2)] text-[var(--text-secondary)] text-xs px-2 py-1 rounded-md border border-[var(--border-strong)]"
              >
                Edit
              </button>
            </div>
          ) : (
            <div className="group relative flex flex-col gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface-1)] hover:border-[var(--border-strong)] p-3">
              <div
                className="h-16 w-full rounded flex items-center justify-center text-[var(--text-faint)] text-xs"
                style={{ background: `linear-gradient(135deg, ${faviconFallbackColor(b.domain)}33, transparent)` }}
              >
                {b.domain}
              </div>
              <div className="flex items-center gap-1.5">
                <Favicon faviconPath={b.faviconPath} domain={b.domain} size={14} />
                <a
                  href={b.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-[var(--text-primary)] leading-snug line-clamp-2 hover:underline"
                >
                  {b.title}
                </a>
              </div>
              <button
                onClick={() => onEdit(b)}
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-[var(--surface-0-a80)] hover:bg-[var(--surface-2)] text-[var(--text-secondary)] text-xs px-2 py-1 rounded-md border border-[var(--border-strong)]"
              >
                Edit
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
