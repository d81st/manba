-- 009: which ayahs each part of a Quran commentary (tafsir) comments on.
-- A part is addressed by its surah and first ayah (tafsir_ibn_kathir.2.63)
-- and may cover several ayahs; this table gives every ayah it quotes, so an
-- ayah leads to its commentary (docs/ADDRESSES.md). Rows come with the
-- commentary's load and never change.
CREATE TABLE IF NOT EXISTS commentary_ayahs (
  comment   extensions.ltree NOT NULL REFERENCES addresses (address),
  ayah      extensions.ltree NOT NULL REFERENCES addresses (address),
  batch_id  BIGINT REFERENCES import_batches (id),
  PRIMARY KEY (comment, ayah)
);
CREATE INDEX IF NOT EXISTS commentary_ayahs_ayah_idx ON commentary_ayahs (ayah);
SELECT close_to_public('commentary_ayahs');

DROP TRIGGER IF EXISTS commentary_ayahs_append_only ON commentary_ayahs;
CREATE TRIGGER commentary_ayahs_append_only BEFORE UPDATE OR DELETE ON commentary_ayahs
  FOR EACH ROW EXECUTE FUNCTION forbid_change();
DROP TRIGGER IF EXISTS commentary_ayahs_no_truncate ON commentary_ayahs;
CREATE TRIGGER commentary_ayahs_no_truncate BEFORE TRUNCATE ON commentary_ayahs
  FOR EACH STATEMENT EXECUTE FUNCTION forbid_change();
