import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { fetchPageMetadata, downloadImage } from "@/lib/metadata";
import { saveImageBuffer, MAX_COVER_BYTES } from "@/lib/uploads";

const UNCHECKED_WITHOUT_COVER = { coverImagePath: null, coverImageCheckedAt: null, deletedAt: null } as const;

// How many bookmarks still need a cover image check — used to show progress
// and to decide whether "Refresh cover images" has anything to do.
export async function GET() {
  const count = await prisma.bookmark.count({ where: UNCHECKED_WITHOUT_COVER });
  return NextResponse.json({ count });
}

const CONCURRENCY = 5;

const schema = z.object({ limit: z.number().int().min(1).max(50).default(20) });

// Same batching/stamping pattern as refresh-favicons: process one batch of
// cover-less bookmarks per call, and stamp coverImageCheckedAt on every
// attempt regardless of outcome so a page with no og:image isn't retried
// forever.
export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const targets = await prisma.bookmark.findMany({
    where: UNCHECKED_WITHOUT_COVER,
    take: parsed.data.limit,
    orderBy: { createdAt: "asc" },
    select: { id: true, url: true },
  });

  let updated = 0;
  for (let i = 0; i < targets.length; i += CONCURRENCY) {
    const batch = targets.slice(i, i + CONCURRENCY);
    await Promise.all(
      batch.map(async (bookmark) => {
        let coverImagePath: string | undefined;
        try {
          const meta = await fetchPageMetadata(bookmark.url);
          if (meta.ogImageUrl) {
            const buf = await downloadImage(meta.ogImageUrl);
            coverImagePath = await saveImageBuffer(buf, MAX_COVER_BYTES);
          }
        } catch {
          // Site unreachable, blocked, or has no og:image — still marked as
          // checked below so it isn't retried on every future run.
        }
        await prisma.bookmark.update({
          where: { id: bookmark.id },
          data: { coverImageCheckedAt: new Date(), ...(coverImagePath ? { coverImagePath } : {}) },
        });
        if (coverImagePath) updated++;
      })
    );
  }

  const remaining = await prisma.bookmark.count({ where: UNCHECKED_WITHOUT_COVER });
  return NextResponse.json({ processed: targets.length, updated, remaining });
}
