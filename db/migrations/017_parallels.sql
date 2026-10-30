-- 017: «Истоки и связи с другими учениями» (decisions of the author
-- 30.10.2026). A link joins passages of Islam's sources with passages of
-- another religion's texts («внешние источники», canon external). It has a
-- kind, a degree of certainty and a basis; a link without a basis is never
-- published. The basis may be a study or an indication in the texts
-- themselves (the Quran or a hadith naming the Torah, a tafsir naming a
-- prophet's book). Both readings of the likeness — the tradition's and the
-- researchers' — are shown, each with its sources; the site draws no
-- conclusion. Every change goes to change_log.

-- Texts of other religions are searched by their own rows and stay out of the
-- trigram index (Arabic search forms mean nothing for them). They are loaded
-- after this migration, so no indexed row changes its answer.
CREATE OR REPLACE FUNCTION search_indexed(version text) RETURNS boolean
LANGUAGE sql IMMUTABLE PARALLEL SAFE AS $$
  SELECT split_part(version, '.', 1) <> ALL (ARRAY[
    'ibn_hisham', 'tafsir_ibn_kathir', 'sabaa_ibn_mujahid', 'ansab_baladhuri',
    'maghazi_waqidi', 'tarikh_khalifa', 'tarikh_tabari', 'tanakh', 'nt', 'mishnah'])
$$;

CREATE TABLE IF NOT EXISTS parallels (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  -- Permanent id in links (/origins/eye-for-eye); not changed once published.
  slug        TEXT NOT NULL UNIQUE CHECK (slug ~ '^[a-z][a-z0-9-]*$'),
  -- The other teaching: Judaism, Christianity, Zoroastrianism, beliefs of
  -- pre-Islamic Arabia; Greek, Roman and Persian traditions; other.
  tradition   TEXT NOT NULL CHECK (tradition IN ('judaism', 'christianity', 'zoroastrianism', 'arabia', 'greek', 'roman', 'persian', 'other')),
  -- quote — a direct quotation; retelling — the same content in other words;
  -- motif — a common story or motif; concept — a common notion or rule.
  kind        TEXT NOT NULL CHECK (kind IN ('quote', 'retelling', 'motif', 'concept')),
  -- borrowing — proven to be taken over; parallel — the texts are alike.
  degree      TEXT NOT NULL CHECK (degree IN ('borrowing', 'parallel')),
  -- What the link rests on: a study, an indication in the texts, or both.
  basis       TEXT NOT NULL CHECK (basis IN ('research', 'text', 'both')),
  status      TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'review', 'published', 'retired')),
  created_by  TEXT NOT NULL,
  updated_by  TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
SELECT close_to_public('parallels');

CREATE TABLE IF NOT EXISTS parallel_texts (
  parallel_id       BIGINT NOT NULL REFERENCES parallels (id) ON DELETE CASCADE,
  locale            TEXT NOT NULL,
  title             TEXT NOT NULL,
  basis_note        TEXT NOT NULL DEFAULT '',  -- what the basis says; studies not in the library: author, title, year, page
  tradition_reading TEXT NOT NULL DEFAULT '',  -- how the Islamic tradition explains the likeness
  tradition_note    TEXT NOT NULL DEFAULT '',  -- its sources not in the library yet
  research_reading  TEXT NOT NULL DEFAULT '',  -- how researchers explain it
  research_note     TEXT NOT NULL DEFAULT '',
  PRIMARY KEY (parallel_id, locale)
);
SELECT close_to_public('parallel_texts');

-- Passages of a link: islam — the Islamic side (ayahs, hadiths, books);
-- external — the other religion's text; basis — passages the basis rests on;
-- tradition, research — sources of each reading.
CREATE TABLE IF NOT EXISTS parallel_refs (
  id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  parallel_id  BIGINT NOT NULL REFERENCES parallels (id) ON DELETE CASCADE,
  role         TEXT NOT NULL CHECK (role IN ('islam', 'external', 'basis', 'tradition', 'research')),
  address      extensions.ltree NOT NULL REFERENCES addresses (address),
  position     INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS parallel_refs_parallel_idx ON parallel_refs (parallel_id, role, position);
CREATE INDEX IF NOT EXISTS parallel_refs_address_idx ON parallel_refs USING gist (address);
SELECT close_to_public('parallel_refs');
