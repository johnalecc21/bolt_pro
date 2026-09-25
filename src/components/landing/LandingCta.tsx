import { Link } from "react-router-dom";
import { ArrowRight, Building2, Truck, Users2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal } from "./Reveal";
import { Magnetic } from "./Magnetic";
import { DEMO_MAILTO } from "./contacto";

const portales = [
  {
    icon: Building2,
    titulo: "Portal Cliente",
    texto: "Para el equipo de compras, aprobadores y CFO.",
    to: "/cliente/login",
  },
  {
    icon: Truck,
    titulo: "Portal Proveedores",
    texto: "Homologación, ofertas, contratos y pagos.",
    to: "/proveedor/login",
  },
  {
    icon: Users2,
    titulo: "Panel Interno",
    texto: "Equipo de Procurex: empresas y homologación.",
    to: "/interno/login",
  },
];

export function LandingCta() {
  return (
    <section className="pb-24">
      <div className="mx-auto max-w-7xl px-6">
        <Reveal className="relative overflow-hidden rounded-3xl bg-brand-700 px-6 py-14 text-center text-white sm:px-14">
          <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-brand-accent/25 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -right-16 h-72 w-72 rounded-full bg-primary/40 blur-3xl" />
          <div className="relative mx-auto max-w-2xl">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Tu próxima compra, con proveedores verificados y cada paso
              registrado
            </h2>
            <p className="mt-4 text-white/75">
              Agenda una demo: te mostramos Procurex con un proceso real de tu
              empresa, de la solicitud al pago.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Magnetic>
                <Button
                  asChild
                  size="lg"
                  className="gap-2 bg-white text-primary shadow-lg hover:bg-white/90"
                >
                  <a href={DEMO_MAILTO}>
                    Solicitar una demo <ArrowRight className="h-4 w-4" />
                  </a>
                </Button>
              </Magnetic>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white"
              >
                <Link to="/proveedor/registro">Soy proveedor</Link>
              </Button>
            </div>
          </div>
        </Reveal>

        <div id="ingresar" className="mt-8 grid gap-4 sm:grid-cols-3">
          {portales.map((p) => (
            <Link
              key={p.to}
              to={p.to}
              className="group flex items-center gap-4 rounded-2xl border border-border bg-card p-5 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <p.icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-semibold">{p.titulo}</span>
                <span className="block text-xs text-muted-foreground">
                  {p.texto}
                </span>
              </span>
              <ArrowRight
                className="h-4 w-4 shrink-0 text-primary transition-transform group-hover:translate-x-1"
                aria-hidden="true"
              />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
