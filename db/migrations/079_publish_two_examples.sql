-- 079: publish two complete drafts as reading examples (docs/PLAN.md, 21.11.2026).
-- The texts, circumstances and positions stay as they are. Recognition stays
-- preliminary. A topic that is missing, already published, or without a
-- passage, circumstances or a position is left alone.

DO $$
DECLARE
  row record;
BEGIN
  FOR row IN
    SELECT t.id, t.slug, t.status
    FROM topics t
    JOIN topic_texts x ON x.topic_id = t.id AND x.locale = 'ru'
    WHERE t.slug IN ('when-is-the-hour', 'embryo-stages')
      AND t.status IN ('draft', 'review')
      AND btrim(x.circumstances) <> ''
      AND EXISTS (SELECT 1 FROM topic_refs r WHERE r.topic_id = t.id AND r.role = 'main')
      AND EXISTS (SELECT 1 FROM topic_positions p WHERE p.topic_id = t.id)
  LOOP
    UPDATE topics
    SET status = 'published', updated_by = 'migration:079', updated_at = now()
    WHERE id = row.id;
    INSERT INTO change_log (entity, entity_id, action, old_value, new_value, reason, actor)
    VALUES (
      'topic', row.id::text, 'published',
      jsonb_build_object('status', row.status, 'slug', row.slug),
      jsonb_build_object('status', 'published', 'slug', row.slug),
      'Опубликовано как пример чтения: тексты, обстоятельства и позиции уже стоят цитатами. Степень признания предварительная, специалист ещё не проверял.',
      'migration:079'
    );
  END LOOP;
END $$;
