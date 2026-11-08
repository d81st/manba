// Columns of a video in the module queries (internal to the server side).

export const COLUMNS = `v.id::int, v.url, v.platform, v.title, v.channel, v.language, v.note, v.status,
  v.link_state AS "linkState", coalesce(to_char(v.checked_at, 'DD.MM.YYYY'), '') AS "checkedAt"`;
