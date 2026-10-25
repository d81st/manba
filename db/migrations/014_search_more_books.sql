-- Books loaded for the Prophet's life (docs/PLAN.md, «Жизнеописание
-- пророка»): the Maghazi of al-Waqidi, the History of Khalifa ibn Khayyat and
-- the History of al-Tabari are searched by their own rows, like the other
-- books (migration 012), and stay out of the trigram index. They are loaded
-- after this migration, so no indexed row changes its answer.
CREATE OR REPLACE FUNCTION search_indexed(version text) RETURNS boolean
LANGUAGE sql IMMUTABLE PARALLEL SAFE AS $$
  SELECT split_part(version, '.', 1) <> ALL (ARRAY[
    'ibn_hisham', 'tafsir_ibn_kathir', 'sabaa_ibn_mujahid', 'ansab_baladhuri',
    'maghazi_waqidi', 'tarikh_khalifa', 'tarikh_tabari'])
$$;
