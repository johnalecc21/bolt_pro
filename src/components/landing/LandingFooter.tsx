import { Link } from "react-router-dom";
import { Mail } from "lucide-react";
import { LogoIcon } from "@/components/shared/Logo";

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
    <footer className="border-t border-white/10 bg-[oklch(0.13_0.02_246)] pt-16 text-white/70">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white p-1.5"><LogoIcon className="h-full w-full" /></div>
              <span className="text-lg font-bold text-white">Procurex</span>
            </div>
            <p className="mt-4 max-w-xs text-sm text-white/50">
              Procurement-as-a-Service para equipos de compras que quieren velocidad y ahorro
              sin perder el criterio humano en cada decisión.
            </p>
            <div className="mt-5 flex gap-3">
              <a href="mailto:hola@procureos.com" className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/5 transition-colors hover:bg-white/10" aria-label="Correo">
                <Mail className="h-4 w-4" />
              </a>
            </div>
          </div>

          {columns.map((c) => (
            <div key={c.title}>
              <h4 className="text-sm font-semibold text-white">{c.title}</h4>
              <ul className="mt-4 space-y-2.5">
                {c.links.map((l) => (
                  <li key={l.label}>
                    {l.href.startsWith("#") || l.href.startsWith("mailto:") ? (
                      <a href={l.href} className="text-sm text-white/50 transition-colors hover:text-white">
                        {l.label}
                      </a>
                    ) : (
                      <Link to={l.href} className="text-sm text-white/50 transition-colors hover:text-white">
                        {l.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-white/10 py-6 text-xs text-white/40 sm:flex-row">
          <span>© {new Date().getFullYear()} Procurex. Todos los derechos reservados.</span>
          <span>Hecho para equipos de compras en Latinoamérica.</span>
        </div>
      </div>
    </footer>
  );
}
