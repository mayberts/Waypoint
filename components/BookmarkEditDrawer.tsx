"use client";

import { useRef, useState } from "react";
import { api, ApiError } from "@/lib/api-client";
import type { BookmarkDTO } from "@/lib/types";
import { CollectionSelect } from "./CollectionSelect";
import { TagInput } from "./TagInput";
import { useAppData } from "./providers";

export function BookmarkEditDrawer({
  bookmark,
  onClose,
  onUpdated,
  onDeleted,
}: {
  bookmark: BookmarkDTO;
  onClose: () => void;
  onUpdated: (bookmark: BookmarkDTO) => void;
  onDeleted: (id: string) => void;
}) {
  const { refreshTags } = useAppData();
  const [title, setTitle] = useState(bookmark.title);
  const [note, setNote] = useState(bookmark.note ?? "");
  const [collectionId, setCollectionId] = useState<string | null>(bookmark.collectionId);
  const [tags, setTags] = useState<string[]>(bookmark.tags.map((t) => t.name));
  const [favicon, setFavicon] = useState(bookmark.faviconPath);
  const [cover, setCover] = useState(bookmark.coverImagePath);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const faviconInput = useRef<HTMLInputElement>(null);
  const coverInput = useRef<HTMLInputElement>(null);

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const updated = await api.patch<BookmarkDTO>(`/api/bookmarks/${bookmark.id}`, {
        title,
        note: note || null,
        collectionId,
        tags,
      });
      await refreshTags();
      onUpdated({ ...updated, faviconPath: favicon, coverImagePath: cover });
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!window.confirm("Delete this bookmark?")) return;
    await api.delete(`/api/bookmarks/${bookmark.id}`);
    onDeleted(bookmark.id);
    onClose();
  }

  async function uploadImage(type: "favicon" | "cover", file: File) {
    setError(null);
    const form = new FormData();
    form.set("type", type);
    form.set("file", file);
    try {
      const updated = await api.upload<BookmarkDTO>(`/api/bookmarks/${bookmark.id}/image`, form);
      if (type === "favicon") setFavicon(updated.faviconPath);
      else setCover(updated.coverImagePath);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Upload failed");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="h-full w-full max-w-sm bg-neutral-950 border-l border-neutral-800 p-4 flex flex-col gap-3 overflow-y-auto"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-neutral-200">Edit bookmark</h2>
          <button onClick={onClose} className="text-neutral-500 hover:text-neutral-200 text-lg leading-none">
            ×
          </button>
        </div>

        <a href={bookmark.url} target="_blank" rel="noopener noreferrer" className="text-xs text-neutral-500 truncate hover:underline">
          {bookmark.url}
        </a>

        <div>
          <label className="text-xs text-neutral-500">Cover image</label>
          <div
            onClick={() => coverInput.current?.click()}
            className="mt-1 h-24 w-full rounded-md bg-neutral-900 border border-dashed border-neutral-700 overflow-hidden cursor-pointer flex items-center justify-center text-xs text-neutral-500 hover:border-neutral-500"
          >
            {cover ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={cover} alt="" className="h-full w-full object-cover" />
            ) : (
              "Click to upload a cover image"
            )}
          </div>
          <input
            ref={coverInput}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && uploadImage("cover", e.target.files[0])}
          />
        </div>

        <div>
          <label className="text-xs text-neutral-500">Favicon</label>
          <div
            onClick={() => faviconInput.current?.click()}
            className="mt-1 h-10 w-10 rounded-md bg-neutral-900 border border-dashed border-neutral-700 overflow-hidden cursor-pointer flex items-center justify-center text-neutral-500 hover:border-neutral-500"
          >
            {favicon ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={favicon} alt="" className="h-full w-full object-cover" />
            ) : (
              "?"
            )}
          </div>
          <input
            ref={faviconInput}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && uploadImage("favicon", e.target.files[0])}
          />
        </div>

        <div>
          <label className="text-xs text-neutral-500">Title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 w-full rounded-md bg-neutral-900 border border-neutral-800 px-2.5 py-1.5 text-sm text-neutral-200 focus:outline-none focus:border-neutral-600"
          />
        </div>

        <div>
          <label className="text-xs text-neutral-500">Collection</label>
          <div className="mt-1">
            <CollectionSelect value={collectionId} onChange={setCollectionId} />
          </div>
        </div>

        <div>
          <label className="text-xs text-neutral-500">Tags</label>
          <div className="mt-1">
            <TagInput value={tags} onChange={setTags} />
          </div>
        </div>

        <div>
          <label className="text-xs text-neutral-500">Note</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            className="mt-1 w-full rounded-md bg-neutral-900 border border-neutral-800 px-2.5 py-1.5 text-sm text-neutral-200 focus:outline-none focus:border-neutral-600 resize-none"
          />
        </div>

        {error && <p className="text-xs text-red-400">{error}</p>}

        <div className="flex justify-between pt-2">
          <button onClick={remove} className="px-3 py-1.5 text-sm rounded-md text-red-400 hover:bg-red-950/50">
            Delete
          </button>
          <button
            onClick={save}
            disabled={saving}
            className="px-3 py-1.5 text-sm rounded-md bg-[var(--accent-strong)] text-white hover:bg-[var(--accent)] disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
