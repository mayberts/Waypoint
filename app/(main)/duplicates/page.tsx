"use client";

import { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api-client";
import type { BookmarkDTO } from "@/lib/types";
import { Favicon } from "@/components/Favicon";
import { useAppData } from "@/components/providers";

export default function DuplicatesPage() {
  const { collections, refreshCollections } = useAppData();
  const [groups, setGroups] = useState<BookmarkDTO[][]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const r = await api.get<{ groups: BookmarkDTO[][] }>("/api/bookmarks/duplicates");
      setGroups(r.groups);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-mount
    load();
  }, []);

  function collectionName(id: string | null): string | null {
    if (!id) return null;
    return collections.find((c) => c.id === id)?.name ?? null;
  }

  async function deleteOne(id: string) {
    setBusyId(id);
    setError(null);
    try {
      await api.delete(`/api/bookmarks/${id}`);
      await Promise.all([load(), refreshCollections()]);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to delete");
    } finally {
      setBusyId(null);
    }
  }

  async function deleteRest(group: BookmarkDTO[]) {
    const [, ...rest] = group; // group is oldest-first (API orders by createdAt asc)
    if (!window.confirm(`Keep the oldest of these ${group.length} bookmarks and move the other ${rest.length} to trash?`)) {
      return;
    }
    setBusyId(group[0].id);
    setError(null);
    try {
      await api.delete("/api/bookmarks/bulk", { ids: rest.map((b) => b.id) });
      await Promise.all([load(), refreshCollections()]);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to delete");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="flex-1 flex flex-col min-w-0">
      <div className="flex items-center justify-between gap-3 flex-wrap px-4 pt-4 pb-3 sm:px-6 sm:pt-6 sm:pb-4">
        <h1 className="text-lg font-semibold text-[var(--text-primary)]">Duplicate bookmarks</h1>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4 sm:px-6 sm:pb-6">
        {error && <p className="text-sm text-red-400 pb-3">{error}</p>}
        {loading ? (
          <p className="text-sm text-[var(--text-faint)]">Loading…</p>
        ) : groups.length === 0 ? (
          <p className="text-sm text-[var(--text-faint)]">No duplicate bookmarks found.</p>
        ) : (
          <div className="flex flex-col gap-4 max-w-2xl">
            {groups.map((group) => (
              <div key={group[0].id} className="rounded-lg border border-[var(--border)] overflow-hidden">
                <div className="flex items-center justify-between gap-3 flex-wrap px-3 py-2 bg-[var(--surface-1)] border-b border-[var(--border)]">
                  <span className="text-xs text-[var(--text-faint)] truncate min-w-0">{group[0].url}</span>
                  <button
                    onClick={() => deleteRest(group)}
                    disabled={busyId !== null}
                    className="shrink-0 text-xs px-2 py-1 rounded-md border border-[var(--border-strong)] text-[var(--text-body)] hover:bg-red-950/50 hover:text-red-400 hover:border-red-900 disabled:opacity-50"
                  >
                    Keep oldest, delete {group.length - 1}
                  </button>
                </div>
                <div className="flex flex-col">
                  {group.map((b) => (
                    <div
                      key={b.id}
                      className="flex items-center gap-2 flex-wrap px-3 py-2.5 border-b border-[var(--border-a70)] last:border-b-0 hover:bg-[var(--surface-1-a60)] sm:gap-3 sm:flex-nowrap"
                    >
                      <Favicon faviconPath={b.faviconPath} domain={b.domain} size={20} />
                      <span className="min-w-0 truncate text-sm font-medium text-[var(--text-body)]">{b.title}</span>
                      {collectionName(b.collectionId) && (
                        <span className="shrink-0 text-xs px-1.5 py-0.5 rounded-full bg-[var(--surface-2)] text-[var(--text-muted)]">
                          {collectionName(b.collectionId)}
                        </span>
                      )}
                      <span className="shrink-0 text-xs text-[var(--text-faint)]">{new Date(b.createdAt).toLocaleDateString()}</span>
                      <div className="flex-1 basis-0 min-w-0 hidden sm:block" />
                      <button
                        onClick={() => deleteOne(b.id)}
                        disabled={busyId !== null}
                        className="shrink-0 ml-auto sm:ml-0 text-xs px-2 py-1 rounded-md border border-[var(--border-strong)] text-[var(--text-muted)] hover:bg-red-950/50 hover:text-red-400 hover:border-red-900 disabled:opacity-50"
                      >
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
