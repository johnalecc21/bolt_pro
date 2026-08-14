import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, PlayCircle, Zap, ShieldCheck, TrendingUp } from "lucide-react";
import { AnimatedCounter } from "./Reveal";

const stats = [
  { value: 42, suffix: "%", label: "Ahorro promedio certificado" },
  { value: 65, suffix: "%", label: "Menos tiempo de ciclo" },
  { value: 100, suffix: "%", label: "Trazabilidad de cada decisión" },
  { value: 24, suffix: "/7", label: "Compliance automatizado" },
];

export function LandingHero() {
  return (
    <section id="top" className="relative overflow-hidden bg-background pb-24 pt-24">
      <div className="relative mx-auto flex max-w-5xl flex-col items-center px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/60 px-4 py-1.5 text-xs font-medium text-muted-foreground"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
          Procurement-as-a-Service para empresas
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="mt-6 max-w-4xl text-4xl font-bold leading-[1.1] tracking-tight text-foreground sm:text-6xl"
        >
          El sistema operativo de tus <span className="text-primary">compras corporativas</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="mt-6 max-w-2xl text-lg text-muted-foreground"
        >
          Automatiza requerimientos, homologa proveedores con verificación real, negocia en vivo
          y cierra contratos, con trazabilidad completa y expertos humanos detrás de cada decisión.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="mt-9 flex flex-wrap items-center justify-center gap-4"
        >
          <Button asChild size="lg" className="gap-2 gradient-brand text-white shadow-lg shadow-primary/20">
            <a href="#precios">
              Solicitar una demo <ArrowRight className="h-4 w-4" />
            </a>
          </Button>
          <Button asChild size="lg" variant="outline" className="gap-2">
            <a href="#como-funciona">
              <PlayCircle className="h-4 w-4" /> Ver cómo funciona
            </a>
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="mt-8 flex flex-wrap justify-center gap-5 text-sm text-muted-foreground"
        >
          <span className="flex items-center gap-1.5"><Zap className="h-4 w-4" /> Implementación en días</span>
          <span className="flex items-center gap-1.5"><TrendingUp className="h-4 w-4" /> Ahorro certificado</span>
          <span className="flex items-center gap-1.5"><ShieldCheck className="h-4 w-4" /> Compliance OCR + OFAC real</span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.5 }}
          className="mt-16 grid w-full grid-cols-2 gap-6 rounded-2xl border border-border bg-card p-8 shadow-sm sm:grid-cols-4"
        >
          {stats.map((s) => (
            <div key={s.label} className="flex flex-col items-center gap-1">
              <span className="text-3xl font-bold text-foreground sm:text-4xl">
                <AnimatedCounter value={s.value} suffix={s.suffix} />
              </span>
              <span className="text-center text-xs text-muted-foreground">{s.label}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
