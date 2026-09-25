import { m } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Magnetic } from "./Magnetic";
import { LandingHeroShowcase } from "./LandingHeroShowcase";
import { BlurText } from "./BlurText";
import { DEMO_MAILTO } from "./contacto";

/**
 * Opens the page on the same navy card with brand glows as the closing CTA,
 * so the first and last impressions match.
 */
export function LandingHero() {
  return (
    <section
      id="top"
      className="bg-background px-3 pb-8 pt-[4.5rem] sm:px-4 sm:pt-20"
    >
      <div className="relative mx-auto max-w-[88rem] overflow-hidden rounded-[2rem] bg-brand-700 text-white">
        <div className="pointer-events-none absolute -left-32 -top-32 h-[28rem] w-[28rem] rounded-full bg-brand-accent/25 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 right-[-6rem] h-[30rem] w-[30rem] rounded-full bg-primary/45 blur-3xl" />
        <div className="pointer-events-none absolute left-1/2 top-1/3 h-72 w-72 -translate-x-1/2 rounded-full bg-primary/15 blur-3xl" />

        <div className="relative mx-auto grid max-w-7xl grid-cols-[minmax(0,1fr)] items-center gap-14 px-6 py-16 sm:py-20 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.02fr)] lg:px-10 lg:py-24">
          <div className="text-center lg:text-left">
            <m.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-xs font-medium text-white/85"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-brand-accent" />
              Procurement-as-a-Service para empresas en Latinoamérica
            </m.div>

            <h1 className="mt-6 text-4xl font-bold leading-[1.08] tracking-tight sm:text-[3.4rem]">
              <BlurText
                text="De la solicitud al pago, con proveedores homologados"
                highlightFrom={5}
                highlightClassName="text-brand-accent"
                delay={35}
                className="justify-center lg:justify-start"
              />
            </h1>

            {/* Static on purpose: this paragraph is the page's largest text block (the
                LCP element), so fading it in would push LCP back by the animation. */}
            <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-white/75 lg:mx-0">
              Procurex verifica a tus proveedores —documentos, listas
              restrictivas y revisión de nuestro equipo de compliance— y le da a
              tu área de compras una sola plataforma para aprobar, licitar,
              negociar, contratar y pagar, con cada decisión registrada.
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
                  className="gap-2 bg-white text-primary shadow-lg hover:bg-white/90"
                >
                  <a href={DEMO_MAILTO}>
                    Solicitar una demo <ArrowRight className="h-4 w-4" />
                  </a>
                </Button>
              </Magnetic>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white"
              >
                <a href="#plataforma">Ver la plataforma</a>
              </Button>
            </m.div>
            <p className="mt-5 text-sm text-white/65">
              ¿Eres proveedor?{" "}
              <Link
                to="/proveedor/registro"
                className="font-medium text-brand-accent hover:underline"
              >
                Regístrate gratis y homológate una sola vez
              </Link>
            </p>
          </div>

          <m.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.8,
              delay: 0.25,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="px-2 sm:px-8 lg:px-0"
          >
            <LandingHeroShowcase />
          </m.div>
        </div>
      </div>
    </section>
  );
}
