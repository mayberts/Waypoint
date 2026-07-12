import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";

export async function GET() {
  const searches = await prisma.savedSearch.findMany({ orderBy: { sortOrder: "asc" } });
  return NextResponse.json(searches);
}

const createSchema = z.object({
  name: z.string().trim().min(1).max(100),
  query: z.string().trim().min(1).max(500),
});

export async function POST(req: NextRequest) {
  const parsed = createSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const count = await prisma.savedSearch.count();
  const search = await prisma.savedSearch.create({
    data: { ...parsed.data, sortOrder: count },
  });
  return NextResponse.json(search, { status: 201 });
}
