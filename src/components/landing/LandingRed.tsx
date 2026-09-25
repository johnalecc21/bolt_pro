import { Link } from "react-router-dom";
import { m } from "framer-motion";
import { ArrowRight, Building2, Check, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal, StaggerGroup, staggerItem } from "./Reveal";

const lados = [
  {
    icon: Building2,
    para: "Para empresas compradoras",
    titulo: "Más proveedores confiables en cada proceso",
    puntos: [
      "Invita a proveedores ya homologados en la categoría que necesitas",
      "Abre la convocatoria a la red y recibe ofertas de quienes aún no conocías",
      "Consulta la vitrina de cada proveedor: portafolio, certificaciones y experiencia",
      "Mide su desempeño después de cada contrato",
    ],
    cta: { label: "Explorar la red", to: "/red" },
  },
  {
    icon: Truck,
    para: "Para proveedores",
    titulo: "Homológate una vez, vende a todas las empresas",
    puntos: [
      "Registro y vitrina gratis, visibles para las empresas de Procurex",
      "Con una sola homologación participas en los procesos de todas ellas",
      "Recibe las convocatorias abiertas de tus categorías sin esperar invitación",
      "Sigue tus ofertas, contratos y pagos, y mira cómo te fue en cada proceso",
    ],
    cta: { label: "Registrarme gratis", to: "/proveedor/registro" },
  },
];

export function LandingRed() {
  return (
    <section id="red" className="py-24">
      <div className="mx-auto max-w-7xl px-6">
        <Reveal className="mx-auto max-w-3xl text-center">
          <span className="text-sm font-semibold uppercase tracking-widest text-primary">
            Red de proveedores
          </span>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            Una red homologada que crece con cada empresa
          </h2>
          <p className="mt-4 text-muted-foreground">
            Cada proveedor que se homologa queda disponible para todas las
            empresas de Procurex. Las compradoras ganan opciones; los
            proveedores, clientes.
          </p>
        </Reveal>

        <StaggerGroup className="mt-12 grid gap-6 lg:grid-cols-2">
          {lados.map((l, i) => (
            <m.div
              key={l.para}
              variants={staggerItem}
              className={
                i === 0
                  ? "flex flex-col rounded-2xl border border-border bg-card p-7 shadow-sm sm:p-8"
                  : "flex flex-col rounded-2xl gradient-brand p-7 text-white shadow-xl shadow-primary/20 sm:p-8"
              }
            >
              <div className="flex items-center gap-3">
                <span
                  className={
                    i === 0
                      ? "flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary"
                      : "flex h-10 w-10 items-center justify-center rounded-xl bg-white/15"
                  }
                >
                  <l.icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <span
                  className={
                    i === 0
                      ? "text-sm font-semibold text-primary"
                      : "text-sm font-semibold text-white/85"
                  }
                >
                  {l.para}
                </span>
              </div>
              <h3 className="mt-5 text-2xl font-bold tracking-tight">
                {l.titulo}
              </h3>
              <ul className="mt-5 flex-1 space-y-3">
                {l.puntos.map((p) => (
                  <li key={p} className="flex gap-3 text-sm">
                    <Check
                      className={
                        i === 0
                          ? "mt-0.5 h-4 w-4 shrink-0 text-success"
                          : "mt-0.5 h-4 w-4 shrink-0 text-white"
                      }
                      aria-hidden="true"
                    />
                    <span className={i === 0 ? "" : "text-white/90"}>{p}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-7">
                <Button
                  asChild
                  variant={i === 0 ? "outline" : "secondary"}
                  className={
                    i === 0
                      ? "gap-2"
                      : "gap-2 bg-white text-primary hover:bg-white/90"
                  }
                >
                  <Link to={l.cta.to}>
                    {l.cta.label} <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </m.div>
          ))}
        </StaggerGroup>
      </div>
    </section>
  );
}
