-- 053: books quoted in the disputes about hard topics (docs/PLAN.md,
-- 12.11.2026): Ibn Taymiyya's «Иктида ас-сират аль-мустаким» and Ibn
-- al-Qayyim's «Ахкам ахль аз-зимма». Like the other books (migrations 014,
-- 021) they are searched by their own rows, not through the trigram index of
-- the Quran and the hadith collections; they are loaded after this migration.
CREATE OR REPLACE FUNCTION search_indexed(version text) RETURNS boolean
LANGUAGE sql IMMUTABLE PARALLEL SAFE AS $$
  SELECT split_part(version, '.', 1) <> ALL (ARRAY[
    'ibn_hisham', 'tafsir_ibn_kathir', 'sabaa_ibn_mujahid', 'ansab_baladhuri',
    'maghazi_waqidi', 'tarikh_khalifa', 'tarikh_tabari', 'tanakh', 'nt', 'mishnah', 'pre',
    'uyun_anba', 'ikhbar_ulama', 'sharh_isharat_tusi', 'tahafut_ghazali', 'munqidh_ghazali',
    'jawahir_quran_ghazali', 'ighathat_lahfan', 'muwafaqat_shatibi', 'itqan_suyuti',
    'iqtida_sirat', 'ahkam_dhimma'])
$$;
