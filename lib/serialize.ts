import type { Bookmark, Tag } from "@prisma/client";

type BookmarkWithTags = Bookmark & { tags: { tag: Tag }[] };

export function serializeBookmark(b: BookmarkWithTags) {
  const { tags, ...rest } = b;
  return { ...rest, tags: tags.map((t) => t.tag) };
}
