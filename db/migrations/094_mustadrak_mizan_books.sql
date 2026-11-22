-- 094: four books for the leads on al-Hakim's «al-Mustadrak» and for the
-- Shia side of the sira (docs/PLAN.md, 22.11.2026): al-Dhahabi's «Мизан
-- аль-итидаль», Ibn al-Qayyim's «аль-Фурусийя» and al-Shaykh al-Mufid's
-- «аль-Иршад» by the pages of their editions, searched by their own rows like
-- the other books; «аль-Мустадрак» with al-Dhahabi's remarks by its numbers,
-- searched with the hadith collections. Loaded after this migration.
CREATE OR REPLACE FUNCTION search_indexed(version text) RETURNS boolean
LANGUAGE sql IMMUTABLE PARALLEL SAFE AS $$
  SELECT split_part(version, '.', 1) <> ALL (ARRAY[
    'ibn_hisham', 'tafsir_ibn_kathir', 'sabaa_ibn_mujahid', 'ansab_baladhuri',
    'maghazi_waqidi', 'tarikh_khalifa', 'tarikh_tabari', 'tanakh', 'nt', 'mishnah', 'pre',
    'uyun_anba', 'ikhbar_ulama', 'sharh_isharat_tusi', 'tahafut_ghazali', 'munqidh_ghazali',
    'jawahir_quran_ghazali', 'ighathat_lahfan', 'muwafaqat_shatibi', 'itqan_suyuti',
    'iqtida_sirat', 'ahkam_dhimma', 'umm_shafii', 'hidaya', 'kharaj_abu_yusuf',
    'ikhtilaf_aimma', 'bidayat_mujtahid', 'sarim_maslul', 'futuh_buldan',
    'mizan_itidal', 'furusiyya', 'irshad_mufid'])
$$;
