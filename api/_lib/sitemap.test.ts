import { describe, expect, it } from "vitest";
import { resolveSiteUrl, vitrinasSitemapXml } from "./sitemap";

describe("vitrinasSitemapXml", () => {
  it("genera una URL por vitrina con el dominio del sitio", () => {
    const xml = vitrinasSitemapXml("https://procurex.co/", [{ id: "abc" }, { id: "d&e" }]);
    expect(xml).toContain("<loc>https://procurex.co/vitrina/abc</loc>");
    expect(xml).toContain("<loc>https://procurex.co/vitrina/d%26e</loc>");
    expect(xml.startsWith('<?xml version="1.0"')).toBe(true);
  });

  it("es válido aunque no haya vitrinas o lleguen datos raros", () => {
    const xml = vitrinasSitemapXml("https://procurex.co", [{ id: "" }, null as never]);
    expect(xml).not.toContain("<url>");
    expect(xml).toContain("</urlset>");
  });
});

describe("resolveSiteUrl", () => {
  it("prioriza VITE_SITE_URL, luego el dominio de Vercel, luego la petición", () => {
    expect(resolveSiteUrl({ VITE_SITE_URL: "https://a.co" }, "https://x.vercel.app/y")).toBe("https://a.co");
    expect(resolveSiteUrl({ VERCEL_PROJECT_PRODUCTION_URL: "b.vercel.app" }, "https://x.vercel.app/y")).toBe("https://b.vercel.app");
    expect(resolveSiteUrl({}, "https://x.vercel.app/api/sitemap-vitrinas")).toBe("https://x.vercel.app");
  });
});
