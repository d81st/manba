-- 042: the migration runner (web/scripts/migrate.mjs) now takes an editorial
-- snapshot before it applies new migrations. Those copies and the weekly ones
-- are counted apart: the last 8 of each kind are kept.

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
    'history_events', 'history_event_texts', 'history_event_dates',
    'quiz_questions', 'quiz_question_texts', 'quiz_options', 'quiz_option_texts', 'quiz_refs',
    'assistant_synonyms',
    'findings',
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
  -- Weekly copies and the copies taken before migrations or by hand are kept
  -- apart, so a run of deploys does not push the weekly history out.
  DELETE FROM editorial_snapshots s
  WHERE (s.reason = 'weekly') = (why = 'weekly')
    AND s.id NOT IN (
      SELECT id FROM editorial_snapshots
      WHERE (reason = 'weekly') = (why = 'weekly')
      ORDER BY id DESC LIMIT 8);
  RETURN new_id;
END $$;
