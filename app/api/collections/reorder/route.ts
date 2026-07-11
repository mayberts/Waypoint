import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";

// Called after a drag-and-drop reorder/reparent in the sidebar tree: the
// client sends the full, final ordering of one parent's direct children.
const schema = z.object({
  parentId: z.string().nullable(),
  orderedIds: z.array(z.string()).max(1000),
});

export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { parentId, orderedIds } = parsed.data;

  if (parentId && orderedIds.includes(parentId)) {
    return NextResponse.json({ error: "A collection cannot be its own parent" }, { status: 400 });
  }

  await prisma.$transaction(
    orderedIds.map((id, index) =>
      prisma.collection.update({ where: { id }, data: { parentId, sortOrder: index } })
    )
  );

  return NextResponse.json({ ok: true });
}
