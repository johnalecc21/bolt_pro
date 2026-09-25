import { Component, type ErrorInfo, type ReactNode } from "react"
import { reportError } from "@/lib/monitoring"

interface ErrorFallbackProps {
  /** Root-level fallback takes over the whole viewport; a scoped one (e.g. inside
   * the portal shell) only replaces the content area, so the sidebar/header stay. */
  fullScreen?: boolean
  /** Error tracker's event id, shown so the user can quote it to support. */
  codigo?: string
}

function ErrorFallback({ fullScreen = true, codigo }: ErrorFallbackProps) {
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
      {codigo && (
        <p className="text-xs text-muted-foreground">
          Si escribes a soporte, menciona el código <span className="select-all font-mono">{codigo.slice(0, 8)}</span>.
        </p>
      )}
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

export class AppErrorBoundary extends Component<AppErrorBoundaryProps, { failed: boolean; codigo?: string }> {
  state: { failed: boolean; codigo?: string } = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    void reportError(error, {
      tags: { tipo: "pantalla", ruta: window.location.pathname },
      extra: { componentStack: info.componentStack },
    }).then((codigo) => {
      if (codigo) this.setState({ codigo })
    })
  }

  render() {
    if (this.state.failed) return <ErrorFallback fullScreen={this.props.fullScreen ?? true} codigo={this.state.codigo} />
    return this.props.children
  }
}
