import { m } from "framer-motion";
import {
  BadgeCheck,
  CheckCircle2,
  ShieldCheck,
  TrendingDown,
} from "lucide-react";
import { cn } from "@/lib/utils";

const ofertas = [
  { nombre: "Suministros Andinos S.A.S.", total: "$162.900.000", mejor: true },
  { nombre: "TecnoRed Colombia", total: "$168.450.000", mejor: false },
  { nombre: "Distribuciones Pacífico", total: "$171.300.000", mejor: false },
];

const kpis = [
  { label: "Invitados", valor: "8" },
  { label: "Vieron", valor: "6" },
  { label: "Ofertaron", valor: "4" },
  { label: "Cierra en", valor: "2 d 4 h" },
];

/** A process as the buyer sees it in the platform: live tender, offers and savings. */
export function LandingHeroShowcase() {
  return (
    <div
      className="relative mx-auto w-full max-w-xl text-card-foreground sm:mb-12 lg:mx-0"
      aria-hidden="true"
    >
      <div className="absolute -inset-x-10 -inset-y-12 -z-10 bg-primary/[0.08] blur-3xl" />

      <div className="relative z-10 overflow-hidden rounded-2xl border border-border bg-card shadow-2xl shadow-primary/[0.12]">
        <div className="flex items-center gap-1.5 border-b border-border bg-muted/50 px-4 py-2.5">
          <span className="h-2.5 w-2.5 rounded-full bg-border" />
          <span className="h-2.5 w-2.5 rounded-full bg-border" />
          <span className="h-2.5 w-2.5 rounded-full bg-border" />
          <span className="ml-3 text-[11px] text-muted-foreground">
            Procesos de compra · REQ-0248
          </span>
        </div>

        <div className="p-5">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-base font-bold">REQ-0248</p>
              <p className="truncate text-xs text-muted-foreground">
                Portátiles para el equipo comercial · Tecnología
              </p>
            </div>
            <span className="rounded-full bg-info/10 px-2.5 py-1 text-[11px] font-semibold text-info">
              En licitación
            </span>
          </div>

          <div className="mt-4 flex gap-4 border-b border-border text-xs font-medium">
            {["Seguimiento", "Comparativo", "Negociación", "Adjudicación"].map(
              (t, i) => (
                <span
                  key={t}
                  className={cn(
                    "-mb-px border-b-2 pb-2",
                    i === 0
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground",
                  )}
                >
                  {t}
                </span>
              ),
            )}
          </div>

          <div className="mt-4 grid grid-cols-4 gap-2">
            {kpis.map((k) => (
              <div
                key={k.label}
                className="rounded-lg bg-muted/60 px-2 py-2 text-center"
              >
                <p className="text-sm font-bold tabular-nums sm:text-base">
                  {k.valor}
                </p>
                <p className="text-[10px] text-muted-foreground">{k.label}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 space-y-2">
            {ofertas.map((o, i) => (
              <m.div
                key={o.nombre}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 + i * 0.12, duration: 0.45 }}
                className={cn(
                  "flex items-center gap-3 rounded-lg border px-3 py-2.5",
                  o.mejor ? "border-success/40 bg-success/5" : "border-border",
                )}
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-[11px] font-bold">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{o.nombre}</p>
                  <p className="flex items-center gap-1 text-[11px] text-success">
                    <BadgeCheck className="h-3 w-3" /> Homologado
                  </p>
                </div>
                <span className="font-mono text-xs sm:text-sm">{o.total}</span>
              </m.div>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-lg bg-primary/5 px-3 py-2.5 text-xs">
            <span className="text-muted-foreground">
              Presupuesto aprobado{" "}
              <span className="font-mono text-foreground">$186.000.000</span>
            </span>
            <span className="flex items-center gap-1 font-semibold text-success">
              <TrendingDown className="h-3.5 w-3.5" /> 12,4 % por debajo
            </span>
          </div>
        </div>
      </div>

      <m.div
        initial={{ opacity: 0, scale: 0.9, y: -8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ delay: 1.1, duration: 0.5 }}
        className="absolute -right-3 -top-5 z-20 flex items-center gap-2 rounded-full border border-border bg-card py-1.5 pl-1.5 pr-3.5 shadow-lg shadow-primary/10 sm:-right-8"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-success/10 text-success">
          <ShieldCheck className="h-3.5 w-3.5" />
        </span>
        <span className="text-xs font-medium">
          Sin coincidencias en listas restrictivas
        </span>
      </m.div>

      <m.div
        initial={{ opacity: 0, scale: 0.9, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ delay: 1.3, duration: 0.5 }}
        className="absolute -bottom-16 -left-3 z-20 hidden w-60 rounded-xl border border-border bg-card p-3.5 shadow-xl shadow-primary/10 sm:block sm:-left-10"
      >
        <p className="flex items-center gap-1.5 text-xs font-semibold">
          <CheckCircle2 className="h-4 w-4 text-success" /> Aprobado por el CFO
        </p>
        <p className="mt-1 text-[11px] leading-snug text-muted-foreground">
          La matriz lo envió al CFO por superar el monto de la categoría.
        </p>
      </m.div>
    </div>
  );
}
