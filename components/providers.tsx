"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { api } from "@/lib/api-client";
import type { CollectionDTO, TagDTO } from "@/lib/types";

interface AppData {
  collections: CollectionDTO[];
  tags: TagDTO[];
  loading: boolean;
  refreshCollections: () => Promise<void>;
  refreshTags: () => Promise<void>;
}

const AppDataContext = createContext<AppData | null>(null);

export function AppDataProvider({ children }: { children: React.ReactNode }) {
  const [collections, setCollections] = useState<CollectionDTO[]>([]);
  const [tags, setTags] = useState<TagDTO[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshCollections = useCallback(async () => {
    setCollections(await api.get<CollectionDTO[]>("/api/collections"));
  }, []);

  const refreshTags = useCallback(async () => {
    setTags(await api.get<TagDTO[]>("/api/tags"));
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-mount
    Promise.all([refreshCollections(), refreshTags()]).finally(() => setLoading(false));
  }, [refreshCollections, refreshTags]);

  return (
    <AppDataContext.Provider value={{ collections, tags, loading, refreshCollections, refreshTags }}>
      {children}
    </AppDataContext.Provider>
  );
}

export function useAppData(): AppData {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error("useAppData must be used within AppDataProvider");
  return ctx;
}
