import { randomBytes } from "node:crypto";
import { prisma } from "./db";
import { saveImageBuffer, MAX_FAVICON_BYTES, MAX_COVER_BYTES } from "./uploads";
import { resolveTagIds } from "./tags";
import { BACKUP_VERSION, type BackupData } from "./backup-export";

function decodeDataUri(dataUri: string | undefined): Buffer | null {
  if (!dataUri) return null;
  const match = /^data:image\/[a-zA-Z0-9.+-]+;base64,(.+)$/.exec(dataUri);
  if (!match) return null;
  try {
    return Buffer.from(match[1], "base64");
  } catch {
    return null;
  }
}

export class UnsupportedBackupVersionError extends Error {}

export interface RestoreResult {
  collectionsRestored: number;
  collectionsSkipped: number;
  iconAssetsRestored: number;
  iconAssetsSkipped: number;
  bookmarksRestored: number;
  bookmarksSkipped: number;
  savedSearchesRestored: number;
  savedSearchesSkipped: number;
  settingsRestored: boolean;
}

// Restoring re-creates every row with its ORIGINAL id (not a fresh one), so
// collectionId/parentId/tag references in the backup just work without any
// id-remapping. This is built to be idempotent: re-running the same backup
// (or restoring onto an instance that already has some of this data) just
// skips whichever rows already exist by id, rather than failing outright —
// each entity is its own try/catch so one bad row can't sink the rest.
export async function restoreBackup(data: BackupData): Promise<RestoreResult> {
  if (data.version !== BACKUP_VERSION) {
    throw new UnsupportedBackupVersionError(`Unsupported backup version: ${data.version}`);
  }

  const result: RestoreResult = {
    collectionsRestored: 0,
    collectionsSkipped: 0,
    iconAssetsRestored: 0,
    iconAssetsSkipped: 0,
    bookmarksRestored: 0,
    bookmarksSkipped: 0,
    savedSearchesRestored: 0,
    savedSearchesSkipped: 0,
    settingsRestored: false,
  };

  for (const asset of data.iconAssets ?? []) {
    try {
      const buf = decodeDataUri(asset.dataUri);
      if (!buf) {
        result.iconAssetsSkipped++;
        continue;
      }
      const savedPath = await saveImageBuffer(buf, MAX_COVER_BYTES);
      await prisma.iconAsset.create({
        data: { id: asset.id, category: asset.category, filename: asset.filename, path: savedPath, createdAt: new Date(asset.createdAt) },
      });
      result.iconAssetsRestored++;
    } catch {
      result.iconAssetsSkipped++;
    }
  }

  // Collections: create every row with parentId left unset first (a parent
  // collection can appear after its child in the backup array), then wire up
  // parentId in a second pass once every id that's going to exist, does.
  const restoredCollectionIds = new Set<string>();
  for (const c of data.collections ?? []) {
    try {
      let icon = c.icon;
      if (c.iconDataUri) {
        try {
          const buf = decodeDataUri(c.iconDataUri);
          if (buf) icon = await saveImageBuffer(buf, MAX_COVER_BYTES);
        } catch {
          // Bad/corrupt embedded image — restore the collection without its custom icon rather than losing it entirely.
        }
      }
      await prisma.collection.create({
        data: {
          id: c.id,
          name: c.name,
          icon,
          color: c.color,
          view: c.view,
          sort: c.sort,
          parentId: null,
          sortOrder: c.sortOrder,
          shareSlug: c.shareSlug,
          createdAt: new Date(c.createdAt),
        },
      });
      restoredCollectionIds.add(c.id);
      result.collectionsRestored++;
    } catch {
      result.collectionsSkipped++;
    }
  }
  for (const c of data.collections ?? []) {
    if (!restoredCollectionIds.has(c.id)) continue;
    if (!c.parentId || !restoredCollectionIds.has(c.parentId)) continue;
    await prisma.collection.update({ where: { id: c.id }, data: { parentId: c.parentId } }).catch(() => {});
  }

  for (const b of data.bookmarks ?? []) {
    try {
      const faviconBuf = decodeDataUri(b.faviconDataUri);
      const coverBuf = decodeDataUri(b.coverDataUri);
      const faviconPath = faviconBuf ? await saveImageBuffer(faviconBuf, MAX_FAVICON_BYTES).catch(() => null) : null;
      const coverImagePath = coverBuf ? await saveImageBuffer(coverBuf, MAX_COVER_BYTES).catch(() => null) : null;
      // A bookmark whose collection didn't make it into this restore (skipped,
      // or simply missing from the backup) falls back to Unsorted rather than
      // failing the bookmark outright.
      const collectionId = b.collectionId && restoredCollectionIds.has(b.collectionId) ? b.collectionId : null;
      const tagIds = await resolveTagIds(b.tags ?? []);

      const created = await prisma.bookmark.create({
        data: {
          id: b.id,
          url: b.url,
          title: b.title,
          description: b.description,
          note: b.note,
          domain: b.domain,
          faviconPath,
          coverImagePath,
          collectionId,
          sortOrder: b.sortOrder,
          deletedAt: b.deletedAt ? new Date(b.deletedAt) : null,
          isBroken: b.isBroken,
          isFavorite: b.isFavorite,
          createdAt: new Date(b.createdAt),
          updatedAt: new Date(b.updatedAt),
        },
      });
      if (tagIds.length > 0) {
        await prisma.bookmarkTag.createMany({ data: tagIds.map((tagId) => ({ bookmarkId: created.id, tagId })) });
      }
      result.bookmarksRestored++;
    } catch {
      result.bookmarksSkipped++;
    }
  }

  for (const s of data.savedSearches ?? []) {
    try {
      await prisma.savedSearch.create({
        data: { id: s.id, name: s.name, query: s.query, sortOrder: s.sortOrder, createdAt: new Date(s.createdAt) },
      });
      result.savedSearchesRestored++;
    } catch {
      result.savedSearchesSkipped++;
    }
  }

  if (data.settings) {
    const defaultLandingCollectionId =
      data.settings.defaultLandingCollectionId && restoredCollectionIds.has(data.settings.defaultLandingCollectionId)
        ? data.settings.defaultLandingCollectionId
        : null;
    const defaultLandingView = data.settings.defaultLandingView === "collection" && !defaultLandingCollectionId
      ? "all"
      : data.settings.defaultLandingView;

    // Never touches apiToken/authUsername/authPasswordHash/sessionSecret —
    // restoring content should never change who can sign in or with what token.
    const settingsUpdate = {
      accentColor: data.settings.accentColor,
      colorScheme: data.settings.colorScheme,
      density: data.settings.density,
      gridPattern: data.settings.gridPattern,
      defaultLandingView,
      defaultLandingCollectionId,
      autoScanEnabled: data.settings.autoScanEnabled,
      autoScanIntervalHours: data.settings.autoScanIntervalHours,
      trashAutoPurgeEnabled: data.settings.trashAutoPurgeEnabled,
      trashRetentionDays: data.settings.trashRetentionDays,
    };
    await prisma.settings.upsert({
      where: { id: 1 },
      update: settingsUpdate,
      create: { id: 1, apiToken: randomBytes(24).toString("base64url"), ...settingsUpdate },
    });
    result.settingsRestored = true;
  }

  return result;
}
