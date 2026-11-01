-- 023: «Тесты» (docs/PLAN.md, «Тесты»). A question is built from fragments
-- of the sources: its refs are the passages that confirm the right answer,
-- shown after any answer, right or wrong. The level of a question is the
-- authority of those sources (works.authority_sunni / authority_shia; the
-- Quran is level 1 for both); it is computed, not stored. Questions are
-- written and checked by the moderator; nothing here is generated.
CREATE TABLE IF NOT EXISTS quiz_questions (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  topic_id    BIGINT REFERENCES topics (id) ON DELETE SET NULL,
  term_id     BIGINT REFERENCES terms (id) ON DELETE SET NULL,
  status      TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'review', 'published', 'retired')),
  created_by  TEXT NOT NULL,
  updated_by  TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
SELECT close_to_public('quiz_questions');

-- prompt — the question; note — what the moderator adds after the answer
-- (e.g. where the sides differ), shown with the sources.
CREATE TABLE IF NOT EXISTS quiz_question_texts (
  question_id  BIGINT NOT NULL REFERENCES quiz_questions (id) ON DELETE CASCADE,
  locale       TEXT NOT NULL,
  prompt       TEXT NOT NULL CHECK (prompt <> ''),
  note         TEXT NOT NULL DEFAULT '',
  PRIMARY KEY (question_id, locale)
);
SELECT close_to_public('quiz_question_texts');

CREATE TABLE IF NOT EXISTS quiz_options (
  id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  question_id  BIGINT NOT NULL REFERENCES quiz_questions (id) ON DELETE CASCADE,
  position     INTEGER NOT NULL DEFAULT 0,
  correct      BOOLEAN NOT NULL DEFAULT false
);
CREATE INDEX IF NOT EXISTS quiz_options_question_idx ON quiz_options (question_id, position);
SELECT close_to_public('quiz_options');

CREATE TABLE IF NOT EXISTS quiz_option_texts (
  option_id  BIGINT NOT NULL REFERENCES quiz_options (id) ON DELETE CASCADE,
  locale     TEXT NOT NULL,
  text       TEXT NOT NULL CHECK (text <> ''),
  PRIMARY KEY (option_id, locale)
);
SELECT close_to_public('quiz_option_texts');

-- The fragments the question is built on and that confirm the right answer.
CREATE TABLE IF NOT EXISTS quiz_refs (
  id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  question_id  BIGINT NOT NULL REFERENCES quiz_questions (id) ON DELETE CASCADE,
  address      extensions.ltree NOT NULL REFERENCES addresses (address),
  position     INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS quiz_refs_question_idx ON quiz_refs (question_id, position);
CREATE INDEX IF NOT EXISTS quiz_refs_address_idx ON quiz_refs USING gist (address);
SELECT close_to_public('quiz_refs');

-- The weekly snapshot of editorial data takes the questions too.
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
