"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { api, ApiError } from "@/lib/api-client";
import type { BookmarkDTO } from "@/lib/types";
import { CollectionSelect } from "@/components/CollectionSelect";
import { TagInput } from "@/components/TagInput";
import { Logo } from "@/components/Logo";

function QuickSaveForm() {
  const searchParams = useSearchParams();
  const url = searchParams.get("url") ?? "";
  const [title, setTitle] = useState(searchParams.get("title") ?? "");
  const [collectionId, setCollectionId] = useState<string | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await api.post<BookmarkDTO>("/api/bookmarks", { url, title: title || undefined, collectionId, tags });
      setSaved(true);
      setTimeout(() => window.close(), 900);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to save bookmark");
    } finally {
      setSaving(false);
    }
  }

  if (!url) {
    return <p className="text-sm text-neutral-400">No URL given.</p>;
  }

  if (saved) {
    return <p className="text-sm text-green-400">Saved to Waypoint ✓</p>;
  }

  return (
    <form onSubmit={submit} className="w-full max-w-sm flex flex-col gap-3">
      <h1 className="flex items-center gap-2 text-sm font-semibold text-neutral-100">
        <Logo size={18} />
        Save to Waypoint
      </h1>
      <p className="text-xs text-neutral-500 truncate">{url}</p>

      <input
        autoFocus
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Title"
        className="w-full rounded-md bg-neutral-900 border border-neutral-800 px-2.5 py-1.5 text-sm text-neutral-200 focus:outline-none focus:border-neutral-600"
      />
      <CollectionSelect value={collectionId} onChange={setCollectionId} />
      <TagInput value={tags} onChange={setTags} />

      {error && <p className="text-xs text-red-400">{error}</p>}

      <button
        type="submit"
        disabled={saving}
        className="px-3 py-1.5 text-sm rounded-md bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-50"
      >
        {saving ? "Saving…" : "Save bookmark"}
      </button>
    </form>
  );
}

export default function QuickSavePage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-neutral-900">
      <Suspense fallback={<p className="text-sm text-neutral-500">Loading…</p>}>
        <QuickSaveForm />
      </Suspense>
    </div>
  );
}
