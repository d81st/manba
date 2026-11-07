-- Library and live data in one database, in two schemas (author's decision
-- 07.11.2026). The schema "library" holds what the source imports load from
-- the repository and nobody edits by hand: works, versions, addresses, texts,
-- sections, hadith links, tafsir links and the import batches. It is 97% of
-- the database and can always be loaded again from the repository. The schema
-- "public" keeps the live data made in the admin panel (topics, glossary,
-- sira, history, quizzes, videos, accounts, the journal, snapshots) and the
-- list of applied migrations.
--
-- Moving a table is a catalog change: indexes, constraints, owned sequences,
-- triggers and row security move with it, the data is not rewritten. Queries
-- stay unqualified: the lookup path is public, library, extensions (set by the
-- site on every connection, by the migration and import scripts, and below as
-- the database default for psql and other tools).
-- New library tables are created as library.<name>; new live tables in public.

CREATE SCHEMA IF NOT EXISTS library;

ALTER TABLE works            SET SCHEMA library;
ALTER TABLE sources          SET SCHEMA library;
ALTER TABLE text_versions    SET SCHEMA library;
ALTER TABLE addresses        SET SCHEMA library;
ALTER TABLE texts            SET SCHEMA library;
ALTER TABLE divisions        SET SCHEMA library;
ALTER TABLE classifications  SET SCHEMA library;
ALTER TABLE work_sections    SET SCHEMA library;
ALTER TABLE section_items    SET SCHEMA library;
ALTER TABLE hadith_links     SET SCHEMA library;
ALTER TABLE commentary_ayahs SET SCHEMA library;
ALTER TABLE import_batches   SET SCHEMA library;

-- Functions with a fixed lookup path that read the moved tables (the guards of
-- published texts read text_versions). All of them get the same full path.
ALTER FUNCTION texts_guard()                  SET search_path = pg_catalog, public, library, extensions;
ALTER FUNCTION version_rows_guard()           SET search_path = pg_catalog, public, library, extensions;
ALTER FUNCTION addresses_guard()              SET search_path = pg_catalog, public, library, extensions;
ALTER FUNCTION close_to_public(regclass)      SET search_path = pg_catalog, public, library, extensions;
ALTER FUNCTION take_editorial_snapshot(text)  SET search_path = public, library, extensions;

-- The database default, for psql, the backup jobs and the Neon console. Where
-- the role may not change it (some hosted plans), the site and the scripts
-- still set the path themselves.
DO $$ BEGIN
  EXECUTE format('ALTER DATABASE %I SET search_path = public, library, extensions', current_database());
EXCEPTION WHEN insufficient_privilege THEN
  RAISE NOTICE 'search_path default not changed: no privilege on the database';
END $$;
