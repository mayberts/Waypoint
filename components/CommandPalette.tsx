"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api-client";
import type { BookmarkDTO } from "@/lib/types";
import { Favicon } from "./Favicon";
import { useAppData } from "./providers";

function isUrlLike(value: string): boolean {
  return /^https?:\/\/\S+$/i.test(value.trim());
}

interface PaletteItem {
  id: string;
  section: "Actions" | "Collections" | "Bookmarks";
  label: string;
  sublabel?: string;
  icon?: React.ReactNode;
  onSelect: () => void;
}

export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const { collections, appearance, setAppearance, refreshCollections } = useAppData();
  const [query, setQuery] = useState("");
  const [bookmarkResults, setBookmarkResults] = useState<BookmarkDTO[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [quickAdd, setQuickAdd] = useState(false);
  const [quickAddUrl, setQuickAddUrl] = useState("");
  const [quickAddTitle, setQuickAddTitle] = useState("");
  const [quickAddSaving, setQuickAddSaving] = useState(false);
  const [quickAddError, setQuickAddError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset to a clean slate every time the palette opens, and focus the input.
  useEffect(() => {
    if (!open) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fresh state on each open
    setQuery("");
    setBookmarkResults([]);
    setSelectedIndex(0);
    setQuickAdd(false);
    setQuickAddUrl("");
    setQuickAddTitle("");
    setQuickAddError(null);
    const id = setTimeout(() => inputRef.current?.focus(), 0);
    return () => clearTimeout(id);
  }, [open]);

  // Debounced bookmark search, reusing the same full-text search the /search page uses.
  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed || isUrlLike(trimmed)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- clearing stale results when the query no longer warrants a search
      setBookmarkResults([]);
      return;
    }
    const handle = setTimeout(async () => {
      try {
        const results = await api.get<BookmarkDTO[]>(`/api/search?q=${encodeURIComponent(trimmed)}`);
        setBookmarkResults(results.slice(0, 8));
      } catch {
        setBookmarkResults([]);
      }
    }, 250);
    return () => clearTimeout(handle);
  }, [query]);

  function go(path: string) {
    router.push(path);
    onClose();
  }

  async function toggleTheme() {
    const next = appearance.colorScheme === "dark" ? "light" : "dark";
    setAppearance({ colorScheme: next });
    try {
      await api.patch("/api/settings/appearance", { colorScheme: next });
    } finally {
      onClose();
    }
  }

  async function quickAddFromQuery() {
    const url = query.trim();
    try {
      await api.post("/api/bookmarks", { url });
      await refreshCollections();
      onClose();
    } catch (err) {
      setQuickAddError(err instanceof ApiError ? err.message : "Failed to add bookmark");
    }
  }

  async function submitQuickAddForm(e: React.FormEvent) {
    e.preventDefault();
    setQuickAddSaving(true);
    setQuickAddError(null);
    try {
      await api.post("/api/bookmarks", { url: quickAddUrl, title: quickAddTitle || undefined });
      await refreshCollections();
      onClose();
    } catch (err) {
      setQuickAddError(err instanceof ApiError ? err.message : "Failed to add bookmark");
    } finally {
      setQuickAddSaving(false);
    }
  }

  const items = useMemo<PaletteItem[]>(() => {
    const trimmed = query.trim();
    const q = trimmed.toLowerCase();
    const out: PaletteItem[] = [];

    if (isUrlLike(trimmed)) {
      out.push({
        id: "quick-add-url",
        section: "Actions",
        label: `Add bookmark: ${trimmed}`,
        icon: "➕",
        onSelect: quickAddFromQuery,
      });
    }

    const actions: { id: string; label: string; icon: string; onSelect: () => void }[] = [
      { id: "add", label: "Add bookmark…", icon: "➕", onSelect: () => setQuickAdd(true) },
      { id: "home", label: "Go to All bookmarks", icon: "🔖", onSelect: () => go("/") },
      { id: "unsorted", label: "Go to Unsorted", icon: "📥", onSelect: () => go("/unsorted") },
      { id: "duplicates", label: "Go to Duplicate bookmarks", icon: "🧬", onSelect: () => go("/duplicates") },
      { id: "trash", label: "Go to Trash", icon: "🗑️", onSelect: () => go("/trash") },
      { id: "settings", label: "Go to Settings", icon: "⚙️", onSelect: () => go("/settings") },
      {
        id: "theme",
        label: appearance.colorScheme === "dark" ? "Switch to light theme" : "Switch to dark theme",
        icon: "🌓",
        onSelect: toggleTheme,
      },
    ];
    for (const a of actions) {
      if (!q || a.label.toLowerCase().includes(q)) {
        out.push({ id: a.id, section: "Actions", label: a.label, icon: a.icon, onSelect: a.onSelect });
      }
    }

    if (q) {
      for (const c of collections.filter((c) => c.name.toLowerCase().includes(q)).slice(0, 6)) {
        out.push({
          id: `collection-${c.id}`,
          section: "Collections",
          label: c.name,
          icon: isImagePath(c.icon) ? undefined : c.icon || "📁",
          sublabel: c._count ? `${c._count.bookmarks} bookmark${c._count.bookmarks === 1 ? "" : "s"}` : undefined,
          onSelect: () => go(`/collection/${c.id}`),
        });
      }

      for (const b of bookmarkResults) {
        out.push({
          id: `bookmark-${b.id}`,
          section: "Bookmarks",
          label: b.title,
          sublabel: b.domain ?? undefined,
          onSelect: () => {
            window.open(b.url, "_blank", "noopener,noreferrer");
            onClose();
          },
        });
      }
    }

    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- go/toggleTheme/quickAddFromQuery close over current query/appearance intentionally
  }, [query, collections, bookmarkResults, appearance.colorScheme]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- keep selection in range as the result set changes
    setSelectedIndex(0);
  }, [items.length]);

  function isImagePath(icon: string | null): boolean {
    return !!icon && icon.startsWith("/uploads/");
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (quickAdd) {
      if (e.key === "Escape") {
        e.preventDefault();
        setQuickAdd(false);
      }
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => (items.length ? (i + 1) % items.length : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => (items.length ? (i - 1 + items.length) % items.length : 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      items[selectedIndex]?.onSelect();
    } else if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    }
  }

  if (!open) return null;

  let lastSection: string | null = null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 px-4 pt-16 sm:pt-24" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
        className="w-full max-w-lg rounded-lg border border-[var(--border)] bg-[var(--surface-0)] shadow-xl flex flex-col overflow-hidden"
      >
        {quickAdd ? (
          <form onSubmit={submitQuickAddForm} className="p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-[var(--text-secondary)]">Add bookmark</h2>
              <button
                type="button"
                onClick={() => setQuickAdd(false)}
                className="text-[var(--text-faint)] hover:text-[var(--text-secondary)] text-lg leading-none"
              >
                ×
              </button>
            </div>
            <input
              autoFocus
              required
              type="url"
              value={quickAddUrl}
              onChange={(e) => setQuickAddUrl(e.target.value)}
              placeholder="https://example.com"
              className="w-full rounded-md bg-[var(--surface-1)] border border-[var(--border)] px-2.5 py-1.5 text-sm text-[var(--text-secondary)] placeholder:text-[var(--text-faint)] focus:outline-none focus:border-[var(--border-stronger)]"
            />
            <input
              value={quickAddTitle}
              onChange={(e) => setQuickAddTitle(e.target.value)}
              placeholder="Title (auto-detected if left blank)"
              className="w-full rounded-md bg-[var(--surface-1)] border border-[var(--border)] px-2.5 py-1.5 text-sm text-[var(--text-secondary)] placeholder:text-[var(--text-faint)] focus:outline-none focus:border-[var(--border-stronger)]"
            />
            {quickAddError && <p className="text-xs text-red-400">{quickAddError}</p>}
            <button
              type="submit"
              disabled={quickAddSaving}
              className="self-end px-3 py-1.5 text-sm rounded-md bg-[var(--accent-strong)] text-white hover:bg-[var(--accent)] disabled:opacity-50"
            >
              {quickAddSaving ? "Saving…" : "Save bookmark"}
            </button>
          </form>
        ) : (
          <>
            <div className="flex items-center gap-2 px-3 py-2.5 border-b border-[var(--border)]">
              <span className="text-[var(--text-faint)]">🔎</span>
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search bookmarks, collections, or paste a URL…"
                className="flex-1 min-w-0 bg-transparent text-sm text-[var(--text-secondary)] placeholder:text-[var(--text-faint)] focus:outline-none"
              />
              {quickAddError && <p className="text-xs text-red-400 shrink-0">{quickAddError}</p>}
            </div>

            <div className="max-h-80 overflow-y-auto py-1.5">
              {items.length === 0 && (
                <p className="px-3 py-6 text-center text-xs text-[var(--text-faint)]">No matches.</p>
              )}
              {items.map((item, i) => {
                const showHeader = item.section !== lastSection;
                lastSection = item.section;
                return (
                  <div key={item.id}>
                    {showHeader && (
                      <div className="px-3 pt-2 pb-1 text-[11px] font-semibold uppercase tracking-wide text-[var(--text-faint)]">
                        {item.section}
                      </div>
                    )}
                    <button
                      onClick={item.onSelect}
                      onMouseEnter={() => setSelectedIndex(i)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 text-left text-sm ${
                        i === selectedIndex
                          ? "bg-[var(--surface-2)] text-[var(--text-primary)]"
                          : "text-[var(--text-body)]"
                      }`}
                    >
                      {item.section === "Bookmarks" ? (
                        <Favicon
                          faviconPath={bookmarkResults.find((b) => `bookmark-${b.id}` === item.id)?.faviconPath ?? null}
                          domain={item.sublabel ?? null}
                          size={16}
                        />
                      ) : (
                        <span className="w-4 text-center shrink-0">{item.icon}</span>
                      )}
                      <span className="min-w-0 flex-1 truncate">{item.label}</span>
                      {item.sublabel && item.section !== "Bookmarks" && (
                        <span className="shrink-0 text-xs text-[var(--text-faint)]">{item.sublabel}</span>
                      )}
                      {item.sublabel && item.section === "Bookmarks" && (
                        <span className="shrink-0 text-xs text-[var(--text-faint)] truncate max-w-[120px]">
                          {item.sublabel}
                        </span>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center gap-3 px-3 py-2 border-t border-[var(--border)] text-[11px] text-[var(--text-faint)]">
              <span>↑↓ Navigate</span>
              <span>↵ Select</span>
              <span>Esc Close</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
