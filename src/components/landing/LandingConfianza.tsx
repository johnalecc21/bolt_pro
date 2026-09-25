import { m } from "framer-motion";
import {
  Coins,
  FileSignature,
  History,
  KeyRound,
  Plug,
  UsersRound,
} from "lucide-react";
import { Reveal, StaggerGroup, staggerItem } from "./Reveal";

const bloques = [
  {
    icon: UsersRound,
    titulo: "Roles y permisos",
    texto:
      "Comprador, aprobador, CFO y administrador: cada persona ve y hace solo lo que le corresponde.",
    chips: ["Comprador", "Aprobador CFO", "Administrador"],
  },
  {
    icon: History,
    titulo: "Bitácora de auditoría",
    texto:
      "Quién aprobó, invitó, adjudicó o cambió algo, y cuándo. Lista para control interno y auditores.",
  },
  {
    icon: KeyRound,
    titulo: "Acceso seguro",
    texto:
      "Doble factor de autenticación, sesiones por empresa y datos aislados entre compañías.",
  },
  {
    icon: Plug,
    titulo: "Integración contable",
    texto:
      "Conector nativo con Siigo (terceros, facturas de compra y egresos) y envío a cualquier ERP por archivo o webhook firmado.",
    chips: ["Siigo", "Webhook", "Excel / CSV"],
  },
  {
    icon: FileSignature,
    titulo: "Documentos con tu marca",
    texto:
      "Sube tus plantillas de Word para contratos y órdenes de compra; Procurex las llena y genera el PDF.",
  },
  {
    icon: Coins,
    titulo: "Multimoneda",
    texto:
      "Cada proceso en la moneda de la compra, y una moneda base definida para tu empresa.",
    chips: ["COP", "USD", "MXN", "PEN", "CLP", "BRL"],
  },
];

export function LandingConfianza() {
  return (
    <section id="control" className="border-y border-border bg-muted/40 py-24">
      <div className="mx-auto max-w-7xl px-6">
        <Reveal className="max-w-2xl">
          <span className="text-sm font-semibold uppercase tracking-widest text-primary">
            Control e integración
          </span>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            Hecho para la forma en que opera tu empresa
          </h2>
          <p className="mt-4 text-muted-foreground">
            Gobierno de compras, seguridad y conexión con tu contabilidad desde
            el primer día.
          </p>
        </Reveal>

        <StaggerGroup className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {bloques.map((b) => (
            <m.div
              key={b.titulo}
              variants={staggerItem}
              className="flex flex-col rounded-2xl border border-border bg-card p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/10"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <b.icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <h3 className="mt-4 font-semibold">{b.titulo}</h3>
              <p className="mt-2 flex-1 text-sm text-muted-foreground">
                {b.texto}
              </p>
              {b.chips && (
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {b.chips.map((c) => (
                    <span
                      key={c}
                      className="rounded-md border border-border bg-background px-2 py-0.5 text-[11px] font-medium text-muted-foreground"
                    >
                      {c}
                    </span>
                  ))}
                </div>
              )}
            </m.div>
          ))}
        </StaggerGroup>
      </div>
    </section>
  );
}
