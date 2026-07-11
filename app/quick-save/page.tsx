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
    return <p className="text-sm text-[var(--text-muted)]">No URL given.</p>;
  }

  if (saved) {
    return <p className="text-sm text-green-400">Saved to Waypoint ✓</p>;
  }

  return (
    <form onSubmit={submit} className="w-full max-w-sm flex flex-col gap-3">
      <h1 className="flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
        <Logo size={18} />
        Save to Waypoint
      </h1>
      <p className="text-xs text-[var(--text-faint)] truncate">{url}</p>

      <input
        autoFocus
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Title"
        className="w-full rounded-md bg-[var(--surface-1)] border border-[var(--border)] px-2.5 py-1.5 text-sm text-[var(--text-secondary)] focus:outline-none focus:border-[var(--border-stronger)]"
      />
      <CollectionSelect value={collectionId} onChange={setCollectionId} />
      <TagInput value={tags} onChange={setTags} />

      {error && <p className="text-xs text-red-400">{error}</p>}

      <button
        type="submit"
        disabled={saving}
        className="px-3 py-1.5 text-sm rounded-md bg-[var(--accent-strong)] text-white hover:bg-[var(--accent)] disabled:opacity-50"
      >
        {saving ? "Saving…" : "Save bookmark"}
      </button>
    </form>
  );
}

export default function QuickSavePage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[var(--surface-1)]">
      <Suspense fallback={<p className="text-sm text-[var(--text-faint)]">Loading…</p>}>
        <QuickSaveForm />
      </Suspense>
    </div>
  );
}
