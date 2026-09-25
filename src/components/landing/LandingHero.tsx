import { m } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Magnetic } from "./Magnetic";
import { LandingHeroShowcase } from "./LandingHeroShowcase";
import { FloatingOrbs } from "./FloatingOrbs";
import { BlurText } from "./BlurText";
import { DEMO_MAILTO } from "./contacto";

/** The whole purchase, in the order it happens in the platform. */
const etapas = [
  "Requerimiento",
  "Aprobación",
  "Convocatoria",
  "Ofertas",
  "Comparativo",
  "Negociación",
  "Adjudicación",
  "Contrato",
  "Entregas",
  "Pago",
  "Evaluación",
];

export function LandingHero() {
  return (
    <section id="top" className="relative overflow-hidden bg-background pt-28">
      <FloatingOrbs variant="hero" />
      <div className="relative mx-auto grid max-w-7xl grid-cols-[minmax(0,1fr)] items-center gap-14 px-6 pb-20 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.02fr)]">
        <div className="text-center lg:text-left">
          <m.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-xs font-medium text-muted-foreground shadow-sm"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-success" />
            Procurement-as-a-Service para empresas en Latinoamérica
          </m.div>

          <h1 className="mt-6 text-4xl font-bold leading-[1.08] tracking-tight text-foreground sm:text-[3.4rem]">
            <BlurText
              text="De la solicitud al pago, con proveedores homologados"
              highlightFrom={5}
              delay={35}
              className="justify-center lg:justify-start"
            />
          </h1>

          {/* Static on purpose: this paragraph is the page's largest text block (the
              LCP element), so fading it in would push LCP back by the animation. */}
          <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground lg:mx-0">
            Procurex verifica a tus proveedores —documentos, listas restrictivas
            y revisión de nuestro equipo de compliance— y le da a tu área de
            compras una sola plataforma para aprobar, licitar, negociar,
            contratar y pagar, con cada decisión registrada.
          </p>

          <m.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="mt-9 flex flex-wrap items-center justify-center gap-3 lg:justify-start"
          >
            <Magnetic>
              <Button
                asChild
                size="lg"
                className="gap-2 gradient-brand text-white shadow-lg shadow-primary/20"
              >
                <a href={DEMO_MAILTO}>
                  Solicitar una demo <ArrowRight className="h-4 w-4" />
                </a>
              </Button>
            </Magnetic>
            <Button asChild size="lg" variant="outline" className="bg-card">
              <a href="#plataforma">Ver la plataforma</a>
            </Button>
          </m.div>
          <p className="mt-5 text-sm text-muted-foreground">
            ¿Eres proveedor?{" "}
            <Link
              to="/proveedor/registro"
              className="font-medium text-primary hover:underline"
            >
              Regístrate gratis y homológate una sola vez
            </Link>
          </p>
        </div>

        <m.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className="px-2 sm:px-8 lg:px-0"
        >
          <LandingHeroShowcase />
        </m.div>
      </div>

      <div className="relative border-y border-border bg-card/70">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-6 py-5 lg:flex-row lg:items-center lg:gap-8">
          <p className="shrink-0 text-xs font-semibold uppercase tracking-widest text-primary">
            Todo el proceso, en una plataforma
          </p>
          <ol
            className="flex flex-wrap items-center gap-x-1 gap-y-2 text-sm font-medium text-foreground/80"
            aria-label="Etapas de una compra en Procurex"
          >
            {etapas.map((e, i) => (
              <li key={e} className="flex items-center gap-1">
                {e}
                {i < etapas.length - 1 && (
                  <ChevronRight
                    className="h-3.5 w-3.5 text-muted-foreground/60"
                    aria-hidden="true"
                  />
                )}
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
