import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { createBookmark, CollectionNotFoundError } from "@/lib/create-bookmark";
import { serializeBookmark } from "@/lib/serialize";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const collectionId = searchParams.get("collectionId");
  const unsorted = searchParams.get("unsorted") === "true";
  const tag = searchParams.get("tag");

  const bookmarks = await prisma.bookmark.findMany({
    where: {
      deletedAt: null,
      ...(unsorted ? { collectionId: null } : collectionId ? { collectionId } : {}),
      ...(tag ? { tags: { some: { tag: { name: tag.toLowerCase() } } } } : {}),
    },
    include: { tags: { include: { tag: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(bookmarks.map(serializeBookmark));
}

const createSchema = z.object({
  url: z.string().trim().url(),
  title: z.string().trim().max(500).optional(),
  note: z.string().trim().max(5000).optional(),
  collectionId: z.string().nullable().optional(),
  tags: z.array(z.string().trim().max(50)).max(50).optional(),
});

export async function POST(req: NextRequest) {
  const parsed = createSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const bookmark = await createBookmark(parsed.data);
    return NextResponse.json(bookmark, { status: 201 });
  } catch (err) {
    if (err instanceof CollectionNotFoundError) {
      return NextResponse.json({ error: "Collection not found" }, { status: 404 });
    }
    throw err;
  }
}
