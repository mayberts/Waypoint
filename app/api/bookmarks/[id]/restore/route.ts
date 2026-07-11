import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { serializeBookmark } from "@/lib/serialize";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const existing = await prisma.bookmark.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const bookmark = await prisma.bookmark.update({
    where: { id },
    data: { deletedAt: null },
    include: { tags: { include: { tag: true } } },
  });
  return NextResponse.json(serializeBookmark(bookmark));
}
