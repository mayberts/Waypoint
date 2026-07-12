import { prisma } from "./db";
import { fetchPageMetadata, downloadImage } from "./metadata";
import { saveImageBuffer, MAX_FAVICON_BYTES, MAX_COVER_BYTES } from "./uploads";
import { checkLinkAlive } from "./link-check";

const CONCURRENCY = 5;

// Shared by the manual "run one batch" API routes (Settings UI, bounded by
// an HTTP request) and the background scheduler (unbounded, loops batches
// to completion). Keeping the logic here means both call sites can't drift.

const UNCHECKED_WITHOUT_FAVICON = { faviconPath: null, faviconCheckedAt: null, deletedAt: null } as const;

export async function countMissingFavicons(): Promise<number> {
  return prisma.bookmark.count({ where: UNCHECKED_WITHOUT_FAVICON });
}

export async function refreshFaviconsBatch(limit: number): Promise<{ processed: number; updated: number; remaining: number }> {
  const targets = await prisma.bookmark.findMany({
    where: UNCHECKED_WITHOUT_FAVICON,
    take: limit,
    orderBy: { createdAt: "asc" },
    select: { id: true, url: true },
  });

  let updated = 0;
  for (let i = 0; i < targets.length; i += CONCURRENCY) {
    const batch = targets.slice(i, i + CONCURRENCY);
    await Promise.all(
      batch.map(async (bookmark) => {
        let faviconPath: string | undefined;
        try {
          const meta = await fetchPageMetadata(bookmark.url);
          if (meta.faviconUrl) {
            const buf = await downloadImage(meta.faviconUrl);
            faviconPath = await saveImageBuffer(buf, MAX_FAVICON_BYTES);
          }
        } catch {
          // Site unreachable, blocked, or has no favicon — still marked as
          // checked below so it isn't retried on every future run.
        }
        await prisma.bookmark.update({
          where: { id: bookmark.id },
          data: { faviconCheckedAt: new Date(), ...(faviconPath ? { faviconPath } : {}) },
        });
        if (faviconPath) updated++;
      })
    );
  }

  const remaining = await countMissingFavicons();
  return { processed: targets.length, updated, remaining };
}

const UNCHECKED_WITHOUT_COVER = { coverImagePath: null, coverImageCheckedAt: null, deletedAt: null } as const;

export async function countMissingCovers(): Promise<number> {
  return prisma.bookmark.count({ where: UNCHECKED_WITHOUT_COVER });
}

export async function refreshCoversBatch(limit: number): Promise<{ processed: number; updated: number; remaining: number }> {
  const targets = await prisma.bookmark.findMany({
    where: UNCHECKED_WITHOUT_COVER,
    take: limit,
    orderBy: { createdAt: "asc" },
    select: { id: true, url: true },
  });

  let updated = 0;
  for (let i = 0; i < targets.length; i += CONCURRENCY) {
    const batch = targets.slice(i, i + CONCURRENCY);
    await Promise.all(
      batch.map(async (bookmark) => {
        let coverImagePath: string | undefined;
        try {
          const meta = await fetchPageMetadata(bookmark.url);
          if (meta.ogImageUrl) {
            const buf = await downloadImage(meta.ogImageUrl);
            coverImagePath = await saveImageBuffer(buf, MAX_COVER_BYTES);
          }
        } catch {
          // Site unreachable, blocked, or has no og:image — still marked as
          // checked below so it isn't retried on every future run.
        }
        await prisma.bookmark.update({
          where: { id: bookmark.id },
          data: { coverImageCheckedAt: new Date(), ...(coverImagePath ? { coverImagePath } : {}) },
        });
        if (coverImagePath) updated++;
      })
    );
  }

  const remaining = await countMissingCovers();
  return { processed: targets.length, updated, remaining };
}

// Bookmarks not yet (re-)checked since `since` — used both to report how much
// of a scan is left and to select the next batch. Passing the scan's start
// time (rather than just "checked === null") is what lets a full re-scan
// revisit every bookmark, not just ones that have never been checked.
function notCheckedSinceWhere(since: Date) {
  return {
    deletedAt: null,
    OR: [{ linkCheckedAt: null }, { linkCheckedAt: { lt: since } }],
  };
}

export async function countUncheckedLinksSince(since: Date): Promise<number> {
  return prisma.bookmark.count({ where: notCheckedSinceWhere(since) });
}

export async function checkLinksBatch(
  since: Date,
  limit: number
): Promise<{ processed: number; broken: number; remaining: number }> {
  const targets = await prisma.bookmark.findMany({
    where: notCheckedSinceWhere(since),
    take: limit,
    orderBy: { linkCheckedAt: { sort: "asc", nulls: "first" } },
    select: { id: true, url: true },
  });

  let broken = 0;
  for (let i = 0; i < targets.length; i += CONCURRENCY) {
    const batch = targets.slice(i, i + CONCURRENCY);
    await Promise.all(
      batch.map(async (bookmark) => {
        const alive = await checkLinkAlive(bookmark.url);
        if (!alive) broken++;
        await prisma.bookmark.update({
          where: { id: bookmark.id },
          data: { linkCheckedAt: new Date(), isBroken: !alive },
        });
      })
    );
  }

  const remaining = await countUncheckedLinksSince(since);
  return { processed: targets.length, broken, remaining };
}

const SCAN_BATCH_SIZE = 20;

/** Runs a batched job to completion — used by the background scheduler, which isn't bound by an HTTP request. */
async function runToCompletion(runBatch: () => Promise<{ processed: number; remaining: number }>) {
  for (;;) {
    const { processed, remaining } = await runBatch();
    if (remaining === 0 || processed === 0) break;
  }
}

/** Runs all three scans to completion, one after another. Used by the background scheduler. */
export async function runAllScans(): Promise<void> {
  await runToCompletion(() => refreshFaviconsBatch(SCAN_BATCH_SIZE));
  await runToCompletion(() => refreshCoversBatch(SCAN_BATCH_SIZE));
  const since = new Date();
  await runToCompletion(() => checkLinksBatch(since, SCAN_BATCH_SIZE));
}
