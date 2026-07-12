"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api-client";
import { CollectionSelect } from "@/components/CollectionSelect";
import { useAppData } from "@/components/providers";
import type { BookmarkDTO, IconAssetDTO, TagDTO } from "@/lib/types";
import { ACCENT_COLORS, isHexColor } from "@/lib/accent-colors";
import { GRID_PATTERN_OPTIONS, GRID_PATTERN_CATEGORIES } from "@/lib/grid-patterns";

const TABS = [
  { id: "connect", label: "Connect" },
  { id: "data", label: "Data" },
  { id: "icons", label: "Icon Library" },
  { id: "tags", label: "Tags" },
  { id: "appearance", label: "Appearance" },
  { id: "account", label: "Account" },
] as const;
type TabId = (typeof TABS)[number]["id"];

export default function SettingsPage() {
  const [tab, setTab] = useState<TabId>("connect");

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 max-w-5xl flex flex-col gap-6 sm:px-6 sm:py-6">
      <h1 className="text-lg font-semibold text-[var(--text-primary)]">Settings</h1>

      <div className="flex gap-1 shrink-0 overflow-x-auto border-b border-[var(--border)] sticky top-0 bg-[var(--surface-1)] z-10">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-3 py-2 text-sm border-b-2 -mb-px whitespace-nowrap transition-colors ${
              tab === t.id
                ? "border-[var(--accent)] text-[var(--text-primary)]"
                : "border-transparent text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "icons" && <IconLibrarySection />}
      {tab === "tags" && <TagsSection />}

      {tab !== "icons" && tab !== "tags" && (
        <div className="columns-1 lg:columns-2 gap-6">
          {tab === "connect" && (
            <>
              <ApiTokenSection />
              <BookmarkletSection />
              <ExtensionSection />
            </>
          )}
          {tab === "data" && (
            <>
              <AutoScanSection />
              <ImportSection />
              <ExportSection />
              <FaviconRefreshSection />
              <CoverRefreshSection />
              <BrokenLinkSection />
              <DuplicatesSection />
              <TrashSection />
            </>
          )}
          {tab === "appearance" && (
            <>
              <AppearanceSection />
              <DensitySection />
            </>
          )}
          {tab === "account" && <AccountSection />}
        </div>
      )}

      {/* Full-width, not in the masonry columns above: its swatch grid is much
          taller than Theme/Density, which threw off column balance when mixed in. */}
      {tab === "appearance" && <BackgroundPatternSection />}
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3 mb-6 break-inside-avoid">
      <h2 className="text-sm font-semibold text-[var(--text-secondary)]">{title}</h2>
      <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-0)] p-4 flex flex-col gap-3 text-sm text-[var(--text-body)]">
        {children}
      </div>
    </section>
  );
}

