-- 024: «Ассистент по источникам», first phase (docs/PLAN.md): no language
-- model. A question is split into words; the words are widened by the
-- glossary (Russian name <-> Arabic) and by this list of synonyms the
-- moderator keeps; then the sources and the encyclopedia are searched. The
-- assistant writes no text of its own.
--
-- phrase — a word or phrase as written in a question (in search form: lower
-- case, ё -> е); forms — what to search for instead of it or with it: Arabic
-- words (searched in the Quran and the hadith) and Russian ones (in the
-- translation of the Quran and the encyclopedia).
CREATE TABLE IF NOT EXISTS assistant_synonyms (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  phrase      TEXT NOT NULL UNIQUE CHECK (phrase <> ''),
  forms       TEXT[] NOT NULL CHECK (cardinality(forms) > 0),
  note        TEXT NOT NULL DEFAULT '',
  created_by  TEXT NOT NULL,
  updated_by  TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
SELECT close_to_public('assistant_synonyms');

-- What the assistant found nothing for, to see what the glossary and the
-- synonyms lack: only the significant words of the question (sorted, without
-- who asked or when exactly), and how many times. Interest in religion is
-- sensitive data: nothing ties a row to a person.
CREATE TABLE IF NOT EXISTS assistant_misses (
  words      TEXT PRIMARY KEY CHECK (words <> ''),
  count      INTEGER NOT NULL DEFAULT 1 CHECK (count > 0),
  last_month DATE NOT NULL DEFAULT date_trunc('month', now())::date
);
SELECT close_to_public('assistant_misses');

-- The weekly snapshot of editorial data takes the synonyms too.
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
