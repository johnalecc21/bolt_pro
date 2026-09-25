import { m } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LandingHeroShowcase } from "./LandingHeroShowcase";
import { DEMO_MAILTO } from "./contacto";

const claves = [
  "Proveedores homologados",
  "Aprobaciones y licitaciones",
  "Contratos y pagos",
];

/** Light, short opening: one idea, two actions, and the product right below. */
export function LandingHero() {
  return (
    <section
      id="top"
      className="relative overflow-hidden bg-background pt-28 sm:pt-32"
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[34rem] bg-gradient-to-b from-primary/[0.08] via-primary/[0.03] to-transparent" />

      <div className="relative mx-auto max-w-3xl px-6 text-center">
        <m.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="text-4xl font-bold leading-[1.1] tracking-tight text-foreground sm:text-6xl"
        >
          Compra mejor, con{" "}
          <span className="text-primary">proveedores verificados</span>
        </m.h1>

        {/* Static on purpose: this is the LCP text, so it isn't animated in. */}
        <p className="mx-auto mt-5 max-w-xl text-lg text-muted-foreground">
          Aprueba, licita, negocia y paga en una sola plataforma. Nosotros
          homologamos a tus proveedores.
        </p>

        <m.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="mt-8 flex flex-wrap items-center justify-center gap-3"
        >
          <Button
            asChild
            size="lg"
            className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground"
          >
            <a href={DEMO_MAILTO}>
              Solicitar una demo <ArrowRight className="h-4 w-4" />
            </a>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="border-border bg-card hover:bg-muted hover:text-foreground"
          >
            <a href="#plataforma">Ver la plataforma</a>
          </Button>
        </m.div>

        <ul className="mt-7 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
          {claves.map((c) => (
            <li key={c} className="flex items-center gap-1.5">
              <Check className="h-4 w-4 text-primary" aria-hidden="true" /> {c}
            </li>
          ))}
        </ul>
        <p className="mt-4 text-sm text-muted-foreground">
          ¿Eres proveedor?{" "}
          <Link
            to="/proveedor/registro"
            className="font-medium text-primary hover:underline"
          >
            Regístrate gratis
          </Link>
        </p>
      </div>

      <m.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
        className="relative mx-auto mt-14 max-w-2xl px-6 pb-4 sm:px-10"
      >
        <LandingHeroShowcase />
      </m.div>
    </section>
  );
}
