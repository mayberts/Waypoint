-- Functional GIN index for full-text search across title/description/url/note.
-- No stored/generated column needed: Postgres can index an expression directly.
CREATE INDEX "Bookmark_search_idx" ON "Bookmark"
  USING GIN (
    to_tsvector(
      'english',
      coalesce(title, '') || ' ' || coalesce(description, '') || ' ' || coalesce(url, '') || ' ' || coalesce(note, '')
    )
  );
