"use client";

import { useState } from "react";
import { api } from "@/lib/api-client";
import { useAppData } from "./providers";

export function SaveSearchButton({ query }: { query: string }) {
  const { savedSearches, refreshSavedSearches } = useAppData();
  const [saving, setSaving] = useState(false);

  const alreadySaved = savedSearches.some((s) => s.query === query);

  async function save() {
    const name = window.prompt("Name this search", query)?.trim();
    if (!name) return;
    setSaving(true);
    try {
      await api.post("/api/saved-searches", { name, query });
      await refreshSavedSearches();
    } finally {
      setSaving(false);
    }
  }

  if (alreadySaved) {
    return (
      <span className="flex items-center gap-1.5 px-2.5 py-1.5 text-sm text-[var(--text-faint)] whitespace-nowrap">
        ✓ Saved
      </span>
    );
  }

  return (
    <button
      onClick={save}
      disabled={saving}
      className="flex items-center gap-1.5 px-2.5 py-1.5 text-sm rounded-md border border-[var(--border)] text-[var(--text-body)] hover:bg-[var(--surface-2)] disabled:opacity-50 whitespace-nowrap"
    >
      🔍 Save search
    </button>
  );
}
