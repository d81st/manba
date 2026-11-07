-- 048: videos as additional material (docs/PLAN.md, «Дополнительные
-- материалы: видео»). A video is a link to a post (YouTube, Telegram, other),
-- never an uploaded file and never an argument: it is shown next to the
-- fragments and topics it is about, marked as additional material. The
-- moderator adds it; the admin panel checks whether the post still exists
-- (link_state). Tables join the editorial snapshot.
CREATE TABLE IF NOT EXISTS videos (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  url         TEXT NOT NULL UNIQUE CHECK (url ~ '^https://\S+$'),
  platform    TEXT NOT NULL CHECK (platform IN ('youtube', 'telegram', 'other')),
  title       TEXT NOT NULL CHECK (title <> ''),
  channel     TEXT NOT NULL DEFAULT '',   -- the author or channel, as the post names it
  language    TEXT NOT NULL DEFAULT '',   -- language of the talk: ru, ar, en, uz...
  note        TEXT NOT NULL DEFAULT '',   -- what in it concerns the fragment (the moderator's words, not a claim)
  status      TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'review', 'published')),
  link_state  TEXT NOT NULL DEFAULT 'unknown' CHECK (link_state IN ('unknown', 'ok', 'unavailable')),
  checked_at  TIMESTAMPTZ,
  created_by  TEXT NOT NULL,
  updated_by  TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
SELECT close_to_public('videos');

CREATE TABLE IF NOT EXISTS video_refs (
  video_id  BIGINT NOT NULL REFERENCES videos (id) ON DELETE CASCADE,
  address   extensions.ltree NOT NULL REFERENCES addresses (address),
  position  INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (video_id, address)
);
CREATE INDEX IF NOT EXISTS video_refs_address_idx ON video_refs USING gist (address);
SELECT close_to_public('video_refs');

CREATE TABLE IF NOT EXISTS video_topics (
  video_id  BIGINT NOT NULL REFERENCES videos (id) ON DELETE CASCADE,
  topic_id  BIGINT NOT NULL REFERENCES topics (id) ON DELETE CASCADE,
  PRIMARY KEY (video_id, topic_id)
);
CREATE INDEX IF NOT EXISTS video_topics_topic_idx ON video_topics (topic_id);
SELECT close_to_public('video_topics');

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
    'videos', 'video_refs', 'video_topics',
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
