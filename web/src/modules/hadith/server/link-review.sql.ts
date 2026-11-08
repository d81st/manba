// The latest verdict on each link (internal to the module's server side).

// The current verdict of every reviewed pair; "cleared" means unchecked again.
export const CURRENT_VERDICTS = `
  SELECT DISTINCT ON (link_id) link_id, verdict, note, actor, created_at
  FROM hadith_link_reviews ORDER BY link_id, id DESC`;
