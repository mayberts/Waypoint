import { readFile } from "node:fs/promises";
import path from "node:path";
import { prisma } from "./db";
import { UPLOADS_DIR, contentTypeForExt } from "./uploads";
import { isIconImagePath } from "./collection-tree";

export const BACKUP_VERSION = 1;

async function fileToDataUri(uploadPath: string | null): Promise<string | undefined> {
  if (!uploadPath) return undefined;
  const filename = uploadPath.split("/").pop();
  if (!filename) return undefined;
  const ext = filename.split(".").pop() || "";
  try {
    const buf = await readFile(path.join(UPLOADS_DIR, filename));
    return `data:${contentTypeForExt(ext)};base64,${buf.toString("base64")}`;
  } catch {
    // File missing from disk (shouldn't normally happen) — export without
    // the image rather than failing the whole backup.
    return undefined;
  }
}

export interface BackupCollection {
  id: string;
  name: string;
  icon: string | null; // an emoji, or null when `iconDataUri` carries an uploaded image instead
  iconDataUri?: string;
  color: string | null;
  view: string;
  sort: string;
  parentId: string | null;
  sortOrder: number;
  shareSlug: string | null;
  createdAt: string;
}

export interface BackupIconAsset {
  id: string;
  category: string;
  filename: string;
  dataUri?: string;
  createdAt: string;
}

export interface BackupBookmark {
  id: string;
  url: string;
  title: string;
  description: string | null;
  note: string | null;
  domain: string | null;
  faviconDataUri?: string;
  coverDataUri?: string;
  collectionId: string | null;
  sortOrder: number;
  deletedAt: string | null;
  isBroken: boolean;
  isFavorite: boolean;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface BackupSavedSearch {
  id: string;
  name: string;
  query: string;
  sortOrder: number;
  createdAt: string;
}

export interface BackupSettings {
  accentColor: string;
  colorScheme: string;
  density: string;
  gridPattern: string;
  defaultLandingView: string;
  defaultLandingCollectionId: string | null;
  autoScanEnabled: boolean;
  autoScanIntervalHours: number;
  trashAutoPurgeEnabled: boolean;
  trashRetentionDays: number;
}

export interface BackupData {
  version: number;
  exportedAt: string;
  settings: BackupSettings;
  collections: BackupCollection[];
  iconAssets: BackupIconAsset[];
  bookmarks: BackupBookmark[];
  savedSearches: BackupSavedSearch[];
}

export async function buildBackup(): Promise<BackupData> {
  const [settingsRow, collections, iconAssets, bookmarks, savedSearches] = await Promise.all([
    prisma.settings.findUnique({ where: { id: 1 } }),
    prisma.collection.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.iconAsset.findMany({ orderBy: { createdAt: "asc" } }),
    // Every bookmark, including trashed ones — a "full" backup shouldn't
    // silently drop what's sitting in trash just because it's not active.
    prisma.bookmark.findMany({ include: { tags: { include: { tag: true } } }, orderBy: { createdAt: "asc" } }),
    prisma.savedSearch.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);

  const collectionsOut: BackupCollection[] = [];
  for (const c of collections) {
    const uploaded = isIconImagePath(c.icon);
    collectionsOut.push({
      id: c.id,
      name: c.name,
      icon: uploaded ? null : c.icon,
      iconDataUri: uploaded ? await fileToDataUri(c.icon) : undefined,
      color: c.color,
      view: c.view,
      sort: c.sort,
      parentId: c.parentId,
      sortOrder: c.sortOrder,
      shareSlug: c.shareSlug,
      createdAt: c.createdAt.toISOString(),
    });
  }

  const iconAssetsOut: BackupIconAsset[] = [];
  for (const a of iconAssets) {
    iconAssetsOut.push({
      id: a.id,
      category: a.category,
      filename: a.filename,
      dataUri: await fileToDataUri(a.path),
      createdAt: a.createdAt.toISOString(),
    });
  }

  const bookmarksOut: BackupBookmark[] = [];
  for (const b of bookmarks) {
    bookmarksOut.push({
      id: b.id,
      url: b.url,
      title: b.title,
      description: b.description,
      note: b.note,
      domain: b.domain,
      faviconDataUri: await fileToDataUri(b.faviconPath),
      coverDataUri: await fileToDataUri(b.coverImagePath),
      collectionId: b.collectionId,
      sortOrder: b.sortOrder,
      deletedAt: b.deletedAt?.toISOString() ?? null,
      isBroken: b.isBroken,
      isFavorite: b.isFavorite,
      tags: b.tags.map((t) => t.tag.name),
      createdAt: b.createdAt.toISOString(),
      updatedAt: b.updatedAt.toISOString(),
    });
  }

  return {
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    // Deliberately excludes apiToken/authUsername/authPasswordHash/sessionSecret
    // and the auto-scan/trash-purge "last ran" bookkeeping — a portable backup
    // file is content, not secrets or ephemeral operational state.
    settings: {
      accentColor: settingsRow?.accentColor ?? "blue",
      colorScheme: settingsRow?.colorScheme ?? "dark",
      density: settingsRow?.density ?? "comfortable",
      gridPattern: settingsRow?.gridPattern ?? "none",
      defaultLandingView: settingsRow?.defaultLandingView ?? "all",
      defaultLandingCollectionId: settingsRow?.defaultLandingCollectionId ?? null,
      autoScanEnabled: settingsRow?.autoScanEnabled ?? true,
      autoScanIntervalHours: settingsRow?.autoScanIntervalHours ?? 24,
      trashAutoPurgeEnabled: settingsRow?.trashAutoPurgeEnabled ?? true,
      trashRetentionDays: settingsRow?.trashRetentionDays ?? 30,
    },
    collections: collectionsOut,
    iconAssets: iconAssetsOut,
    bookmarks: bookmarksOut,
    savedSearches: savedSearches.map((s) => ({
      id: s.id,
      name: s.name,
      query: s.query,
      sortOrder: s.sortOrder,
      createdAt: s.createdAt.toISOString(),
    })),
  };
}
