"use client";

import { useState } from "react";
import { api } from "@/lib/api-client";
import { CollectionSelect } from "./CollectionSelect";

export function BulkActionBar({
  count,
  onClear,
  onDone,
  selectedIds,
}: {
  count: number;
  onClear: () => void;
  onDone: () => void;
  selectedIds: string[];
}) {
  const [moving, setMoving] = useState(false);
  const [tagValue, setTagValue] = useState("");
  const [tagging, setTagging] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const busy = moving || tagging || deleting;

  async function moveTo(collectionId: string | null) {
    setMoving(true);
    try {
      await api.patch("/api/bookmarks/bulk", { ids: selectedIds, collectionId });
      onDone();
    } finally {
      setMoving(false);
    }
  }

  async function addTag(e: React.FormEvent) {
    e.preventDefault();
    const tag = tagValue.trim();
    if (!tag) return;
    setTagging(true);
    try {
      await api.patch("/api/bookmarks/bulk", { ids: selectedIds, addTag: tag });
      setTagValue("");
      onDone();
    } finally {
      setTagging(false);
    }
  }

  async function deleteSelected() {
    if (!window.confirm(`Move ${count} bookmark${count === 1 ? "" : "s"} to trash?`)) return;
    setDeleting(true);
    try {
      await api.delete("/api/bookmarks/bulk", { ids: selectedIds });
      onDone();
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="sticky bottom-4 z-20 mx-6 flex items-center gap-3 rounded-lg border border-[var(--border-strong)] bg-[var(--surface-0)] px-4 py-2.5 shadow-lg">
      <span className="text-sm font-medium text-[var(--text-primary)] shrink-0">{count} selected</span>

      <div className="w-44 shrink-0">
        <CollectionSelect value={null} onChange={moveTo} />
      </div>

      <form onSubmit={addTag} className="flex items-center gap-1.5 shrink-0">
        <input
          value={tagValue}
          onChange={(e) => setTagValue(e.target.value)}
          placeholder="Add tag…"
          disabled={busy}
          className="w-28 rounded-md bg-[var(--surface-1)] border border-[var(--border)] px-2 py-1 text-xs text-[var(--text-secondary)] placeholder:text-[var(--text-faint)] focus:outline-none focus:border-[var(--border-stronger)] disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={busy || !tagValue.trim()}
          className="text-xs px-2 py-1 rounded-md border border-[var(--border-strong)] text-[var(--text-secondary)] hover:bg-[var(--surface-2)] disabled:opacity-50"
        >
          Add
        </button>
      </form>

      <div className="flex-1" />

      <button
        onClick={deleteSelected}
        disabled={busy}
        className="text-xs px-2.5 py-1.5 rounded-md border border-[var(--border-strong)] text-[var(--text-secondary)] hover:bg-red-950/50 hover:text-red-400 hover:border-red-900 disabled:opacity-50 shrink-0"
      >
        {deleting ? "Deleting…" : "Delete"}
      </button>
      <button
        onClick={onClear}
        disabled={busy}
        className="text-xs px-2.5 py-1.5 rounded-md text-[var(--text-faint)] hover:text-[var(--text-secondary)] disabled:opacity-50 shrink-0"
      >
        Clear
      </button>
    </div>
  );
}
