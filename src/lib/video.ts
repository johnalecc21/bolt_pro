/**
 * Turns a YouTube or Vimeo page link into its embeddable player URL. Anything
 * else returns null — the page then shows a plain link instead of an iframe.
 */
export function videoEmbedUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return null;
  }
  const host = u.hostname.replace(/^www\.|^m\./, "");
  let id: string | null = null;
  if (host === "youtube.com") {
    id = u.pathname === "/watch" ? u.searchParams.get("v") : u.pathname.match(/^\/(?:shorts|embed)\/([\w-]+)/)?.[1] ?? null;
    if (id) return `https://www.youtube-nocookie.com/embed/${id}`;
  }
  if (host === "youtu.be") {
    id = u.pathname.slice(1).split("/")[0] || null;
    if (id) return `https://www.youtube-nocookie.com/embed/${id}`;
  }
  if (host === "vimeo.com") {
    id = u.pathname.match(/^\/(\d+)/)?.[1] ?? null;
    if (id) return `https://player.vimeo.com/video/${id}`;
  }
  return null;
}
