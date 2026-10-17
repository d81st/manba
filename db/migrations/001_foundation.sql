-- 001: foundation. No source tables yet: they come with the approved address schema.

-- Extensions live in the "extensions" schema, as Supabase expects.
CREATE SCHEMA IF NOT EXISTS extensions;
CREATE EXTENSION IF NOT EXISTS ltree WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA extensions;

-- Supabase exposes the public schema through its REST API to the anon and
-- authenticated roles. The site talks to the database only through its own
-- server, so these roles get no access to our tables, now or later.
DO $$
DECLARE
  r TEXT;
BEGIN
  FOREACH r IN ARRAY ARRAY['anon', 'authenticated'] LOOP
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = r) THEN
      EXECUTE format('REVOKE ALL ON ALL TABLES IN SCHEMA public FROM %I', r);
      EXECUTE format('REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM %I', r);
      EXECUTE format('REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM %I', r);
      EXECUTE format('ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM %I', r);
      EXECUTE format('ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM %I', r);
      EXECUTE format('ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON FUNCTIONS FROM %I', r);
    END IF;
  END LOOP;
END $$;

-- Rejects any change to an append-only table. Reused later for published texts.
CREATE OR REPLACE FUNCTION forbid_change() RETURNS trigger
  LANGUAGE plpgsql SET search_path = pg_catalog
AS $$
BEGIN
  RAISE EXCEPTION 'Table % is append-only: a correction is a new row', TG_TABLE_NAME
    USING ERRCODE = 'P0001';
END $$;

-- Journal of changes: who, when, why. Rows can only be added.
CREATE TABLE IF NOT EXISTS change_log (
  id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  entity     TEXT NOT NULL,                -- kind of object, e.g. text_version
  entity_id  TEXT NOT NULL,                -- its id or address, e.g. quran.2.255
  action     TEXT NOT NULL,                -- created, updated, published, retired, ...
  old_value  JSONB,
  new_value  JSONB,
  reason     TEXT NOT NULL DEFAULT '',
  actor      TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS change_log_entity_idx ON change_log (entity, entity_id, created_at);
ALTER TABLE change_log ENABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS change_log_append_only ON change_log;
CREATE TRIGGER change_log_append_only BEFORE UPDATE OR DELETE ON change_log
  FOR EACH ROW EXECUTE FUNCTION forbid_change();
DROP TRIGGER IF EXISTS change_log_no_truncate ON change_log;
CREATE TRIGGER change_log_no_truncate BEFORE TRUNCATE ON change_log
  FOR EACH STATEMENT EXECUTE FUNCTION forbid_change();
