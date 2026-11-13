-- 058: two books of the Hanafi law (docs/PLAN.md, 13.11.2026) —
-- al-Marghinani's «аль-Хидая» and Abu Yusuf's «Китаб аль-Харадж» — and a
-- section of the library for the law (category 'fiqh'), where al-Shafi'i's
-- «аль-Умм» and Ibn al-Qayyim's «Ахкам ахль аз-зимма» move from theology.
-- The books are searched by their own rows like the other books; they are
-- loaded after this migration (on an empty database the import gives them the
-- new category itself).
CREATE OR REPLACE FUNCTION search_indexed(version text) RETURNS boolean
LANGUAGE sql IMMUTABLE PARALLEL SAFE AS $$
  SELECT split_part(version, '.', 1) <> ALL (ARRAY[
    'ibn_hisham', 'tafsir_ibn_kathir', 'sabaa_ibn_mujahid', 'ansab_baladhuri',
    'maghazi_waqidi', 'tarikh_khalifa', 'tarikh_tabari', 'tanakh', 'nt', 'mishnah', 'pre',
    'uyun_anba', 'ikhbar_ulama', 'sharh_isharat_tusi', 'tahafut_ghazali', 'munqidh_ghazali',
    'jawahir_quran_ghazali', 'ighathat_lahfan', 'muwafaqat_shatibi', 'itqan_suyuti',
    'iqtida_sirat', 'ahkam_dhimma', 'umm_shafii', 'hidaya', 'kharaj_abu_yusuf'])
$$;

UPDATE library.works SET category = 'fiqh' WHERE id IN ('umm_shafii', 'ahkam_dhimma') AND category = 'theology';
