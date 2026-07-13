"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api-client";
import { Skeleton } from "@/components/Skeleton";
import { TagCloud } from "@/components/TagCloud";
import { useAppData } from "@/components/providers";

interface StatsResponse {
  totalBookmarks: number;
  brokenLinks: number;
  addedThisWeek: number;
  addedThisMonth: number;
  topDomains: { domain: string; count: number }[];
  activity: { date: string; count: number }[];
}

export default function StatsPage() {
  const { collections, tags } = useAppData();
  const [stats, setStats] = useState<StatsResponse | null>(null);

  useEffect(() => {
    api.get<StatsResponse>("/api/stats").then(setStats);
  }, []);

  const topCollections = [...collections]
    .filter((c) => (c._count?.bookmarks ?? 0) > 0)
    .sort((a, b) => (b._count?.bookmarks ?? 0) - (a._count?.bookmarks ?? 0))
    .slice(0, 8);

  const topTags = [...tags]
    .filter((t) => (t._count?.bookmarks ?? 0) > 0)
    .sort((a, b) => (b._count?.bookmarks ?? 0) - (a._count?.bookmarks ?? 0))
    .slice(0, 24);

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 max-w-5xl flex flex-col gap-6 sm:px-6 sm:py-6">
      <h1 className="text-lg font-semibold text-[var(--text-primary)]">Stats</h1>

      {!stats ? (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-lg border border-[var(--border)] bg-[var(--surface-0)] p-3 flex flex-col gap-2">
                <Skeleton className="h-7 w-12" />
                <Skeleton className="h-3 w-16" />
              </div>
            ))}
          </div>
          <Skeleton className="h-[168px] w-full rounded-lg" />
          <div className="columns-1 lg:columns-2 gap-6">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="mb-6 break-inside-avoid rounded-lg border border-[var(--border)] bg-[var(--surface-0)] p-4 flex flex-col gap-2.5">
                {Array.from({ length: 5 }).map((_, j) => (
                  <Skeleton key={j} className="h-4 w-full" />
                ))}
              </div>
            ))}
          </div>
        </>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <StatTile label="Bookmarks" value={stats.totalBookmarks} />
            <StatTile label="Collections" value={collections.length} />
            <StatTile label="Tags" value={tags.length} />
            <StatTile label="Broken links" value={stats.brokenLinks} tone={stats.brokenLinks > 0 ? "warn" : undefined} />
            <StatTile label="Added this week" value={stats.addedThisWeek} />
            <StatTile label="Added this month" value={stats.addedThisMonth} />
          </div>

          <ActivityChart activity={stats.activity} />

          <div className="columns-1 lg:columns-2 gap-6">
            <RankedList
              title="Top domains"
              items={stats.topDomains.map((d) => ({ label: d.domain, count: d.count }))}
              empty="No bookmarks yet."
            />
            <RankedList
              title="Top collections"
              items={topCollections.map((c) => ({ label: c.name, count: c._count?.bookmarks ?? 0 }))}
              empty="No collections with bookmarks yet."
            />
          </div>

          <section className="flex flex-col gap-3">
            <h2 className="text-sm font-semibold text-[var(--text-secondary)]">Tag cloud</h2>
            <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-0)] p-4">
              <TagCloud tags={topTags.map((t) => ({ name: t.name, count: t._count?.bookmarks ?? 0 }))} />
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function StatTile({ label, value, tone }: { label: string; value: number; tone?: "warn" }) {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-0)] p-3 flex flex-col gap-1">
      <span className={`text-2xl font-semibold ${tone === "warn" && value > 0 ? "text-red-400" : "text-[var(--text-primary)]"}`}>
        {value.toLocaleString()}
      </span>
      <span className="text-xs text-[var(--text-faint)]">{label}</span>
    </div>
  );
}

function ActivityChart({ activity }: { activity: { date: string; count: number }[] }) {
  const max = Math.max(1, ...activity.map((a) => a.count));
  const [hover, setHover] = useState<number | null>(null);

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-sm font-semibold text-[var(--text-secondary)]">Added in the last 30 days</h2>
      <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-0)] p-4">
        <div className="flex items-end gap-[3px] h-28">
          {activity.map((a, i) => {
            const heightPct = a.count === 0 ? 0 : Math.max(6, (a.count / max) * 100);
            return (
              <div
                key={a.date}
                className="relative flex-1 h-full flex items-end"
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover((h) => (h === i ? null : h))}
                tabIndex={0}
                onFocus={() => setHover(i)}
                onBlur={() => setHover((h) => (h === i ? null : h))}
                title={`${formatDate(a.date)}: ${a.count} bookmark${a.count === 1 ? "" : "s"}`}
              >
                {hover === i && (
                  <div className="absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-[var(--surface-2)] border border-[var(--border-strong)] px-2 py-1 text-[11px] text-[var(--text-secondary)] shadow-lg z-10">
                    <span className="font-semibold text-[var(--text-primary)]">{a.count}</span> on {formatDate(a.date)}
                  </div>
                )}
                <div
                  className="w-full rounded-t"
                  style={{
                    height: `${heightPct}%`,
                    minHeight: a.count === 0 ? "2px" : undefined,
                    background: a.count === 0 ? "var(--border-strong)" : "var(--accent)",
                    opacity: hover === null || hover === i ? 1 : 0.5,
                  }}
                />
              </div>
            );
          })}
        </div>
        <div className="flex justify-between pt-2 text-[10px] text-[var(--text-faint)]">
          <span>{formatDate(activity[0]?.date)}</span>
          <span>{formatDate(activity[activity.length - 1]?.date)}</span>
        </div>
      </div>
    </section>
  );
}

function formatDate(iso?: string): string {
  if (!iso) return "";
  return new Date(iso + "T00:00:00").toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function RankedList({
  title,
  items,
  empty,
}: {
  title: string;
  items: { label: string; count: number }[];
  empty: string;
}) {
  const max = Math.max(1, ...items.map((i) => i.count));
  return (
    <section className="flex flex-col gap-3 mb-6 break-inside-avoid">
      <h2 className="text-sm font-semibold text-[var(--text-secondary)]">{title}</h2>
      <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-0)] p-4">
        {items.length === 0 ? (
          <p className="text-xs text-[var(--text-faint)]">{empty}</p>
        ) : (
          <div className="flex flex-col gap-2.5">
            {items.map((item, i) => (
              <div key={`${item.label}-${i}`} className="flex items-center gap-3">
                <span className="w-28 shrink-0 truncate text-xs text-[var(--text-body)]" title={item.label}>
                  {item.label}
                </span>
                <div className="flex-1 h-4 rounded bg-[var(--surface-1)] overflow-hidden">
                  <div
                    className="h-full rounded"
                    style={{ width: `${Math.max(4, (item.count / max) * 100)}%`, background: "var(--accent)" }}
                  />
                </div>
                <span className="w-6 shrink-0 text-right text-xs tabular-nums text-[var(--text-faint)]">{item.count}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

