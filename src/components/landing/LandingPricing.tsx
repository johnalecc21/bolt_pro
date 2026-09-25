import { Link } from "react-router-dom";
import { m } from "framer-motion";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Reveal, StaggerGroup, staggerItem } from "./Reveal";
import { DEMO_MAILTO } from "./contacto";

// Limits mirror the backend (planes.constants.ts): plans differ in size, not in features.
const plans = [
  {
    name: "Starter",
    price: "Desde US$490",
    period: "/mes",
    description: "Para áreas de compras que están digitalizando su proceso.",
    features: [
      "Hasta 5 usuarios",
      "15 requerimientos al mes",
      "1 GB de documentos",
      "Soporte por correo",
    ],
    highlighted: false,
  },
  {
    name: "Growth",
    price: "Desde US$1.290",
    period: "/mes",
    description: "Para equipos con varias categorías y aprobadores.",
    features: [
      "Hasta 25 usuarios",
      "150 requerimientos al mes",
      "10 GB de documentos",
      "Soporte prioritario",
    ],
    highlighted: true,
  },
  {
    name: "Enterprise",
    price: "A la medida",
    period: "",
    description: "Para grupos empresariales y operación en varios países.",
    features: [
      "Usuarios y requerimientos ilimitados",
      "Almacenamiento ilimitado",
      "Varias empresas bajo un mismo grupo",
      "Acompañamiento en la puesta en marcha",
    ],
    highlighted: false,
  },
];

const incluido = [
  "Acceso a la red de proveedores homologados",
  "Aprobaciones, convocatorias, comparativo y negociación",
  "Contratos, entregas, facturas y pagos",
  "Integración con Siigo y tu ERP",
  "Analítica de ahorro para el CFO",
  "Bitácora de auditoría y doble factor",
];

export function LandingPricing() {
  return (
    <section id="precios" className="py-24">
      <div className="mx-auto max-w-7xl px-6">
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-semibold uppercase tracking-widest text-primary">
            Precios
          </span>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            Todas las funciones en todos los planes
          </h2>
          <p className="mt-4 text-muted-foreground">
            Elige según el tamaño de tu operación. Sin permanencia mínima; los
            proveedores nunca pagan.
          </p>
        </Reveal>

        <StaggerGroup className="mt-14 grid gap-6 lg:grid-cols-3 lg:items-stretch">
          {plans.map((p) => (
            <m.div
              key={p.name}
              variants={staggerItem}
              className={cn(
                "relative flex flex-col gap-6 rounded-2xl border p-8",
                p.highlighted
                  ? "gradient-brand border-transparent text-white shadow-2xl shadow-primary/25"
                  : "border-border bg-card shadow-sm",
              )}
            >
              {p.highlighted && (
                <Badge className="absolute -top-3 left-8 bg-white text-primary hover:bg-white">
                  Más elegido
                </Badge>
              )}
              <div>
                <h3 className="text-lg font-semibold">{p.name}</h3>
                <p
                  className={cn(
                    "mt-1 text-sm",
                    p.highlighted ? "text-white/75" : "text-muted-foreground",
                  )}
                >
                  {p.description}
                </p>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="whitespace-nowrap text-2xl font-bold sm:text-3xl">
                  {p.price}
                </span>
                <span
                  className={cn(
                    "text-sm",
                    p.highlighted ? "text-white/75" : "text-muted-foreground",
                  )}
                >
                  {p.period}
                </span>
              </div>
              <ul className="flex-1 space-y-3">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <Check
                      className={cn(
                        "mt-0.5 h-4 w-4 shrink-0",
                        p.highlighted ? "text-white" : "text-primary",
                      )}
                      aria-hidden="true"
                    />
                    <span className={p.highlighted ? "text-white/90" : ""}>
                      {f}
                    </span>
                  </li>
                ))}
              </ul>
              <Button
                asChild
                className={cn(
                  "w-full",
                  p.highlighted
                    ? "bg-white text-primary hover:bg-white/90"
                    : "gradient-brand text-white",
                )}
              >
                <a href={DEMO_MAILTO}>Hablar con ventas</a>
              </Button>
            </m.div>
          ))}
        </StaggerGroup>

        <Reveal
          delay={0.1}
          className="mt-8 rounded-2xl border border-border bg-card p-6 sm:p-8"
        >
          <p className="text-sm font-semibold">Incluido en todos los planes</p>
          <ul className="mt-4 grid gap-x-8 gap-y-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {incluido.map((i) => (
              <li
                key={i}
                className="flex items-start gap-2 text-sm text-muted-foreground"
              >
                <Check
                  className="mt-0.5 h-4 w-4 shrink-0 text-success"
                  aria-hidden="true"
                />
                {i}
              </li>
            ))}
          </ul>
        </Reveal>

        <p className="mt-8 text-center text-sm text-muted-foreground">
          ¿Eres proveedor?{" "}
          <Link
            to="/proveedor/registro"
            className="font-medium text-primary hover:underline"
          >
            El registro y la homologación en la red no tienen costo
          </Link>
          .
        </p>
      </div>
    </section>
  );
}
