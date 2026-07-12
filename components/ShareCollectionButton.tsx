"use client";

import { useState } from "react";
import { api } from "@/lib/api-client";
import type { CollectionDTO } from "@/lib/types";
import { useAppData } from "./providers";

export function ShareCollectionButton({ collectionId }: { collectionId: string }) {
  const { collections, refreshCollections } = useAppData();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  const collection = collections.find((c) => c.id === collectionId);
  const shareSlug = collection?.shareSlug ?? null;
  const shareUrl = shareSlug && typeof window !== "undefined" ? `${window.location.origin}/share/${shareSlug}` : "";

  async function enableOrRegenerate() {
    setBusy(true);
    try {
      await api.post<CollectionDTO>(`/api/collections/${collectionId}/share`);
      await refreshCollections();
    } finally {
      setBusy(false);
    }
  }

  async function disable() {
    if (!window.confirm("Stop sharing this collection? The current link will stop working.")) return;
    setBusy(true);
    try {
      await api.delete(`/api/collections/${collectionId}/share`);
      await refreshCollections();
    } finally {
      setBusy(false);
    }
  }

  async function copyLink() {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        title="Share this collection"
        className={`flex items-center gap-1.5 px-2.5 py-1.5 text-sm rounded-md border hover:bg-[var(--surface-2)] whitespace-nowrap ${
          shareSlug ? "border-[var(--accent)] text-[var(--accent)]" : "border-[var(--border)] text-[var(--text-body)]"
        }`}
      >
        🔗 {shareSlug ? "Shared" : "Share"}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute z-50 top-full right-0 mt-1 w-72 rounded-lg border border-[var(--border)] bg-[var(--surface-0)] p-3 shadow-xl flex flex-col gap-3">
            {shareSlug ? (
              <>
                <p className="text-xs text-[var(--text-faint)]">
                  Anyone with this link can view this collection&apos;s bookmarks — no login required.
                </p>
                <div className="flex items-center gap-1.5">
                  <input
                    readOnly
                    value={shareUrl}
                    onFocus={(e) => e.currentTarget.select()}
                    className="flex-1 min-w-0 rounded-md bg-[var(--surface-1)] border border-[var(--border)] px-2 py-1.5 text-xs text-[var(--text-secondary)]"
                  />
                  <button
                    onClick={copyLink}
                    className="shrink-0 text-xs px-2 py-1.5 rounded-md border border-[var(--border-strong)] text-[var(--text-secondary)] hover:bg-[var(--surface-2)]"
                  >
                    {copied ? "Copied!" : "Copy"}
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={enableOrRegenerate}
                    disabled={busy}
                    className="flex-1 text-xs px-2 py-1.5 rounded-md border border-[var(--border-strong)] text-[var(--text-body)] hover:bg-[var(--surface-2)] disabled:opacity-50"
                  >
                    Regenerate link
                  </button>
                  <button
                    onClick={disable}
                    disabled={busy}
                    className="flex-1 text-xs px-2 py-1.5 rounded-md border border-[var(--border-strong)] text-[var(--text-body)] hover:bg-red-950/50 hover:text-red-400 hover:border-red-900 disabled:opacity-50"
                  >
                    Stop sharing
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="text-xs text-[var(--text-faint)]">
                  Create a public, read-only link to this collection. Anyone with the link can view it without logging in.
                </p>
                <button
                  onClick={enableOrRegenerate}
                  disabled={busy}
                  className="text-sm px-3 py-1.5 rounded-md bg-[var(--accent-strong)] text-white hover:bg-[var(--accent)] disabled:opacity-50"
                >
                  Create public link
                </button>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
