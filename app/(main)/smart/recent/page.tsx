"use client";

import { useEffect, useState } from "react";
import { BookmarkGrid } from "@/components/BookmarkGrid";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export default function RecentPage() {
  const [since, setSince] = useState<string | null>(null);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Date.now() is impure, so it can't be computed during render; read it after mount instead
    setSince(new Date(Date.now() - WEEK_MS).toISOString());
  }, []);

  if (!since) return null;
  return <BookmarkGrid title="Added this week" query={{ since }} viewKey="smart:recent" />;
}
