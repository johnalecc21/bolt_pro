import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Reveal } from "./Reveal";
import { motion } from "framer-motion";

export function LandingCta() {
  return (
    <section className="relative overflow-hidden gradient-hero py-24 text-white">
      <div className="pointer-events-none absolute inset-0">
        <motion.div
          animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          className="absolute left-1/4 top-0 h-72 w-72 rounded-full bg-[oklch(0.5_0.16_246)]/25 blur-3xl"
        />
        <motion.div
          animate={{ x: [0, -30, 0], y: [0, 20, 0] }}
          transition={{ duration: 24, repeat: Infinity, ease: "easeInOut" }}
          className="absolute right-1/4 bottom-0 h-72 w-72 rounded-full bg-[oklch(0.55_0.13_195)]/20 blur-3xl"
        />
      </div>
      <Reveal className="relative mx-auto flex max-w-3xl flex-col items-center gap-6 px-6 text-center">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">¿Listo para transformar tus compras?</h2>
        <p className="max-w-xl text-white/70">
          Agenda una demo con nuestro equipo y te mostramos cómo Procurex se adapta al proceso de tu empresa.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Button asChild size="lg" className="gap-2 bg-white text-primary hover:bg-white/90">
            <a href="mailto:ventas@procureos.com?subject=Quiero%20una%20demo%20de%20Procurex">
              Solicitar una demo <ArrowRight className="h-4 w-4" />
            </a>
          </Button>
          <Button asChild size="lg" variant="outline" className="border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white">
            <Link to="/proveedor/registro">Registrarme como proveedor</Link>
          </Button>
        </div>
      </Reveal>
    </section>
  );
}
