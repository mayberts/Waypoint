"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Favicon } from "@/components/Favicon";
import { Logo } from "@/components/Logo";
import { isIconImagePath } from "@/lib/collection-tree";

interface PublicBookmark {
  id: string;
  url: string;
  title: string;
  description: string | null;
  domain: string | null;
  faviconPath: string | null;
  coverImagePath: string | null;
  createdAt: string;
  tags: string[];
}

interface PublicShare {
  collection: { id: string; name: string; icon: string | null; color: string | null };
  bookmarks: PublicBookmark[];
}

export default function SharePage() {
  const { slug } = useParams<{ slug: string }>();
  const [data, setData] = useState<PublicShare | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetch(`/api/share/${slug}`)
      .then(async (res) => {
        if (!res.ok) {
          setNotFound(true);
          return;
        }
        setData(await res.json());
      })
      .catch(() => setNotFound(true));
  }, [slug]);

  if (notFound) {
    return (
      <div className="min-h-full flex flex-col items-center justify-center gap-3 px-4 text-center">
        <Logo size={32} />
        <p className="text-sm text-[var(--text-faint)]">This link is invalid or is no longer shared.</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-full flex items-center justify-center">
        <p className="text-sm text-[var(--text-faint)]">Loading…</p>
      </div>
    );
  }

  const { collection, bookmarks } = data;

  return (
    <div className="min-h-full flex flex-col items-center px-4 py-10 sm:py-14">
      <div className="w-full max-w-4xl flex flex-col gap-6">
        <header className="flex items-center gap-3">
          <span className="flex items-center justify-center h-9 w-9 text-2xl leading-none rounded-lg shrink-0">
            {isIconImagePath(collection.icon) ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={collection.icon} alt="" className="h-9 w-9 rounded-lg object-cover" />
            ) : (
              collection.icon || "📁"
            )}
          </span>
          <div className="min-w-0">
            <h1 className="text-lg font-semibold text-[var(--text-primary)] truncate">{collection.name}</h1>
            <p className="text-xs text-[var(--text-faint)]">
              {bookmarks.length} bookmark{bookmarks.length === 1 ? "" : "s"} · shared via Waypoint
            </p>
          </div>
        </header>

        {bookmarks.length === 0 ? (
          <p className="text-sm text-[var(--text-faint)]">No bookmarks in this collection yet.</p>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-4">
            {bookmarks.map((b) => (
              <a
                key={b.id}
                href={b.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-col rounded-lg border border-[var(--border)] bg-[var(--surface-1)] overflow-hidden hover:border-[var(--border-strong)] hover:-translate-y-0.5 hover:shadow-lg transition-[border-color,box-shadow,transform] duration-150"
              >
                <div className="h-28 w-full bg-[var(--surface-2)] overflow-hidden">
                  {b.coverImagePath ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={b.coverImagePath} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-[var(--text-faint)] text-xs">
                      {b.domain}
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-1.5 p-3">
                  <div className="flex items-start gap-2">
                    <Favicon faviconPath={b.faviconPath} domain={b.domain} size={16} className="mt-0.5" />
                    <span className="text-sm font-medium text-[var(--text-primary)] leading-snug line-clamp-2 group-hover:underline">
                      {b.title}
                    </span>
                  </div>
                  {b.domain && <div className="text-xs text-[var(--text-faint)] truncate">{b.domain}</div>}
                  {b.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-0.5">
                      {b.tags.map((t) => (
                        <span key={t} className="text-[11px] px-1.5 py-0.5 rounded-full bg-[var(--surface-2)] text-[var(--text-muted)]">
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </a>
            ))}
          </div>
        )}

        <footer className="pt-6 flex items-center justify-center gap-1.5 text-xs text-[var(--text-faint)]">
          <Logo size={14} />
          Shared with Waypoint
        </footer>
      </div>
    </div>
  );
}
