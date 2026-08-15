import { Link } from "react-router-dom";
import { Mail } from "lucide-react";
import { LogoFull } from "@/components/shared/Logo";

const columns = [
  {
    title: "Producto",
    links: [
      { label: "Cómo funciona", href: "#como-funciona" },
      { label: "Servicios", href: "#servicios" },
      { label: "Ventajas", href: "#ventajas" },
      { label: "Precios", href: "#precios" },
    ],
  },
  {
    title: "Portales",
    links: [
      { label: "Portal Cliente", href: "/cliente/login" },
      { label: "Portal Proveedores", href: "/proveedor/login" },
      { label: "Panel Interno", href: "/interno/login" },
      { label: "Registro de proveedor", href: "/proveedor/registro" },
    ],
  },
  {
    title: "Empresa",
    links: [
      { label: "Nosotros", href: "#nosotros" },
      { label: "Contacto", href: "mailto:hola@procureos.com" },
    ],
  },
];

export function LandingFooter() {
  return (
    <footer className="border-t border-border bg-muted/30 pt-16 text-muted-foreground">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <LogoFull className="h-7" />
            <p className="mt-4 max-w-xs text-sm text-muted-foreground">
              Procurement-as-a-Service para equipos de compras que quieren velocidad y ahorro
              sin perder el criterio humano en cada decisión.
            </p>
            <div className="mt-5 flex gap-3">
              <a href="mailto:hola@procureos.com" className="flex h-9 w-9 items-center justify-center rounded-lg bg-background transition-colors hover:bg-accent" aria-label="Correo">
                <Mail className="h-4 w-4" />
              </a>
            </div>
          </div>

          {columns.map((c) => (
            <div key={c.title}>
              <h4 className="text-sm font-semibold text-foreground">{c.title}</h4>
              <ul className="mt-4 space-y-2.5">
                {c.links.map((l) => (
                  <li key={l.label}>
                    {l.href.startsWith("#") || l.href.startsWith("mailto:") ? (
                      <a href={l.href} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                        {l.label}
                      </a>
                    ) : (
                      <Link to={l.href} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                        {l.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-border py-6 text-xs text-muted-foreground sm:flex-row">
          <span>© {new Date().getFullYear()} Procurex. Todos los derechos reservados.</span>
          <div className="flex items-center gap-4">
            <Link to="/terminos" className="hover:text-foreground">Términos y condiciones</Link>
            <Link to="/privacidad" className="hover:text-foreground">Aviso de privacidad</Link>
            <span className="hidden sm:inline">Hecho para equipos de compras en Latinoamérica.</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
