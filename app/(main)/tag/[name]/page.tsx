"use client";

import { useParams } from "next/navigation";
import { BookmarkGrid } from "@/components/BookmarkGrid";

export default function TagPage() {
  const { name } = useParams<{ name: string }>();
  const tag = decodeURIComponent(name);

  return <BookmarkGrid title={`#${tag}`} query={{ tag }} viewKey={`tag:${tag}`} />;
}
