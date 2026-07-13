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
  const [url, setUrl] = useState(bookmark.url);
  const [title, setTitle] = useState(bookmark.title);
  const [note, setNote] = useState(bookmark.note ?? "");
  const [collectionId, setCollectionId] = useState<string | null>(bookmark.collectionId);
  const [tags, setTags] = useState<string[]>(bookmark.tags.map((t) => t.name));
  const [favicon, setFavicon] = useState(bookmark.faviconPath);
  const [cover, setCover] = useState(bookmark.coverImagePath);
  const [saving, setSaving] = useState(false);
  const [refetching, setRefetching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const faviconInput = useRef<HTMLInputElement>(null);
  const coverInput = useRef<HTMLInputElement>(null);

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const updated = await api.patch<BookmarkDTO>(`/api/bookmarks/${bookmark.id}`, {
        url,
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

  async function refetchImages() {
    setError(null);
    setRefetching(true);
    try {
      const result = await api.post<{ faviconPath: string | null; coverImagePath: string | null; faviconFound: boolean; coverFound: boolean }>(
        `/api/bookmarks/${bookmark.id}/refetch-images`
      );
      setFavicon(result.faviconPath);
      setCover(result.coverImagePath);
      if (!result.faviconFound && !result.coverFound) {
        setError("Couldn't find a favicon or cover image on that page");
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to refetch images");
    } finally {
      setRefetching(false);
    }
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
        className="h-full w-full max-w-sm bg-[var(--surface-0)] border-l border-[var(--border)] p-4 flex flex-col gap-3 overflow-y-auto"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[var(--text-secondary)]">Edit bookmark</h2>
          <button onClick={onClose} className="text-[var(--text-faint)] hover:text-[var(--text-secondary)] text-lg leading-none">
            ×
          </button>
        </div>

        <div>
          <div className="flex items-center justify-between">
            <label className="text-xs text-[var(--text-faint)]">URL</label>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-[var(--text-faint)] hover:text-[var(--text-secondary)] hover:underline"
            >
              Open ↗
            </a>
          </div>
          <input
            type="url"
            required
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="mt-1 w-full rounded-md bg-[var(--surface-1)] border border-[var(--border)] px-2.5 py-1.5 text-sm text-[var(--text-secondary)] focus:outline-none focus:border-[var(--border-stronger)]"
          />
        </div>

        <button
          type="button"
          onClick={refetchImages}
          disabled={refetching}
          className="self-start flex items-center gap-1.5 text-xs text-[var(--text-faint)] hover:text-[var(--text-secondary)] disabled:opacity-50"
          title="Re-fetch the favicon and cover image from the live URL"
        >
          <span className={refetching ? "animate-spin" : ""}>↻</span>
          {refetching ? "Refetching…" : "Refetch favicon & cover from site"}
        </button>

        <div>
          <label className="text-xs text-[var(--text-faint)]">Cover image</label>
          <div
            onClick={() => coverInput.current?.click()}
            className="mt-1 h-24 w-full rounded-md bg-[var(--surface-1)] border border-dashed border-[var(--border-strong)] overflow-hidden cursor-pointer flex items-center justify-center text-xs text-[var(--text-faint)] hover:border-[var(--border-strongest)]"
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
          <label className="text-xs text-[var(--text-faint)]">Favicon</label>
          <div
            onClick={() => faviconInput.current?.click()}
            className="mt-1 h-10 w-10 rounded-md bg-[var(--surface-1)] border border-dashed border-[var(--border-strong)] overflow-hidden cursor-pointer flex items-center justify-center text-[var(--text-faint)] hover:border-[var(--border-strongest)]"
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
          <label className="text-xs text-[var(--text-faint)]">Title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 w-full rounded-md bg-[var(--surface-1)] border border-[var(--border)] px-2.5 py-1.5 text-sm text-[var(--text-secondary)] focus:outline-none focus:border-[var(--border-stronger)]"
          />
        </div>

        <div>
          <label className="text-xs text-[var(--text-faint)]">Collection</label>
          <div className="mt-1">
            <CollectionSelect value={collectionId} onChange={setCollectionId} />
          </div>
        </div>

        <div>
          <label className="text-xs text-[var(--text-faint)]">Tags</label>
          <div className="mt-1">
            <TagInput value={tags} onChange={setTags} />
          </div>
        </div>

        <div>
          <label className="text-xs text-[var(--text-faint)]">Note</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            className="mt-1 w-full rounded-md bg-[var(--surface-1)] border border-[var(--border)] px-2.5 py-1.5 text-sm text-[var(--text-secondary)] focus:outline-none focus:border-[var(--border-stronger)] resize-none"
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
