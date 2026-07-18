export interface ParsedSearchQuery {
  /** Whatever's left after stripping operators — fed to the full-text search. Empty string if the query was operators only. */
  text: string;
  /** tag:name — ANDed, a bookmark must carry every listed tag. */
  tags: string[];
  /** site:domain — ORed, a bookmark matches if its domain ends with any listed value. */
  sites: string[];
  favorite: boolean;
  broken: boolean;
  untagged: boolean;
}

// Matches "tag:foo", "site:example.com", 'tag:"multi word"' etc. — a bare
// keyword, colon, then either a quoted phrase or a single non-space token.
const OPERATOR_RE = /(^|\s)(tag|site|is):("[^"]+"|\S+)/gi;

/** Splits a search box query into recognized operators (tag:/site:/is:) and the remaining free text. */
export function parseSearchQuery(raw: string): ParsedSearchQuery {
  const tags: string[] = [];
  const sites: string[] = [];
  let favorite = false;
  let broken = false;
  let untagged = false;

  const text = raw
    .replace(OPERATOR_RE, (_match, _pre, key, rawValue) => {
      const value = rawValue.replace(/^"|"$/g, "").trim().toLowerCase();
      if (!value) return "";
      switch (key.toLowerCase()) {
        case "tag":
          tags.push(value);
          break;
        case "site":
          sites.push(value);
          break;
        case "is":
          if (value === "favorite" || value === "favourite") favorite = true;
          else if (value === "broken") broken = true;
          else if (value === "untagged") untagged = true;
          break;
      }
      return "";
    })
    .replace(/\s+/g, " ")
    .trim();

  return { text, tags, sites, favorite, broken, untagged };
}
