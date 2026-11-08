// Public entry of the videos module: videos as additional material next to
// fragments and topics. Database reads and writes are in "@/modules/videos/server".
export { VIDEOS_TAG } from "./video.constants";
export type { PublicVideo, Video } from "./video.types";
export { checkVideoInput, platformOf, telegramPost, VIDEO_STATUSES, videoSchema } from "./video.validation";
export type { CheckedVideo, Platform, VideoInput } from "./video.validation";

export { CheckLinks } from "./components/check-links";
export { VideoForm } from "./components/video-form";
export { VideoList } from "./components/video-list";
