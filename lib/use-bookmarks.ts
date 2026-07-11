"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "./api-client";
import type { BookmarkDTO } from "./types";

export interface BookmarkQuery {
  collectionId?: string;
  unsorted?: boolean;
  q?: string;
}

function buildUrl(query: BookmarkQuery): string {
  if (query.q) {
    const params = new URLSearchParams({ q: query.q });
    return `/api/search?${params}`;
  }
  const params = new URLSearchParams();
  if (query.unsorted) params.set("unsorted", "true");
  else if (query.collectionId) params.set("collectionId", query.collectionId);
  return `/api/bookmarks?${params}`;
}

export function useBookmarks(query: BookmarkQuery) {
  const [bookmarks, setBookmarks] = useState<BookmarkDTO[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setBookmarks(await api.get<BookmarkDTO[]>(buildUrl(query)));
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query.collectionId, query.unsorted, query.q]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-mount/query-change
    refresh();
  }, [refresh]);

  return { bookmarks, loading, refresh };
}
