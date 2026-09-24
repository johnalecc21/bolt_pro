import { useRef } from "react";
import { FileText, ShieldCheck, Gavel, FileSignature } from "lucide-react";
import { Reveal, StaggerGroup, staggerItem } from "./Reveal";
import { BlurText } from "./BlurText";
import { m, useReducedMotion, useScroll, useSpring } from "framer-motion";

const steps = [
  {
    icon: FileText,
    title: "Solicita",
    description: "Crea tu requerimiento en minutos. La matriz de aprobación lo enruta automáticamente al aprobador correcto según el monto y la categoría.",
    bg: "var(--primary)",
  },
  {
    icon: ShieldCheck,
    title: "Homologa y cotiza",
    description: "Proveedores homologados con verificación real de documentos (OCR) y cruce contra listas de sanciones (OFAC/SDN) presentan ofertas estructuradas.",
    bg: "var(--success)",
  },
  {
    icon: Gavel,
    title: "Negocia en vivo",
    description: "Subasta o negociación en tiempo real con leaderboard transparente para tu equipo, y visibilidad controlada para cada proveedor.",
    bg: "var(--info)",
  },
  {
    icon: FileSignature,
    title: "Adjudica y firma",
    description: "Adjudicación con trazabilidad completa, firma electrónica y contrato generado automáticamente, listo para dar seguimiento.",
    bg: "var(--brand-accent)",
  },
];

export function LandingHowItWorks() {
  const gridRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  // The line literally traces the 4-step flow as the section scrolls into
  // view — it's the visual for "un flujo continuo", not decoration.
  const { scrollYProgress } = useScroll({ target: gridRef, offset: ["start 0.75", "start 0.35"] });
  const pathLength = useSpring(scrollYProgress, { stiffness: 120, damping: 30, restDelta: 0.001 });

  return (
    <section id="como-funciona" className="relative overflow-hidden py-28">
      <div className="relative mx-auto max-w-7xl px-6">
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-semibold uppercase tracking-widest text-primary">Cómo funciona</span>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            <BlurText text="De la necesidad al contrato firmado" className="justify-center" />
          </h2>
          <p className="mt-4 text-muted-foreground">Un flujo continuo, sin hojas de cálculo ni cadenas de correos perdidas.</p>
        </Reveal>

        <div ref={gridRef} className="relative mt-16">
          <svg
            viewBox="0 0 100 1"
            preserveAspectRatio="none"
            className="pointer-events-none absolute left-0 right-0 top-7 hidden h-px w-full overflow-visible lg:block"
          >
            <line x1="12.5" y1="0.5" x2="87.5" y2="0.5" className="stroke-border" strokeWidth="0.3" vectorEffect="non-scaling-stroke" />
            <m.path
              d="M 12.5 0.5 L 87.5 0.5"
              style={{ pathLength: reduceMotion ? 1 : pathLength }}
              className="stroke-primary"
              strokeWidth="0.5"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
          <StaggerGroup className="relative grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((s, i) => (
              <m.div key={s.title} variants={staggerItem} className="relative flex flex-col items-start gap-4">
                <div
                  className="relative z-10 flex h-14 w-14 items-center justify-center rounded-2xl text-white shadow-lg"
                  style={{ background: s.bg, boxShadow: `0 10px 24px -8px color-mix(in oklab, ${s.bg} 45%, transparent)` }}
                >
                  {reduceMotion ? (
                    <s.icon className="h-6 w-6" />
                  ) : (
                    <m.div
                      initial={{ rotate: 0 }}
                      animate={{ rotate: 360 }}
                      transition={{ duration: 14 + i * 3, repeat: Infinity, ease: "linear", repeatType: "loop" }}
                    >
                      <s.icon className="h-6 w-6" />
                    </m.div>
                  )}
                  <span className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full border-2 border-background bg-foreground text-xs font-bold text-background">
                    {i + 1}
                  </span>
                </div>
                <h3 className="text-lg font-semibold">{s.title}</h3>
                <p className="text-sm text-muted-foreground">{s.description}</p>
              </m.div>
            ))}
          </StaggerGroup>
        </div>
      </div>
    </section>
  );
}
