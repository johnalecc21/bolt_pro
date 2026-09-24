import type { Plugin } from "vite"

// Public, indexable routes. Everything else (portals, logins, set-password) is
// private and is kept out of search engines via robots.txt + a noindex meta.
const PUBLIC_ROUTES = ["/", "/proveedor/registro", "/terminos", "/privacidad"]
const PRIVATE_PREFIXES = ["/cliente/", "/proveedor/", "/interno/", "/set-password"]

function origin(url: string | undefined) {
  if (!url) return undefined
  try {
    return new URL(url).origin
  } catch {
    return undefined
  }
}

/**
 * Build-time SEO: absolute canonical/OG URLs, robots.txt, sitemap.xml and
 * preconnect hints to the API and Supabase so the first requests skip the
 * DNS/TLS handshake. The site URL comes from VITE_SITE_URL, falling back to the
 * production domain Vercel exposes during its builds.
 */
export function seoPlugin(env: Record<string, string>): Plugin {
  const vercelDomain = process.env.VERCEL_PROJECT_PRODUCTION_URL
  const siteUrl = (env.VITE_SITE_URL || (vercelDomain ? `https://${vercelDomain}` : "")).replace(/\/+$/, "")
  const preconnect = [origin(env.VITE_API_URL), origin(env.VITE_SUPABASE_URL)].filter(
    (o, i, all): o is string => !!o && all.indexOf(o) === i,
  )

  return {
    name: "procurex-seo",
    transformIndexHtml(html) {
      let out = html
      if (siteUrl) {
        out = out
          .replaceAll('content="/og-image.png"', `content="${siteUrl}/og-image.png"`)
          .replace(
            '<meta property="og:type"',
            `<link rel="canonical" href="${siteUrl}/" />\n    <meta property="og:url" content="${siteUrl}/" />\n    <meta property="og:type"`,
          )
      }
      const hints = preconnect.map((o) => `<link rel="preconnect" href="${o}" crossorigin />`).join("\n    ")
      return hints ? out.replace("<meta charset=\"UTF-8\" />", `<meta charset="UTF-8" />\n    ${hints}`) : out
    },
    generateBundle() {
      const robots = [
        "User-agent: *",
        "Allow: /",
        "Allow: /proveedor/registro",
        "Allow: /vitrina/",
        ...PRIVATE_PREFIXES.map((p) => `Disallow: ${p}`),
        ...(siteUrl ? ["", `Sitemap: ${siteUrl}/sitemap.xml`, `Sitemap: ${siteUrl}/sitemap-vitrinas.xml`] : []),
        "",
      ].join("\n")
      this.emitFile({ type: "asset", fileName: "robots.txt", source: robots })

      if (siteUrl) {
        const today = new Date().toISOString().slice(0, 10)
        const urls = PUBLIC_ROUTES.map(
          (r) => `  <url><loc>${siteUrl}${r}</loc><lastmod>${today}</lastmod><priority>${r === "/" ? "1.0" : "0.6"}</priority></url>`,
        ).join("\n")
        this.emitFile({
          type: "asset",
          fileName: "sitemap.xml",
          source: `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
        })
      }
    },
  }
}
