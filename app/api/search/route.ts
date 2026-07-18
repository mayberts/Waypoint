import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { serializeBookmark } from "@/lib/serialize";
import { parseSearchQuery } from "@/lib/search-query";

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

  const parsed = parseSearchQuery(q);

  // tag:/site:/is: operators, layered on top of whatever the caller already
  // filters by (a saved search's own collectionId/tag, if any).
  const operatorWhere: Prisma.BookmarkWhereInput = {
    ...(collectionId ? { collectionId } : {}),
    ...(tag ? { tags: { some: { tag: { name: tag.toLowerCase() } } } } : {}),
    ...(parsed.tags.length > 0 ? { AND: parsed.tags.map((t) => ({ tags: { some: { tag: { name: t } } } })) } : {}),
    // endsWith (not contains): "site:udemy.com" should catch "www.udemy.com"
    // too, but "site:udemy.com" shouldn't match an unrelated domain that
    // merely contains "udemy.com" partway through.
    ...(parsed.sites.length > 0
      ? { OR: parsed.sites.map((s) => ({ domain: { endsWith: s, mode: "insensitive" as const } })) }
      : {}),
    ...(parsed.favorite ? { isFavorite: true } : {}),
    ...(parsed.broken ? { isBroken: true } : {}),
    ...(parsed.untagged ? { tags: { none: {} } } : {}),
  };

  // A query that's operators only (e.g. "tag:recipes") has no text to rank
  // by — just filter and show newest first, skipping the tsvector step.
  if (!parsed.text) {
    const bookmarks = await prisma.bookmark.findMany({
      where: { deletedAt: null, ...operatorWhere },
      include: { tags: { include: { tag: true } } },
      orderBy: { createdAt: "desc" },
      take: 200,
    });
    return NextResponse.json(bookmarks.map(serializeBookmark));
  }

  const tsQuery = buildPrefixTsQuery(parsed.text);
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
    where: { id: { in: ids }, deletedAt: null, ...operatorWhere },
    include: { tags: { include: { tag: true } } },
  });

  const order = new Map(ids.map((id, i) => [id, i]));
  bookmarks.sort((a, b) => order.get(a.id)! - order.get(b.id)!);

  return NextResponse.json(bookmarks.map(serializeBookmark));
}
