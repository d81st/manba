-- 012: less space per text (decision of the author, 25.10.2026: free plans
-- until the site is finished; the free database holds 500 MB).
-- 1. The vocalized search form is no longer stored: search_key(content, true)
--    computes it, the same as searchKey(text, { diacritics: true }) in
--    web/src/lib/arabic.ts (checked equal on all 103 381 texts). A search with
--    vowel marks finds candidates by letters and checks the vowels on them.
-- 2. The trigram index on search_plain covers only the collections searched
--    all at once (Quran, hadith): search_indexed(version) is false for books
--    searched one at a time (Sira, tafsir, ...), which are read by their own
--    rows. A new book is indexed until it is added to the list here (with
--    a REINDEX of texts_search_plain_part_idx): only space is lost, never
--    results. A collection must never be in the list.
-- 3. The table is rewritten (CLUSTER) so that the space of the dropped column
--    is given back.
CREATE OR REPLACE FUNCTION search_key(t text, vowels boolean DEFAULT false) RETURNS text
LANGUAGE sql IMMUTABLE PARALLEL SAFE AS $$
  SELECT btrim(regexp_replace(
    translate(
      regexp_replace(
        regexp_replace(normalize(t, NFKC), '[​-‏‪-‮⁦-⁩﻿ـ]', '', 'g'),
        CASE WHEN vowels THEN '[ؐ-ؚۖ-ۭ࣓-ࣣ࣡-ࣿ]'
             ELSE '[ؐ-ًؚ-ٰٟۖ-ۭ࣓-ࣣ࣡-ࣿ]' END,
        '', 'g'),
      -- alef forms, alef maksura, teh marbuta, Persian kaf and yeh; Arabic-Indic digits
      'آأإٱٲٳىةکی٠١٢٣٤٥٦٧٨٩۰۱۲۳۴۵۶۷۸۹',
      'اااااايهكي01234567890123456789'),
    '[\u0009-\u000d    -     　﻿]+', ' ', 'g'), ' ')
$$;

CREATE OR REPLACE FUNCTION search_indexed(version text) RETURNS boolean
LANGUAGE sql IMMUTABLE PARALLEL SAFE AS $$
  SELECT split_part(version, '.', 1) <> ALL (ARRAY['ibn_hisham', 'tafsir_ibn_kathir', 'sabaa_ibn_mujahid', 'ansab_baladhuri'])
$$;

-- In this order, so that the rewrite never holds the old and new copies of
-- the big index at once (the free database must stay under 500 MB).
DROP INDEX IF EXISTS texts_search_plain_idx;
ALTER TABLE texts DROP COLUMN IF EXISTS search_vocalized;
CLUSTER texts USING texts_pkey;
CREATE INDEX IF NOT EXISTS texts_search_plain_part_idx
  ON texts USING gin (search_plain extensions.gin_trgm_ops) WHERE search_indexed(version_id);
