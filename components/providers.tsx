"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { api } from "@/lib/api-client";
import type { CollectionDTO, TagDTO, IconAssetDTO } from "@/lib/types";

interface AppData {
  collections: CollectionDTO[];
  tags: TagDTO[];
  iconAssets: IconAssetDTO[];
  loading: boolean;
  refreshCollections: () => Promise<void>;
  refreshTags: () => Promise<void>;
  refreshIconAssets: () => Promise<void>;
}

const AppDataContext = createContext<AppData | null>(null);

export function AppDataProvider({ children }: { children: React.ReactNode }) {
  const [collections, setCollections] = useState<CollectionDTO[]>([]);
  const [tags, setTags] = useState<TagDTO[]>([]);
  const [iconAssets, setIconAssets] = useState<IconAssetDTO[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshCollections = useCallback(async () => {
    setCollections(await api.get<CollectionDTO[]>("/api/collections"));
  }, []);

  const refreshTags = useCallback(async () => {
    setTags(await api.get<TagDTO[]>("/api/tags"));
  }, []);

  const refreshIconAssets = useCallback(async () => {
    setIconAssets(await api.get<IconAssetDTO[]>("/api/icon-assets"));
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-mount
    Promise.all([refreshCollections(), refreshTags(), refreshIconAssets()]).finally(() => setLoading(false));
  }, [refreshCollections, refreshTags, refreshIconAssets]);

  return (
    <AppDataContext.Provider
      value={{ collections, tags, iconAssets, loading, refreshCollections, refreshTags, refreshIconAssets }}
    >
      {children}
    </AppDataContext.Provider>
  );
}

export function useAppData(): AppData {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error("useAppData must be used within AppDataProvider");
  return ctx;
}
