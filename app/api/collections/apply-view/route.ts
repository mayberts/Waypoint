import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";

const schema = z.object({ view: z.enum(["cards", "list", "headlines", "moodboard"]) });

export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  await prisma.collection.updateMany({ data: { view: parsed.data.view } });
  return NextResponse.json({ ok: true });
}
