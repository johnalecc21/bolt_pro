import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { m, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Building2, Truck, Users2, ChevronDown, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { LogoFull } from "@/components/shared/Logo";

const navLinks = [
  { label: "Cómo funciona", href: "#como-funciona" },
  { label: "Servicios", href: "#servicios" },
  { label: "Ventajas", href: "#ventajas" },
  { label: "Precios", href: "#precios" },
  { label: "Nosotros", href: "#nosotros" },
];

const portals = [
  { icon: Building2, label: "Portal Cliente", to: "/cliente/login" },
  { icon: Truck, label: "Portal Proveedores", to: "/proveedor/login" },
  { icon: Users2, label: "Panel Interno", to: "/interno/login" },
];

export function LandingNavbar() {
  const [scrolled, setScrolled] = useState(false);
  const [portalOpen, setPortalOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 12);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 border-b border-border bg-white transition-shadow duration-300",
        scrolled && "shadow-sm",
      )}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <a href="#top" className="flex items-center">
          <LogoFull className="h-7" />
        </a>

        <nav className="hidden items-center gap-8 lg:flex">
          {navLinks.map((l) => (
            <a key={l.href} href={l.href} className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
              {l.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <div className="relative" onMouseEnter={() => setPortalOpen(true)} onMouseLeave={() => setPortalOpen(false)}>
            <Button variant="ghost" className="gap-1.5">
              Ingresar <ChevronDown className="h-3.5 w-3.5" />
            </Button>
            <AnimatePresence>
              {portalOpen && (
                <m.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full w-64 overflow-hidden rounded-xl border border-border bg-popover p-1.5 shadow-xl"
                >
                  {portals.map((p) => (
                    <Link
                      key={p.to}
                      to={p.to}
                      className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-popover-foreground transition-colors hover:bg-accent"
                    >
                      <p.icon className="h-4 w-4 text-primary" />
                      {p.label}
                    </Link>
                  ))}
                </m.div>
              )}
            </AnimatePresence>
          </div>
          <Button asChild className="gradient-brand text-white shadow-lg shadow-primary/20">
            <a href="#precios">Solicitar demo</a>
          </Button>
        </div>

        <button className="text-foreground lg:hidden" onClick={() => setMobileOpen((v) => !v)} aria-label="Abrir menú">
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <m.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden border-t border-border bg-white lg:hidden"
          >
            <div className="flex flex-col gap-1 px-6 py-4">
              {navLinks.map((l) => (
                <a key={l.href} href={l.href} onClick={() => setMobileOpen(false)} className="rounded-lg px-2 py-2.5 text-sm font-medium text-foreground/80 hover:bg-muted">
                  {l.label}
                </a>
              ))}
              <div className="my-2 h-px bg-border" />
              {portals.map((p) => (
                <Link key={p.to} to={p.to} className="flex items-center gap-2 rounded-lg px-2 py-2.5 text-sm text-foreground/80 hover:bg-muted">
                  <p.icon className="h-4 w-4" /> {p.label}
                </Link>
              ))}
            </div>
          </m.div>
        )}
      </AnimatePresence>
    </header>
  );
}
