type SentryModule = typeof import("@sentry/react")

let sentry: Promise<SentryModule> | null = null

/** Who is using the app, applied as soon as the tracker loads (and on every change). */
interface Contexto {
  usuario: { id: string; email?: string } | null
  tags: Record<string, string | undefined>
}
let contexto: Contexto = { usuario: null, tags: {} }

function aplicarContexto(S: SentryModule) {
  S.setUser(contexto.usuario)
  for (const [k, v] of Object.entries(contexto.tags)) S.setTag(k, v ?? null)
}

/**
 * Sentry/GlitchTip weighs ~80 KB gzip. It is only downloaded when a DSN is
 * configured, and after the first render, so it never delays the page.
 */
export function initMonitoring() {
  const dsn = import.meta.env.VITE_GLITCHTIP_DSN
  if (!dsn || sentry) return
  sentry = import("@sentry/react").then((S) => {
    S.init({
      dsn,
      environment: import.meta.env.MODE,
      // The deployed build, so an error points to the exact frontend version.
      release: import.meta.env.VITE_APP_VERSION || undefined,
      integrations: [S.browserTracingIntegration()],
      tracesSampleRate: 0.2,
    })
    aplicarContexto(S)
    return S
  })
}

/**
 * Tags every later report with the signed-in user, company, portal and role
 * (null on logout), so an error in the tracker says whose session it was.
 */
export function identificarUsuario(
  usuario: { id: string; email?: string } | null,
  tags: { companyId?: string; empresa?: string; portal?: string; rol?: string } = {},
) {
  contexto = { usuario, tags: usuario ? tags : { companyId: undefined, empresa: undefined, portal: undefined, rol: undefined } }
  if (sentry) void sentry.then(aplicarContexto).catch(() => undefined)
}

export interface OpcionesReporte {
  /** Short searchable values (requestId, status…). */
  tags?: Record<string, string>
  /** Any detail that helps reproduce it. */
  extra?: Record<string, unknown>
}

/**
 * Sends an unexpected error to the tracker. Resolves to the event id (to show
 * the user as a reference), or undefined when monitoring is off.
 */
export function reportError(error: unknown, opciones: OpcionesReporte = {}): Promise<string | undefined> {
  if (import.meta.env.DEV) console.error("[reportError]", error, opciones)
  initMonitoring()
  if (!sentry) return Promise.resolve(undefined)
  return sentry
    .then((S) => S.captureException(error, { tags: opciones.tags, extra: opciones.extra }))
    .catch(() => undefined)
}
