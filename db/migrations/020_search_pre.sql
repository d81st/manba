-- 020: Pirkei de-Rabbi Eliezer (pre) joins the texts of other religions: it
-- is searched by its own rows, like them (migration 017), and is loaded
-- after this migration, so no indexed row changes its answer.
CREATE OR REPLACE FUNCTION search_indexed(version text) RETURNS boolean
LANGUAGE sql IMMUTABLE PARALLEL SAFE AS $$
  SELECT split_part(version, '.', 1) <> ALL (ARRAY[
    'ibn_hisham', 'tafsir_ibn_kathir', 'sabaa_ibn_mujahid', 'ansab_baladhuri',
    'maghazi_waqidi', 'tarikh_khalifa', 'tarikh_tabari', 'tanakh', 'nt', 'mishnah', 'pre'])
$$;
