import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { serializeBookmark } from "@/lib/serialize";

export async function GET() {
  const bookmarks = await prisma.bookmark.findMany({
    where: { deletedAt: { not: null } },
    include: { tags: { include: { tag: true } } },
    orderBy: { deletedAt: "desc" },
  });
  return NextResponse.json(bookmarks.map(serializeBookmark));
}

// Permanently removes everything currently in the trash.
export async function DELETE() {
  const { count } = await prisma.bookmark.deleteMany({ where: { deletedAt: { not: null } } });
  return NextResponse.json({ deleted: count });
}
