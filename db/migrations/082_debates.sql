-- 082: debates (phase 2), the first slice. A dispute is a tree of short claims.
-- An answer cannot be stored without one library address. The quotation is
-- not copied: the page reads it from the library, so the core text stays the
-- source. Voting is not stored, and a person has no permanent side — both are
-- still open questions. The existing administrator is the moderator during
-- the dispute and the editor who publishes the outcome. A published dispute
-- is not edited. These tables are live data, not part of the editorial
-- snapshot (they are not source texts).

CREATE TABLE IF NOT EXISTS debates (
  id                   BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  question             TEXT NOT NULL CHECK (length(question) BETWEEN 12 AND 300),
  language             TEXT NOT NULL CHECK (language IN ('ru', 'en')),
  status               TEXT NOT NULL DEFAULT 'proposed'
                       CHECK (status IN ('proposed', 'open', 'closed', 'published', 'declined', 'withdrawn')),
  created_by           TEXT NOT NULL CHECK (length(created_by) BETWEEN 1 AND 80),
  partner              TEXT NOT NULL CHECK (length(partner) BETWEEN 1 AND 80),
  topic_id             BIGINT REFERENCES topics (id) ON DELETE SET NULL,
  pending_question     TEXT CHECK (pending_question IS NULL OR length(pending_question) BETWEEN 12 AND 300),
  pending_question_by  TEXT,
  close_requested_by   TEXT,
  editor_note          TEXT NOT NULL DEFAULT '' CHECK (length(editor_note) <= 500),
  published_by         TEXT,
  published_at         TIMESTAMPTZ,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (created_by <> partner),
  CHECK ((pending_question IS NULL) = (pending_question_by IS NULL)),
  CHECK (status <> 'published' OR (published_by IS NOT NULL AND published_at IS NOT NULL))
);
CREATE INDEX IF NOT EXISTS debates_status_idx ON debates (status, id DESC);
CREATE INDEX IF NOT EXISTS debates_people_idx ON debates (created_by, partner);
CREATE INDEX IF NOT EXISTS debates_author_day_idx ON debates (created_by, created_at);
SELECT close_to_public('debates');

CREATE TABLE IF NOT EXISTS debate_moves (
  id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  debate_id  BIGINT NOT NULL REFERENCES debates (id) ON DELETE CASCADE,
  parent_id  BIGINT REFERENCES debate_moves (id) ON DELETE CASCADE,
  kind       TEXT NOT NULL CHECK (kind IN ('question', 'answer', 'counter')),
  body       TEXT NOT NULL CHECK (length(body) BETWEEN 1 AND 500),
  address    extensions.ltree REFERENCES addresses (address),
  author     TEXT NOT NULL CHECK (length(author) BETWEEN 1 AND 80),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- An answer is a claim about one fragment. A question may stand at the root;
  -- an answer and a counter-question hang on an earlier move.
  CHECK (kind <> 'answer' OR address IS NOT NULL),
  CHECK (kind = 'question' OR parent_id IS NOT NULL),
  CHECK (kind <> 'question' OR parent_id IS NULL)
);
CREATE INDEX IF NOT EXISTS debate_moves_debate_idx ON debate_moves (debate_id, id);
CREATE INDEX IF NOT EXISTS debate_moves_address_idx ON debate_moves (address);
CREATE INDEX IF NOT EXISTS debate_moves_author_day_idx ON debate_moves (author, created_at);
SELECT close_to_public('debate_moves');

-- The moderator's check: does this quotation support the claim? It does not
-- name a winner. One check per move; publishing requires one on every move
-- that cites an address.
CREATE TABLE IF NOT EXISTS debate_checks (
  move_id     BIGINT PRIMARY KEY REFERENCES debate_moves (id) ON DELETE CASCADE,
  verdict     TEXT NOT NULL CHECK (verdict IN ('supports', 'does_not_support', 'out_of_context')),
  note        TEXT NOT NULL DEFAULT '' CHECK (length(note) <= 500),
  checked_by  TEXT NOT NULL CHECK (length(checked_by) BETWEEN 1 AND 80),
  checked_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
SELECT close_to_public('debate_checks');
