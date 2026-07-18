import { prisma } from "./db";

/**
 * Permanently deletes trashed bookmarks (deletedAt set) older than
 * `retentionDays`. Shared by the scheduler (runs on every tick when enabled)
 * and the manual "Purge old items now" button in Settings.
 */
export async function purgeOldTrash(retentionDays: number): Promise<number> {
  const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);
  const result = await prisma.bookmark.deleteMany({
    where: { deletedAt: { not: null, lt: cutoff } },
  });
  return result.count;
}
