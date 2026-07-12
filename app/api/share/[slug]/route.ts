import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Public, unauthenticated endpoint (see proxy.ts's PUBLIC_PREFIXES) — the
// slug itself is the only credential, so the response is a hand-picked
// whitelist of fields, never a spread of the raw Bookmark row (which also
// carries the private `note` and internal link-check bookkeeping).
export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const collection = await prisma.collection.findUnique({ where: { shareSlug: slug } });
  if (!collection) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const bookmarks = await prisma.bookmark.findMany({
    where: { collectionId: collection.id, deletedAt: null },
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
