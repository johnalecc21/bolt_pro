import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Reveal } from "./Reveal";

export function LandingCta() {
  return (
    <section className="relative overflow-hidden border-t border-border bg-muted/30 py-24">
      <Reveal className="relative mx-auto flex max-w-3xl flex-col items-center gap-6 px-6 text-center">
        <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">¿Listo para transformar tus compras?</h2>
        <p className="max-w-xl text-muted-foreground">
          Agenda una demo con nuestro equipo y te mostramos cómo Procurex se adapta al proceso de tu empresa.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Button asChild size="lg" className="gap-2 gradient-brand text-white shadow-lg shadow-primary/20">
            <a href="mailto:ventas@procureos.com?subject=Quiero%20una%20demo%20de%20Procurex">
              Solicitar una demo <ArrowRight className="h-4 w-4" />
            </a>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link to="/proveedor/registro">Registrarme como proveedor</Link>
          </Button>
        </div>
      </Reveal>
    </section>
  );
}
