-- 097: the places of a topic on a map (docs/PLAN.md, 22.11.2026), step 4 of
-- the livelier pages. A topic may name several places, apart from the one
-- city of a city topic (topics.place_id). Coordinates come from the
-- al-Ṯurayyā gazetteer (CC BY 4.0), as for the map of the sira; a place that
-- is already there is left as it is.
CREATE TABLE IF NOT EXISTS topic_places (
  topic_id  BIGINT NOT NULL REFERENCES topics (id) ON DELETE CASCADE,
  place_id  BIGINT NOT NULL REFERENCES places (id) ON DELETE CASCADE,
  PRIMARY KEY (topic_id, place_id)
);
CREATE INDEX IF NOT EXISTS topic_places_place_idx ON topic_places (place_id);
SELECT close_to_public('topic_places');

-- Places of the drafts «Хайбар», «Райхана» and «Завоевание Армении, Аррана и
-- Дербента»: the gazetteer's point and Arabic name.
WITH v(slug, name, name_ar, lat, lon, source) AS (VALUES
  ('madina', 'Медина', 'المدينة', 24.47782, 39.60908, 'al-thurayya:MADINA_396E244N_S'),
  ('khaybar', 'Хайбар', 'خيبر', 25.78667, 39.26821, 'al-thurayya:KHAYBAR_392E257N_S'),
  ('dabil', 'Дабиль (Двин)', 'دبيل', 40.16468, 44.68562, 'al-thurayya:DABIL_446E401N_S'),
  ('tiflis', 'Тифлис', 'تفليس', 42.0841, 44.83734, 'al-thurayya:TIFLIS_448E420N_S'),
  ('bardhaa', 'Барда', 'برذعة', 40.45334, 47.23624, 'al-thurayya:BARDHAA_472E404N_S'),
  ('bab-al-abwab', 'Баб аль-Абваб (Дербент)', 'باب الأبواب', 42.04308, 48.30854, 'al-thurayya:BABABWAB_483E420N_S'),
  ('balanjar', 'Баланджар', 'بلنجر', 43.28166, 46.42082, 'al-thurayya:BALANJAR_464E432N_S')
), added AS (
  INSERT INTO places (slug, name_ar, lat, lon, coord_source, created_by, updated_by)
  SELECT slug, name_ar, lat, lon, source, 'migration:097', 'migration:097' FROM v
  ON CONFLICT (slug) DO NOTHING
  RETURNING id, slug
)
INSERT INTO place_texts (place_id, locale, name)
SELECT a.id, 'ru', v.name FROM added a JOIN v ON v.slug = a.slug
ON CONFLICT DO NOTHING;

INSERT INTO topic_places (topic_id, place_id)
SELECT t.id, p.id
FROM (VALUES
  ('khaybar-safiyya-kinana', 'khaybar'),
  ('khaybar-safiyya-kinana', 'madina'),
  ('rayhana', 'madina'),
  ('caucasus-conquest', 'dabil'),
  ('caucasus-conquest', 'tiflis'),
  ('caucasus-conquest', 'bardhaa'),
  ('caucasus-conquest', 'bab-al-abwab'),
  ('caucasus-conquest', 'balanjar')
) AS v(topic, place)
JOIN topics t ON t.slug = v.topic
JOIN places p ON p.slug = v.place
ON CONFLICT DO NOTHING;

INSERT INTO change_log (entity, entity_id, action, new_value, reason, actor)
SELECT 'topic', t.id::text, 'updated', jsonb_build_object('slug', t.slug, 'places', array_agg(p.slug ORDER BY p.slug)),
       'Места темы на карте (координаты — al-Ṯurayyā, CC BY 4.0).', 'migration:097'
FROM topic_places tp JOIN topics t ON t.id = tp.topic_id JOIN places p ON p.id = tp.place_id
WHERE t.slug IN ('khaybar-safiyya-kinana', 'rayhana', 'caucasus-conquest')
  AND NOT EXISTS (SELECT 1 FROM change_log c WHERE c.actor = 'migration:097' AND c.entity_id = t.id::text)
GROUP BY t.id, t.slug;
