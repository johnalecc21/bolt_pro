import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Building2, Truck, Users2, ChevronDown, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

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
        "fixed inset-x-0 top-0 z-50 transition-all duration-300",
        scrolled ? "border-b border-white/10 bg-[oklch(0.13_0.02_246)]/80 backdrop-blur-xl" : "bg-transparent",
      )}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <a href="#top" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg gradient-brand font-bold text-white">P</div>
          <span className="text-lg font-bold text-white">ProcureOS</span>
        </a>

        <nav className="hidden items-center gap-8 lg:flex">
          {navLinks.map((l) => (
            <a key={l.href} href={l.href} className="text-sm font-medium text-white/70 transition-colors hover:text-white">
              {l.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <div className="relative" onMouseEnter={() => setPortalOpen(true)} onMouseLeave={() => setPortalOpen(false)}>
            <Button variant="ghost" className="gap-1.5 text-white/90 hover:bg-white/10 hover:text-white">
              Ingresar <ChevronDown className="h-3.5 w-3.5" />
            </Button>
            <AnimatePresence>
              {portalOpen && (
                <motion.div
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
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <Button asChild className="gradient-brand text-white shadow-lg shadow-primary/20">
            <a href="#precios">Solicitar demo</a>
          </Button>
        </div>

        <button className="text-white lg:hidden" onClick={() => setMobileOpen((v) => !v)} aria-label="Abrir menú">
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden border-t border-white/10 bg-[oklch(0.13_0.02_246)] lg:hidden"
          >
            <div className="flex flex-col gap-1 px-6 py-4">
              {navLinks.map((l) => (
                <a key={l.href} href={l.href} onClick={() => setMobileOpen(false)} className="rounded-lg px-2 py-2.5 text-sm font-medium text-white/80 hover:bg-white/10">
                  {l.label}
                </a>
              ))}
              <div className="my-2 h-px bg-white/10" />
              {portals.map((p) => (
                <Link key={p.to} to={p.to} className="flex items-center gap-2 rounded-lg px-2 py-2.5 text-sm text-white/80 hover:bg-white/10">
                  <p.icon className="h-4 w-4" /> {p.label}
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
