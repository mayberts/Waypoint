export interface CollectionDTO {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
  view: string;
  parentId: string | null;
  sortOrder: number;
  createdAt: string;
  shareSlug: string | null;
  _count?: { bookmarks: number };
}

export interface TagDTO {
  id: string;
  name: string;
  _count?: { bookmarks: number };
}

export interface SavedSearchDTO {
  id: string;
  name: string;
  query: string;
  sortOrder: number;
  createdAt: string;
}

export interface IconAssetDTO {
  id: string;
  category: string;
  path: string;
  filename: string;
  createdAt: string;
}

export interface BookmarkDTO {
  id: string;
  url: string;
  title: string;
  description: string | null;
  note: string | null;
  domain: string | null;
  faviconPath: string | null;
  coverImagePath: string | null;
  collectionId: string | null;
  deletedAt: string | null;
  isBroken: boolean;
  linkCheckedAt: string | null;
  createdAt: string;
  updatedAt: string;
  tags: TagDTO[];
}