function ApiTokenSection() {
  const [token, setToken] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.get<{ token: string }>("/api/settings/token").then((r) => setToken(r.token));
  }, []);

  async function regenerate() {
    if (!window.confirm("Regenerate the API token? The browser extension will need the new one.")) return;
    setBusy(true);
    try {
      const r = await api.post<{ token: string }>("/api/settings/token");
      setToken(r.token);
      setRevealed(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card title="API token">
      <p>
        Used by the browser extension to save bookmarks to this server. Paste it into the extension&apos;s options
        page after installing it.
      </p>
      <div className="flex items-center gap-2">
        <code className="flex-1 truncate rounded bg-[var(--surface-1)] border border-[var(--border)] px-2.5 py-1.5 text-xs">
          {token ? (revealed ? token : "•".repeat(24)) : "Loading…"}
        </code>
        <button
          onClick={() => setRevealed((v) => !v)}
          className="px-2.5 py-1.5 text-xs rounded-md border border-[var(--border)] hover:bg-[var(--surface-2)]"
        >
          {revealed ? "Hide" : "Reveal"}
        </button>
        <button
          onClick={() => token && navigator.clipboard.writeText(token)}
          className="px-2.5 py-1.5 text-xs rounded-md border border-[var(--border)] hover:bg-[var(--surface-2)]"
        >
          Copy
        </button>
      </div>
      <button
        onClick={regenerate}
        disabled={busy}
        className="self-start px-2.5 py-1.5 text-xs rounded-md border border-[var(--border)] hover:bg-[var(--surface-2)] disabled:opacity-50"
      >
        Regenerate token
      </button>
    </Card>
  );
}

function BookmarkletSection() {
  const [origin] = useState(() => (typeof window !== "undefined" ? window.location.origin : ""));

  const code = `javascript:(function(){window.open('${origin}/quick-save?url='+encodeURIComponent(location.href)+'&title='+encodeURIComponent(document.title),'waypoint-quick-save','width=480,height=640')})();`;

  return (
    <Card title="Bookmarklet">
      <p>Drag this link to your bookmarks bar. Click it on any page to save it to Waypoint in one click — no extension needed.</p>
      <a
        href={code}
        onClick={(e) => e.preventDefault()}
        draggable
        className="self-start px-3 py-1.5 text-sm rounded-md bg-[var(--surface-2)] text-[var(--text-primary)] cursor-grab"
      >
        📌 Save to Waypoint
      </a>
    </Card>
  );
}

function ExtensionSection() {
  return (
    <Card title="Browser extension">
      <p>For a one-click save without opening a popup window, install the extension in this repo:</p>
      <ol className="list-decimal list-inside flex flex-col gap-1">
        <li>
          In the repo: <code className="bg-[var(--surface-1)] px-1 rounded">cd extension && npm install && npm run build</code>
        </li>
        <li>Open <code className="bg-[var(--surface-1)] px-1 rounded">chrome://extensions</code>, enable Developer mode</li>
        <li>
          Click &quot;Load unpacked&quot; and select <code className="bg-[var(--surface-1)] px-1 rounded">extension/dist</code>
        </li>
        <li>Open the extension&apos;s options page and paste in the API token above, plus this server&apos;s URL</li>
      </ol>
    </Card>
  );
}

function ImportSection() {
  const { refreshCollections } = useAppData();
  const [parentId, setParentId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const form = new FormData();
      form.set("file", file);
      if (parentId) form.set("parentId", parentId);
      const r = await api.upload<{ collectionsCreated: number; bookmarksCreated: number }>("/api/import", form);
      setResult(`Imported ${r.bookmarksCreated} bookmarks into ${r.collectionsCreated} new collections.`);
      await refreshCollections();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Import failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card title="Import bookmarks">
      <p>
        Import a bookmarks export (Netscape Bookmark File Format — the .html file Chrome, Firefox, and Raindrop all
        produce). Folder structure and embedded favicons are preserved.
      </p>
      <label className="text-xs text-[var(--text-faint)]">Import into</label>
      <CollectionSelect value={parentId} onChange={setParentId} />
      <input
        type="file"
        accept=".html,text/html"
        disabled={busy}
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        className="text-xs"
      />
      {result && <p className="text-xs text-green-400">{result}</p>}
      {error && <p className="text-xs text-red-400">{error}</p>}
    </Card>
  );
}

const SCAN_INTERVAL_OPTIONS = [
  { hours: 6, label: "Every 6 hours" },
  { hours: 12, label: "Every 12 hours" },
  { hours: 24, label: "Daily" },
  { hours: 72, label: "Every 3 days" },
  { hours: 168, label: "Weekly" },
];

function formatRelativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.round(diffMs / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.round(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

interface AutoScanSummary {
  faviconsFound: number;
  coversFound: number;
  linksChecked: number;
  brokenLinksFound: number;
  errors: string[];
}

interface AutoScanState {
  autoScanEnabled: boolean;
  autoScanIntervalHours: number;
  lastAutoScanAt: string | null;
  lastAutoScanSummary: AutoScanSummary | null;
}

function AutoScanSection() {
  const [state, setState] = useState<AutoScanState | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.get<AutoScanState>("/api/settings/auto-scan").then(setState);
  }, []);

  async function patch(update: Partial<Pick<AutoScanState, "autoScanEnabled" | "autoScanIntervalHours">>) {
    if (!state) return;
    const previous = state;
    setSaving(true);
    setError(null);
    setState({ ...state, ...update });
    try {
      await api.patch("/api/settings/auto-scan", update);
    } catch (err) {
      setState(previous);
      setError(err instanceof ApiError ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card title="Automatic scans">
      <p>
        Periodically fetches missing favicons and cover images, and checks for broken links, in the background —
        the same work as the buttons below, run on a schedule instead of by hand.
      </p>

      {!state ? (
        <p className="text-xs text-[var(--text-faint)]">Loading…</p>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[var(--text-secondary)] font-medium">Enable automatic scans</p>
              <p className="text-xs text-[var(--text-faint)]">
                Last ran {state.lastAutoScanAt ? formatRelativeTime(state.lastAutoScanAt) : "never"}
              </p>
              {state.lastAutoScanSummary && (
                <p className="text-xs text-[var(--text-faint)]">
                  {state.lastAutoScanSummary.faviconsFound} favicon{state.lastAutoScanSummary.faviconsFound === 1 ? "" : "s"}
                  , {state.lastAutoScanSummary.coversFound} cover image{state.lastAutoScanSummary.coversFound === 1 ? "" : "s"}
                  , {state.lastAutoScanSummary.linksChecked} link{state.lastAutoScanSummary.linksChecked === 1 ? "" : "s"}{" "}
                  checked ({state.lastAutoScanSummary.brokenLinksFound} broken)
                </p>
              )}
              {state.lastAutoScanSummary && state.lastAutoScanSummary.errors.length > 0 && (
                <p className="text-xs text-red-400">{state.lastAutoScanSummary.errors.join("; ")}</p>
              )}
            </div>
            <button
              onClick={() => patch({ autoScanEnabled: !state.autoScanEnabled })}
              disabled={saving}
              role="switch"
              aria-checked={state.autoScanEnabled}
              className={`inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:opacity-50 ${
                state.autoScanEnabled ? "bg-[var(--accent)]" : "bg-[var(--surface-2)]"
              }`}
            >
              <span
                className={`inline-block h-5 w-5 rounded-full bg-white transition-transform ${
                  state.autoScanEnabled ? "translate-x-5" : "translate-x-0.5"
                }`}
              />
            </button>
          </div>

          {state.autoScanEnabled && (
            <div className="pt-2 border-t border-[var(--border)] flex items-center justify-between">
              <p className="text-[var(--text-secondary)] font-medium">Frequency</p>
              <select
                value={state.autoScanIntervalHours}
                onChange={(e) => patch({ autoScanIntervalHours: Number(e.target.value) })}
                disabled={saving}
                className="rounded-md bg-[var(--surface-1)] border border-[var(--border)] px-2.5 py-1.5 text-sm text-[var(--text-secondary)] focus:outline-none focus:border-[var(--border-stronger)] disabled:opacity-50"
              >
                {SCAN_INTERVAL_OPTIONS.map((o) => (
                  <option key={o.hours} value={o.hours}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          )}
        </>
      )}
      {error && <p className="text-xs text-red-400">{error}</p>}
    </Card>
  );
}

function FaviconRefreshSection() {
  const [missingCount, setMissingCount] = useState<number | null>(null);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number; updated: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.get<{ count: number }>("/api/bookmarks/refresh-favicons").then((r) => setMissingCount(r.count));
  }, []);

  async function run() {
    setRunning(true);
    setError(null);
    const startTotal = missingCount ?? 0;
    let done = 0;
    let updatedTotal = 0;
    setProgress({ done: 0, total: startTotal, updated: 0 });
    try {
      for (;;) {
        const r = await api.post<{ processed: number; updated: number; remaining: number }>(
          "/api/bookmarks/refresh-favicons",
          { limit: 20 }
        );
        done += r.processed;
        updatedTotal += r.updated;
        setProgress({ done, total: done + r.remaining, updated: updatedTotal });
        setMissingCount(r.remaining);
        if (r.remaining === 0 || r.processed === 0) break;
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to refresh favicons");
    } finally {
      setRunning(false);
    }
  }

  return (
    <Card title="Favicons">
      <p>
        Bookmarks imported without an embedded icon — common with Raindrop and other exports — show a plain
        color square instead of a favicon. This fetches missing favicons from each bookmark&apos;s live URL, no
        manual upload needed.
      </p>

      {missingCount === null ? (
        <p className="text-xs text-[var(--text-faint)]">Checking…</p>
      ) : missingCount === 0 && !progress ? (
        <p className="text-xs text-green-400">All bookmarks already have a favicon.</p>
      ) : (
        <>
          {!running && missingCount > 0 && (
            <p className="text-xs text-[var(--text-faint)]">
              {missingCount} bookmark{missingCount === 1 ? "" : "s"} missing a favicon.
            </p>
          )}
          <button
            onClick={run}
            disabled={running || missingCount === 0}
            className="self-start px-2.5 py-1.5 text-xs rounded-md border border-[var(--border)] hover:bg-[var(--surface-2)] disabled:opacity-50"
          >
            {running ? "Refreshing…" : "Refresh missing favicons"}
          </button>
        </>
      )}

      {progress && (
        <p className="text-xs text-[var(--text-faint)]">
          Checked {progress.done} of {progress.total} — {progress.updated} favicon{progress.updated === 1 ? "" : "s"}{" "}
          found{!running && progress.done >= progress.total ? " (done)" : ""}
        </p>
      )}
      {error && <p className="text-xs text-red-400">{error}</p>}
    </Card>
  );
}

function CoverRefreshSection() {
  const [missingCount, setMissingCount] = useState<number | null>(null);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number; updated: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.get<{ count: number }>("/api/bookmarks/refresh-covers").then((r) => setMissingCount(r.count));
  }, []);

  async function run() {
    setRunning(true);
    setError(null);
    const startTotal = missingCount ?? 0;
    let done = 0;
    let updatedTotal = 0;
    setProgress({ done: 0, total: startTotal, updated: 0 });
    try {
      for (;;) {
        const r = await api.post<{ processed: number; updated: number; remaining: number }>(
          "/api/bookmarks/refresh-covers",
          { limit: 20 }
        );
        done += r.processed;
        updatedTotal += r.updated;
        setProgress({ done, total: done + r.remaining, updated: updatedTotal });
        setMissingCount(r.remaining);
        if (r.remaining === 0 || r.processed === 0) break;
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to refresh cover images");
    } finally {
      setRunning(false);
    }
  }

  return (
    <Card title="Cover images">
      <p>
        Bookmarks without a cover image show a plain color block in Cards and Moodboard view. This fetches each
        bookmark&apos;s og:image from its live URL, no manual upload needed.
      </p>

      {missingCount === null ? (
        <p className="text-xs text-[var(--text-faint)]">Checking…</p>
      ) : missingCount === 0 && !progress ? (
        <p className="text-xs text-green-400">All bookmarks already have a cover image.</p>
      ) : (
        <>
          {!running && missingCount > 0 && (
            <p className="text-xs text-[var(--text-faint)]">
              {missingCount} bookmark{missingCount === 1 ? "" : "s"} missing a cover image.
            </p>
          )}
          <button
            onClick={run}
            disabled={running || missingCount === 0}
            className="self-start px-2.5 py-1.5 text-xs rounded-md border border-[var(--border)] hover:bg-[var(--surface-2)] disabled:opacity-50"
          >
            {running ? "Refreshing…" : "Refresh missing cover images"}
          </button>
        </>
      )}

      {progress && (
        <p className="text-xs text-[var(--text-faint)]">
          Checked {progress.done} of {progress.total} — {progress.updated} cover image{progress.updated === 1 ? "" : "s"}{" "}
          found{!running && progress.done >= progress.total ? " (done)" : ""}
        </p>
      )}
      {error && <p className="text-xs text-red-400">{error}</p>}
    </Card>
  );
}

function BrokenLinkSection() {
  const [since] = useState(() => Date.now());
  const [remaining, setRemaining] = useState<number | null>(null);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number; broken: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.get<{ remaining: number }>(`/api/bookmarks/check-links?since=${since}`).then((r) => setRemaining(r.remaining));
  }, [since]);

  async function run() {
    setRunning(true);
    setError(null);
    const startTotal = remaining ?? 0;
    let done = 0;
    let brokenTotal = 0;
    setProgress({ done: 0, total: startTotal, broken: 0 });
    try {
      for (;;) {
        const r = await api.post<{ processed: number; broken: number; remaining: number }>(
          "/api/bookmarks/check-links",
          { since, limit: 20 }
        );
        done += r.processed;
        brokenTotal += r.broken;
        setProgress({ done, total: done + r.remaining, broken: brokenTotal });
        setRemaining(r.remaining);
        if (r.remaining === 0 || r.processed === 0) break;
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to check links");
    } finally {
      setRunning(false);
    }
  }

  return (
    <Card title="Broken links">
      <p>
        Checks every bookmark&apos;s URL to see if it still resolves. Links that time out or return an error are
        flagged so you can review or remove them — nothing is deleted automatically.
      </p>

      {remaining === null ? (
        <p className="text-xs text-[var(--text-faint)]">Checking…</p>
      ) : (
        <>
          {!running && !progress && (
            <p className="text-xs text-[var(--text-faint)]">
              {remaining} bookmark{remaining === 1 ? "" : "s"} to check.
            </p>
          )}
          <button
            onClick={run}
            disabled={running || remaining === 0}
            className="self-start px-2.5 py-1.5 text-xs rounded-md border border-[var(--border)] hover:bg-[var(--surface-2)] disabled:opacity-50"
          >
            {running ? "Checking…" : "Check for broken links"}
          </button>
        </>
      )}

      {progress && (
        <p className="text-xs text-[var(--text-faint)]">
          Checked {progress.done} of {progress.total} — {progress.broken} broken link{progress.broken === 1 ? "" : "s"}{" "}
          found{!running && progress.done >= progress.total ? " (done)" : ""}
        </p>
      )}
      {error && <p className="text-xs text-red-400">{error}</p>}
    </Card>
  );
}

const IMAGE_EXT = /\.(png|jpe?g|gif|webp|svg|ico)$/i;

function categoryForFile(file: File): string {
  const rel = file.webkitRelativePath || file.name;
  const parts = rel.split("/");
  if (parts.length >= 3) return parts[parts.length - 2]; // immediate parent subfolder
  if (parts.length === 2) return parts[0]; // file sits directly in the chosen folder
  return "Uploaded icons";
}

function IconLibrarySection() {
  const { iconAssets, refreshIconAssets } = useAppData();
  const folderInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  useEffect(() => {
    // webkitdirectory/directory aren't in React's JSX typings for <input>, so
    // set them imperatively — this is what actually enables folder selection.
    folderInputRef.current?.setAttribute("webkitdirectory", "");
    folderInputRef.current?.setAttribute("directory", "");
  }, []);

  const categories = useMemo(() => {
    const byCategory = new Map<string, IconAssetDTO[]>();
    for (const asset of iconAssets) {
      const list = byCategory.get(asset.category) ?? [];
      list.push(asset);
      byCategory.set(asset.category, list);
    }
    return Array.from(byCategory.entries());
  }, [iconAssets]);

  function toggleCategory(category: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(category)) next.delete(category);
      else next.add(category);
      return next;
    });
  }

  async function handleFolderSelect(fileList: FileList) {
    const files = Array.from(fileList).filter((f) => IMAGE_EXT.test(f.name));
    if (files.length === 0) {
      setError("No image files found in that folder.");
      return;
    }
    setUploading(true);
    setError(null);
    let done = 0;
    setProgress({ done: 0, total: files.length });
    const CONCURRENCY = 4;
    try {
      for (let i = 0; i < files.length; i += CONCURRENCY) {
        const batch = files.slice(i, i + CONCURRENCY);
        await Promise.all(
          batch.map(async (file) => {
            const form = new FormData();
            form.set("file", file);
            form.set("category", categoryForFile(file));
            try {
              await api.upload("/api/icon-assets", form);
            } catch {
              // Not an image, too large, etc. — skip it and keep going.
            } finally {
              done++;
              setProgress({ done, total: files.length });
            }
          })
        );
      }
      await refreshIconAssets();
    } finally {
      setUploading(false);
    }
  }

  async function deleteCategory(category: string) {
    if (!window.confirm(`Delete all icons in "${category}"?`)) return;
    await api.delete(`/api/icon-assets?category=${encodeURIComponent(category)}`);
    await refreshIconAssets();
  }

  async function deleteIcon(id: string) {
    await api.delete(`/api/icon-assets/${id}`);
    await refreshIconAssets();
  }

  return (
    <Card title="Icon library">
      <p>
        Upload your own icons for the collection icon picker. Choose a folder with images sorted into
        subfolders — each subfolder becomes a labeled category, same as the built-in emoji sections.
      </p>
      <button
        onClick={() => folderInputRef.current?.click()}
        disabled={uploading}
        className="self-start px-2.5 py-1.5 text-xs rounded-md border border-[var(--border)] hover:bg-[var(--surface-2)] disabled:opacity-50"
      >
        {uploading ? "Uploading…" : "Choose a folder"}
      </button>
      <input
        ref={folderInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => e.target.files && handleFolderSelect(e.target.files)}
      />
      {progress && (
        <p className="text-xs text-[var(--text-faint)]">
          Uploaded {progress.done} of {progress.total}
          {!uploading && progress.done >= progress.total ? " (done)" : ""}
        </p>
      )}
      {error && <p className="text-xs text-red-400">{error}</p>}

      {categories.length > 0 && (
        <div className="flex flex-col gap-1 pt-2 border-t border-[var(--border)]">
          {categories.map(([category, icons]) => {
            const isOpen = expanded.has(category);
            return (
              <div key={category} className="border-b border-[var(--border-a70)] last:border-b-0">
                <div className="flex items-center justify-between py-1.5">
                  <button
                    onClick={() => toggleCategory(category)}
                    className="flex items-center gap-1.5 text-xs font-medium text-[var(--text-body)] hover:text-[var(--text-primary)]"
                  >
                    <span className={`text-[var(--text-faint)] transition-transform ${isOpen ? "rotate-90" : ""}`}>▶</span>
                    {category} <span className="text-[var(--text-faint)]">({icons.length})</span>
                  </button>
                  <button onClick={() => deleteCategory(category)} className="text-xs text-[var(--text-faint)] hover:text-red-400">
                    Delete category
                  </button>
                </div>
                {isOpen && (
                  <div className="flex flex-wrap gap-1.5 pb-2">
                    {icons.map((icon) => (
                      <div key={icon.id} className="group relative">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={icon.path} alt="" className="h-8 w-8 rounded border border-[var(--border)] object-cover" />
                        <button
                          onClick={() => deleteIcon(icon.id)}
                          title="Remove"
                          className="absolute -top-1.5 -right-1.5 hidden group-hover:flex h-4 w-4 items-center justify-center rounded-full bg-[var(--surface-2)] text-[var(--text-body)] hover:bg-red-600 hover:text-white text-[10px] leading-none"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

function TagsSection() {
  const { tags, refreshTags } = useAppData();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function startEdit(tag: TagDTO) {
    setEditingId(tag.id);
    setEditValue(tag.name);
  }

  async function commitEdit(tag: TagDTO) {
    const name = editValue.trim().toLowerCase();
    setEditingId(null);
    if (!name || name === tag.name) return;
    setBusyId(tag.id);
    setError(null);
    try {
      await api.patch(`/api/tags/${tag.id}`, { name });
      await refreshTags();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to rename tag");
    } finally {
      setBusyId(null);
    }
  }

  async function remove(tag: TagDTO) {
    const count = tag._count?.bookmarks ?? 0;
    const extra = count > 0 ? ` It will be removed from ${count} bookmark${count === 1 ? "" : "s"}.` : "";
    if (!window.confirm(`Delete tag "${tag.name}"?${extra}`)) return;
    setBusyId(tag.id);
    setError(null);
    try {
      await api.delete(`/api/tags/${tag.id}`);
      await refreshTags();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to delete tag");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <Card title="Tags">
      <p>Rename or delete tags across your whole library. Renaming a tag to an existing tag&apos;s name merges the two.</p>

      {tags.length === 0 ? (
        <p className="text-xs text-[var(--text-faint)]">No tags yet.</p>
      ) : (
        <div className="flex flex-col">
          {tags.map((tag) => (
            <div
              key={tag.id}
              className="group flex items-center gap-3 py-2 border-b border-[var(--border-a70)] last:border-b-0"
            >
              {editingId === tag.id ? (
                <input
                  autoFocus
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onBlur={() => commitEdit(tag)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") commitEdit(tag);
                    if (e.key === "Escape") setEditingId(null);
                  }}
                  className="flex-1 min-w-0 bg-[var(--surface-1)] border border-[var(--border-strong)] rounded px-2 py-1 text-sm text-[var(--text-secondary)]"
                />
              ) : (
                <button
                  onClick={() => startEdit(tag)}
                  disabled={busyId === tag.id}
                  className="flex-1 min-w-0 text-left text-sm text-[var(--text-body)] hover:text-[var(--text-primary)] truncate disabled:opacity-50"
                  title="Click to rename"
                >
                  {tag.name}
                </button>
              )}
              <span className="shrink-0 text-xs text-[var(--text-faint)] tabular-nums">
                {tag._count?.bookmarks ?? 0} bookmark{(tag._count?.bookmarks ?? 0) === 1 ? "" : "s"}
              </span>
              <button
                onClick={() => remove(tag)}
                disabled={busyId === tag.id}
                className="shrink-0 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity text-xs px-2 py-1 rounded-md border border-[var(--border-strong)] text-[var(--text-muted)] hover:bg-red-950/50 hover:text-red-400 hover:border-red-900 disabled:opacity-50"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
      {error && <p className="text-xs text-red-400">{error}</p>}
    </Card>
  );
}

function AppearanceSection() {
  const { appearance, setAppearance } = useAppData();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function patch(field: "accentColor" | "colorScheme", value: string) {
    const previous = appearance[field];
    setSaving(true);
    setError(null);
    setAppearance({ [field]: value });
    try {
      await api.patch("/api/settings/appearance", { [field]: value });
    } catch (err) {
      setAppearance({ [field]: previous });
      setError(err instanceof ApiError ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card title="Theme">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[var(--text-secondary)] font-medium">Color scheme</p>
          <p className="text-xs text-[var(--text-faint)]">Light, dark, or match your system</p>
        </div>
        <div className="flex rounded-md border border-[var(--border)] overflow-hidden">
          {(["light", "dark", "auto"] as const).map((scheme) => (
            <button
              key={scheme}
              onClick={() => patch("colorScheme", scheme)}
              disabled={saving}
              className={`px-3 py-1.5 text-xs capitalize disabled:opacity-50 ${
                appearance.colorScheme === scheme
                  ? "bg-[var(--surface-2)] text-[var(--text-primary)]"
                  : "text-[var(--text-faint)] hover:text-[var(--text-secondary)]"
              }`}
            >
              {scheme}
            </button>
          ))}
        </div>
      </div>

      <div className="pt-2 border-t border-[var(--border)]">
        <p className="text-[var(--text-secondary)] font-medium pb-0.5">Accent color</p>
        <p className="text-xs text-[var(--text-faint)] pb-2">Controls buttons, selection highlights, and interactive elements.</p>
        <div className="flex flex-wrap gap-2 items-center">
          {ACCENT_COLORS.map((c) => (
            <button
              key={c.value}
              onClick={() => patch("accentColor", c.value)}
              disabled={saving}
              title={c.label}
              className="h-7 w-7 rounded-full disabled:opacity-50"
              style={{
                backgroundColor: c.hex,
                outline: appearance.accentColor === c.value ? "2px solid var(--text-primary)" : "none",
                outlineOffset: "2px",
              }}
            />
          ))}
          <label
            title="Custom color"
            className="relative h-7 w-7 shrink-0 rounded-full cursor-pointer"
            style={{
              background: isHexColor(appearance.accentColor)
                ? appearance.accentColor
                : "conic-gradient(from 0deg, #ef4444, #eab308, #22c55e, #06b6d4, #3b82f6, #a855f7, #ef4444)",
              outline: isHexColor(appearance.accentColor) ? "2px solid var(--text-primary)" : "none",
              outlineOffset: "2px",
            }}
          >
            <input
              type="color"
              value={isHexColor(appearance.accentColor) ? appearance.accentColor : "#3b82f6"}
              onChange={(e) => patch("accentColor", e.target.value)}
              disabled={saving}
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
            />
          </label>
        </div>
        {isHexColor(appearance.accentColor) && (
          <p className="pt-1.5 text-xs text-[var(--text-faint)]">Custom: {appearance.accentColor}</p>
        )}
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </Card>
  );
}

function BackgroundPatternSection() {
  const { appearance, setAppearance } = useAppData();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function choose(value: string) {
    const previous = appearance.gridPattern;
    setSaving(true);
    setError(null);
    setAppearance({ gridPattern: value });
    try {
      await api.patch("/api/settings/appearance", { gridPattern: value });
    } catch (err) {
      setAppearance({ gridPattern: previous });
      setError(err instanceof ApiError ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card title="Background pattern">
      <p>Pattern shown behind the bookmark grid.</p>
      <div className="flex flex-col gap-4">
        {GRID_PATTERN_CATEGORIES.map((category) => (
          <div key={category}>
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-faint)] pb-2">{category}</p>
            <div className="flex flex-wrap gap-2.5">
              {GRID_PATTERN_OPTIONS.filter((o) => o.category === category).map((option) => (
                <button
                  key={option.value}
                  onClick={() => choose(option.value)}
                  disabled={saving}
                  title={option.label}
                  className="flex flex-col items-center gap-1 disabled:opacity-50"
                >
                  <div
                    className="h-14 w-20 rounded-md border-2 bg-[var(--surface-1)]"
                    style={{
                      ...option.style,
                      borderColor: appearance.gridPattern === option.value ? "var(--accent)" : "var(--border)",
                    }}
                  />
                  <span className="text-xs text-[var(--text-faint)]">{option.label}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </Card>
  );
}

function DensitySection() {
  const { appearance, setAppearance } = useAppData();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function choose(value: string) {
    const previous = appearance.density;
    setSaving(true);
    setError(null);
    setAppearance({ density: value });
    try {
      await api.patch("/api/settings/appearance", { density: value });
    } catch (err) {
      setAppearance({ density: previous });
      setError(err instanceof ApiError ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card title="Density">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[var(--text-secondary)] font-medium">Layout density</p>
          <p className="text-xs text-[var(--text-faint)]">Comfortable spacing or a more compact layout</p>
        </div>
        <div className="flex rounded-md border border-[var(--border)] overflow-hidden">
          {(["comfortable", "compact"] as const).map((d) => (
            <button
              key={d}
              onClick={() => choose(d)}
              disabled={saving}
              className={`px-3 py-1.5 text-xs capitalize disabled:opacity-50 ${
                appearance.density === d
                  ? "bg-[var(--surface-2)] text-[var(--text-primary)]"
                  : "text-[var(--text-faint)] hover:text-[var(--text-secondary)]"
              }`}
            >
              {d}
            </button>
          ))}
        </div>
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </Card>
  );
}

function AccountSection() {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    if (newPassword !== confirmPassword) {
      setError("New passwords don't match");
      return;
    }
    setSaving(true);
    try {
      await api.patch("/api/auth/password", { currentPassword, newPassword });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setSuccess(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to change password");
    } finally {
      setSaving(false);
    }
  }

  async function signOut() {
    setSigningOut(true);
    try {
      await api.post("/api/auth/logout");
      router.push("/login");
      router.refresh();
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <>
      <Card title="Change password">
        <form onSubmit={changePassword} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-[var(--text-faint)]">Current password</label>
            <input
              required
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full rounded-md bg-[var(--surface-1)] border border-[var(--border)] px-2.5 py-1.5 text-sm text-[var(--text-secondary)] focus:outline-none focus:border-[var(--border-stronger)]"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-[var(--text-faint)]">New password</label>
            <input
              required
              type="password"
              minLength={8}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full rounded-md bg-[var(--surface-1)] border border-[var(--border)] px-2.5 py-1.5 text-sm text-[var(--text-secondary)] focus:outline-none focus:border-[var(--border-stronger)]"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-[var(--text-faint)]">Confirm new password</label>
            <input
              required
              type="password"
              minLength={8}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full rounded-md bg-[var(--surface-1)] border border-[var(--border)] px-2.5 py-1.5 text-sm text-[var(--text-secondary)] focus:outline-none focus:border-[var(--border-stronger)]"
            />
          </div>
          {error && <p className="text-xs text-red-400">{error}</p>}
          {success && <p className="text-xs text-green-400">Password changed.</p>}
          <button
            type="submit"
            disabled={saving}
            className="self-start px-3 py-1.5 text-sm rounded-md bg-[var(--accent-strong)] text-white hover:bg-[var(--accent)] disabled:opacity-50"
          >
            {saving ? "Saving…" : "Change password"}
          </button>
        </form>
      </Card>

      <Card title="Sign out">
        <p>Signs you out of this device and invalidates any other active sessions.</p>
        <button
          onClick={signOut}
          disabled={signingOut}
          className="self-start px-3 py-1.5 text-sm rounded-md border border-[var(--border-strong)] text-[var(--text-secondary)] hover:bg-[var(--surface-2)] disabled:opacity-50"
        >
          {signingOut ? "Signing out…" : "Sign out"}
        </button>
      </Card>
    </>
  );
}

function ExportSection() {
  return (
    <Card title="Export bookmarks">
      <p>
        Download everything as a Netscape Bookmark File (the same .html format Import accepts) — collection
        structure is preserved as nested folders, and each bookmark&apos;s favicon is embedded directly in the
        file so it survives the round trip without needing a live fetch.
      </p>
      <a
        href="/api/export"
        download
        className="self-start px-2.5 py-1.5 text-xs rounded-md border border-[var(--border)] hover:bg-[var(--surface-2)]"
      >
        Download export
      </a>
    </Card>
  );
}

function DuplicatesSection() {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    api.get<{ groups: unknown[][] }>("/api/bookmarks/duplicates").then((r) => setCount(r.groups.length));
  }, []);

  return (
    <Card title="Duplicate bookmarks">
      <p>
        Finds bookmarks that share the exact same URL — including port, so two self-hosted services on the same
        LAN address at different ports are never flagged as duplicates.
      </p>
      {count === 0 ? (
        <p className="text-xs text-green-400">No duplicates found.</p>
      ) : (
        <Link
          href="/duplicates"
          className="self-start px-2.5 py-1.5 text-xs rounded-md border border-[var(--border)] hover:bg-[var(--surface-2)]"
        >
          Review duplicates{count !== null ? ` (${count})` : ""}
        </Link>
      )}
    </Card>
  );
}

function TrashSection() {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    api.get<BookmarkDTO[]>("/api/bookmarks/trash").then((r) => setCount(r.length));
  }, []);

  return (
    <Card title="Trash">
      <p>Deleted bookmarks go here first and can be restored, rather than disappearing immediately.</p>
      <Link
        href="/trash"
        className="self-start px-2.5 py-1.5 text-xs rounded-md border border-[var(--border)] hover:bg-[var(--surface-2)]"
      >
        View trash{count !== null ? ` (${count})` : ""}
      </Link>
    </Card>
  );
}
