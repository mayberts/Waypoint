"use client";

import { useState } from "react";
import { api, ApiError } from "@/lib/api-client";
import type { BookmarkDTO } from "@/lib/types";
import { CollectionSelect } from "./CollectionSelect";
import { TagInput } from "./TagInput";
import { useAppData } from "./providers";

export function AddBookmarkModal({
  defaultCollectionId,
  onClose,
  onCreated,
}: {
  defaultCollectionId: string | null;
  onClose: () => void;
  onCreated: (bookmark: BookmarkDTO) => void;
}) {
  const { refreshTags } = useAppData();
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [collectionId, setCollectionId] = useState<string | null>(defaultCollectionId);
  const [tags, setTags] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const bookmark = await api.post<BookmarkDTO>("/api/bookmarks", {
        url,
        title: title || undefined,
        note: note || undefined,
        collectionId,
        tags,
      });
      await refreshTags();
      onCreated(bookmark);
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to save bookmark");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 pt-24" onClick={onClose}>
      <form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-lg border border-[var(--border)] bg-[var(--surface-0)] p-4 flex flex-col gap-3"
      >
        <h2 className="text-sm font-semibold text-[var(--text-secondary)]">Add bookmark</h2>

        <input
          autoFocus
          required
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://example.com"
          className="w-full rounded-md bg-[var(--surface-1)] border border-[var(--border)] px-2.5 py-1.5 text-sm text-[var(--text-secondary)] placeholder:text-[var(--text-faint)] focus:outline-none focus:border-[var(--border-stronger)]"
        />
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title (auto-detected if left blank)"
          className="w-full rounded-md bg-[var(--surface-1)] border border-[var(--border)] px-2.5 py-1.5 text-sm text-[var(--text-secondary)] placeholder:text-[var(--text-faint)] focus:outline-none focus:border-[var(--border-stronger)]"
        />
        <CollectionSelect value={collectionId} onChange={setCollectionId} />
        <TagInput value={tags} onChange={setTags} />
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Note (optional)"
          rows={2}
          className="w-full rounded-md bg-[var(--surface-1)] border border-[var(--border)] px-2.5 py-1.5 text-sm text-[var(--text-secondary)] placeholder:text-[var(--text-faint)] focus:outline-none focus:border-[var(--border-stronger)] resize-none"
        />

        {error && <p className="text-xs text-red-400">{error}</p>}

        <div className="flex justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-sm rounded-md text-[var(--text-body)] hover:bg-[var(--surface-2)]"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-3 py-1.5 text-sm rounded-md bg-[var(--accent-strong)] text-white hover:bg-[var(--accent)] disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save bookmark"}
          </button>
        </div>
      </form>
    </div>
  );
}
