import { m } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, PlayCircle } from "lucide-react";
import { Magnetic } from "./Magnetic";
import { LandingHeroShowcase } from "./LandingHeroShowcase";
import { FloatingOrbs } from "./FloatingOrbs";
import { BlurText } from "./BlurText";

export function LandingHero() {
  return (
    <section id="top" className="relative overflow-hidden bg-background pb-24 pt-24">
      <FloatingOrbs variant="hero" />
      <div className="relative mx-auto grid max-w-6xl items-center gap-16 px-6 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="text-center lg:text-left">
          <m.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/60 px-4 py-1.5 text-xs font-medium text-muted-foreground"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            Procurement-as-a-Service para empresas
          </m.div>

          <h1 className="mt-6 text-4xl font-bold leading-[1.1] tracking-tight text-foreground sm:text-6xl">
            <BlurText
              text="El sistema operativo de tus compras corporativas"
              highlightFrom={5}
              delay={35}
              className="justify-center lg:justify-start"
            />
          </h1>

          {/* Static on purpose: this paragraph is the page's largest text block (the
              LCP element), so fading it in would push LCP back by the animation. */}
          <p className="mx-auto mt-6 max-w-lg text-lg text-muted-foreground lg:mx-0">
            Automatiza requerimientos, homologa proveedores con verificación real, negocia en vivo
            y cierra contratos, con trazabilidad completa y proveedores revisados por nuestro equipo de compliance.
          </p>

          <m.div
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
          </m.div>
        </div>

        <m.div
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="hidden pt-6 lg:block"
        >
          <LandingHeroShowcase />
        </m.div>
      </div>
    </section>
  );
}
