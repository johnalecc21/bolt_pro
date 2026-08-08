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
    <section id="top" className="relative overflow-hidden gradient-hero pb-28 pt-36 text-white">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.div
          animate={{ x: [0, 40, 0], y: [0, -30, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -left-32 top-10 h-96 w-96 rounded-full bg-[oklch(0.5_0.16_246)]/30 blur-3xl"
        />
        <motion.div
          animate={{ x: [0, -30, 0], y: [0, 40, 0] }}
          transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
          className="absolute right-0 top-1/3 h-[28rem] w-[28rem] rounded-full bg-[oklch(0.55_0.13_195)]/20 blur-3xl"
        />
        <motion.div
          animate={{ x: [0, 25, 0], y: [0, 25, 0] }}
          transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-[oklch(0.45_0.14_225)]/25 blur-3xl"
        />
        <div className="absolute inset-0 bg-[linear-gradient(oklch(1_0_0/0.04)_1px,transparent_1px),linear-gradient(90deg,oklch(1_0_0/0.04)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_20%,#000_10%,transparent_70%)]" />
      </div>

      <div className="relative mx-auto flex max-w-5xl flex-col items-center px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-medium text-white/80 backdrop-blur-sm"
        >
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-info" />
          Procurement-as-a-Service para empresas
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="mt-6 max-w-4xl text-4xl font-bold leading-[1.1] tracking-tight sm:text-6xl"
        >
          El sistema operativo de tus{" "}
          <span className="text-gradient bg-gradient-to-r from-[oklch(0.75_0.10_220)] to-[oklch(0.80_0.10_195)] bg-clip-text text-transparent">
            compras corporativas
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="mt-6 max-w-2xl text-lg text-white/70"
        >
          Automatiza requerimientos, homologa proveedores con verificación real, negocia en vivo
          y cierra contratos — todo con trazabilidad completa y expertos humanos detrás de cada decisión.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="mt-9 flex flex-wrap items-center justify-center gap-4"
        >
          <Button asChild size="lg" className="gap-2 gradient-brand text-white shadow-xl shadow-primary/25">
            <a href="#precios">
              Solicitar una demo <ArrowRight className="h-4 w-4" />
            </a>
          </Button>
          <Button asChild size="lg" variant="outline" className="gap-2 border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white">
            <a href="#como-funciona">
              <PlayCircle className="h-4 w-4" /> Ver cómo funciona
            </a>
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="mt-8 flex flex-wrap justify-center gap-5 text-sm text-white/60"
        >
          <span className="flex items-center gap-1.5"><Zap className="h-4 w-4" /> Implementación en días</span>
          <span className="flex items-center gap-1.5"><TrendingUp className="h-4 w-4" /> Ahorro certificado</span>
          <span className="flex items-center gap-1.5"><ShieldCheck className="h-4 w-4" /> Compliance OCR + OFAC real</span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.5 }}
          className="mt-16 grid w-full grid-cols-2 gap-6 rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-sm sm:grid-cols-4"
        >
          {stats.map((s) => (
            <div key={s.label} className="flex flex-col items-center gap-1">
              <span className="text-3xl font-bold sm:text-4xl">
                <AnimatedCounter value={s.value} suffix={s.suffix} />
              </span>
              <span className="text-center text-xs text-white/60">{s.label}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
