import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { serializeBookmark } from "@/lib/serialize";

const SEARCH_EXPR = `to_tsvector('english', coalesce(title,'') || ' ' || coalesce(description,'') || ' ' || coalesce(url,'') || ' ' || coalesce(note,''))`;

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const q = searchParams.get("q")?.trim();
  const collectionId = searchParams.get("collectionId");
  const tag = searchParams.get("tag");

  if (!q) return NextResponse.json({ error: "Missing q" }, { status: 400 });

  const ranked = await prisma.$queryRawUnsafe<{ id: string }[]>(
    `SELECT id FROM "Bookmark"
     WHERE ${SEARCH_EXPR} @@ websearch_to_tsquery('english', $1)
     ORDER BY ts_rank(${SEARCH_EXPR}, websearch_to_tsquery('english', $1)) DESC
     LIMIT 200`,
    q
  );

  const ids = ranked.map((r) => r.id);
  if (ids.length === 0) return NextResponse.json([]);

  const bookmarks = await prisma.bookmark.findMany({
    where: {
      id: { in: ids },
      ...(collectionId ? { collectionId } : {}),
      ...(tag ? { tags: { some: { tag: { name: tag.toLowerCase() } } } } : {}),
    },
    include: { tags: { include: { tag: true } } },
  });

  const order = new Map(ids.map((id, i) => [id, i]));
  bookmarks.sort((a, b) => order.get(a.id)! - order.get(b.id)!);

  return NextResponse.json(bookmarks.map(serializeBookmark));
}
