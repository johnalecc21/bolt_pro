// Pure helpers for the sitemap function (files under api/_lib are not deployed
// as endpoints by Vercel) — kept separate so they can be unit-tested.

const XML_ESCAPES: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" };

function escapeXml(value: string) {
  return value.replace(/[&<>"']/g, (c) => XML_ESCAPES[c]);
}

export function vitrinasSitemapXml(siteUrl: string, vitrinas: { id: string }[]) {
  const base = siteUrl.replace(/\/+$/, "");
  const urls = vitrinas
    .filter((v) => typeof v?.id === "string" && v.id.length > 0)
    .map((v) => `  <url><loc>${escapeXml(`${base}/vitrina/${encodeURIComponent(v.id)}`)}</loc><priority>0.7</priority></url>`)
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}${urls ? "\n" : ""}</urlset>\n`;
}

/** VITE_SITE_URL wins; otherwise the production domain Vercel exposes, then the request's own origin. */
export function resolveSiteUrl(env: Record<string, string | undefined>, requestUrl: string) {
  if (env.VITE_SITE_URL) return env.VITE_SITE_URL;
  if (env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${env.VERCEL_PROJECT_PRODUCTION_URL}`;
  return new URL(requestUrl).origin;
}
