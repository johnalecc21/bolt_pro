import { m } from "framer-motion";
import {
  AlertTriangle,
  BellRing,
  Check,
  FileSearch,
  ListChecks,
  Lock,
  RefreshCw,
  UserCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Reveal, StaggerGroup, staggerItem } from "./Reveal";

const pasos = [
  {
    icon: FileSearch,
    titulo: "Documentos",
    texto:
      "13 documentos —RUT, Cámara de Comercio, estados financieros, pólizas, certificaciones ISO, SARLAFT…— leídos con OCR y con su fecha de vigencia.",
  },
  {
    icon: ListChecks,
    titulo: "Listas restrictivas",
    texto:
      "Cruce automático con OFAC/SDN y la lista consolidada de la ONU. Procuraduría, Contraloría y Policía Nacional, revisadas por el equipo.",
  },
  {
    icon: UserCheck,
    titulo: "Revisión humana",
    texto:
      "Un analista de compliance de Procurex aprueba, pide correcciones o rechaza. Ningún caso dudoso pasa solo.",
  },
  {
    icon: RefreshCw,
    titulo: "Monitoreo continuo",
    texto:
      "Las listas se vuelven a consultar cada día y avisamos antes de que venza un documento. Si algo cambia, el proveedor se revalida.",
  },
];

const controles = [
  { l: "OFAC / SDN", e: "Sin coincidencias", ok: true },
  { l: "Lista consolidada ONU", e: "Sin coincidencias", ok: true },
  { l: "Procuraduría · Contraloría · Policía", e: "Revisado", ok: true },
  { l: "Estados financieros", e: "Validado", ok: true },
  { l: "Cámara de Comercio", e: "Vence en 28 días", ok: false },
];

export function LandingHomologacion() {
  return (
    <section
      id="homologacion"
      className="relative overflow-hidden bg-brand-700 py-24 text-white"
    >
      <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-brand-accent/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -left-24 h-96 w-96 rounded-full bg-primary/25 blur-3xl" />

      <div className="relative mx-auto grid max-w-7xl gap-14 px-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div>
          <Reveal>
            <span className="text-sm font-semibold uppercase tracking-widest text-brand-accent">
              Homologación y riesgo
            </span>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              Nosotros verificamos a tus proveedores. Tú solo eliges.
            </h2>
            <p className="mt-4 max-w-2xl text-white/75">
              Cada proveedor pasa por el equipo de compliance de Procurex antes
              de entrar a la red, y lo seguimos vigilando mientras trabaja
              contigo.
            </p>
          </Reveal>

          <StaggerGroup className="mt-10 grid gap-5 sm:grid-cols-2">
            {pasos.map((p, i) => (
              <m.div
                key={p.titulo}
                variants={staggerItem}
                className="rounded-2xl border border-white/10 bg-white/[0.04] p-5"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-accent/15 text-brand-accent">
                    <p.icon className="h-4.5 w-4.5" aria-hidden="true" />
                  </span>
                  <h3 className="font-semibold">
                    <span className="mr-1.5 text-white/40">{i + 1}.</span>
                    {p.titulo}
                  </h3>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-white/70">
                  {p.texto}
                </p>
              </m.div>
            ))}
          </StaggerGroup>

          <Reveal
            delay={0.1}
            className="mt-8 flex gap-3 rounded-2xl border border-brand-accent/30 bg-brand-accent/10 p-5"
          >
            <Lock
              className="mt-0.5 h-5 w-5 shrink-0 text-brand-accent"
              aria-hidden="true"
            />
            <p className="text-sm text-white/85">
              <strong className="text-white">
                Procurex no participa en tus compras.
              </strong>{" "}
              Nuestro equipo solo homologa proveedores: tus procesos, precios y
              decisiones son visibles únicamente para tu empresa.
            </p>
          </Reveal>
        </div>

        <Reveal delay={0.15}>
          <div
            aria-hidden="true"
            className="rounded-2xl bg-card p-6 text-card-foreground shadow-2xl shadow-black/30"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-bold">Suministros Andinos S.A.S.</p>
                <p className="text-xs text-muted-foreground">
                  NIT 900.412.378-1 · Tecnología
                </p>
              </div>
              <span className="whitespace-nowrap rounded-full bg-success/10 px-2.5 py-1 text-[11px] font-semibold text-success">
                Homologado
              </span>
            </div>

            <div className="mt-5 space-y-2">
              {controles.map((c) => (
                <div
                  key={c.l}
                  className={cn(
                    "flex items-center gap-3 rounded-lg border px-3 py-2.5 text-sm",
                    c.ok ? "border-border" : "border-warning/40 bg-warning/5",
                  )}
                >
                  <span
                    className={cn(
                      "flex h-5 w-5 shrink-0 items-center justify-center rounded-full",
                      c.ok
                        ? "bg-success/10 text-success"
                        : "bg-warning/15 text-warning",
                    )}
                  >
                    {c.ok ? (
                      <Check className="h-3 w-3" />
                    ) : (
                      <AlertTriangle className="h-3 w-3" />
                    )}
                  </span>
                  <span className="min-w-0 flex-1 truncate">{c.l}</span>
                  <span
                    className={cn(
                      "whitespace-nowrap text-xs",
                      c.ok
                        ? "text-muted-foreground"
                        : "font-medium text-warning-foreground",
                    )}
                  >
                    {c.e}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-5 flex items-center gap-3 rounded-lg bg-muted/70 px-3 py-3 text-xs text-muted-foreground">
              <BellRing className="h-4 w-4 shrink-0 text-primary" />
              Aviso enviado al proveedor para renovar la Cámara de Comercio
              antes del vencimiento.
            </div>
            <p className="mt-4 text-[11px] text-muted-foreground">
              Última consulta de listas: hoy, 4:15 a. m.
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
