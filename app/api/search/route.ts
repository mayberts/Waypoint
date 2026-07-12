import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { serializeBookmark } from "@/lib/serialize";

const SEARCH_EXPR = `to_tsvector('english', coalesce(title,'') || ' ' || coalesce(description,'') || ' ' || coalesce(url,'') || ' ' || coalesce(note,''))`;

// websearch_to_tsquery only matches whole (stemmed) lexemes, so typing "ste"
// never matches "steam" — bad for a search box people expect to behave like
// autocomplete. Build a prefix query instead: each word becomes `word:*`
// (matches any lexeme starting with it), ANDed together. Strip everything
// but alphanumerics from each word first so user input can't break tsquery
// syntax (this is a plain runtime error concern, not a SQL-injection one —
// $1 is still a bound parameter).
function buildPrefixTsQuery(q: string): string | null {
  // Split on hyphens too, not just whitespace — nobody searching for
  // "claude-code" means the literal hyphen character, and the tsvector
  // tokenizer splits hyphenated compounds into separate lexemes anyway.
  const words = q
    .trim()
    .split(/[\s-]+/)
    .map((w) => w.replace(/[^a-zA-Z0-9]/g, ""))
    .filter(Boolean);
  if (words.length === 0) return null;
  return words.map((w) => `${w}:*`).join(" & ");
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const q = searchParams.get("q")?.trim();
  const collectionId = searchParams.get("collectionId");
  const tag = searchParams.get("tag");

  if (!q) return NextResponse.json({ error: "Missing q" }, { status: 400 });

  const tsQuery = buildPrefixTsQuery(q);
  if (!tsQuery) return NextResponse.json([]);

  const ranked = await prisma.$queryRawUnsafe<{ id: string }[]>(
    `SELECT id FROM "Bookmark"
     WHERE "deletedAt" IS NULL AND ${SEARCH_EXPR} @@ to_tsquery('english', $1)
     ORDER BY ts_rank(${SEARCH_EXPR}, to_tsquery('english', $1)) DESC
     LIMIT 200`,
    tsQuery
  );

  const ids = ranked.map((r) => r.id);
  if (ids.length === 0) return NextResponse.json([]);

  const bookmarks = await prisma.bookmark.findMany({
    where: {
      id: { in: ids },
      deletedAt: null,
      ...(collectionId ? { collectionId } : {}),
      ...(tag ? { tags: { some: { tag: { name: tag.toLowerCase() } } } } : {}),
    },
    include: { tags: { include: { tag: true } } },
  });

  const order = new Map(ids.map((id, i) => [id, i]));
  bookmarks.sort((a, b) => order.get(a.id)! - order.get(b.id)!);

  return NextResponse.json(bookmarks.map(serializeBookmark));
}
