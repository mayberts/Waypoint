export type ViewMode = "cards" | "list" | "headlines" | "moodboard";

export const VIEW_MODES: ViewMode[] = ["cards", "list", "headlines", "moodboard"];

export function isViewMode(v: string | null | undefined): v is ViewMode {
  return !!v && (VIEW_MODES as string[]).includes(v);
}

const STORAGE_PREFIX = "waypoint:view:";

/** Non-collection views (All bookmarks / Unsorted / Search) don't have a DB row to persist to. */
export function loadLocalView(key: string): ViewMode {
  if (typeof window === "undefined") return "cards";
  const v = window.localStorage.getItem(STORAGE_PREFIX + key);
  return isViewMode(v) ? v : "cards";
}

export function saveLocalView(key: string, view: ViewMode): void {
  window.localStorage.setItem(STORAGE_PREFIX + key, view);
}

export const VIRTUAL_VIEW_KEYS = ["all", "unsorted", "search"];

export function applyViewToAllLocalKeys(view: ViewMode): void {
  for (const key of VIRTUAL_VIEW_KEYS) saveLocalView(key, view);
}
