import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { checkLinkAlive } from "@/lib/link-check";

const CONCURRENCY = 5;

// Bookmarks not yet (re-)checked since `since` — used both to report how much
// of a scan is left and to select the next batch. Passing the scan's start
// time (rather than just "checked === null") is what lets a full re-scan
// revisit every bookmark, not just ones that have never been checked.
function notCheckedSince(since: Date) {
  return {
    deletedAt: null,
    OR: [{ linkCheckedAt: null }, { linkCheckedAt: { lt: since } }],
  };
}

const querySchema = z.object({ since: z.coerce.number().int() });

export async function GET(req: NextRequest) {
  const parsed = querySchema.safeParse({ since: req.nextUrl.searchParams.get("since") ?? Date.now() });
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const remaining = await prisma.bookmark.count({ where: notCheckedSince(new Date(parsed.data.since)) });
  return NextResponse.json({ remaining });
}

const bodySchema = z.object({
  since: z.number().int(),
  limit: z.number().int().min(1).max(50).default(20),
});

export async function POST(req: NextRequest) {
  const parsed = bodySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const since = new Date(parsed.data.since);

  const targets = await prisma.bookmark.findMany({
    where: notCheckedSince(since),
    take: parsed.data.limit,
    orderBy: { linkCheckedAt: { sort: "asc", nulls: "first" } },
    select: { id: true, url: true },
  });

  let broken = 0;
  for (let i = 0; i < targets.length; i += CONCURRENCY) {
    const batch = targets.slice(i, i + CONCURRENCY);
    await Promise.all(
      batch.map(async (bookmark) => {
        const alive = await checkLinkAlive(bookmark.url);
        if (!alive) broken++;
        await prisma.bookmark.update({
          where: { id: bookmark.id },
          data: { linkCheckedAt: new Date(), isBroken: !alive },
        });
      })
    );
  }

  const remaining = await prisma.bookmark.count({ where: notCheckedSince(since) });
  return NextResponse.json({ processed: targets.length, broken, remaining });
}
