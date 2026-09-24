import { Reveal, StaggerGroup, staggerItem, AnimatedCounter } from "./Reveal";
import { BlurText } from "./BlurText";
import { FloatingOrbs } from "./FloatingOrbs";
import { m } from "framer-motion";

const timeline = [
  {
    stage: "Origen",
    title: "Nació de una frustración real",
    description: "Equipos de compras tomando decisiones de millones de dólares por hojas de cálculo y cadenas de correo perdidas.",
  },
  {
    stage: "Hoy",
    title: "Automatización con criterio humano",
    description: "Cada homologación, negociación y disputa en la plataforma tiene, en algún punto, una persona real revisando lo que importa.",
  },
  {
    stage: "Futuro",
    title: "La capa de confianza de Latinoamérica",
    description: "Construir el puente entre compradores y proveedores, un proceso homologado a la vez, en toda la región.",
  },
];

const milestones = [
  { value: 500, suffix: "+", label: "Proveedores homologados" },
  { value: 12, suffix: "", label: "Países con operación activa" },
  { value: 98, suffix: "%", label: "Satisfacción de clientes" },
];

export function LandingAboutUs() {
  return (
    <section id="nosotros" className="py-28">
      <div className="mx-auto max-w-5xl px-6">
        <div className="relative overflow-hidden rounded-3xl border border-border bg-card px-6 py-14 shadow-md sm:px-14 sm:py-16">
          <FloatingOrbs />
          <div className="relative">
            <Reveal>
              <span className="text-sm font-semibold uppercase tracking-widest text-primary">Nosotros</span>
              <p className="mt-4 text-3xl font-bold leading-tight tracking-tight text-foreground sm:text-4xl">
                <BlurText
                  text="Que ningún equipo de compras vuelva a depender de hojas de cálculo para tomar decisiones de millones de dólares."
                  delay={18}
                />
              </p>
              <p className="mt-6 max-w-2xl text-muted-foreground">
                Somos el equipo detrás de Procurex: creemos que la tecnología debería hacer las compras
                corporativas más rápidas sin sacrificar el criterio experto que evita errores costosos.
              </p>
            </Reveal>

            <StaggerGroup className="relative mt-16 space-y-10 border-l border-border pl-8 sm:pl-10">
              {timeline.map((t) => (
                <m.div key={t.stage} variants={staggerItem} className="relative">
                  <span className="absolute -left-[calc(2rem+5px)] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-primary bg-card sm:-left-[calc(2.5rem+5px)]" />
                  <span className="text-xs font-semibold uppercase tracking-widest text-primary">{t.stage}</span>
                  <h3 className="mt-1.5 text-lg font-semibold text-foreground">{t.title}</h3>
                  <p className="mt-1.5 max-w-xl text-sm text-muted-foreground">{t.description}</p>
                </m.div>
              ))}
            </StaggerGroup>

            <Reveal delay={0.1} className="mt-16 grid grid-cols-3 gap-8 border-t border-border pt-10">
              {milestones.map((m) => (
                <div key={m.label}>
                  <div className="text-3xl font-bold text-primary sm:text-4xl">
                    <AnimatedCounter value={m.value} suffix={m.suffix} />
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground sm:text-sm">{m.label}</div>
                </div>
              ))}
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
