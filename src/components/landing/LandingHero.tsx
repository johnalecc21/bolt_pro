import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, PlayCircle } from "lucide-react";
import { Magnetic } from "./Magnetic";
import { LandingHeroShowcase } from "./LandingHeroShowcase";

export function LandingHero() {
  return (
    <section id="top" className="relative overflow-hidden bg-background pb-24 pt-24">
      <div className="relative mx-auto grid max-w-6xl items-center gap-16 px-6 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="text-center lg:text-left">
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
            className="mt-6 text-4xl font-bold leading-[1.1] tracking-tight text-foreground sm:text-6xl"
          >
            El sistema operativo de tus <span className="text-primary">compras corporativas</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="mx-auto mt-6 max-w-lg text-lg text-muted-foreground lg:mx-0"
          >
            Automatiza requerimientos, homologa proveedores con verificación real, negocia en vivo
            y cierra contratos, con trazabilidad completa y expertos humanos detrás de cada decisión.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="mt-9 flex flex-wrap items-center justify-center gap-4 lg:justify-start"
          >
            <Magnetic>
              <Button asChild size="lg" className="gap-2 gradient-brand text-white shadow-lg shadow-primary/20">
                <a href="#precios">
                  Solicitar una demo <ArrowRight className="h-4 w-4" />
                </a>
              </Button>
            </Magnetic>
            <Button asChild size="lg" variant="outline" className="gap-2">
              <a href="#como-funciona">
                <PlayCircle className="h-4 w-4" /> Ver cómo funciona
              </a>
            </Button>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="hidden pt-6 lg:block"
        >
          <LandingHeroShowcase />
        </motion.div>
      </div>
    </section>
  );
}
