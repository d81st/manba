-- 052: bookmarks. A reader saves a place of the site (a page, with the #anchor
-- of a fragment) under a name of their own, with an optional note, and finds
-- it again on any device. Only the reader sees their bookmarks; the admin
-- panel does not show them. "owner" is the main administrator ('owner') or an
-- account ('user:<id>'), so a renamed login keeps its bookmarks. Not part of
-- the editorial snapshot: what a person reads is their own business.
-- "Continue reading" is not stored here at all: it stays in the browser.
CREATE TABLE IF NOT EXISTS bookmarks (
  id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  owner      TEXT NOT NULL CHECK (owner ~ '^(owner|user:[0-9]+)$'),
  page       TEXT NOT NULL CHECK (page ~ '^/' AND length(page) <= 500),
  title      TEXT NOT NULL CHECK (length(title) BETWEEN 1 AND 200),
  note       TEXT NOT NULL DEFAULT '' CHECK (length(note) <= 500),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (owner, page)
);
SELECT close_to_public('bookmarks');
