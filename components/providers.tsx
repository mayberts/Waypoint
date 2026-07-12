"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { api } from "@/lib/api-client";
import type { CollectionDTO, TagDTO, IconAssetDTO, SavedSearchDTO } from "@/lib/types";
import { accentColorByValue, DEFAULT_ACCENT_COLOR } from "@/lib/accent-colors";

interface AppearanceSettings {
  accentColor: string;
  colorScheme: string;
  density: string;
  gridPattern: string;
}

const DEFAULT_APPEARANCE: AppearanceSettings = {
  accentColor: DEFAULT_ACCENT_COLOR,
  colorScheme: "dark",
  density: "comfortable",
  gridPattern: "none",
};

interface AppData {
  collections: CollectionDTO[];
  tags: TagDTO[];
  iconAssets: IconAssetDTO[];
  savedSearches: SavedSearchDTO[];
  appearance: AppearanceSettings;
  loading: boolean;
  refreshCollections: () => Promise<void>;
  refreshTags: () => Promise<void>;
  refreshIconAssets: () => Promise<void>;
  refreshSavedSearches: () => Promise<void>;
  setAppearance: (patch: Partial<AppearanceSettings>) => void;
  /** Bumped whenever a bookmark moves outside of the currently-mounted grid's own actions (e.g. a sidebar drag-drop), so grids know to refetch. */
  bookmarksVersion: number;
  notifyBookmarksChanged: () => void;
}

const AppDataContext = createContext<AppData | null>(null);

function applyAppearance(settings: AppearanceSettings) {
  const { hex, hexStrong } = accentColorByValue(settings.accentColor);
  document.documentElement.style.setProperty("--accent", hex);
  document.documentElement.style.setProperty("--accent-strong", hexStrong);
  document.documentElement.setAttribute("data-theme", settings.colorScheme);
  document.documentElement.setAttribute("data-density", settings.density);
}

export function AppDataProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [collections, setCollections] = useState<CollectionDTO[]>([]);
  const [tags, setTags] = useState<TagDTO[]>([]);
  const [iconAssets, setIconAssets] = useState<IconAssetDTO[]>([]);
  const [savedSearches, setSavedSearches] = useState<SavedSearchDTO[]>([]);
  const [appearance, setAppearanceState] = useState<AppearanceSettings>(DEFAULT_APPEARANCE);
  const [loading, setLoading] = useState(true);
  const [bookmarksVersion, setBookmarksVersion] = useState(0);
  const notifyBookmarksChanged = useCallback(() => setBookmarksVersion((v) => v + 1), []);

  const refreshCollections = useCallback(async () => {
    setCollections(await api.get<CollectionDTO[]>("/api/collections"));
  }, []);

  const refreshTags = useCallback(async () => {
    setTags(await api.get<TagDTO[]>("/api/tags"));
  }, []);

  const refreshIconAssets = useCallback(async () => {
    setIconAssets(await api.get<IconAssetDTO[]>("/api/icon-assets"));
  }, []);

  const refreshSavedSearches = useCallback(async () => {
    setSavedSearches(await api.get<SavedSearchDTO[]>("/api/saved-searches"));
  }, []);

  const refreshAppearance = useCallback(async () => {
    const settings = await api.get<AppearanceSettings>("/api/settings/appearance");
    setAppearanceState(settings);
    applyAppearance(settings);
  }, []);

  const setAppearance = useCallback((patch: Partial<AppearanceSettings>) => {
    setAppearanceState((prev) => {
      const next = { ...prev, ...patch };
      applyAppearance(next);
      return next;
    });
  }, []);

  useEffect(() => {
    // The login page and public share pages are reachable pre-authentication,
    // so these (now session-gated) endpoints would just 401 — skip fetching
    // there. Nothing under /login or /share reads `loading`, so leaving it at
    // its initial value is fine.
    if (pathname === "/login" || pathname?.startsWith("/share/")) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-mount
    Promise.all([refreshCollections(), refreshTags(), refreshIconAssets(), refreshSavedSearches(), refreshAppearance()]).finally(() =>
      setLoading(false)
    );
  }, [pathname, refreshCollections, refreshTags, refreshIconAssets, refreshSavedSearches, refreshAppearance]);

  return (
    <AppDataContext.Provider
      value={{
        collections,
        tags,
        iconAssets,
        savedSearches,
        appearance,
        loading,
        refreshCollections,
        refreshTags,
        refreshIconAssets,
        refreshSavedSearches,
        setAppearance,
        bookmarksVersion,
        notifyBookmarksChanged,
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
