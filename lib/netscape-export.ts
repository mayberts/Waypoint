import { readFile } from "node:fs/promises";
import path from "node:path";
import { prisma } from "./db";
import { UPLOADS_DIR, contentTypeForExt } from "./uploads";

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function unixTime(date: Date): number {
  return Math.floor(date.getTime() / 1000);
}

async function faviconDataUri(faviconPath: string | null): Promise<string | null> {
  if (!faviconPath) return null;
  const filename = faviconPath.split("/").pop();
  if (!filename) return null;
  const ext = filename.split(".").pop() || "";
  try {
    const buf = await readFile(path.join(UPLOADS_DIR, filename));
    return `data:${contentTypeForExt(ext)};base64,${buf.toString("base64")}`;
  } catch {
    // Favicon file missing from disk (shouldn't normally happen) — export
    // the bookmark without an icon rather than failing the whole export.
    return null;
  }
}

interface ExportBookmark {
  id: string;
  url: string;
  title: string;
  faviconPath: string | null;
  createdAt: Date;
  collectionId: string | null;
  tags: { tag: { name: string } }[];
}

interface ExportCollection {
  id: string;
  name: string;
  parentId: string | null;
  sortOrder: number;
  createdAt: Date;
}

async function renderBookmark(b: ExportBookmark): Promise<string> {
  const icon = await faviconDataUri(b.faviconPath);
  const tagNames = b.tags.map((t) => t.tag.name).join(",");
  const attrs = [
    `HREF="${escapeHtml(b.url)}"`,
    `ADD_DATE="${unixTime(b.createdAt)}"`,
    icon ? `ICON="${icon}"` : null,
    tagNames ? `TAGS="${escapeHtml(tagNames)}"` : null,
  ]
    .filter(Boolean)
    .join(" ");
  return `<DT><A ${attrs}>${escapeHtml(b.title)}</A>`;
}

async function renderFolder(
  parentId: string | null,
  indent: string,
  bookmarksByCollection: Map<string | null, ExportBookmark[]>,
  collectionsByParent: Map<string | null, ExportCollection[]>
): Promise<string> {
  const lines: string[] = [];

  for (const b of bookmarksByCollection.get(parentId) ?? []) {
    lines.push(indent + (await renderBookmark(b)));
  }

  const children = [...(collectionsByParent.get(parentId) ?? [])].sort((a, b) => a.sortOrder - b.sortOrder);
  for (const c of children) {
    lines.push(`${indent}<DT><H3 ADD_DATE="${unixTime(c.createdAt)}">${escapeHtml(c.name)}</H3>`);
    lines.push(`${indent}<DL><p>`);
    lines.push(await renderFolder(c.id, indent + "    ", bookmarksByCollection, collectionsByParent));
    lines.push(`${indent}</DL><p>`);
  }

  return lines.join("\n");
}

export async function buildNetscapeExport(): Promise<string> {
  const [collections, bookmarks] = await Promise.all([
    prisma.collection.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.bookmark.findMany({
      where: { deletedAt: null },
      include: { tags: { include: { tag: true } } },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  const collectionsByParent = new Map<string | null, ExportCollection[]>();
  for (const c of collections) {
    const list = collectionsByParent.get(c.parentId) ?? [];
    list.push(c);
    collectionsByParent.set(c.parentId, list);
  }

  const bookmarksByCollection = new Map<string | null, ExportBookmark[]>();
  for (const b of bookmarks) {
    const list = bookmarksByCollection.get(b.collectionId) ?? [];
    list.push(b);
    bookmarksByCollection.set(b.collectionId, list);
  }

  const body = await renderFolder(null, "    ", bookmarksByCollection, collectionsByParent);

  return `<!DOCTYPE NETSCAPE-Bookmark-file-1>
<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">
<TITLE>Bookmarks</TITLE>
<H1>Bookmarks</H1>
<DL><p>
${body}
</DL><p>
`;
}
