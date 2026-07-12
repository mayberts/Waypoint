import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";

// Called after a drag-and-drop reorder within a single collection (or
// Unsorted, collectionId: null) — the client sends the full, final ordering
// of that group's bookmarks.
const schema = z.object({
  collectionId: z.string().nullable(),
  orderedIds: z.array(z.string()).max(2000),
});

export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { orderedIds } = parsed.data;

  await prisma.$transaction(
    orderedIds.map((id, index) => prisma.bookmark.update({ where: { id }, data: { sortOrder: index } }))
  );

  return NextResponse.json({ ok: true });
}
