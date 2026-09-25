import { m } from "framer-motion";
import { FileSpreadsheet, ShieldCheck, Scale, ArrowDown } from "lucide-react";
import { Reveal, StaggerGroup, staggerItem } from "./Reveal";

const cambios = [
  {
    icon: ShieldCheck,
    tema: "Proveedores",
    antes:
      "Pedir papeles por correo, consultar listas una por una y enterarse tarde de que un documento venció.",
    ahora:
      "Proveedores homologados por nuestro equipo de compliance, con listas consultadas y documentos vigilados cada día.",
  },
  {
    icon: Scale,
    tema: "Cotizaciones",
    antes:
      "Ofertas en PDFs y correos distintos, imposibles de comparar ítem por ítem sin rehacerlas en Excel.",
    ahora:
      "Ofertas en el mismo formato, cuadro comparativo automático por ítem y negociación en rondas o subasta en vivo.",
  },
  {
    icon: FileSpreadsheet,
    tema: "Control",
    antes:
      "Aprobaciones por chat, contratos en carpetas sueltas y un ahorro que nadie puede demostrar.",
    ahora:
      "Matriz de aprobación, contratos generados con tu plantilla, bitácora de cada decisión y ahorro medido contra el presupuesto.",
  },
];

export function LandingCambio() {
  return (
    <section id="por-que" className="py-24">
      <div className="mx-auto max-w-7xl px-6">
        <Reveal className="max-w-2xl">
          <span className="text-sm font-semibold uppercase tracking-widest text-primary">
            Por qué Procurex
          </span>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            Lo que cambia en tu área de compras
          </h2>
          <p className="mt-4 text-muted-foreground">
            Comprar bien no es solo conseguir el mejor precio: es saber a quién
            le compras, poder comparar de verdad y demostrar cada decisión.
          </p>
        </Reveal>

        <StaggerGroup className="mt-12 grid gap-5 md:grid-cols-3">
          {cambios.map((c) => (
            <m.div
              key={c.tema}
              variants={staggerItem}
              className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
            >
              <div className="flex items-center gap-3 px-6 pt-6">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <c.icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <h3 className="text-lg font-semibold">{c.tema}</h3>
              </div>
              <div className="px-6 pb-5 pt-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Hoy
                </p>
                <p className="mt-1.5 text-sm text-muted-foreground">
                  {c.antes}
                </p>
              </div>
              <div className="relative mt-auto border-t border-border bg-primary/[0.04] px-6 pb-6 pt-5">
                <span className="absolute -top-3.5 left-6 flex h-7 w-7 items-center justify-center rounded-full border border-border bg-card text-primary">
                  <ArrowDown className="h-3.5 w-3.5" aria-hidden="true" />
                </span>
                <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                  Con Procurex
                </p>
                <p className="mt-1.5 text-sm font-medium text-foreground">
                  {c.ahora}
                </p>
              </div>
            </m.div>
          ))}
        </StaggerGroup>
      </div>
    </section>
  );
}
