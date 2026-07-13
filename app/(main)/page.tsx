"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { BookmarkGrid } from "@/components/BookmarkGrid";
import { useAppData } from "@/components/providers";

export default function AllBookmarksPage() {
  const router = useRouter();
  const { appearance, loading } = useAppData();
  const { defaultLandingView, defaultLandingCollectionId } = appearance;
  const redirecting = !loading && defaultLandingView !== "all";

  useEffect(() => {
    if (loading) return;
    if (defaultLandingView === "unsorted") router.replace("/unsorted");
    else if (defaultLandingView === "stats") router.replace("/stats");
    else if (defaultLandingView === "collection" && defaultLandingCollectionId) {
      router.replace(`/collection/${defaultLandingCollectionId}`);
    }
  }, [loading, defaultLandingView, defaultLandingCollectionId, router]);

  // Wait for the appearance setting to load (and any redirect it triggers)
  // before painting the grid, so visiting "/" doesn't flash "All bookmarks"
  // for a frame when the landing view is set to something else.
  if (loading || redirecting) return null;

  return <BookmarkGrid title="All bookmarks" query={{}} viewKey="all" />;
}
