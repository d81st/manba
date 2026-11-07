// Videos as additional material (migration 048): validation of the form and
// reading a post's address. No database here, so it is unit-tested; that the
// fragments and topics exist is checked on saving (lib/videos.ts).
import { z } from "zod";
import { parseRefs, type InputProblem } from "./glossary-input.ts";

export const VIDEO_STATUSES = ["draft", "review", "published"] as const;
export type Platform = "youtube" | "telegram" | "other";

const trimmed = (max: number) => z.string().trim().max(max);

export const videoSchema = z.object({
  url: trimmed(500).regex(/^https:\/\/\S+$/, "url"),
  title: trimmed(300).min(1, "title"),
  channel: trimmed(200).default(""),
  language: trimmed(20).default(""),
  note: trimmed(2000).default(""),
  refs: trimmed(4000).default(""), // "2:255, Бухари 1, Ибн Хишам 1:235"
  topics: trimmed(1000).default(""), // topic slugs: "namaz, hajj"
  status: z.enum(VIDEO_STATUSES),
});

export type VideoInput = z.infer<typeof videoSchema>;
export type CheckedVideo = VideoInput & { platform: Platform; addresses: string[]; topicSlugs: string[] };

// youtube.com/watch?v=…, youtu.be/…, /shorts/…, /live/… and t.me/<channel>/<post>.
export function platformOf(url: string): Platform {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return "other";
  }
  const host = parsed.hostname.replace(/^(www|m)\./, "");
  if (host === "youtu.be" || host === "youtube.com" || host === "music.youtube.com") return "youtube";
  if (host === "t.me" || host === "telegram.me") return "telegram";
  return "other";
}

// A Telegram post is a channel and a number: t.me/channel/123.
export function telegramPost(url: string): { channel: string; post: string } | null {
  const m = url.match(/^https:\/\/(?:www\.)?(?:t|telegram)\.me\/(?:s\/)?([A-Za-z0-9_]{3,})\/(\d+)/);
  return m ? { channel: m[1], post: m[2] } : null;
}

export function checkVideoInput(raw: unknown): { input?: CheckedVideo; problems: InputProblem[] } {
  const result = videoSchema.safeParse(raw);
  if (!result.success) {
    return {
      problems: result.error.issues.map((issue) => ({
        field: issue.path.join("."),
        code: issue.message.match(/^[a-zA-Z]+$/) ? issue.message : "invalid",
      })),
    };
  }
  const input = result.data;
  const problems: InputProblem[] = [];
  const { addresses, invalid } = parseRefs(input.refs);
  if (invalid.length) problems.push({ field: "refs", code: "refs", detail: invalid.join(", ") });
  const topicSlugs = [...new Set(input.topics.split(/[,;\s]+/).map((s) => s.trim()).filter(Boolean))];
  const badSlugs = topicSlugs.filter((s) => !/^[a-z][a-z0-9-]*$/.test(s));
  if (badSlugs.length) problems.push({ field: "topics", code: "topics", detail: badSlugs.join(", ") });
  const platform = platformOf(input.url);
  if (platform === "telegram" && !telegramPost(input.url)) problems.push({ field: "url", code: "telegramPost" });
  // A published video is always next to something it explains.
  if (input.status === "published" && addresses.length === 0 && topicSlugs.length === 0) {
    problems.push({ field: "refs", code: "placeRequired" });
  }
  return problems.length ? { problems } : { input: { ...input, platform, addresses, topicSlugs }, problems };
}
