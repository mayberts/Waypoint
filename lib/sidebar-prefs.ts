// Which optional sidebar sections/links are shown — a personal display
// preference, not app data, so (like collapsed-collection state) it lives in
// localStorage rather than the database: nothing here needs to sync across
// devices or survive a account.
export interface SidebarPrefs {
  showStats: boolean;
  showTags: boolean;
  showSmartFavorites: boolean;
  showSmartBroken: boolean;
  showSmartRecent: boolean;
  showSmartUntagged: boolean;
}

export const DEFAULT_SIDEBAR_PREFS: SidebarPrefs = {
  showStats: true,
  showTags: true,
  showSmartFavorites: true,
  showSmartBroken: true,
  showSmartRecent: true,
  showSmartUntagged: true,
};

const STORAGE_KEY = "waypoint:sidebar-prefs";

export function loadSidebarPrefs(): SidebarPrefs {
  if (typeof window === "undefined") return DEFAULT_SIDEBAR_PREFS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SIDEBAR_PREFS;
    const parsed = JSON.parse(raw);
    // Merge over the defaults so a preference added in a later release
    // (a key missing from an older saved blob) still comes back `true`.
    return { ...DEFAULT_SIDEBAR_PREFS, ...parsed };
  } catch {
    return DEFAULT_SIDEBAR_PREFS;
  }
}

export function saveSidebarPrefs(prefs: SidebarPrefs): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
}
