-- 103: «Что проверить» (docs/PLAN.md, 28.11.2026). The checklist the
-- administrator and the specialist go through before a draft topic is
-- published: one row per checked item of a topic (the question, the chosen
-- texts, the circumstances, each position by its holder). The row keeps a
-- fingerprint of what was checked, so an item edited after the check shows as
-- changed and is checked again. A specialist's remark stays with the item.
CREATE TABLE IF NOT EXISTS topic_review_checks (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  topic_id    BIGINT NOT NULL REFERENCES topics (id) ON DELETE CASCADE,
  item        TEXT NOT NULL CHECK (item <> ''),
  fingerprint TEXT NOT NULL,
  checked     BOOLEAN NOT NULL DEFAULT false,
  note        TEXT NOT NULL DEFAULT '',
  actor       TEXT NOT NULL,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (topic_id, item)
);
SELECT close_to_public('topic_review_checks');
