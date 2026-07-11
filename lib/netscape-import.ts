import { prisma } from "./db";
import { saveImageBuffer, MAX_FAVICON_BYTES } from "./uploads";

// Netscape Bookmark File Format (Chrome/Firefox/Raindrop export). Standard
// HTML parsers (cheerio/htmlparser2, parse5) do NOT preserve this format's
// intended <H3>/<DL> folder nesting, because <DT> is never closed — so we
// tokenize it directly instead of building a DOM tree.
const TOKEN_RE = /<H3[^>]*>([\s\S]*?)<\/H3>|<A\s+([^>]*)>([\s\S]*?)<\/A>|<DL[^>]*>|<\/DL>/gi;
const ATTR_RE = /([a-zA-Z_:][-a-zA-Z0-9_:.]*)\s*=\s*"([^"]*)"/g;

interface ParsedBookmark {
  url: string;
  title: string;
  iconDataUri?: string;
}

interface ParsedFolder {
  name: string;
  children: ParsedFolder[];
  bookmarks: ParsedBookmark[];
}

function decodeEntities(s: string): string {
  return s
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(parseInt(dec, 10)))
    .replace(/&amp;/g, "&");
}

function stripTags(s: string): string {
  return s.replace(/<[^>]*>/g, "");
}

function parseAttrs(attrString: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  for (const match of attrString.matchAll(ATTR_RE)) {
    attrs[match[1].toLowerCase()] = match[2];
  }
  return attrs;
}

export function parseNetscapeBookmarks(html: string): ParsedFolder {
  const root: ParsedFolder = { name: "", children: [], bookmarks: [] };
  const stack: ParsedFolder[] = [root];
  let pendingFolderName: string | null = null;

  for (const match of html.matchAll(TOKEN_RE)) {
    const [token, h3Text, aAttrs, aText] = match;

    if (h3Text !== undefined) {
      pendingFolderName = decodeEntities(stripTags(h3Text)).trim();
      continue;
    }

    if (aAttrs !== undefined) {
      const attrs = parseAttrs(aAttrs);
      const href = attrs.href;
      if (href && /^https?:\/\//i.test(href)) {
        stack[stack.length - 1].bookmarks.push({
          url: href,
          title: decodeEntities(stripTags(aText)).trim() || href,
          iconDataUri: attrs.icon,
        });
      }
      continue;
    }

    if (/^<DL/i.test(token)) {
      const folder: ParsedFolder = {
        name: pendingFolderName ?? "Imported",
        children: [],
        bookmarks: [],
      };
      if (pendingFolderName !== null) {
        stack[stack.length - 1].children.push(folder);
        stack.push(folder);
      }
      // A <DL> with no preceding <H3> is the file's outer wrapper — stay at
      // the current (root) scope rather than opening a new folder for it.
      pendingFolderName = null;
      continue;
    }

    if (token === "</DL>" || /^<\/DL>/i.test(token)) {
      if (stack.length > 1) stack.pop();
    }
  }

  return root;
}

async function saveEmbeddedIcon(dataUri: string | undefined): Promise<string | undefined> {
  if (!dataUri) return undefined;
  const match = /^data:image\/[a-zA-Z0-9.+-]+;base64,(.+)$/.exec(dataUri);
  if (!match) return undefined;
  try {
    const buf = Buffer.from(match[1], "base64");
    return await saveImageBuffer(buf, MAX_FAVICON_BYTES);
  } catch {
    return undefined;
  }
}

export interface ImportResult {
  collectionsCreated: number;
  bookmarksCreated: number;
}

async function importFolder(folder: ParsedFolder, parentId: string | null, result: ImportResult) {
  for (const bookmark of folder.bookmarks) {
    const faviconPath = await saveEmbeddedIcon(bookmark.iconDataUri);
    let domain: string | undefined;
    try {
      domain = new URL(bookmark.url).hostname;
    } catch {
      continue;
    }
    await prisma.bookmark.create({
      data: {
        url: bookmark.url,
        title: bookmark.title,
        domain,
        faviconPath,
        collectionId: parentId,
      },
    });
    result.bookmarksCreated++;
  }

  for (const child of folder.children) {
    const existingSiblingCount = await prisma.collection.count({ where: { parentId } });
    const created = await prisma.collection.create({
      data: { name: child.name || "Imported", parentId, sortOrder: existingSiblingCount },
    });
    result.collectionsCreated++;
    await importFolder(child, created.id, result);
  }
}

export async function importNetscapeHtml(html: string, targetParentId: string | null): Promise<ImportResult> {
  const root = parseNetscapeBookmarks(html);
  const result: ImportResult = { collectionsCreated: 0, bookmarksCreated: 0 };
  await importFolder(root, targetParentId, result);
  return result;
}
