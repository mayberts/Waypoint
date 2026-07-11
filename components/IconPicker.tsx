"use client";

import { useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { api } from "@/lib/api-client";
import type { CollectionDTO } from "@/lib/types";
import { useAppData } from "./providers";

export function IconPicker({
  collectionId,
  anchorRect,
  onChanged,
  onClose,
}: {
  collectionId: string;
  anchorRect: { top: number; left: number; bottom: number };
  onChanged: (icon: string | null) => void;
  onClose: () => void;
}) {
  const { iconAssets } = useAppData();
  const fileInput = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const customCategories = useMemo(() => {
    const byCategory = new Map<string, { path: string; filename: string }[]>();
    for (const asset of iconAssets) {
      const list = byCategory.get(asset.category) ?? [];
      list.push(asset);
      byCategory.set(asset.category, list);
    }
    return Array.from(byCategory.entries()).map(([label, icons]) => ({ label, icons }));
  }, [iconAssets]);

  const q = query.trim().toLowerCase();

  const filteredCustomCategories = useMemo(() => {
    if (!q) return customCategories;
    return customCategories
      .map((category) => {
        const categoryMatches = category.label.toLowerCase().includes(q);
        const icons = categoryMatches
          ? category.icons
          : category.icons.filter((icon) => icon.filename.toLowerCase().includes(q));
        return { ...category, icons };
      })
      .filter((category) => category.icons.length > 0);
  }, [customCategories, q]);

  const noResults = q.length > 0 && filteredCustomCategories.length === 0;

  async function pick(icon: string) {
    const updated = await api.patch<CollectionDTO>(`/api/collections/${collectionId}`, { icon });
    onChanged(updated.icon);
    onClose();
  }

  async function clear() {
    const updated = await api.patch<CollectionDTO>(`/api/collections/${collectionId}`, { icon: null });
    onChanged(updated.icon);
    onClose();
  }

  async function uploadFile(file: File) {
    setUploading(true);
    setError(null);
    try {
      const form = new FormData();
      form.set("file", file);
      const updated = await api.upload<CollectionDTO>(`/api/collections/${collectionId}/image`, form);
      onChanged(updated.icon);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  const width = 280;
  const left = Math.min(anchorRect.left, window.innerWidth - width - 8);
  const maxHeight = Math.min(420, window.innerHeight - anchorRect.bottom - 16);

  return createPortal(
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ top: anchorRect.bottom + 4, left, width }}
        className="fixed z-50 rounded-lg border border-neutral-800 bg-neutral-950 shadow-xl flex flex-col"
      >
        <div className="p-2.5 pb-0 shrink-0">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search icons…"
            autoFocus
            className="w-full rounded-md border border-neutral-800 bg-neutral-900 px-2 py-1.5 text-xs text-neutral-200 placeholder:text-neutral-500 focus:outline-none focus:border-neutral-600"
          />
        </div>

        <div className="overflow-y-auto p-2.5" style={{ maxHeight }}>
          {filteredCustomCategories.map((category) => (
            <div key={category.label} className="mb-2 last:mb-0">
              <div className="px-1 pb-1 text-[11px] font-semibold uppercase tracking-wide text-neutral-500">
                {category.label}
              </div>
              <div className="grid grid-cols-8 gap-0.5">
                {category.icons.map((icon) => (
                  <button
                    key={icon.path}
                    onClick={() => pick(icon.path)}
                    className="flex items-center justify-center rounded p-1 hover:bg-neutral-800"
                    title={icon.filename}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={icon.path} alt="" className="h-5 w-5 rounded object-cover" />
                  </button>
                ))}
              </div>
            </div>
          ))}
          {noResults && <p className="px-1 py-4 text-center text-xs text-neutral-500">No icons found.</p>}
        </div>

        {error && <p className="text-xs text-red-400 px-2.5 pt-2">{error}</p>}

        <div className="flex items-center justify-between px-2.5 py-2 border-t border-neutral-800 shrink-0">
          <button
            onClick={() => fileInput.current?.click()}
            disabled={uploading}
            className="text-xs text-neutral-400 hover:text-neutral-200 disabled:opacity-50"
          >
            {uploading ? "Uploading…" : "Upload image"}
          </button>
          <button onClick={clear} className="text-xs text-neutral-400 hover:text-neutral-200">
            Reset to default
          </button>
        </div>
        <input
          ref={fileInput}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && uploadFile(e.target.files[0])}
        />
      </div>
    </>,
    document.body
  );
}
