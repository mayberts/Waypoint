import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { resolveTagIds } from "@/lib/tags";

const patchSchema = z.object({
  ids: z.array(z.string()).min(1).max(500),
  collectionId: z.string().nullable().optional(),
  addTag: z.string().trim().min(1).max(50).optional(),
});

export async function PATCH(req: NextRequest) {
  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { ids, collectionId, addTag } = parsed.data;

  if (collectionId) {
    const collection = await prisma.collection.findUnique({ where: { id: collectionId } });
    if (!collection) return NextResponse.json({ error: "Collection not found" }, { status: 404 });
  }

  await prisma.$transaction(async (tx) => {
    if (collectionId !== undefined) {
      await tx.bookmark.updateMany({ where: { id: { in: ids } }, data: { collectionId } });
    }
    if (addTag) {
      const [tagId] = await resolveTagIds([addTag]);
      await tx.bookmarkTag.createMany({
        data: ids.map((bookmarkId) => ({ bookmarkId, tagId })),
        skipDuplicates: true,
      });
    }
  });

  return NextResponse.json({ ok: true, count: ids.length });
}

const deleteSchema = z.object({ ids: z.array(z.string()).min(1).max(500) });

// Soft-deletes (moves to trash), matching the single-bookmark DELETE default.
export async function DELETE(req: NextRequest) {
  const parsed = deleteSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { count } = await prisma.bookmark.updateMany({
    where: { id: { in: parsed.data.ids } },
    data: { deletedAt: new Date() },
  });

  return NextResponse.json({ ok: true, count });
}
