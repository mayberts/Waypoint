import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";

const updateSchema = z.object({
  name: z.string().trim().min(1).max(200).optional(),
  parentId: z.string().nullable().optional(),
  icon: z.string().nullable().optional(),
  color: z.string().nullable().optional(),
  view: z.enum(["cards", "list", "headlines", "moodboard"]).optional(),
  sort: z.enum(["manual", "newest", "oldest", "title-asc", "title-desc"]).optional(),
});

async function wouldCreateCycle(collectionId: string, proposedParentId: string): Promise<boolean> {
  let cursor: string | null = proposedParentId;
  while (cursor) {
    if (cursor === collectionId) return true;
    const parent: { parentId: string | null } | null = await prisma.collection.findUnique({
      where: { id: cursor },
      select: { parentId: true },
    });
    cursor = parent?.parentId ?? null;
  }
  return false;
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const parsed = updateSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const existing = await prisma.collection.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { parentId } = parsed.data;
  if (parentId) {
    if (parentId === id || (await wouldCreateCycle(id, parentId))) {
      return NextResponse.json({ error: "Cannot move a collection into its own descendant" }, { status: 400 });
    }
  }

  const collection = await prisma.collection.update({ where: { id }, data: parsed.data });
  return NextResponse.json(collection);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const existing = await prisma.collection.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.collection.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
