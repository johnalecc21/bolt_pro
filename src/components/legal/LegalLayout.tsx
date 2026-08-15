import { Link } from "react-router-dom";
import { LogoFull } from "@/components/shared/Logo";

export function LegalLayout({
  title,
  vigencia,
  children,
}: {
  title: string;
  vigencia: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-5">
          <Link to="/">
            <LogoFull className="h-7" />
          </Link>
          <nav className="flex gap-4 text-sm text-muted-foreground">
            <Link to="/terminos" className="hover:text-foreground">Términos</Link>
            <Link to="/privacidad" className="hover:text-foreground">Privacidad</Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">Última actualización: {vigencia}</p>

        <div className="legal-content mt-10 space-y-8 text-sm leading-relaxed text-foreground/90">
          {children}
        </div>
      </main>

      <footer className="border-t border-border py-8">
        <div className="mx-auto max-w-3xl px-6 text-xs text-muted-foreground">
          © {new Date().getFullYear()} Procurex. Todos los derechos reservados. ·{" "}
          <a href="mailto:hola@procureos.com" className="hover:text-foreground">hola@procureos.com</a>
        </div>
      </footer>
    </div>
  );
}

export function LegalSection({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24 space-y-3">
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      <div className="space-y-3 text-muted-foreground">{children}</div>
    </section>
  );
}
