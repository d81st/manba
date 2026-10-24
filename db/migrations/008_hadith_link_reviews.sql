-- 008: a person's verdict on a pair of hadith_links: the same hadith, or not.
-- Rows are only added; the latest row of a pair is its current verdict, so
-- every change of mind stays visible (who, when, why). "cleared" takes a
-- verdict back: the pair is unchecked again.
CREATE TABLE IF NOT EXISTS hadith_link_reviews (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  link_id     BIGINT NOT NULL REFERENCES hadith_links (id),
  verdict     TEXT NOT NULL CHECK (verdict IN ('same', 'different', 'cleared')),
  note        TEXT NOT NULL DEFAULT '' CHECK (length(note) <= 1000),
  actor       TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS hadith_link_reviews_link_idx ON hadith_link_reviews (link_id, id DESC);
SELECT close_to_public('hadith_link_reviews');

DROP TRIGGER IF EXISTS hadith_link_reviews_append_only ON hadith_link_reviews;
CREATE TRIGGER hadith_link_reviews_append_only BEFORE UPDATE OR DELETE ON hadith_link_reviews
  FOR EACH ROW EXECUTE FUNCTION forbid_change();
DROP TRIGGER IF EXISTS hadith_link_reviews_no_truncate ON hadith_link_reviews;
CREATE TRIGGER hadith_link_reviews_no_truncate BEFORE TRUNCATE ON hadith_link_reviews
  FOR EACH STATEMENT EXECUTE FUNCTION forbid_change();
