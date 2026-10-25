-- 016: «Священные города» (decision of the author 25.10.2026): a city is a
-- topic of the category cities, tied to its place on the map (the places of
-- migration 015). place_id may be set for a topic of any category.
ALTER TABLE topics DROP CONSTRAINT IF EXISTS topics_category_check;
ALTER TABLE topics ADD CONSTRAINT topics_category_check
  CHECK (category IN ('general', 'hard', 'quran_text', 'sira', 'cities'));
ALTER TABLE topics ADD COLUMN IF NOT EXISTS place_id BIGINT REFERENCES places (id);
CREATE INDEX IF NOT EXISTS topics_place_idx ON topics (place_id) WHERE place_id IS NOT NULL;
