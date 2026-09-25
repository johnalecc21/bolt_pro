import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, type LucideIcon } from "lucide-react";
import { LogoFull } from "@/components/shared/Logo";

export interface PuntoMarca {
  icon: LucideIcon;
  titulo: string;
  texto: string;
}

interface Props {
  /** Brand panel (desktop): what this portal is for. */
  panel: {
    etiqueta: string;
    titulo: string;
    texto: string;
    puntos: PuntoMarca[];
  };
  /** Above the form: small label with the portal's icon, title and subtitle. */
  portal: { icon: LucideIcon; nombre: string };
  titulo: string;
  subtitulo: string;
  children: ReactNode;
  pie?: ReactNode;
}

/**
 * Shared frame for the login and sign-up screens: the navy brand panel of the
 * landing on the left (desktop) and the form on the right, always with a way
 * back to the landing — on mobile too.
 */
export function AuthLayout({
  panel,
  portal,
  titulo,
  subtitulo,
  children,
  pie,
}: Props) {
  return (
    <div className="min-h-screen bg-background lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-3 lg:p-3">
      <aside className="relative hidden overflow-hidden rounded-[2rem] bg-brand-700 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="pointer-events-none absolute -left-32 -top-32 h-[26rem] w-[26rem] rounded-full bg-brand-accent/25 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 -right-24 h-[28rem] w-[28rem] rounded-full bg-primary/45 blur-3xl" />

        <Link
          to="/"
          className="relative inline-flex w-fit items-center rounded-xl bg-white px-3.5 py-2 shadow-lg shadow-black/20"
          aria-label="Ir al inicio de Procurex"
        >
          <LogoFull className="h-6" />
        </Link>

        <div className="relative max-w-md space-y-8">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-1 text-xs font-medium text-white/85">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-accent" />
              {panel.etiqueta}
            </span>
            <h1 className="mt-5 text-4xl font-bold leading-tight tracking-tight">
              {panel.titulo}
            </h1>
            <p className="mt-3 text-lg text-white/70">{panel.texto}</p>
          </div>
          <ul className="space-y-3">
            {panel.puntos.map((p) => (
              <li
                key={p.titulo}
                className="flex items-start gap-3.5 rounded-2xl border border-white/10 bg-white/[0.05] p-4"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-accent/15 text-brand-accent">
                  <p.icon className="h-4.5 w-4.5" aria-hidden="true" />
                </span>
                <div>
                  <p className="font-semibold">{p.titulo}</p>
                  <p className="text-sm text-white/65">{p.texto}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-sm text-white/50">
          © {new Date().getFullYear()} Procurex. Todos los derechos reservados.
        </p>
      </aside>

      <main className="flex min-h-screen flex-col lg:min-h-0">
        <header className="flex items-center justify-between gap-4 px-5 py-4 sm:px-8 sm:py-6">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3.5 py-2 text-sm font-medium text-foreground shadow-sm transition-colors hover:border-primary/40 hover:text-primary"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Volver al
            inicio
          </Link>
          <Link
            to="/"
            className="lg:hidden"
            aria-label="Ir al inicio de Procurex"
          >
            <LogoFull className="h-6" />
          </Link>
        </header>

        <div className="flex flex-1 items-center justify-center px-5 pb-10 pt-4 sm:px-8">
          <div className="w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-xl shadow-primary/[0.06] sm:p-9">
            <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              <portal.icon className="h-3.5 w-3.5" aria-hidden="true" />
              {portal.nombre}
            </span>
            <h2 className="mt-4 text-2xl font-bold tracking-tight">{titulo}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{subtitulo}</p>
            <div className="mt-7">{children}</div>
            {pie && (
              <div className="mt-7 border-t border-border pt-6">{pie}</div>
            )}
          </div>
        </div>

        <footer className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 px-5 pb-6 text-xs text-muted-foreground">
          <Link to="/terminos" className="hover:text-foreground">
            Términos y condiciones
          </Link>
          <Link to="/privacidad" className="hover:text-foreground">
            Aviso de privacidad
          </Link>
          <a href="mailto:hola@procureos.com" className="hover:text-foreground">
            Ayuda
          </a>
        </footer>
      </main>
    </div>
  );
}
