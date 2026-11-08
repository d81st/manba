import "server-only";
import { db } from "@/lib/db";
import { platformOf, telegramPost } from "../video.validation";

// Whether the post is still there. YouTube answers its oEmbed address with
// 404 or 400 for a removed or private video; a removed Telegram post shows an
// error block on its embed page. Other sites: the page itself.
export async function linkState(url: string): Promise<"ok" | "unavailable" | "unknown"> {
  const get = (address: string) => fetch(address, { redirect: "follow", signal: AbortSignal.timeout(10_000) });
  try {
    const platform = platformOf(url);
    if (platform === "youtube") {
      const response = await get(`https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(url)}`);
      if (response.ok || response.status === 401 || response.status === 403) return "ok";
      return response.status === 404 || response.status === 400 ? "unavailable" : "unknown";
    }
    if (platform === "telegram") {
      const post = telegramPost(url);
      if (!post) return "unavailable";
      const response = await get(`https://t.me/${post.channel}/${post.post}?embed=1`);
      if (!response.ok) return response.status === 404 ? "unavailable" : "unknown";
      const html = await response.text();
      return html.includes("tgme_widget_message_error") ? "unavailable" : "ok";
    }
    const response = await get(url);
    if (response.ok) return "ok";
    return response.status === 404 || response.status === 410 ? "unavailable" : "unknown";
  } catch {
    return "unknown";
  }
}

export async function checkLinks(actor: string): Promise<{ checked: number; unavailable: number }> {
  const { rows } = await db().query<{ id: number; url: string; link_state: string }>(
    "SELECT id::int, url, link_state FROM videos ORDER BY checked_at NULLS FIRST, id LIMIT 50",
  );
  let unavailable = 0;
  for (const row of rows) {
    const state = await linkState(row.url);
    if (state === "unavailable") unavailable++;
    // An unanswered check keeps the last known state.
    await db().query(
      `UPDATE videos SET link_state = CASE WHEN $2 = 'unknown' THEN link_state ELSE $2 END, checked_at = now() WHERE id = $1`,
      [row.id, state],
    );
    if (state !== "unknown" && state !== row.link_state) {
      await db().query(
        `INSERT INTO change_log (entity, entity_id, action, old_value, new_value, actor)
         VALUES ('video', $1, 'updated', $2, $3, $4)`,
        [String(row.id), JSON.stringify({ linkState: row.link_state }), JSON.stringify({ linkState: state }), actor],
      );
    }
  }
  return { checked: rows.length, unavailable };
}
