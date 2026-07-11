import { prisma } from "./db";
import { fetchPageMetadata, downloadImage } from "./metadata";
import { saveImageBuffer, MAX_FAVICON_BYTES, MAX_COVER_BYTES } from "./uploads";
import { resolveTagIds } from "./tags";
import { serializeBookmark } from "./serialize";

export interface CreateBookmarkInput {
  url: string;
  title?: string;
  note?: string;
  collectionId?: string | null;
  tags?: string[];
}

export class CollectionNotFoundError extends Error {}

export async function createBookmark(input: CreateBookmarkInput) {
  const { url, title, note, collectionId, tags } = input;

  if (collectionId) {
    const collection = await prisma.collection.findUnique({ where: { id: collectionId } });
    if (!collection) throw new CollectionNotFoundError();
  }

  let metaTitle = title;
  let description: string | undefined;
  let domain: string | undefined;
  let faviconPath: string | undefined;
  let coverImagePath: string | undefined;

  try {
    const meta = await fetchPageMetadata(url);
    domain = meta.domain;
    description = meta.description;
    if (!metaTitle) metaTitle = meta.title;

    if (meta.faviconUrl) {
      try {
        const buf = await downloadImage(meta.faviconUrl);
        faviconPath = await saveImageBuffer(buf, MAX_FAVICON_BYTES);
      } catch {
        // No favicon available or it failed to download — fine, user can upload one manually.
      }
    }
    if (meta.ogImageUrl) {
      try {
        const buf = await downloadImage(meta.ogImageUrl);
        coverImagePath = await saveImageBuffer(buf, MAX_COVER_BYTES);
      } catch {
        // No og:image, or it failed to download — fine, cover stays unset.
      }
    }
  } catch {
    // Page fetch failed entirely (offline site, blocked, non-HTML, etc.) — still
    // save the bookmark with whatever the caller gave us.
    try {
      domain = new URL(url).hostname;
    } catch {
      // unreachable: url already validated by the caller
    }
  }

  const tagIds = await resolveTagIds(tags ?? []);

  const bookmark = await prisma.bookmark.create({
    data: {
      url,
      title: metaTitle || domain || url,
      description,
      note,
      domain,
      collectionId: collectionId ?? null,
      faviconPath,
      // Creation already attempted a live favicon fetch above, so mark it
      // checked — otherwise the bulk "refresh missing favicons" feature
      // would redundantly re-attempt every freshly created bookmark.
      faviconCheckedAt: new Date(),
      coverImagePath,
      tags: { create: tagIds.map((tagId) => ({ tagId })) },
    },
    include: { tags: { include: { tag: true } } },
  });

  return serializeBookmark(bookmark);
}
