-- 021: «Ислам и наука» (docs/PLAN.md, 31.10.2026). The books of the section
-- (lives of the scholars, the theologians on the philosophers, the dispute
-- over sciences in the Quran) are searched by their own rows, like the other
-- books (migration 014); they are loaded after this migration. Topics of the
-- section: science — a scholar and his work, with the views of the sides;
-- science_claims — a claim that a text foretells a discovery, with the
-- readings of supporters and critics. Both are listed on /science.
CREATE OR REPLACE FUNCTION search_indexed(version text) RETURNS boolean
LANGUAGE sql IMMUTABLE PARALLEL SAFE AS $$
  SELECT split_part(version, '.', 1) <> ALL (ARRAY[
    'ibn_hisham', 'tafsir_ibn_kathir', 'sabaa_ibn_mujahid', 'ansab_baladhuri',
    'maghazi_waqidi', 'tarikh_khalifa', 'tarikh_tabari', 'tanakh', 'nt', 'mishnah', 'pre',
    'uyun_anba', 'ikhbar_ulama', 'sharh_isharat_tusi', 'tahafut_ghazali', 'munqidh_ghazali',
    'jawahir_quran_ghazali', 'ighathat_lahfan', 'muwafaqat_shatibi', 'itqan_suyuti'])
$$;

ALTER TABLE topics DROP CONSTRAINT IF EXISTS topics_category_check;
ALTER TABLE topics ADD CONSTRAINT topics_category_check
  CHECK (category IN ('general', 'hard', 'quran_text', 'sira', 'cities', 'testimony', 'science', 'science_claims'));
