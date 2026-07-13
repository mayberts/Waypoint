import { NextRequest, NextResponse } from "next/server";
import { refetchBookmarkImages } from "@/lib/scan-jobs";

// Manual per-bookmark force refetch of favicon + cover image, triggered from
// the edit drawer — unlike the Settings bulk refresh, this runs regardless
// of whether the bookmark already has images.
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const result = await refetchBookmarkImages(id);
    return NextResponse.json(result);
  } catch (err) {
    const notFound = err instanceof Error && err.message === "Bookmark not found";
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Refetch failed" },
      { status: notFound ? 404 : 400 }
    );
  }
}
