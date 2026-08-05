import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Building2, Truck, Users2, Zap, ShieldCheck, TrendingUp } from "lucide-react";

const portals = [
  {
    icon: Building2,
    title: "Portal Cliente",
    description: "Gestiona todo el ciclo de compras de tu empresa: requerimientos, licitaciones, negociación y contratos.",
    to: "/cliente/login",
    accent: "text-primary bg-primary/10",
  },
  {
    icon: Truck,
    title: "Portal Proveedores",
    description: "Homologa tu empresa, recibe invitaciones a licitar, cotiza y da seguimiento a tus procesos.",
    to: "/proveedor/login",
    accent: "text-info bg-info/10",
  },
  {
    icon: Users2,
    title: "Panel Interno",
    description: "Herramientas de consultoría, compliance y soporte human-in-the-loop para el equipo de ProcureOS.",
    to: "/interno/login",
    accent: "text-warning-foreground bg-warning/10",
  },
];

export function Landing() {
  return (
    <div className="min-h-screen gradient-hero text-white">
      <header className="flex items-center gap-2 px-8 py-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 font-bold backdrop-blur-sm">P</div>
        <span className="text-lg font-bold">ProcureOS</span>
      </header>

      <main className="mx-auto flex max-w-5xl flex-col items-center px-6 pb-24 pt-8 text-center">
        <h1 className="max-w-3xl text-4xl font-bold leading-tight sm:text-5xl">
          Procurement-as-a-Service
        </h1>
        <p className="mt-4 max-w-xl text-lg text-white/70">
          Más velocidad, más ahorro, con expertos humanos detrás de cada decisión.
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-4 text-sm text-white/80">
          <span className="flex items-center gap-1.5"><Zap className="h-4 w-4" /> Implementación en días</span>
          <span className="flex items-center gap-1.5"><TrendingUp className="h-4 w-4" /> Ahorro certificado</span>
          <span className="flex items-center gap-1.5"><ShieldCheck className="h-4 w-4" /> Red de proveedores validada</span>
        </div>

        <div className="mt-14 grid w-full gap-5 sm:grid-cols-3">
          {portals.map((p) => (
            <Card key={p.title} className="flex flex-col items-start gap-4 bg-white/5 p-6 text-left backdrop-blur-sm border-white/10">
              <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${p.accent}`}>
                <p.icon className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold text-white">{p.title}</h3>
                <p className="text-sm text-white/60">{p.description}</p>
              </div>
              <Button asChild className="mt-auto w-full gradient-brand text-white">
                <Link to={p.to}>Ingresar</Link>
              </Button>
            </Card>
          ))}
        </div>
      </main>

      <footer className="border-t border-white/10 py-6 text-center text-xs text-white/40">
        © 2026 ProcureOS. Todos los derechos reservados.
      </footer>
    </div>
  );
}
