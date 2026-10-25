-- 015: events, places and people of «Жизнеописание пророка» (decisions of the
-- author 25.10.2026): the map of Arabia, the timeline and the graph of people.
-- Nothing here is said by the site itself: a date is what a source says, in
-- its own words and with the address of the passage; a relation between two
-- people is likewise a quoted passage. Published rows change only through the
-- admin panel, and every change goes to change_log.

-- Places of events. Coordinates come with their source (an entry of the
-- al-Thurayya gazetteer, CC BY 4.0) or stay empty until the moderator adds
-- them with one; a place without coordinates is listed but not drawn.
CREATE TABLE IF NOT EXISTS places (
  id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  slug          TEXT NOT NULL UNIQUE CHECK (slug ~ '^[a-z][a-z0-9-]*$'),
  name_ar       TEXT NOT NULL,
  lat           DOUBLE PRECISION CHECK (lat BETWEEN -90 AND 90),
  lon           DOUBLE PRECISION CHECK (lon BETWEEN -180 AND 180),
  coord_source  TEXT NOT NULL DEFAULT '',  -- "al-thurayya:MAKKA_398E213N_S" or a note on another source
  created_by    TEXT NOT NULL,
  updated_by    TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK ((lat IS NULL) = (lon IS NULL)),
  CHECK (lat IS NULL OR coord_source <> '')
);
SELECT close_to_public('places');

CREATE TABLE IF NOT EXISTS place_texts (
  place_id  BIGINT NOT NULL REFERENCES places (id) ON DELETE CASCADE,
  locale    TEXT NOT NULL,
  name      TEXT NOT NULL,
  PRIMARY KEY (place_id, locale)
);
SELECT close_to_public('place_texts');

-- An event of the Prophet's life: a life event or an expedition. Its card, if
-- any, is a topic of the category sira.
CREATE TABLE IF NOT EXISTS sira_events (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  slug        TEXT NOT NULL UNIQUE CHECK (slug ~ '^[a-z][a-z0-9-]*$'),
  kind        TEXT NOT NULL CHECK (kind IN ('life', 'expedition')),
  place_id    BIGINT REFERENCES places (id),
  topic_id    BIGINT REFERENCES topics (id) ON DELETE SET NULL,
  position    INTEGER NOT NULL DEFAULT 0,  -- order in the Prophet's life, for events the sources leave undated
  status      TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'review', 'published', 'retired')),
  created_by  TEXT NOT NULL,
  updated_by  TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
SELECT close_to_public('sira_events');

CREATE TABLE IF NOT EXISTS sira_event_texts (
  event_id  BIGINT NOT NULL REFERENCES sira_events (id) ON DELETE CASCADE,
  locale    TEXT NOT NULL,
  title     TEXT NOT NULL,
  PRIMARY KEY (event_id, locale)
);
SELECT close_to_public('sira_event_texts');

-- When the event was, as one source says: the words of the source (quote,
-- found in the text of the address when saved) and their reading. year_ah is
-- the year of the hijra, negative for the years before it (-13 — the 13th
-- year before the hijra; there is no year 0); a reading may leave the year
-- out when the source gives none ("в год слона"), and the note says what it
-- gives; age — when the source dates by the Prophet's age. variant — the source itself gives it as another report ("ويقال").
CREATE TABLE IF NOT EXISTS sira_event_dates (
  id        BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  event_id  BIGINT NOT NULL REFERENCES sira_events (id) ON DELETE CASCADE,
  address   extensions.ltree NOT NULL REFERENCES addresses (address),
  quote     TEXT NOT NULL CHECK (quote <> ''),
  holder    TEXT NOT NULL DEFAULT '',   -- whose report, as the source names it
  year_ah   SMALLINT CHECK (year_ah BETWEEN -80 AND 20 AND year_ah <> 0),
  month     SMALLINT CHECK (month BETWEEN 1 AND 12),
  day       SMALLINT CHECK (day BETWEEN 1 AND 30),
  age       SMALLINT CHECK (age BETWEEN 0 AND 80),  -- the Prophet's age, when the source dates by it
  variant   BOOLEAN NOT NULL DEFAULT false,
  note      TEXT NOT NULL DEFAULT '',
  position  INTEGER NOT NULL DEFAULT 0,
  CHECK (month IS NOT NULL OR day IS NULL)
);
CREATE INDEX IF NOT EXISTS sira_event_dates_event_idx ON sira_event_dates (event_id, position);
CREATE INDEX IF NOT EXISTS sira_event_dates_address_idx ON sira_event_dates USING gist (address);
SELECT close_to_public('sira_event_dates');

-- People of the graph. search_forms — Arabic forms of the name looked for in
-- the Sira for "mentioned together" (a measure of co-occurrence, not a claim).
CREATE TABLE IF NOT EXISTS sira_people (
  id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  slug          TEXT NOT NULL UNIQUE CHECK (slug ~ '^[a-z][a-z0-9-]*$'),
  name_ar       TEXT NOT NULL,
  search_forms  TEXT[] NOT NULL DEFAULT '{}',
  topic_id      BIGINT REFERENCES topics (id) ON DELETE SET NULL,
  status        TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'review', 'published', 'retired')),
  created_by    TEXT NOT NULL,
  updated_by    TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
SELECT close_to_public('sira_people');

CREATE TABLE IF NOT EXISTS sira_person_texts (
  person_id  BIGINT NOT NULL REFERENCES sira_people (id) ON DELETE CASCADE,
  locale     TEXT NOT NULL,
  name       TEXT NOT NULL,
  PRIMARY KEY (person_id, locale)
);
SELECT close_to_public('sira_person_texts');

-- A relation as a source states it: "a is the <kind> of b" (parent, uncle,
-- grandparent, foster — nurse or guardian), or symmetric (spouse, sibling,
-- cousin). Each with the words of the source and their address.
CREATE TABLE IF NOT EXISTS sira_relations (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  a           BIGINT NOT NULL REFERENCES sira_people (id) ON DELETE CASCADE,
  b           BIGINT NOT NULL REFERENCES sira_people (id) ON DELETE CASCADE,
  kind        TEXT NOT NULL CHECK (kind IN ('parent', 'uncle', 'grandparent', 'foster', 'spouse', 'sibling', 'cousin')),
  address     extensions.ltree NOT NULL REFERENCES addresses (address),
  quote       TEXT NOT NULL CHECK (quote <> ''),
  note        TEXT NOT NULL DEFAULT '',
  status      TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'review', 'published', 'retired')),
  created_by  TEXT NOT NULL,
  updated_by  TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (a <> b)
);
CREATE INDEX IF NOT EXISTS sira_relations_a_idx ON sira_relations (a);
CREATE INDEX IF NOT EXISTS sira_relations_b_idx ON sira_relations (b);
SELECT close_to_public('sira_relations');
