import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { resolveTagIds } from "@/lib/tags";
import { serializeBookmark } from "@/lib/serialize";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const bookmark = await prisma.bookmark.findUnique({
    where: { id },
    include: { tags: { include: { tag: true } } },
  });
  if (!bookmark) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(serializeBookmark(bookmark));
}

const updateSchema = z.object({
  url: z.string().trim().url().max(2000).optional(),
  title: z.string().trim().min(1).max(500).optional(),
  description: z.string().trim().max(2000).nullable().optional(),
  note: z.string().trim().max(5000).nullable().optional(),
  collectionId: z.string().nullable().optional(),
  tags: z.array(z.string().trim().max(50)).max(50).optional(),
  isFavorite: z.boolean().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const parsed = updateSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const existing = await prisma.bookmark.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { tags, ...rest } = parsed.data;

  if (rest.collectionId) {
    const collection = await prisma.collection.findUnique({ where: { id: rest.collectionId } });
    if (!collection) return NextResponse.json({ error: "Collection not found" }, { status: 404 });
  }

  // Changing the URL invalidates the domain (used for the favicon fallback
  // and display) and any prior broken-link result, which was for the old URL.
  const data: typeof rest & { domain?: string; isBroken?: boolean; linkCheckedAt?: null } = { ...rest };
  if (rest.url && rest.url !== existing.url) {
    data.domain = new URL(rest.url).hostname;
    data.isBroken = false;
    data.linkCheckedAt = null;
  }

  const tagIds = tags !== undefined ? await resolveTagIds(tags) : undefined;

  const bookmark = await prisma.$transaction(async (tx) => {
    if (tagIds !== undefined) {
      await tx.bookmarkTag.deleteMany({ where: { bookmarkId: id } });
      if (tagIds.length > 0) {
        await tx.bookmarkTag.createMany({ data: tagIds.map((tagId) => ({ bookmarkId: id, tagId })) });
      }
    }
    return tx.bookmark.update({
      where: { id },
      data,
      include: { tags: { include: { tag: true } } },
    });
  });

  return NextResponse.json(serializeBookmark(bookmark));
}

// Soft-deletes by default (moves to trash); pass ?permanent=1 to remove for good.
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const existing = await prisma.bookmark.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (req.nextUrl.searchParams.get("permanent") === "1") {
    await prisma.bookmark.delete({ where: { id } });
  } else {
    await prisma.bookmark.update({ where: { id }, data: { deletedAt: new Date() } });
  }
  return NextResponse.json({ ok: true });
}
