"use client";

import { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api-client";
import type { BookmarkDTO } from "@/lib/types";
import { Favicon } from "@/components/Favicon";
import { useAppData } from "@/components/providers";

export default function TrashPage() {
  const { refreshCollections } = useAppData();
  const [bookmarks, setBookmarks] = useState<BookmarkDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      setBookmarks(await api.get<BookmarkDTO[]>("/api/bookmarks/trash"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-mount
    load();
  }, []);

  async function restore(id: string) {
    setError(null);
    try {
      await api.post(`/api/bookmarks/${id}/restore`);
      await Promise.all([load(), refreshCollections()]);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to restore");
    }
  }

  async function deleteForever(id: string) {
    if (!window.confirm("Permanently delete this bookmark? This can't be undone.")) return;
    setError(null);
    try {
      await api.delete(`/api/bookmarks/${id}?permanent=1`);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to delete");
    }
  }

  async function emptyTrash() {
    if (!window.confirm(`Permanently delete all ${bookmarks.length} bookmark(s) in the trash? This can't be undone.`))
      return;
    setError(null);
    try {
      await api.delete("/api/bookmarks/trash");
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to empty trash");
    }
  }

  return (
    <div className="flex-1 flex flex-col min-w-0">
      <div className="flex items-center justify-between px-6 pt-6 pb-4">
        <h1 className="text-lg font-semibold text-neutral-100">Trash</h1>
        {bookmarks.length > 0 && (
          <button
            onClick={emptyTrash}
            className="px-3 py-1.5 text-sm rounded-md border border-neutral-800 text-neutral-300 hover:bg-red-950/50 hover:text-red-400 hover:border-red-900"
          >
            Empty trash
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-6">
        {error && <p className="text-sm text-red-400 pb-3">{error}</p>}
        {loading ? (
          <p className="text-sm text-neutral-500">Loading…</p>
        ) : bookmarks.length === 0 ? (
          <p className="text-sm text-neutral-500">Trash is empty.</p>
        ) : (
          <div className="flex flex-col">
            {bookmarks.map((b) => (
              <div
                key={b.id}
                className="group flex items-center gap-2.5 py-2.5 border-b border-neutral-800/70 hover:bg-neutral-900/60"
              >
                <Favicon faviconPath={b.faviconPath} domain={b.domain} size={18} />
                <span className="min-w-0 truncate text-sm font-medium text-neutral-300">{b.title}</span>
                {b.domain && <span className="shrink-0 text-xs text-neutral-500 truncate max-w-[200px]">{b.domain}</span>}
                <div className="flex-1" />
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => restore(b.id)}
                    className="text-xs px-2 py-1 rounded-md border border-neutral-700 text-neutral-300 hover:bg-neutral-800"
                  >
                    Restore
                  </button>
                  <button
                    onClick={() => deleteForever(b.id)}
                    className="text-xs px-2 py-1 rounded-md border border-neutral-700 text-neutral-400 hover:bg-red-950/50 hover:text-red-400 hover:border-red-900"
                  >
                    Delete forever
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
