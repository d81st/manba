-- 025: «Новые находки» and «Не найдено в источниках» (docs/PLAN.md, «Новые
-- находки извне»; decision of the author 31.10.2026). A finding is a lead
-- from outside (a post, a video) that attributes a text to a source; it is
-- checked against the source, never added to the core directly.
-- Statuses: new -> checking -> confirmed (the text is in the source: found_address,
-- perhaps under another number) or not_found (it is not where it is said to
-- be: searched says where we looked). A not_found finding the moderator marks
-- public is listed on /not-found with where it was searched.
CREATE TABLE IF NOT EXISTS findings (
  id             BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  status         TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'checking', 'confirmed', 'not_found')),
  lead_url       TEXT NOT NULL DEFAULT '',   -- the post or video, as given
  lead_date      DATE,                       -- when it was seen
  claimed_source TEXT NOT NULL CHECK (claimed_source <> ''), -- "аль-Бухари, № 1234", as the lead says
  claimed_text   TEXT NOT NULL DEFAULT '',   -- the words attributed, as the lead gives them
  found_address  extensions.ltree REFERENCES addresses (address), -- where the text really is (confirmed)
  searched       TEXT NOT NULL DEFAULT '',   -- where and how it was looked for
  note           TEXT NOT NULL DEFAULT '',   -- what did not match, or the checker's remark
  public         BOOLEAN NOT NULL DEFAULT false,
  created_by     TEXT NOT NULL,
  updated_by     TEXT NOT NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (status <> 'confirmed' OR found_address IS NOT NULL),
  CHECK (NOT public OR (status = 'not_found' AND searched <> '' AND claimed_text <> ''))
);
CREATE INDEX IF NOT EXISTS findings_status_idx ON findings (status, id);
SELECT close_to_public('findings');

-- The weekly snapshot of editorial data takes the findings too.
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
  DELETE FROM editorial_snapshots WHERE id NOT IN (SELECT id FROM editorial_snapshots ORDER BY id DESC LIMIT 8);
  RETURN new_id;
END $$;
