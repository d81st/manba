-- 043: accounts besides the main administrator from the server settings
-- (SITE_LOGIN/SITE_PASSWORD). Two roles (docs/PLAN.md, 31.10.2026): admin
-- (moderator, sees the admin panel and drafts) and reader. The administrator
-- creates an account with a temporary password; the person changes it at the
-- first login. Role and disabling are checked on every request
-- (web/src/proxy.ts); session_version grows when the password, role or
-- disabling changes, so older sessions of that account stop working.
-- Passwords are scrypt hashes (web/src/lib/passwords.ts). Not part of the
-- editorial snapshot: it holds password hashes.
CREATE TABLE IF NOT EXISTS users (
  id                   BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  login                TEXT NOT NULL UNIQUE CHECK (login ~ '^[a-z0-9][a-z0-9._-]{2,39}$'),
  password_hash        TEXT NOT NULL,
  role                 TEXT NOT NULL DEFAULT 'reader' CHECK (role IN ('admin', 'reader')),
  disabled             BOOLEAN NOT NULL DEFAULT false,
  must_change_password BOOLEAN NOT NULL DEFAULT true,
  session_version      INTEGER NOT NULL DEFAULT 1,
  created_by           TEXT NOT NULL,
  updated_by           TEXT NOT NULL,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);
SELECT close_to_public('users');
