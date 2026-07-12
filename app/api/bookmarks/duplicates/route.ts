import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { serializeBookmark } from "@/lib/serialize";
import { normalizeUrlForDuplicates } from "@/lib/duplicates";

// Grouped in application code rather than via a stored normalized-URL
// column: a single-user bookmark library is small enough that an in-memory
// group-by is trivial, and it avoids keeping a derived column in sync every
// time a bookmark's URL is edited.
export async function GET() {
  const bookmarks = await prisma.bookmark.findMany({
    where: { deletedAt: null },
    include: { tags: { include: { tag: true } } },
    orderBy: { createdAt: "asc" },
  });

  const groups = new Map<string, typeof bookmarks>();
  for (const bookmark of bookmarks) {
    const key = normalizeUrlForDuplicates(bookmark.url);
    const list = groups.get(key);
    if (list) list.push(bookmark);
    else groups.set(key, [bookmark]);
  }

  const duplicateGroups = Array.from(groups.values())
    .filter((list) => list.length > 1)
    .map((list) => list.map(serializeBookmark));

  return NextResponse.json({ groups: duplicateGroups });
}
