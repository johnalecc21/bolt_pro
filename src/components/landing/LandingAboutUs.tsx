import { Target, Heart, Compass } from "lucide-react";
import { Reveal, StaggerGroup, staggerItem, AnimatedCounter } from "./Reveal";
import { motion } from "framer-motion";

const values = [
  {
    icon: Target,
    title: "Nuestra misión",
    description: "Que ningún equipo de compras vuelva a depender de hojas de cálculo y cadenas de correo para tomar decisiones de millones de dólares.",
  },
  {
    icon: Heart,
    title: "Cómo trabajamos",
    description: "Combinamos automatización real con expertos humanos en cada punto crítico: compliance, negociación y resolución de disputas.",
  },
  {
    icon: Compass,
    title: "Hacia dónde vamos",
    description: "Construir la capa de confianza entre compradores y proveedores en toda Latinoamérica, un proceso homologado a la vez.",
  },
];

const milestones = [
  { value: 500, suffix: "+", label: "Proveedores homologados" },
  { value: 12, suffix: "", label: "Países con operación activa" },
  { value: 98, suffix: "%", label: "Satisfacción de clientes" },
];

export function LandingAboutUs() {
  return (
    <section id="nosotros" className="relative overflow-hidden py-28">
      <div className="relative mx-auto grid max-w-7xl gap-16 px-6 lg:grid-cols-2 lg:items-center">
        <Reveal>
          <span className="text-sm font-semibold uppercase tracking-widest text-primary">Nosotros</span>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            Somos el equipo detrás de un procurement más humano
          </h2>
          <p className="mt-5 text-muted-foreground">
            Procurex nació de una idea simple: la tecnología debería hacer las compras corporativas
            más rápidas sin sacrificar el criterio experto que evita errores costosos. Por eso cada
            homologación, cada negociación y cada disputa en la plataforma tiene, en algún punto, una
            persona real revisando lo que importa.
          </p>
          <p className="mt-4 text-muted-foreground">
            Hoy trabajamos con equipos de compras de distintos tamaños e industrias, ayudándolos a pasar
            de procesos manuales a un sistema con trazabilidad completa y compliance verificable.
          </p>

          <div className="mt-10 grid grid-cols-3 gap-6 border-t border-border pt-8">
            {milestones.map((m) => (
              <div key={m.label}>
                <div className="text-2xl font-bold text-primary sm:text-3xl">
                  <AnimatedCounter value={m.value} suffix={m.suffix} />
                </div>
                <div className="mt-1 text-xs text-muted-foreground">{m.label}</div>
              </div>
            ))}
          </div>
        </Reveal>

        <StaggerGroup className="space-y-5">
          {values.map((v) => (
            <motion.div key={v.title} variants={staggerItem} className="flex gap-4 rounded-2xl border border-border p-6">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <v.icon className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold">{v.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{v.description}</p>
              </div>
            </motion.div>
          ))}
        </StaggerGroup>
      </div>
    </section>
  );
}
