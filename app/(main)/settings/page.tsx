"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { api, ApiError } from "@/lib/api-client";
import { CollectionSelect } from "@/components/CollectionSelect";
import { useAppData } from "@/components/providers";
import type { BookmarkDTO, IconAssetDTO } from "@/lib/types";

export default function SettingsPage() {
  return (
    <div className="flex-1 overflow-y-auto px-6 py-6 max-w-2xl flex flex-col gap-10">
      <h1 className="text-lg font-semibold text-neutral-100">Settings</h1>
      <ApiTokenSection />
      <BookmarkletSection />
      <ExtensionSection />
      <ImportSection />
      <FaviconRefreshSection />
      <IconLibrarySection />
      <ExportSection />
      <TrashSection />
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-sm font-semibold text-neutral-200">{title}</h2>
      <div className="rounded-lg border border-neutral-800 bg-neutral-950 p-4 flex flex-col gap-3 text-sm text-neutral-300">
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
        <code className="flex-1 truncate rounded bg-neutral-900 border border-neutral-800 px-2.5 py-1.5 text-xs">
          {token ? (revealed ? token : "•".repeat(24)) : "Loading…"}
        </code>
        <button
          onClick={() => setRevealed((v) => !v)}
          className="px-2.5 py-1.5 text-xs rounded-md border border-neutral-800 hover:bg-neutral-800"
        >
          {revealed ? "Hide" : "Reveal"}
        </button>
        <button
          onClick={() => token && navigator.clipboard.writeText(token)}
          className="px-2.5 py-1.5 text-xs rounded-md border border-neutral-800 hover:bg-neutral-800"
        >
          Copy
        </button>
      </div>
      <button
        onClick={regenerate}
        disabled={busy}
        className="self-start px-2.5 py-1.5 text-xs rounded-md border border-neutral-800 hover:bg-neutral-800 disabled:opacity-50"
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
        className="self-start px-3 py-1.5 text-sm rounded-md bg-neutral-800 text-neutral-100 cursor-grab"
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
          In the repo: <code className="bg-neutral-900 px-1 rounded">cd extension && npm install && npm run build</code>
        </li>
        <li>Open <code className="bg-neutral-900 px-1 rounded">chrome://extensions</code>, enable Developer mode</li>
        <li>
          Click &quot;Load unpacked&quot; and select <code className="bg-neutral-900 px-1 rounded">extension/dist</code>
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
      <label className="text-xs text-neutral-500">Import into</label>
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
        <p className="text-xs text-neutral-500">Checking…</p>
      ) : missingCount === 0 && !progress ? (
        <p className="text-xs text-green-400">All bookmarks already have a favicon.</p>
      ) : (
        <>
          {!running && missingCount > 0 && (
            <p className="text-xs text-neutral-500">
              {missingCount} bookmark{missingCount === 1 ? "" : "s"} missing a favicon.
            </p>
          )}
          <button
            onClick={run}
            disabled={running || missingCount === 0}
            className="self-start px-2.5 py-1.5 text-xs rounded-md border border-neutral-800 hover:bg-neutral-800 disabled:opacity-50"
          >
            {running ? "Refreshing…" : "Refresh missing favicons"}
          </button>
        </>
      )}

      {progress && (
        <p className="text-xs text-neutral-500">
          Checked {progress.done} of {progress.total} — {progress.updated} favicon{progress.updated === 1 ? "" : "s"}{" "}
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
        className="self-start px-2.5 py-1.5 text-xs rounded-md border border-neutral-800 hover:bg-neutral-800 disabled:opacity-50"
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
        <p className="text-xs text-neutral-500">
          Uploaded {progress.done} of {progress.total}
          {!uploading && progress.done >= progress.total ? " (done)" : ""}
        </p>
      )}
      {error && <p className="text-xs text-red-400">{error}</p>}

      {categories.length > 0 && (
        <div className="flex flex-col gap-3 pt-2 border-t border-neutral-800">
          {categories.map(([category, icons]) => (
            <div key={category}>
              <div className="flex items-center justify-between pb-1.5">
                <span className="text-xs font-medium text-neutral-300">
                  {category} <span className="text-neutral-500">({icons.length})</span>
                </span>
                <button onClick={() => deleteCategory(category)} className="text-xs text-neutral-500 hover:text-red-400">
                  Delete category
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {icons.map((icon) => (
                  <div key={icon.id} className="group relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={icon.path} alt="" className="h-8 w-8 rounded border border-neutral-800 object-cover" />
                    <button
                      onClick={() => deleteIcon(icon.id)}
                      title="Remove"
                      className="absolute -top-1.5 -right-1.5 hidden group-hover:flex h-4 w-4 items-center justify-center rounded-full bg-neutral-800 text-neutral-300 hover:bg-red-600 hover:text-white text-[10px] leading-none"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
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
        className="self-start px-2.5 py-1.5 text-xs rounded-md border border-neutral-800 hover:bg-neutral-800"
      >
        Download export
      </a>
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
        className="self-start px-2.5 py-1.5 text-xs rounded-md border border-neutral-800 hover:bg-neutral-800"
      >
        View trash{count !== null ? ` (${count})` : ""}
      </Link>
    </Card>
  );
}
