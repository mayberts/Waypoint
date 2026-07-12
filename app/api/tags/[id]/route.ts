import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";

const renameSchema = z.object({ name: z.string().trim().min(1).max(50) });

// Renaming to a name that already belongs to a different tag merges the two:
// every bookmark tagged with this one gets re-tagged to the existing tag,
// then this tag is removed. That matches what a user expects when they type
// an existing tag's name into a rename field, and avoids a confusing unique-
// constraint error.
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const parsed = renameSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const name = parsed.data.name.toLowerCase();

  const existing = await prisma.tag.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const collision = name !== existing.name ? await prisma.tag.findUnique({ where: { name } }) : null;

  if (collision) {
    const rows = await prisma.bookmarkTag.findMany({ where: { tagId: id }, select: { bookmarkId: true } });
    await prisma.$transaction(async (tx) => {
      if (rows.length > 0) {
        await tx.bookmarkTag.createMany({
          data: rows.map((r) => ({ bookmarkId: r.bookmarkId, tagId: collision.id })),
          skipDuplicates: true,
        });
      }
      await tx.tag.delete({ where: { id } }); // cascades: removes this tag's now-redundant BookmarkTag rows
    });
    return NextResponse.json({ merged: true, tag: collision });
  }

  const updated = await prisma.tag.update({ where: { id }, data: { name } });
  return NextResponse.json({ merged: false, tag: updated });
}

// Cascades via the schema's onDelete: Cascade on BookmarkTag.tag — removes
// this tag from every bookmark that has it, without touching the bookmarks.
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const existing = await prisma.tag.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.tag.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
