-- 101: volume 22 of Ibn Taymiyya's «Маджму аль-фатава» for the leads on
-- al-Hakim's «al-Mustadrak» (docs/PLAN.md, 28.11.2026; the author's decision:
-- only the volume needed, not the whole collection). By the pages of the
-- edition of Ibn Qasim, searched by its own rows like the other books.
-- Loaded after this migration.
CREATE OR REPLACE FUNCTION search_indexed(version text) RETURNS boolean
LANGUAGE sql IMMUTABLE PARALLEL SAFE AS $$
  SELECT split_part(version, '.', 1) <> ALL (ARRAY[
    'ibn_hisham', 'tafsir_ibn_kathir', 'sabaa_ibn_mujahid', 'ansab_baladhuri',
    'maghazi_waqidi', 'tarikh_khalifa', 'tarikh_tabari', 'tanakh', 'nt', 'mishnah', 'pre',
    'uyun_anba', 'ikhbar_ulama', 'sharh_isharat_tusi', 'tahafut_ghazali', 'munqidh_ghazali',
    'jawahir_quran_ghazali', 'ighathat_lahfan', 'muwafaqat_shatibi', 'itqan_suyuti',
    'iqtida_sirat', 'ahkam_dhimma', 'umm_shafii', 'hidaya', 'kharaj_abu_yusuf',
    'ikhtilaf_aimma', 'bidayat_mujtahid', 'sarim_maslul', 'futuh_buldan',
    'mizan_itidal', 'furusiyya', 'irshad_mufid', 'majmu_fatawa'])
$$;
