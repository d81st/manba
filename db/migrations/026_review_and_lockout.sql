-- 026: a published topic needs its passages, circumstances and a position
-- (the rule that already applied to hard topics), and failed logins are
-- counted in the database so a restart of the free Render instance does not
-- clear the lockout.

-- Editorial snapshot first, so the status change below can be restored.
SELECT take_editorial_snapshot('перед возвратом тем из одних ссылок на проверку');

WITH incomplete AS (
  SELECT t.id
  FROM topics t
  LEFT JOIN topic_texts x ON x.topic_id = t.id AND x.locale = 'ru'
  WHERE t.status = 'published'
    AND (
      NOT EXISTS (
        SELECT 1 FROM topic_refs r WHERE r.topic_id = t.id AND r.role = 'main'
      )
      OR btrim(coalesce(x.circumstances, '')) = ''
      OR NOT EXISTS (SELECT 1 FROM topic_positions p WHERE p.topic_id = t.id)
    )
),
updated AS (
  UPDATE topics t
  SET status = 'review', updated_by = 'migration:026', updated_at = now()
  FROM incomplete i
  WHERE t.id = i.id
  RETURNING t.id, t.slug
)
INSERT INTO change_log (entity, entity_id, action, old_value, new_value, reason, actor)
SELECT 'topic', u.id::text, 'updated',
       jsonb_build_object('status', 'published', 'slug', u.slug),
       jsonb_build_object('status', 'review', 'slug', u.slug),
       'Тема из одних ссылок возвращена на проверку: для публикации нужны тексты, обстоятельства и позиция стороны.',
       'migration:026'
FROM updated u;

-- One row per failed attempt. Thresholds live in web/src/lib/login-limiter.ts.
CREATE TABLE IF NOT EXISTS auth_failures (
  id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  address    TEXT NOT NULL,
  login      TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS auth_failures_created_idx ON auth_failures (created_at);
CREATE INDEX IF NOT EXISTS auth_failures_address_idx ON auth_failures (address, created_at);
CREATE INDEX IF NOT EXISTS auth_failures_login_idx ON auth_failures (login, created_at);
SELECT close_to_public('auth_failures');
