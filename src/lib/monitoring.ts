type SentryModule = typeof import("@sentry/react")

let sentry: Promise<SentryModule> | null = null

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
      integrations: [S.browserTracingIntegration()],
      tracesSampleRate: 0.2,
    })
    return S
  })
}

export function reportError(error: unknown, extra?: Record<string, unknown>) {
  initMonitoring()
  if (!sentry) return
  void sentry.then((S) => S.captureException(error, { extra })).catch(() => undefined)
}
