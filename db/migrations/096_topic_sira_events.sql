-- 096: topics on the timeline of the Prophet's life (docs/PLAN.md,
-- 22.11.2026), step 3 of the livelier pages. A topic may concern several
-- events and an event may have several topics, apart from the one card of an
-- event (sira_events.topic_id). The topic page shows its events on the years
-- of the hijra with the date each source gives; the event page lists its
-- topics; the timeline marks events that have topics.
CREATE TABLE IF NOT EXISTS topic_sira_events (
  topic_id  BIGINT NOT NULL REFERENCES topics (id) ON DELETE CASCADE,
  event_id  BIGINT NOT NULL REFERENCES sira_events (id) ON DELETE CASCADE,
  PRIMARY KEY (topic_id, event_id)
);
CREATE INDEX IF NOT EXISTS topic_sira_events_event_idx ON topic_sira_events (event_id);
SELECT close_to_public('topic_sira_events');

-- Draft links of the sira topics to the events they are about.
INSERT INTO topic_sira_events (topic_id, event_id)
SELECT t.id, e.id
FROM (VALUES ('khaybar-safiyya-kinana', 'khaybar'), ('rayhana', 'qurayza')) AS v(topic, event)
JOIN topics t ON t.slug = v.topic
JOIN sira_events e ON e.slug = v.event
ON CONFLICT DO NOTHING;

INSERT INTO change_log (entity, entity_id, action, new_value, reason, actor)
SELECT 'topic', t.id::text, 'updated', jsonb_build_object('slug', t.slug, 'sira_events', array_agg(e.slug ORDER BY e.slug)),
       'Тема привязана к событиям ленты жизнеописания.', 'migration:096'
FROM topic_sira_events ts JOIN topics t ON t.id = ts.topic_id JOIN sira_events e ON e.id = ts.event_id
WHERE t.slug IN ('khaybar-safiyya-kinana', 'rayhana')
  AND NOT EXISTS (SELECT 1 FROM change_log c WHERE c.actor = 'migration:096' AND c.entity_id = t.id::text)
GROUP BY t.id, t.slug;
