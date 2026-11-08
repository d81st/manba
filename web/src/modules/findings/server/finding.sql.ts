// Columns of a finding in the module queries (internal to the server side).

export const COLUMNS = `id::int, status, lead_url AS "leadUrl", coalesce(to_char(lead_date, 'YYYY-MM-DD'), '') AS "leadDate",
  claimed_source AS "claimedSource", claimed_text AS "claimedText", found_address::text AS "foundAddress",
  searched, note, public, to_char(updated_at, 'DD.MM.YYYY') AS "updatedAt"`;
