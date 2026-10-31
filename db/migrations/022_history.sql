-- 022: «Историческая линия» (docs/PLAN.md, 31.10.2026). Events from the
-- Prophet to our days on layers: rulers (caliphs, dynasties), texts (when
-- texts were written down and collected), doctrine (schools, movements,
-- rites), science (scholars and their works, «Ислам и наука»). As in the
-- Prophet's life (migration 015), the date of an event is never the site's
-- own: each date is the quoted words of a source with their address, and
-- when sources differ every version is kept.
CREATE TABLE IF NOT EXISTS history_events (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  slug        TEXT NOT NULL UNIQUE CHECK (slug ~ '^[a-z][a-z0-9-]*$'),
  layer       TEXT NOT NULL CHECK (layer IN ('rulers', 'texts', 'doctrine', 'science')),
  topic_id    BIGINT REFERENCES topics (id) ON DELETE SET NULL,
  status      TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'review', 'published', 'retired')),
  created_by  TEXT NOT NULL,
  updated_by  TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
SELECT close_to_public('history_events');

CREATE TABLE IF NOT EXISTS history_event_texts (
  event_id  BIGINT NOT NULL REFERENCES history_events (id) ON DELETE CASCADE,
  locale    TEXT NOT NULL,
  title     TEXT NOT NULL,
  PRIMARY KEY (event_id, locale)
);
SELECT close_to_public('history_event_texts');

-- When the event was, as one source says: its words (found in the text of
-- the address when saved) and their reading. year_ah — the year of the hijra
-- (negative before it, no year 0); year_ce — when the source itself counts
-- by the common era (modern documents); one of them is given. The site shows
-- the other only as an approximate conversion, marked as such. variant — the
-- source gives it as another report ("ويقال"). note — e.g. that the year is
-- the heading of the source's annal ("سنة ثلاث عشرة") the words stand under.
CREATE TABLE IF NOT EXISTS history_event_dates (
  id        BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  event_id  BIGINT NOT NULL REFERENCES history_events (id) ON DELETE CASCADE,
  address   extensions.ltree NOT NULL REFERENCES addresses (address),
  quote     TEXT NOT NULL CHECK (quote <> ''),
  holder    TEXT NOT NULL DEFAULT '',
  year_ah   SMALLINT CHECK (year_ah BETWEEN -150 AND 1600 AND year_ah <> 0),
  year_ce   SMALLINT CHECK (year_ce BETWEEN 400 AND 2200),
  month     SMALLINT CHECK (month BETWEEN 1 AND 12),
  day       SMALLINT CHECK (day BETWEEN 1 AND 31),
  variant   BOOLEAN NOT NULL DEFAULT false,
  note      TEXT NOT NULL DEFAULT '',
  position  INTEGER NOT NULL DEFAULT 0,
  CHECK (month IS NOT NULL OR day IS NULL),
  CHECK (year_ah IS NULL OR year_ce IS NULL)
);
CREATE INDEX IF NOT EXISTS history_event_dates_event_idx ON history_event_dates (event_id, position);
CREATE INDEX IF NOT EXISTS history_event_dates_address_idx ON history_event_dates USING gist (address);
SELECT close_to_public('history_event_dates');

-- The weekly snapshot of editorial data (migration 019) takes the new tables too.
CREATE OR REPLACE FUNCTION take_editorial_snapshot(why text DEFAULT 'weekly') RETURNS bigint
  LANGUAGE plpgsql SET search_path = public, extensions
AS $$
DECLARE
  editorial text[] := ARRAY[
    'terms', 'term_texts', 'term_definitions', 'term_refs', 'term_relations',
    'position_sides', 'position_side_texts',
    'topics', 'topic_texts', 'topic_positions', 'topic_refs', 'topic_terms', 'topic_relations',
    'hadith_link_reviews',
    'places', 'place_texts', 'sira_events', 'sira_event_texts', 'sira_event_dates',
    'sira_people', 'sira_person_texts', 'sira_relations',
    'parallels', 'parallel_texts', 'parallel_refs',
    'history_events', 'history_event_texts', 'history_event_dates',
    'change_log'];
  name text;
  rows jsonb;
  result jsonb := '{}';
  new_id bigint;
BEGIN
  FOREACH name IN ARRAY editorial LOOP
    IF to_regclass(name) IS NOT NULL THEN
      EXECUTE format('SELECT coalesce(jsonb_agg(to_jsonb(t)), ''[]'') FROM %I t', name) INTO rows;
      result := result || jsonb_build_object(name, rows);
    END IF;
  END LOOP;
  INSERT INTO editorial_snapshots (reason, tables) VALUES (why, result) RETURNING id INTO new_id;
  DELETE FROM editorial_snapshots WHERE id NOT IN (SELECT id FROM editorial_snapshots ORDER BY id DESC LIMIT 8);
  RETURN new_id;
END $$;
