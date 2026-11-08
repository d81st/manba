import type { Platform } from "./video.validation";
export type Video = {
  id: number;
  url: string;
  platform: Platform;
  title: string;
  channel: string;
  language: string;
  note: string;
  status: string;
  linkState: "unknown" | "ok" | "unavailable";
  checkedAt: string;
};

export type PublicVideo = Pick<Video, "url" | "platform" | "title" | "channel" | "language" | "note" | "linkState">;
