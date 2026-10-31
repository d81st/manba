-- 019: backups of what the editors made (decision of the author 31.10.2026).
-- Texts of the sources are reloaded from the repository (data/sources), so
-- only the editorial tables — topics, terms, links, the Prophet's life, the
-- change log — are copied. A snapshot is one row: the rows of every editorial
-- table as JSON. The database takes one a week by itself (pg_cron, where the
-- server has it) and keeps the last 8; docs/BACKUP.md says how to restore.
-- The copy outside the database is made by a GitHub workflow (docs/BACKUP.md).

CREATE TABLE IF NOT EXISTS editorial_snapshots (
  id        BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  taken_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  reason    TEXT NOT NULL DEFAULT '',
  tables    JSONB NOT NULL  -- {"topics": [rows], "topic_texts": [rows], …}
);
SELECT close_to_public('editorial_snapshots');

CREATE OR REPLACE FUNCTION take_editorial_snapshot(why text DEFAULT 'weekly') RETURNS bigint
  LANGUAGE plpgsql SET search_path = public, extensions
AS $$
DECLARE
  editorial text[] := ARRAY[
    'terms', 'term_texts', 'term_definitions', 'term_refs', 'term_relations',
    'position_sides', 'position_side_texts',
    'topics', 'topic_texts', 'topic_positions', 'topic_refs', 'topic_terms', 'topic_relations',
    'hadith_link_reviews',
    'places', 'place_texts', 'sira_events', 'sira_event_texts', 'sira_event_dates',
    'sira_people', 'sira_person_texts', 'sira_relations',
    'parallels', 'parallel_texts', 'parallel_refs',
    'change_log'];
  name text;
  rows jsonb;
  result jsonb := '{}';
  new_id bigint;
BEGIN
  FOREACH name IN ARRAY editorial LOOP
    IF to_regclass(name) IS NOT NULL THEN
      EXECUTE format('SELECT coalesce(jsonb_agg(to_jsonb(t)), ''[]'') FROM %I t', name) INTO rows;
      result := result || jsonb_build_object(name, rows);
    END IF;
  END LOOP;
  INSERT INTO editorial_snapshots (reason, tables) VALUES (why, result) RETURNING id INTO new_id;
  DELETE FROM editorial_snapshots WHERE id NOT IN (SELECT id FROM editorial_snapshots ORDER BY id DESC LIMIT 8);
  RETURN new_id;
END $$;

-- Weekly, on Sunday at 03:17 UTC, where pg_cron is available (Supabase);
-- a plain Postgres (local, CI) has no scheduler and skips this.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_available_extensions WHERE name = 'pg_cron') THEN
    BEGIN
      CREATE EXTENSION IF NOT EXISTS pg_cron;
      PERFORM cron.unschedule(jobid) FROM cron.job WHERE jobname = 'manba-editorial-snapshot';
      PERFORM cron.schedule('manba-editorial-snapshot', '17 3 * * 0', 'SELECT public.take_editorial_snapshot(''weekly'')');
    EXCEPTION WHEN OTHERS THEN
      -- No right to the scheduler: the site still starts; docs/BACKUP.md says how to enable it.
      RAISE NOTICE 'pg_cron not scheduled: %', SQLERRM;
    END;
  END IF;
END $$;
