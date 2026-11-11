-- 051: "report a mistake". A reader who sees a mistake on a page (a typo in a
-- text, a wrong date, a broken link) writes a few words; the report keeps the
-- page it was sent from (with the #anchor of the fragment, if one was chosen)
-- and the text the reader had selected. The administrator reads the reports
-- in the panel and marks them done. A report is a note to the editors, not
-- content: it is never shown on the site and is not part of the editorial
-- snapshot. Not the same as "findings" (migration 023): those are leads from
-- outside to check against the sources.
CREATE TABLE IF NOT EXISTS reports (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  status      TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'done')),
  page        TEXT NOT NULL CHECK (page ~ '^/' AND length(page) <= 500), -- path, query and #anchor
  quote       TEXT NOT NULL DEFAULT '' CHECK (length(quote) <= 1000),    -- the selected text, if any
  message     TEXT NOT NULL CHECK (length(message) BETWEEN 5 AND 2000),
  created_by  TEXT NOT NULL,                                             -- the login
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  done_by     TEXT,
  done_at     TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS reports_status_idx ON reports (status, id DESC);
CREATE INDEX IF NOT EXISTS reports_author_idx ON reports (created_by, created_at);
SELECT close_to_public('reports');
