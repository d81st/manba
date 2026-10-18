-- 004: topics — one structure for encyclopedia entries and hard topics.
-- A topic is a neutral question, the passages it is about, the circumstances,
-- and positions of different sides, each with how widely it is accepted.
-- Positions are a flat list: they are not paired with each other.

-- Sides a position can come from. Kept as data so the moderator can add new
-- ones (for example Sufis or reformers) without a migration.
CREATE TABLE IF NOT EXISTS position_sides (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  slug        TEXT NOT NULL UNIQUE CHECK (slug ~ '^[a-z][a-z0-9-]*$'),
  position    INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
SELECT close_to_public('position_sides');

CREATE TABLE IF NOT EXISTS position_side_texts (
  side_id  BIGINT NOT NULL REFERENCES position_sides (id) ON DELETE CASCADE,
  locale   TEXT NOT NULL,
  title    TEXT NOT NULL,
  PRIMARY KEY (side_id, locale)
);
SELECT close_to_public('position_side_texts');

-- The starting list agreed with the author on 18.10.2026.
INSERT INTO position_sides (slug, position) VALUES
  ('sunni', 1), ('shia', 2), ('research', 3), ('critics', 4), ('other', 5)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO position_side_texts (side_id, locale, title)
SELECT s.id, 'ru', v.title
FROM (VALUES ('sunni', 'Традиция: сунниты'), ('shia', 'Традиция: шииты'), ('research', 'Исследователи'),
             ('critics', 'Критики'), ('other', 'Другие')) AS v(slug, title)
JOIN position_sides s ON s.slug = v.slug
ON CONFLICT (side_id, locale) DO NOTHING;

CREATE TABLE IF NOT EXISTS topics (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  -- Permanent id in links (/topics/jihad); not changed once published.
  slug        TEXT NOT NULL UNIQUE CHECK (slug ~ '^[a-z][a-z0-9-]*$'),
  -- One section for now; a new value here becomes a separate section later.
  category    TEXT NOT NULL DEFAULT 'general' CHECK (category IN ('general', 'hard')),
  status      TEXT NOT NULL DEFAULT 'draft'
              CHECK (status IN ('draft', 'review', 'published', 'retired')),
  created_by  TEXT NOT NULL,
  updated_by  TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
SELECT close_to_public('topics');

CREATE TABLE IF NOT EXISTS topic_texts (
  topic_id             BIGINT NOT NULL REFERENCES topics (id) ON DELETE CASCADE,
  locale               TEXT NOT NULL,
  title                TEXT NOT NULL,
  question             TEXT NOT NULL,             -- the neutral question the topic answers
  circumstances        TEXT NOT NULL DEFAULT '',  -- occasion and historical background; "9:29" becomes a link
  circumstances_note   TEXT NOT NULL DEFAULT '',  -- sources that are not in the library yet
  PRIMARY KEY (topic_id, locale)
);
SELECT close_to_public('topic_texts');

CREATE TABLE IF NOT EXISTS topic_positions (
  id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  topic_id     BIGINT NOT NULL REFERENCES topics (id) ON DELETE CASCADE,
  side_id      BIGINT NOT NULL REFERENCES position_sides (id),
  locale       TEXT NOT NULL,
  holder       TEXT NOT NULL,             -- whose position: school, scholar, author
  recognition  TEXT NOT NULL CHECK (recognition IN ('tradition', 'research_majority', 'minority')),
  text         TEXT NOT NULL,
  source_note  TEXT NOT NULL DEFAULT '',  -- hadith, tafsir, books not in the library yet
  position     INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS topic_positions_topic_idx ON topic_positions (topic_id, position);
CREATE INDEX IF NOT EXISTS topic_positions_side_idx ON topic_positions (side_id);
SELECT close_to_public('topic_positions');

-- Library fragments of a topic: the passages it is about (main), related
-- places, references of the circumstances, and references of each position.
CREATE TABLE IF NOT EXISTS topic_refs (
  id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  topic_id     BIGINT NOT NULL REFERENCES topics (id) ON DELETE CASCADE,
  role         TEXT NOT NULL CHECK (role IN ('main', 'related', 'circumstances', 'position')),
  position_id  BIGINT REFERENCES topic_positions (id) ON DELETE CASCADE,
  address      extensions.ltree NOT NULL REFERENCES addresses (address),
  position     INTEGER NOT NULL DEFAULT 0,
  CHECK ((role = 'position') = (position_id IS NOT NULL))
);
CREATE INDEX IF NOT EXISTS topic_refs_topic_idx ON topic_refs (topic_id, role, position);
CREATE INDEX IF NOT EXISTS topic_refs_address_idx ON topic_refs USING gist (address);
SELECT close_to_public('topic_refs');

CREATE TABLE IF NOT EXISTS topic_terms (
  topic_id  BIGINT NOT NULL REFERENCES topics (id) ON DELETE CASCADE,
  term_id   BIGINT NOT NULL REFERENCES terms (id) ON DELETE CASCADE,
  PRIMARY KEY (topic_id, term_id)
);
CREATE INDEX IF NOT EXISTS topic_terms_term_idx ON topic_terms (term_id);
SELECT close_to_public('topic_terms');

-- Kept in both directions, like term relations.
CREATE TABLE IF NOT EXISTS topic_relations (
  topic_id    BIGINT NOT NULL REFERENCES topics (id) ON DELETE CASCADE,
  related_id  BIGINT NOT NULL REFERENCES topics (id) ON DELETE CASCADE,
  PRIMARY KEY (topic_id, related_id),
  CHECK (topic_id <> related_id)
);
SELECT close_to_public('topic_relations');
