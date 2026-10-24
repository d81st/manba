-- 007: links between hadiths of different collections.
-- similar_text: a pair found automatically by shared wording
-- (data/sources/links/README.md). It is a measure, not a claim that the two
-- texts are one hadith; the site shows it as such, with its share.
-- Pairs confirmed or rejected by a person will be kept in a separate table.
CREATE TABLE IF NOT EXISTS hadith_links (
  id        BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  a         extensions.ltree NOT NULL REFERENCES addresses (address),
  b         extensions.ltree NOT NULL REFERENCES addresses (address),
  kind      TEXT NOT NULL CHECK (kind IN ('similar_text')),
  share     NUMERIC(3, 2) NOT NULL CHECK (share > 0 AND share <= 1),
  method    TEXT NOT NULL,              -- how the pair was found, e.g. similar-texts:v1
  batch_id  BIGINT REFERENCES import_batches (id),
  CHECK (a <> b),
  UNIQUE (a, b, kind, method)
);
CREATE INDEX IF NOT EXISTS hadith_links_b_idx ON hadith_links (b);
SELECT close_to_public('hadith_links');

-- A new method or new texts give a new batch; loaded pairs never change.
DROP TRIGGER IF EXISTS hadith_links_append_only ON hadith_links;
CREATE TRIGGER hadith_links_append_only BEFORE UPDATE OR DELETE ON hadith_links
  FOR EACH ROW EXECUTE FUNCTION forbid_change();
DROP TRIGGER IF EXISTS hadith_links_no_truncate ON hadith_links;
CREATE TRIGGER hadith_links_no_truncate BEFORE TRUNCATE ON hadith_links
  FOR EACH STATEMENT EXECUTE FUNCTION forbid_change();
