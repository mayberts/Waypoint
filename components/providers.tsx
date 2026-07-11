"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { api } from "@/lib/api-client";
import type { CollectionDTO, TagDTO, IconAssetDTO } from "@/lib/types";
import { accentColorByValue, DEFAULT_ACCENT_COLOR } from "@/lib/accent-colors";

interface AppData {
  collections: CollectionDTO[];
  tags: TagDTO[];
  iconAssets: IconAssetDTO[];
  accentColor: string;
  loading: boolean;
  refreshCollections: () => Promise<void>;
  refreshTags: () => Promise<void>;
  refreshIconAssets: () => Promise<void>;
  setAccentColor: (value: string) => void;
}

const AppDataContext = createContext<AppData | null>(null);

function applyAccentColor(value: string) {
  const { hex, hexStrong } = accentColorByValue(value);
  document.documentElement.style.setProperty("--accent", hex);
  document.documentElement.style.setProperty("--accent-strong", hexStrong);
}

export function AppDataProvider({ children }: { children: React.ReactNode }) {
  const [collections, setCollections] = useState<CollectionDTO[]>([]);
  const [tags, setTags] = useState<TagDTO[]>([]);
  const [iconAssets, setIconAssets] = useState<IconAssetDTO[]>([]);
  const [accentColor, setAccentColorState] = useState(DEFAULT_ACCENT_COLOR);
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

  const refreshAccentColor = useCallback(async () => {
    const { accentColor } = await api.get<{ accentColor: string }>("/api/settings/appearance");
    setAccentColorState(accentColor);
    applyAccentColor(accentColor);
  }, []);

  const setAccentColor = useCallback((value: string) => {
    setAccentColorState(value);
    applyAccentColor(value);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-mount
    Promise.all([refreshCollections(), refreshTags(), refreshIconAssets(), refreshAccentColor()]).finally(() =>
      setLoading(false)
    );
  }, [refreshCollections, refreshTags, refreshIconAssets, refreshAccentColor]);

  return (
    <AppDataContext.Provider
      value={{
        collections,
        tags,
        iconAssets,
        accentColor,
        loading,
        refreshCollections,
        refreshTags,
        refreshIconAssets,
        setAccentColor,
      }}
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
