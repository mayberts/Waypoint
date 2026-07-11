import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";

export async function GET() {
  const collections = await prisma.collection.findMany({
    orderBy: [{ parentId: "asc" }, { sortOrder: "asc" }],
    include: { _count: { select: { bookmarks: true } } },
  });
  return NextResponse.json(collections);
}

const createSchema = z.object({
  name: z.string().trim().min(1).max(200),
  parentId: z.string().nullable().optional(),
  icon: z.string().nullable().optional(),
  color: z.string().nullable().optional(),
});

export async function POST(req: NextRequest) {
  const parsed = createSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { name, parentId, icon, color } = parsed.data;

  if (parentId) {
    const parent = await prisma.collection.findUnique({ where: { id: parentId } });
    if (!parent) return NextResponse.json({ error: "Parent collection not found" }, { status: 404 });
  }

  const siblingCount = await prisma.collection.count({ where: { parentId: parentId ?? null } });

  const collection = await prisma.collection.create({
    data: { name, parentId: parentId ?? null, icon, color, sortOrder: siblingCount },
  });
  return NextResponse.json(collection, { status: 201 });
}
