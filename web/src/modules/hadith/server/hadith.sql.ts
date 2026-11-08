// Shared pieces of the hadith queries (internal to the module's server side).

export const PRIMARY = `
  SELECT v.id, v.title, v.verification, s.title AS source_title, s.url, s.license,
         s.license_text AS notice, s.version
  FROM text_versions v JOIN sources s ON s.id = v.source_id
  WHERE v.work_id = $1 AND v.language = 'ar' AND v.is_primary AND v.status = 'published'`;

export type PrimaryRow = {
  id: string;
  title: string;
  verification: string;
  source_title: string;
  url: string;
  license: string;
  notice: string;
  version: string;
};

// The address after the work id, as numbers.
export const PATH = (column: string) => `string_to_array(subpath(${column}, 1)::text, '.')::int[]`;
