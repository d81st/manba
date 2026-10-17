-- 003: glossary of terms, edited by the moderator in the admin panel.
-- A term's texts are site content written per interface language; every
-- claim in them points to fragments of the library (term_refs).

CREATE TABLE IF NOT EXISTS terms (
  id               BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  -- Permanent id in links (/glossary/naskh); not changed once published.
  slug             TEXT NOT NULL UNIQUE CHECK (slug ~ '^[a-z][a-z0-9-]*$'),
  arabic           TEXT NOT NULL,
  transliteration  TEXT NOT NULL,
  -- One of the first terms a newcomer should learn, in this order.
  is_basic         BOOLEAN NOT NULL DEFAULT false,
  basic_order      INTEGER CHECK (basic_order > 0),
  status           TEXT NOT NULL DEFAULT 'draft'
                   CHECK (status IN ('draft', 'review', 'published', 'retired')),
  created_by       TEXT NOT NULL,
  updated_by       TEXT NOT NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
SELECT close_to_public('terms');

-- The term explained in one interface language.
CREATE TABLE IF NOT EXISTS term_texts (
  term_id      BIGINT NOT NULL REFERENCES terms (id) ON DELETE CASCADE,
  locale       TEXT NOT NULL,             -- ru, later uz, en
  translation  TEXT NOT NULL,             -- the term in that language
  short        TEXT NOT NULL,             -- one or two sentences for a newcomer
  detail       TEXT NOT NULL DEFAULT '',  -- longer explanation; "2:106" becomes a link
  PRIMARY KEY (term_id, locale)
);
SELECT close_to_public('term_texts');

-- How schools, scholars or researchers understand the term, side by side,
-- each with how widely the view is accepted.
CREATE TABLE IF NOT EXISTS term_definitions (
  id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  term_id      BIGINT NOT NULL REFERENCES terms (id) ON DELETE CASCADE,
  locale       TEXT NOT NULL,
  holder       TEXT NOT NULL,             -- whose understanding this is
  recognition  TEXT NOT NULL CHECK (recognition IN ('tradition', 'research_majority', 'minority')),
  text         TEXT NOT NULL,
  source_note  TEXT NOT NULL DEFAULT '',  -- a source that is not in the library yet
  position     INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS term_definitions_term_idx ON term_definitions (term_id, position);
SELECT close_to_public('term_definitions');

-- Fragments the term (or one of its definitions) is explained with.
CREATE TABLE IF NOT EXISTS term_refs (
  id             BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  term_id        BIGINT NOT NULL REFERENCES terms (id) ON DELETE CASCADE,
  definition_id  BIGINT REFERENCES term_definitions (id) ON DELETE CASCADE,
  address        extensions.ltree NOT NULL REFERENCES addresses (address),
  position       INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS term_refs_term_idx ON term_refs (term_id, definition_id, position);
CREATE INDEX IF NOT EXISTS term_refs_address_idx ON term_refs USING gist (address);
SELECT close_to_public('term_refs');

-- Links between terms, e.g. naskh — nasikh — mansukh.
CREATE TABLE IF NOT EXISTS term_relations (
  term_id     BIGINT NOT NULL REFERENCES terms (id) ON DELETE CASCADE,
  related_id  BIGINT NOT NULL REFERENCES terms (id) ON DELETE CASCADE,
  kind        TEXT NOT NULL DEFAULT 'related'
              CHECK (kind IN ('related', 'broader', 'narrower', 'opposite')),
  PRIMARY KEY (term_id, related_id),
  CHECK (term_id <> related_id)
);
SELECT close_to_public('term_relations');
