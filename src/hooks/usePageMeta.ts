import { useEffect } from "react"

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

/** Per-route <title>, description and robots — the SPA only ships one index.html. */
export function usePageMeta({ title, description, noindex = false }: PageMeta) {
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

    return () => {
      document.title = previousTitle
      if (description && previousDesc !== null) setMeta('meta[name="description"]', "name", "description", previousDesc)
      setMeta('meta[name="robots"]', "name", "robots", null)
    }
  }, [title, description, noindex])
}
