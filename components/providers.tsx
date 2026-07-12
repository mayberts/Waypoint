"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { api } from "@/lib/api-client";
import type { CollectionDTO, TagDTO, IconAssetDTO, SavedSearchDTO } from "@/lib/types";
import { accentColorByValue, DEFAULT_ACCENT_COLOR } from "@/lib/accent-colors";
import { loadSidebarPrefs, saveSidebarPrefs, DEFAULT_SIDEBAR_PREFS, type SidebarPrefs } from "@/lib/sidebar-prefs";

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
  sidebarPrefs: SidebarPrefs;
  setSidebarPrefs: (patch: Partial<SidebarPrefs>) => void;
  /** Bumped whenever a bookmark moves outside of the currently-mounted grid's own actions (e.g. a sidebar drag-drop), so grids know to refetch. */
  bookmarksVersion: number;
  notifyBookmarksChanged: () => void;
}

const AppDataContext = createContext<AppData | null>(null);

function resolveColorScheme(colorScheme: string): "dark" | "light" {
  if (colorScheme === "auto") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  return colorScheme === "light" ? "light" : "dark";
}

function applyAppearance(settings: AppearanceSettings) {
  const { hex, hexStrong } = accentColorByValue(settings.accentColor);
  document.documentElement.style.setProperty("--accent", hex);
  document.documentElement.style.setProperty("--accent-strong", hexStrong);
  document.documentElement.setAttribute("data-theme", resolveColorScheme(settings.colorScheme));
  document.documentElement.setAttribute("data-density", settings.density);
}

export function AppDataProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [collections, setCollections] = useState<CollectionDTO[]>([]);
  const [tags, setTags] = useState<TagDTO[]>([]);
  const [iconAssets, setIconAssets] = useState<IconAssetDTO[]>([]);
  const [savedSearches, setSavedSearches] = useState<SavedSearchDTO[]>([]);
  const [appearance, setAppearanceState] = useState<AppearanceSettings>(DEFAULT_APPEARANCE);
  // Starts at the defaults (all shown) to match the server-rendered shell —
  // localStorage isn't available during SSR — then reads the real saved
  // preference after mount.
  const [sidebarPrefs, setSidebarPrefsState] = useState<SidebarPrefs>(DEFAULT_SIDEBAR_PREFS);
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

  const setSidebarPrefs = useCallback((patch: Partial<SidebarPrefs>) => {
    setSidebarPrefsState((prev) => {
      const next = { ...prev, ...patch };
      saveSidebarPrefs(next);
      return next;
    });
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reading a client-only localStorage preference after mount
    setSidebarPrefsState(loadSidebarPrefs());
  }, []);

  // In "auto" mode, follow the OS preference live — not just at page load —
  // in case it changes (e.g. a scheduled dark-mode switch) while the app is
  // already open in a tab.
  useEffect(() => {
    if (appearance.colorScheme !== "auto") return;
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => document.documentElement.setAttribute("data-theme", mql.matches ? "dark" : "light");
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [appearance.colorScheme]);

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
        sidebarPrefs,
        setSidebarPrefs,
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
