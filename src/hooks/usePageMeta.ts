import { useEffect } from "react"
import { useLocation } from "react-router-dom"

const SITE = "Procurex"
const DEFAULT_TITLE = "Procurex · Plataforma de compras corporativas y homologación de proveedores"

function setMeta(selector: string, attr: "name" | "property", key: string, content: string | null) {
  let el = document.head.querySelector<HTMLMetaElement>(selector)
  if (content === null) {
    el?.remove()
    return
  }
  if (!el) {
    el = document.createElement("meta")
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.content = content
}

interface PageMeta {
  /** Page name; " · Procurex" is appended. Omit to keep the default site title. */
  title?: string
  description?: string
  /** Private screens (portals, logins) must never be indexed. */
  noindex?: boolean
}

/**
 * index.html ships a canonical/og:url for "/" (absolute, from the build's site
 * URL). Every route must point them at itself, or search engines would treat
 * vitrinas and legal pages as duplicates of the home page.
 */
function setCanonical(pathname: string) {
  const link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
  const origin = link ? new URL(link.href).origin : window.location.origin
  const href = `${origin}${pathname}`
  if (link) link.href = href
  setMeta('meta[property="og:url"]', "property", "og:url", href)
}

/** Per-route <title>, description, canonical and robots — the SPA only ships one index.html. */
export function usePageMeta({ title, description, noindex = false }: PageMeta) {
  const { pathname } = useLocation()
  useEffect(() => {
    const previousTitle = document.title
    const descEl = document.head.querySelector<HTMLMetaElement>('meta[name="description"]')
    const previousDesc = descEl?.content ?? null

    document.title = title ? `${title} · ${SITE}` : DEFAULT_TITLE
    if (description) {
      setMeta('meta[name="description"]', "name", "description", description)
      setMeta('meta[property="og:description"]', "property", "og:description", description)
    }
    if (title) setMeta('meta[property="og:title"]', "property", "og:title", document.title)
    setMeta('meta[name="robots"]', "name", "robots", noindex ? "noindex, nofollow" : null)
    setCanonical(pathname)

    return () => {
      document.title = previousTitle
      if (description && previousDesc !== null) setMeta('meta[name="description"]', "name", "description", previousDesc)
      setMeta('meta[name="robots"]', "name", "robots", null)
    }
  }, [title, description, noindex, pathname])
}
