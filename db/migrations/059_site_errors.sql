-- 059: the journal of site errors (docs/PLAN.md, 13.11.2026, "слежение за
-- сайтом"). Errors of the server (caught by Next.js in instrumentation.ts) and
-- errors in the reader's browser (sent by the error page) are kept here, so
-- the administrator sees them in the panel instead of searching the Render
-- log. Nothing personal is kept: the path of the page without its query, no
-- login, no address of the visitor. Rows older than 30 days are removed by
-- the insert itself; a flood of errors is capped. Not editorial content: not
-- part of the editorial snapshot, may be cleared by the administrator.
CREATE TABLE IF NOT EXISTS site_errors (
  id       BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  kind     TEXT NOT NULL CHECK (kind IN ('server', 'client')),
  route    TEXT NOT NULL DEFAULT '' CHECK (length(route) <= 200),   -- the route file, e.g. /topics/[slug]
  path     TEXT NOT NULL DEFAULT '' CHECK (length(path) <= 500),    -- the page, without the query
  method   TEXT NOT NULL DEFAULT '' CHECK (length(method) <= 10),
  digest   TEXT NOT NULL DEFAULT '' CHECK (length(digest) <= 64),   -- the code the error page shows
  message  TEXT NOT NULL CHECK (length(message) <= 1000),
  stack    TEXT NOT NULL DEFAULT '' CHECK (length(stack) <= 4000)
);
CREATE INDEX IF NOT EXISTS site_errors_at_idx ON site_errors (at);
SELECT close_to_public('site_errors');
