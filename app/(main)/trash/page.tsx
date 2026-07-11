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
      <div className="flex items-center justify-between gap-3 flex-wrap px-4 pt-4 pb-3 sm:px-6 sm:pt-6 sm:pb-4">
        <h1 className="text-lg font-semibold text-[var(--text-primary)]">Trash</h1>
        {bookmarks.length > 0 && (
          <button
            onClick={emptyTrash}
            className="px-3 py-1.5 text-sm rounded-md border border-[var(--border)] text-[var(--text-body)] hover:bg-red-950/50 hover:text-red-400 hover:border-red-900"
          >
            Empty trash
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4 sm:px-6 sm:pb-6">
        {error && <p className="text-sm text-red-400 pb-3">{error}</p>}
        {loading ? (
          <p className="text-sm text-[var(--text-faint)]">Loading…</p>
        ) : bookmarks.length === 0 ? (
          <p className="text-sm text-[var(--text-faint)]">Trash is empty.</p>
        ) : (
          <div className="flex flex-col">
            {bookmarks.map((b) => (
              <div
                key={b.id}
                className="group flex items-center gap-2 flex-wrap py-3 border-b border-[var(--border-a70)] hover:bg-[var(--surface-1-a60)] sm:gap-3 sm:flex-nowrap"
              >
                <Favicon faviconPath={b.faviconPath} domain={b.domain} size={24} />
                <span className="min-w-0 truncate text-sm font-medium text-[var(--text-body)]">{b.title}</span>
                {b.domain && (
                  <span className="hidden shrink-0 text-xs text-[var(--text-faint)] truncate max-w-[200px] sm:block">
                    {b.domain}
                  </span>
                )}
                <div className="flex-1 basis-0 min-w-0 hidden sm:block" />
                <div className="flex items-center gap-2 shrink-0 ml-auto sm:ml-0">
                  <button
                    onClick={() => restore(b.id)}
                    className="text-xs px-2 py-1 rounded-md border border-[var(--border-strong)] text-[var(--text-body)] hover:bg-[var(--surface-2)]"
                  >
                    Restore
                  </button>
                  <button
                    onClick={() => deleteForever(b.id)}
                    className="text-xs px-2 py-1 rounded-md border border-[var(--border-strong)] text-[var(--text-muted)] hover:bg-red-950/50 hover:text-red-400 hover:border-red-900"
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
