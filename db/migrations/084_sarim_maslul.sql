-- 084: Ibn Taymiyya's «ас-Сарим аль-маслюль» (docs/PLAN.md, 22.11.2026), the
-- book the critic of the author's archive quotes on the punishment for
-- insulting the Prophet. Searched by its own rows like the other books of
-- the law; loaded after this migration.
CREATE OR REPLACE FUNCTION search_indexed(version text) RETURNS boolean
LANGUAGE sql IMMUTABLE PARALLEL SAFE AS $$
  SELECT split_part(version, '.', 1) <> ALL (ARRAY[
    'ibn_hisham', 'tafsir_ibn_kathir', 'sabaa_ibn_mujahid', 'ansab_baladhuri',
    'maghazi_waqidi', 'tarikh_khalifa', 'tarikh_tabari', 'tanakh', 'nt', 'mishnah', 'pre',
    'uyun_anba', 'ikhbar_ulama', 'sharh_isharat_tusi', 'tahafut_ghazali', 'munqidh_ghazali',
    'jawahir_quran_ghazali', 'ighathat_lahfan', 'muwafaqat_shatibi', 'itqan_suyuti',
    'iqtida_sirat', 'ahkam_dhimma', 'umm_shafii', 'hidaya', 'kharaj_abu_yusuf',
    'ikhtilaf_aimma', 'bidayat_mujtahid', 'sarim_maslul'])
$$;
