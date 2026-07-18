import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { descendantCollectionIds } from "@/lib/collections-server";

// Public, unauthenticated endpoint (see proxy.ts's PUBLIC_PREFIXES) — the
// slug itself is the only credential, so the response is a hand-picked
// whitelist of fields, never a spread of the raw Bookmark row (which also
// carries the private `note` and internal link-check bookkeeping).
export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const collection = await prisma.collection.findUnique({ where: { shareSlug: slug } });
  if (!collection) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Same subtree inclusion as the in-app collection view, so a shared link
  // to a parent collection isn't missing whatever the owner sees in it.
  const collectionIds = [collection.id, ...(await descendantCollectionIds(collection.id))];
  const bookmarks = await prisma.bookmark.findMany({
    where: { collectionId: { in: collectionIds }, deletedAt: null },
    include: { tags: { include: { tag: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    collection: {
      id: collection.id,
      name: collection.name,
      icon: collection.icon,
      color: collection.color,
    },
    bookmarks: bookmarks.map((b) => ({
      id: b.id,
      url: b.url,
      title: b.title,
      description: b.description,
      domain: b.domain,
      faviconPath: b.faviconPath,
      coverImagePath: b.coverImagePath,
      createdAt: b.createdAt,
      tags: b.tags.map((t) => t.tag.name),
    })),
  });
}
