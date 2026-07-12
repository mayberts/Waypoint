export type SortMode = "manual" | "newest" | "oldest" | "title-asc" | "title-desc";

export const SORT_MODES: SortMode[] = ["manual", "newest", "oldest", "title-asc", "title-desc"];

export function isSortMode(v: string | null | undefined): v is SortMode {
  return !!v && (SORT_MODES as string[]).includes(v);
}

const STORAGE_PREFIX = "waypoint:sort:";

/** Non-collection views (All bookmarks / Search / Smart collections) don't have a DB row to persist to. */
export function loadLocalSort(key: string, fallback: SortMode): SortMode {
  if (typeof window === "undefined") return fallback;
  const v = window.localStorage.getItem(STORAGE_PREFIX + key);
  return isSortMode(v) ? v : fallback;
}

export function saveLocalSort(key: string, sort: SortMode): void {
  window.localStorage.setItem(STORAGE_PREFIX + key, sort);
}
