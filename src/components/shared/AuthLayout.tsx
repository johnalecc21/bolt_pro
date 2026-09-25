import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { LogoFull } from "@/components/shared/Logo";

interface Props {
  titulo: string;
  subtitulo: string;
  children: ReactNode;
  /** One short line under the card (e.g. a link to another portal). */
  pie?: ReactNode;
}

/**
 * Shared frame for the login and sign-up screens: a light, centered card with
 * just the logo, the form and a way back to the landing (on mobile too).
 */
export function AuthLayout({ titulo, subtitulo, children, pie }: Props) {
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-gradient-to-b from-primary/[0.07] to-transparent" />

      <header className="relative px-5 py-5 sm:px-8">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Volver al inicio
        </Link>
      </header>

      <main className="relative flex flex-1 flex-col items-center justify-center px-5 pb-12 sm:px-8">
        <div className="w-full max-w-sm">
          <Link
            to="/"
            className="mx-auto flex w-fit"
            aria-label="Ir al inicio de Procurex"
          >
            <LogoFull className="h-8" />
          </Link>
          <div className="mt-8 text-center">
            <h1 className="text-2xl font-bold tracking-tight">{titulo}</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">{subtitulo}</p>
          </div>
          <div className="mt-7 rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-7">
            {children}
          </div>
          {pie && (
            <div className="mt-6 text-center text-sm text-muted-foreground">
              {pie}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
