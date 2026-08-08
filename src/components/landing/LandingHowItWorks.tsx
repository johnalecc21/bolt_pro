import { FileText, ShieldCheck, Gavel, FileSignature } from "lucide-react";
import { Reveal, StaggerGroup, staggerItem } from "./Reveal";
import { motion } from "framer-motion";

const steps = [
  {
    icon: FileText,
    title: "Solicita",
    description: "Crea tu requerimiento en minutos. La matriz de aprobación lo enruta automáticamente al aprobador correcto según el monto y la categoría.",
  },
  {
    icon: ShieldCheck,
    title: "Homologa y cotiza",
    description: "Proveedores homologados con verificación real de documentos (OCR) y cruce contra listas de sanciones (OFAC/SDN) presentan ofertas estructuradas.",
  },
  {
    icon: Gavel,
    title: "Negocia en vivo",
    description: "Subasta o negociación en tiempo real con leaderboard transparente para tu equipo, y visibilidad controlada para cada proveedor.",
  },
  {
    icon: FileSignature,
    title: "Adjudica y firma",
    description: "Adjudicación con trazabilidad completa, firma electrónica y contrato generado automáticamente, listo para dar seguimiento.",
  },
];

export function LandingHowItWorks() {
  return (
    <section id="como-funciona" className="mx-auto max-w-7xl px-6 py-28">
      <Reveal className="mx-auto max-w-2xl text-center">
        <span className="text-sm font-semibold uppercase tracking-widest text-primary">Cómo funciona</span>
        <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">De la necesidad al contrato firmado</h2>
        <p className="mt-4 text-muted-foreground">Un flujo continuo, sin hojas de cálculo ni cadenas de correos perdidas.</p>
      </Reveal>

      <StaggerGroup className="relative mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
        <div className="absolute left-0 right-0 top-10 hidden h-px bg-gradient-to-r from-transparent via-border to-transparent lg:block" />
        {steps.map((s, i) => (
          <motion.div key={s.title} variants={staggerItem} className="relative flex flex-col items-start gap-4">
            <div className="relative z-10 flex h-14 w-14 items-center justify-center rounded-2xl gradient-brand text-white shadow-lg shadow-primary/20">
              <s.icon className="h-6 w-6" />
              <span className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full border-2 border-background bg-foreground text-xs font-bold text-background">
                {i + 1}
              </span>
            </div>
            <h3 className="text-lg font-semibold">{s.title}</h3>
            <p className="text-sm text-muted-foreground">{s.description}</p>
          </motion.div>
        ))}
      </StaggerGroup>
    </section>
  );
}
