// dnd-kit shares one flat id namespace across every draggable/droppable in the
// app (collections in the sidebar tree, bookmark cards/rows in the grid), so
// every id is prefixed by kind to tell them apart in a single onDragEnd handler.
const COLLECTION_PREFIX = "collection:";
const BOOKMARK_PREFIX = "bookmark:";

export const UNSORTED_DROP_ID = "unsorted-drop";

export function collectionDndId(id: string): string {
  return `${COLLECTION_PREFIX}${id}`;
}

export function bookmarkDndId(id: string): string {
  return `${BOOKMARK_PREFIX}${id}`;
}

export function parseCollectionDndId(id: string | number | undefined): string | null {
  return typeof id === "string" && id.startsWith(COLLECTION_PREFIX) ? id.slice(COLLECTION_PREFIX.length) : null;
}

export function parseBookmarkDndId(id: string | number | undefined): string | null {
  return typeof id === "string" && id.startsWith(BOOKMARK_PREFIX) ? id.slice(BOOKMARK_PREFIX.length) : null;
}
