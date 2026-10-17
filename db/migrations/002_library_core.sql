-- 002: library core — works, addresses, text versions, texts, provenance.
-- Address scheme: docs/ADDRESSES.md (the Quran part is approved).

-- ============ Closed to Supabase public roles ============
-- Row level security with a deny-all policy: anon and authenticated get no
-- rows even if a grant appears by mistake. The site connects as the table
-- owner, which RLS does not restrict.
CREATE OR REPLACE FUNCTION close_to_public(tbl regclass) RETURNS void
  LANGUAGE plpgsql SET search_path = pg_catalog, public
AS $$
BEGIN
  EXECUTE format('ALTER TABLE %s ENABLE ROW LEVEL SECURITY', tbl);
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon')
     AND EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    EXECUTE format('DROP POLICY IF EXISTS deny_public ON %s', tbl);
    EXECUTE format(
      'CREATE POLICY deny_public ON %s AS RESTRICTIVE FOR ALL TO anon, authenticated USING (false) WITH CHECK (false)',
      tbl);
  END IF;
END $$;

SELECT close_to_public('_migrations');
SELECT close_to_public('change_log');

-- ============ Provenance ============
-- Where imported data comes from and under which license.
CREATE TABLE IF NOT EXISTS sources (
  id            TEXT PRIMARY KEY CHECK (id ~ '^[a-z][a-z0-9_.-]*$'),
  title         TEXT NOT NULL,
  url           TEXT NOT NULL,
  license       TEXT NOT NULL,           -- short name, e.g. CC BY 3.0
  license_text  TEXT NOT NULL DEFAULT '', -- the notice as shipped with the data
  version       TEXT NOT NULL DEFAULT '',
  retrieved_at  DATE NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
SELECT close_to_public('sources');

-- One bulk load. Everything it created can be rolled back while unpublished.
CREATE TABLE IF NOT EXISTS import_batches (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  key         TEXT NOT NULL UNIQUE,      -- what was loaded, e.g. tanzil:quran-uthmani:1.1
  source_id   TEXT NOT NULL REFERENCES sources (id),
  actor       TEXT NOT NULL,
  summary     JSONB NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
SELECT close_to_public('import_batches');

-- ============ Works ============
CREATE TABLE IF NOT EXISTS works (
  id               TEXT PRIMARY KEY CHECK (id ~ '^[a-z][a-z0-9_]*$'),
  canon            TEXT NOT NULL CHECK (canon IN ('common', 'sunni', 'shia', 'external')),
  category         TEXT NOT NULL,          -- quran, hadith, tafsir, sira, ...
  titles           JSONB NOT NULL,         -- {"ar": ..., "ru": ...}
  levels           JSONB NOT NULL,         -- address levels: [{"key": "sura"}, {"key": "ayah"}]
  -- Authority within each canon, 1 = highest; NULL = not part of that canon.
  authority_sunni  SMALLINT CHECK (authority_sunni > 0),
  authority_shia   SMALLINT CHECK (authority_shia > 0),
  status           TEXT NOT NULL DEFAULT 'draft'
                   CHECK (status IN ('draft', 'review', 'published', 'retired')),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
SELECT close_to_public('works');

-- ============ Addresses ============
-- Every addressable place: containers (sura) and citable segments (ayah,
-- basmala). Addresses are never renamed, reused or deleted; a withdrawn
-- address is marked retired.
CREATE TABLE IF NOT EXISTS addresses (
  address    extensions.ltree PRIMARY KEY
             CHECK (address::text ~ '^[a-z][a-z0-9_]*(\.[0-9]+)+$'),
  work_id    TEXT NOT NULL REFERENCES works (id),
  level      TEXT NOT NULL,              -- sura, ayah, basmala, ...
  -- Reading order inside the work for citable segments (ranges, prev/next).
  ordinal    INTEGER,
  names      JSONB NOT NULL DEFAULT '{}', -- container names: {"ar": ..., "translit": ...}
  status     TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'retired')),
  batch_id   BIGINT REFERENCES import_batches (id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (subpath(address, 0, 1)::text = work_id),
  UNIQUE (work_id, ordinal)
);
CREATE INDEX IF NOT EXISTS addresses_tree_idx ON addresses USING gist (address);
SELECT close_to_public('addresses');

CREATE OR REPLACE FUNCTION addresses_guard() RETURNS trigger
  LANGUAGE plpgsql SET search_path = pg_catalog, extensions
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'Addresses are never deleted: mark the address retired'
      USING ERRCODE = 'P0001';
  END IF;
  IF NEW.address IS DISTINCT FROM OLD.address OR NEW.work_id IS DISTINCT FROM OLD.work_id
     OR NEW.level IS DISTINCT FROM OLD.level OR NEW.ordinal IS DISTINCT FROM OLD.ordinal THEN
    RAISE EXCEPTION 'An address is permanent: only its names and status can change'
      USING ERRCODE = 'P0001';
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS addresses_permanent ON addresses;
CREATE TRIGGER addresses_permanent BEFORE UPDATE OR DELETE ON addresses
  FOR EACH ROW EXECUTE FUNCTION addresses_guard();

-- ============ Text versions ============
-- A version of a work's text: original, reading (qiraat) or translation.
CREATE TABLE IF NOT EXISTS text_versions (
  id            TEXT PRIMARY KEY CHECK (id ~ '^[a-z][a-z0-9_]*\.[a-z]{2,3}\.[a-z0-9_-]+$'),
  work_id       TEXT NOT NULL REFERENCES works (id),
  language      TEXT NOT NULL,           -- ISO 639: ar, ru, ...
  kind          TEXT NOT NULL CHECK (kind IN ('original', 'qiraat', 'translation')),
  title         TEXT NOT NULL,
  riwaya        TEXT,                    -- for Quran readings: hafs, warsh, ...
  script        TEXT,                    -- orthography: uthmani, imlaei, ...
  translator    TEXT,
  source_id     TEXT NOT NULL REFERENCES sources (id),
  verification  TEXT NOT NULL DEFAULT 'unverified'
                CHECK (verification IN ('unverified', 'source_verified', 'verified')),
  is_primary    BOOLEAN NOT NULL DEFAULT false,
  status        TEXT NOT NULL DEFAULT 'draft'
                CHECK (status IN ('draft', 'review', 'published', 'retired')),
  batch_id      BIGINT REFERENCES import_batches (id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (split_part(id, '.', 1) = work_id)
);
-- One primary version per work and language.
CREATE UNIQUE INDEX IF NOT EXISTS text_versions_primary_idx
  ON text_versions (work_id, language) WHERE is_primary;
SELECT close_to_public('text_versions');

-- ============ Texts ============
-- Text of one address in one version. "content" is stored exactly as in the
-- source; the search columns are derived (web/src/lib/arabic.ts).
CREATE TABLE IF NOT EXISTS texts (
  address          extensions.ltree NOT NULL REFERENCES addresses (address),
  version_id       TEXT NOT NULL REFERENCES text_versions (id),
  content          TEXT NOT NULL,
  search_plain     TEXT NOT NULL,       -- letters only
  search_vocalized TEXT NOT NULL,       -- letters and vowel marks
  batch_id         BIGINT REFERENCES import_batches (id),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (address, version_id)
);
CREATE INDEX IF NOT EXISTS texts_version_idx ON texts (version_id);
CREATE INDEX IF NOT EXISTS texts_search_plain_idx
  ON texts USING gin (search_plain extensions.gin_trgm_ops);
CREATE INDEX IF NOT EXISTS texts_search_vocalized_idx
  ON texts USING gin (search_vocalized extensions.gin_trgm_ops);
SELECT close_to_public('texts');

-- Published text never changes: a correction is a new version with a journal entry.
CREATE OR REPLACE FUNCTION texts_guard() RETURNS trigger
  LANGUAGE plpgsql SET search_path = pg_catalog, public
AS $$
DECLARE
  version_status TEXT;
BEGIN
  SELECT status INTO version_status FROM text_versions WHERE id = OLD.version_id;
  IF version_status IN ('published', 'retired') THEN
    RAISE EXCEPTION 'Text of a published version cannot change: publish a corrected version instead'
      USING ERRCODE = 'P0001';
  END IF;
  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END $$;
DROP TRIGGER IF EXISTS texts_immutable_when_published ON texts;
CREATE TRIGGER texts_immutable_when_published BEFORE UPDATE OR DELETE ON texts
  FOR EACH ROW EXECUTE FUNCTION texts_guard();

-- ============ Structural divisions ============
-- Juz, hizb, manzil, ruku, mushaf page: where each part starts.
CREATE TABLE IF NOT EXISTS divisions (
  work_id    TEXT NOT NULL REFERENCES works (id),
  scheme     TEXT NOT NULL,             -- juz, hizb, manzil, ruku, page
  number     INTEGER NOT NULL CHECK (number > 0),
  starts_at  extensions.ltree NOT NULL REFERENCES addresses (address),
  source_id  TEXT NOT NULL REFERENCES sources (id),
  batch_id   BIGINT REFERENCES import_batches (id),
  PRIMARY KEY (work_id, scheme, number, source_id)
);
SELECT close_to_public('divisions');

-- ============ Classifications ============
-- Statements about an address that sources may disagree on, e.g. the place
-- or order of revelation. Each one keeps its source and how widely it is
-- accepted, so several views can stand side by side.
CREATE TABLE IF NOT EXISTS classifications (
  id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  address      extensions.ltree NOT NULL REFERENCES addresses (address),
  kind         TEXT NOT NULL,           -- revelation_place, revelation_order, ...
  value        TEXT NOT NULL,
  recognition  TEXT NOT NULL CHECK (recognition IN ('tradition', 'research_majority', 'minority')),
  source_id    TEXT NOT NULL REFERENCES sources (id),
  note         TEXT NOT NULL DEFAULT '',
  batch_id     BIGINT REFERENCES import_batches (id),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (address, kind, source_id)
);
CREATE INDEX IF NOT EXISTS classifications_kind_idx ON classifications (kind, address);
SELECT close_to_public('classifications');
