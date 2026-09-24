import { resolveSiteUrl, vitrinasSitemapXml } from "./_lib/sitemap.js";

declare const process: { env: Record<string, string | undefined> };

/**
 * Served as /sitemap-vitrinas.xml (see vercel.json): one URL per public
 * proveedor vitrina, read live from the API so new homologados show up
 * without a redeploy. Vercel's CDN keeps it for an hour.
 */
export async function GET(request: Request) {
  const siteUrl = resolveSiteUrl(process.env, request.url);
  const apiUrl = (process.env.VITE_API_URL ?? "").replace(/\/+$/, "");

  let vitrinas: { id: string }[] = [];
  try {
    const res = await fetch(`${apiUrl}/vitrina/sitemap`, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) throw new Error(`API respondió ${res.status}`);
    vitrinas = (await res.json()) as { id: string }[];
  } catch {
    // The free backend may be asleep; answer with an empty (valid) sitemap and
    // a short cache so the crawler simply retries later.
    return new Response(vitrinasSitemapXml(siteUrl, []), {
      headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, s-maxage=300" },
    });
  }

  return new Response(vitrinasSitemapXml(siteUrl, vitrinas), {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
