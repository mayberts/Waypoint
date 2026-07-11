"use client";

import { useParams } from "next/navigation";
import { BookmarkGrid } from "@/components/BookmarkGrid";
import { useAppData } from "@/components/providers";

export default function CollectionPage() {
  const { id } = useParams<{ id: string }>();
  const { collections } = useAppData();
  const collection = collections.find((c) => c.id === id);

  return (
    <BookmarkGrid title={collection?.name ?? "Collection"} query={{ collectionId: id }} defaultCollectionId={id} />
  );
}
