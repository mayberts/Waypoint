"use client";

import { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api-client";
import { CollectionSelect } from "@/components/CollectionSelect";
import { useAppData } from "@/components/providers";

export default function SettingsPage() {
  return (
    <div className="flex-1 overflow-y-auto px-6 py-6 max-w-2xl flex flex-col gap-10">
      <h1 className="text-lg font-semibold text-neutral-100">Settings</h1>
      <ApiTokenSection />
      <BookmarkletSection />
      <ExtensionSection />
      <ImportSection />
      <FaviconRefreshSection />
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
