import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { countMissingCovers, refreshCoversBatch } from "@/lib/scan-jobs";

// How many bookmarks still need a cover image check — used to show progress
// and to decide whether "Refresh cover images" has anything to do.
export async function GET() {
  const count = await countMissingCovers();
  return NextResponse.json({ count });
}

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
  const result = await refreshCoversBatch(parsed.data.limit);
  return NextResponse.json(result);
}
