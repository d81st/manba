import { describe, expect, it } from "vitest";
import { checkVideoInput, platformOf, telegramPost } from "./video.validation";

// A made-up video for the test (not a real post).
const video = { url: "https://www.youtube.com/watch?v=test0000000", title: "Вымышленное видео", status: "draft" };

describe("platformOf", () => {
  it("tells YouTube, Telegram and other sites apart", () => {
    expect(platformOf("https://youtu.be/abc")).toBe("youtube");
    expect(platformOf("https://m.youtube.com/shorts/abc")).toBe("youtube");
    expect(platformOf("https://t.me/somechannel/123")).toBe("telegram");
    expect(platformOf("https://example.org/talk")).toBe("other");
    expect(telegramPost("https://t.me/somechannel/123")).toEqual({ channel: "somechannel", post: "123" });
    expect(telegramPost("https://t.me/somechannel")).toBeNull();
  });
});

describe("checkVideoInput", () => {
  it("accepts a draft and reads its places", () => {
    const { input, problems } = checkVideoInput({ ...video, refs: "2:255, Бухари 1", topics: "namaz" });
    expect(problems).toEqual([]);
    expect(input?.platform).toBe("youtube");
    expect(input?.addresses).toEqual(["quran.2.255", "bukhari.1"]);
    expect(input?.topicSlugs).toEqual(["namaz"]);
  });

  it("refuses a plain http link, a Telegram channel without a post and an unknown place", () => {
    expect(checkVideoInput({ ...video, url: "http://example.org" }).problems[0].field).toBe("url");
    expect(checkVideoInput({ ...video, url: "https://t.me/somechannel" }).problems[0].code).toBe("telegramPost");
    expect(checkVideoInput({ ...video, refs: "abc" }).problems[0].code).toBe("refs");
    expect(checkVideoInput({ ...video, topics: "Bad Slug!" }).problems[0].code).toBe("topics");
  });

  it("publishes a video only next to a fragment or a topic", () => {
    expect(checkVideoInput({ ...video, status: "published" }).problems[0].code).toBe("placeRequired");
    expect(checkVideoInput({ ...video, status: "published", topics: "hajj" }).problems).toEqual([]);
  });
});
