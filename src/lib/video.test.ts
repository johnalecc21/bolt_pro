import { describe, expect, it } from "vitest";
import { videoEmbedUrl } from "@/lib/video";

describe("videoEmbedUrl", () => {
  it("embeds YouTube watch, short and youtu.be links without tracking cookies", () => {
    expect(videoEmbedUrl("https://www.youtube.com/watch?v=abc123&t=10")).toBe("https://www.youtube-nocookie.com/embed/abc123");
    expect(videoEmbedUrl("https://youtu.be/abc123")).toBe("https://www.youtube-nocookie.com/embed/abc123");
    expect(videoEmbedUrl("https://youtube.com/shorts/xyz_9")).toBe("https://www.youtube-nocookie.com/embed/xyz_9");
  });

  it("embeds Vimeo", () => {
    expect(videoEmbedUrl("https://vimeo.com/123456")).toBe("https://player.vimeo.com/video/123456");
  });

  it("returns null for anything else so the page shows a plain link", () => {
    expect(videoEmbedUrl("https://example.com/video.mp4")).toBeNull();
    expect(videoEmbedUrl("no es url")).toBeNull();
    expect(videoEmbedUrl(null)).toBeNull();
  });
});
