-- 050: signing the main administrator out everywhere. The main administrator
-- (SITE_LOGIN/SITE_PASSWORD) has no row in "users", so a session cookie of
-- theirs could not be revoked before it expired. site_state keeps one number,
-- owner_session_version: every session cookie of the main administrator
-- carries it, it is checked on every request (web/src/proxy.ts), and
-- "sign out" raises it, so every older cookie stops working. Not part of the
-- editorial snapshot: it is state of the server, not content.
CREATE TABLE IF NOT EXISTS site_state (
  key   TEXT PRIMARY KEY CHECK (key ~ '^[a-z][a-z0-9_]*$'),
  value INTEGER NOT NULL
);
SELECT close_to_public('site_state');

INSERT INTO site_state (key, value) VALUES ('owner_session_version', 0) ON CONFLICT (key) DO NOTHING;
