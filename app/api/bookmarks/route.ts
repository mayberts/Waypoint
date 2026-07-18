import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { createBookmark, CollectionNotFoundError } from "@/lib/create-bookmark";
import { serializeBookmark } from "@/lib/serialize";
import { descendantCollectionIds } from "@/lib/collections-server";

function orderByForSort(sort: string | null): Prisma.BookmarkOrderByWithRelationInput[] {
  switch (sort) {
    case "oldest":
      return [{ createdAt: "asc" }];
    case "title-asc":
      return [{ title: "asc" }];
    case "title-desc":
      return [{ title: "desc" }];
    case "manual":
      // Ties (e.g. every row still at the default 0, before any drag)
      // fall back to newest-first so a never-reordered list still reads
      // sensibly rather than in arbitrary id order.
      return [{ sortOrder: "asc" }, { createdAt: "desc" }];
    case "newest":
    default:
      return [{ createdAt: "desc" }];
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const collectionId = searchParams.get("collectionId");
  const unsorted = searchParams.get("unsorted") === "true";
  const tag = searchParams.get("tag");
  const broken = searchParams.get("broken") === "true";
  const untagged = searchParams.get("untagged") === "true";
  const since = searchParams.get("since");
  const sinceDate = since ? new Date(since) : null;
  // Viewing a parent collection includes bookmarks filed anywhere in its
  // subtree, not just ones filed directly on it — matches how the sidebar
  // tree nests them visually.
  const collectionIdsFilter = collectionId ? [collectionId, ...(await descendantCollectionIds(collectionId))] : null;

  const bookmarks = await prisma.bookmark.findMany({
    where: {
      deletedAt: null,
      ...(unsorted ? { collectionId: null } : collectionIdsFilter ? { collectionId: { in: collectionIdsFilter } } : {}),
      ...(tag ? { tags: { some: { tag: { name: tag.toLowerCase() } } } } : {}),
      ...(broken ? { isBroken: true } : {}),
      ...(untagged ? { tags: { none: {} } } : {}),
      ...(sinceDate && !Number.isNaN(sinceDate.getTime()) ? { createdAt: { gte: sinceDate } } : {}),
    },
    include: { tags: { include: { tag: true } } },
    orderBy: orderByForSort(searchParams.get("sort")),
  });

  return NextResponse.json(bookmarks.map(serializeBookmark));
}

const createSchema = z.object({
  url: z.string().trim().url(),
  title: z.string().trim().max(500).optional(),
  note: z.string().trim().max(5000).optional(),
  collectionId: z.string().nullable().optional(),
  tags: z.array(z.string().trim().max(50)).max(50).optional(),
});

export async function POST(req: NextRequest) {
  const parsed = createSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const bookmark = await createBookmark(parsed.data);
    return NextResponse.json(bookmark, { status: 201 });
  } catch (err) {
    if (err instanceof CollectionNotFoundError) {
      return NextResponse.json({ error: "Collection not found" }, { status: 404 });
    }
    throw err;
  }
}
