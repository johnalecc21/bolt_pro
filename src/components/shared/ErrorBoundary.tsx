import type { ReactNode } from "react"
import * as Sentry from "@sentry/react"

interface ErrorFallbackProps {
  /** Root-level fallback takes over the whole viewport; a scoped one (e.g. inside
   * the portal shell) only replaces the content area, so the sidebar/header stay. */
  fullScreen?: boolean
}

function ErrorFallback({ fullScreen = true }: ErrorFallbackProps) {
  return (
    <div
      className={
        fullScreen
          ? "flex min-h-screen flex-col items-center justify-center gap-3 p-6 text-center"
          : "flex h-full flex-col items-center justify-center gap-3 p-6 text-center"
      }
    >
      <h1 className="text-xl font-semibold">Algo salió mal</h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        Ocurrió un error inesperado. El equipo ya fue notificado — intenta recargar la página.
      </p>
      <button
        className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        onClick={() => window.location.reload()}
      >
        Recargar
      </button>
    </div>
  )
}

interface AppErrorBoundaryProps {
  children: ReactNode
  /** false for boundaries nested inside the shell (e.g. around <Outlet />) so the
   * fallback fills its container instead of the whole viewport. */
  fullScreen?: boolean
}

export function AppErrorBoundary({ children, fullScreen = true }: AppErrorBoundaryProps) {
  return (
    <Sentry.ErrorBoundary fallback={<ErrorFallback fullScreen={fullScreen} />}>
      {children}
    </Sentry.ErrorBoundary>
  )
}
