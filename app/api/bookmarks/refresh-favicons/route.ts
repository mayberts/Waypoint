import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { countMissingFavicons, refreshFaviconsBatch } from "@/lib/scan-jobs";

// How many bookmarks still need a favicon check — used to show progress
// and to decide whether "Refresh favicons" has anything to do.
export async function GET() {
  const count = await countMissingFavicons();
  return NextResponse.json({ count });
}

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
  const result = await refreshFaviconsBatch(parsed.data.limit);
  return NextResponse.json(result);
}
