-- 005: structure of hadith collections (and later other books).
-- A hadith is an address (bukhari.3951) with its text in `texts`, as for the
-- Quran. Books and chapters of an edition are kept here for navigation only:
-- they are not part of the address (docs/ADDRESSES.md, section 3).

-- Books and chapters of one text version, with the edition's own words:
-- the chapter heading and the text under it before the first hadith.
CREATE TABLE IF NOT EXISTS work_sections (
  id             BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  version_id     TEXT NOT NULL REFERENCES text_versions (id),
  kind           TEXT NOT NULL CHECK (kind IN ('book', 'chapter')),
  book           INTEGER NOT NULL CHECK (book > 0),
  chapter        INTEGER CHECK (chapter > 0),          -- NULL for a book
  ordinal        INTEGER NOT NULL,                      -- reading order in the version
  title          TEXT NOT NULL DEFAULT '',
  intro          TEXT NOT NULL DEFAULT '',              -- paragraphs separated by a blank line
  -- Narration printed in the chapter that the source gives no number for.
  unnumbered     TEXT NOT NULL DEFAULT '',
  batch_id       BIGINT REFERENCES import_batches (id),
  CHECK ((kind = 'book') = (chapter IS NULL)),
  UNIQUE (version_id, ordinal)
);
CREATE UNIQUE INDEX IF NOT EXISTS work_sections_place_idx
  ON work_sections (version_id, book, COALESCE(chapter, 0));
SELECT close_to_public('work_sections');

-- Where each hadith of a version stands, and how its number was established:
-- marker — printed in the source; gap / displaced — inferred during import
-- (see the import report), to be checked by a specialist.
CREATE TABLE IF NOT EXISTS section_items (
  version_id  TEXT NOT NULL REFERENCES text_versions (id),
  address     extensions.ltree NOT NULL REFERENCES addresses (address),
  book        INTEGER NOT NULL,
  chapter     INTEGER NOT NULL,
  numbering   TEXT NOT NULL DEFAULT 'marker' CHECK (numbering IN ('marker', 'gap', 'displaced')),
  batch_id    BIGINT REFERENCES import_batches (id),
  PRIMARY KEY (version_id, address)
);
CREATE INDEX IF NOT EXISTS section_items_place_idx ON section_items (version_id, book, chapter);
SELECT close_to_public('section_items');

-- Like texts: rows of a published version never change.
CREATE OR REPLACE FUNCTION version_rows_guard() RETURNS trigger
  LANGUAGE plpgsql SET search_path = pg_catalog, public
AS $$
DECLARE
  version_status TEXT;
BEGIN
  SELECT status INTO version_status FROM text_versions WHERE id = OLD.version_id;
  IF version_status IN ('published', 'retired') THEN
    RAISE EXCEPTION 'Rows of a published version cannot change: publish a corrected version instead'
      USING ERRCODE = 'P0001';
  END IF;
  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END $$;
DROP TRIGGER IF EXISTS work_sections_immutable_when_published ON work_sections;
CREATE TRIGGER work_sections_immutable_when_published BEFORE UPDATE OR DELETE ON work_sections
  FOR EACH ROW EXECUTE FUNCTION version_rows_guard();
DROP TRIGGER IF EXISTS section_items_immutable_when_published ON section_items;
CREATE TRIGGER section_items_immutable_when_published BEFORE UPDATE OR DELETE ON section_items
  FOR EACH ROW EXECUTE FUNCTION version_rows_guard();
