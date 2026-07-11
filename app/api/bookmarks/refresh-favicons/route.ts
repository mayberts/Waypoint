import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { fetchPageMetadata, downloadImage } from "@/lib/metadata";
import { saveImageBuffer, MAX_FAVICON_BYTES } from "@/lib/uploads";

const UNCHECKED_WITHOUT_FAVICON = { faviconPath: null, faviconCheckedAt: null, deletedAt: null } as const;

// How many bookmarks still need a favicon check — used to show progress
// and to decide whether "Refresh favicons" has anything to do.
export async function GET() {
  const count = await prisma.bookmark.count({ where: UNCHECKED_WITHOUT_FAVICON });
  return NextResponse.json({ count });
}

const CONCURRENCY = 5;

const schema = z.object({ limit: z.number().int().min(1).max(50).default(20) });

// Processes one batch of favicon-less bookmarks per call rather than the
// whole library at once, so a large import (hundreds/thousands of
// bookmarks) doesn't turn into one very long request — the client calls
// this repeatedly, using `remaining` to know when it's done.
//
// Every bookmark in a batch gets faviconCheckedAt stamped regardless of
// outcome. Without that, a permanently-failing URL (dead link, blocked
// site) would be re-selected by every subsequent batch forever, since the
// query has no other way to exclude it — that would either loop forever
// client-side or silently starve every bookmark after it in the queue.
export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const targets = await prisma.bookmark.findMany({
    where: UNCHECKED_WITHOUT_FAVICON,
    take: parsed.data.limit,
    orderBy: { createdAt: "asc" },
    select: { id: true, url: true },
  });

  let updated = 0;
  for (let i = 0; i < targets.length; i += CONCURRENCY) {
    const batch = targets.slice(i, i + CONCURRENCY);
    await Promise.all(
      batch.map(async (bookmark) => {
        let faviconPath: string | undefined;
        try {
          const meta = await fetchPageMetadata(bookmark.url);
          if (meta.faviconUrl) {
            const buf = await downloadImage(meta.faviconUrl);
            faviconPath = await saveImageBuffer(buf, MAX_FAVICON_BYTES);
          }
        } catch {
          // Site unreachable, blocked, or has no favicon — still marked as
          // checked below so it isn't retried on every future run.
        }
        await prisma.bookmark.update({
          where: { id: bookmark.id },
          data: { faviconCheckedAt: new Date(), ...(faviconPath ? { faviconPath } : {}) },
        });
        if (faviconPath) updated++;
      })
    );
  }

  const remaining = await prisma.bookmark.count({ where: UNCHECKED_WITHOUT_FAVICON });
  return NextResponse.json({ processed: targets.length, updated, remaining });
}
