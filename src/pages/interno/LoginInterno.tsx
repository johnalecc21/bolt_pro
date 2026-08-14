import { Link } from "react-router-dom";
import { Users2, ShieldAlert, LineChart } from "lucide-react";
import { PortalLoginForm } from "@/components/shared/PortalLoginForm";
import { LogoIcon } from "@/components/shared/Logo";

export function LoginInterno() {
  return (
    <div className="flex min-h-screen">
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden gradient-hero p-12 text-white lg:flex">
        <div className="absolute -right-20 top-20 h-72 w-72 rounded-full bg-warning/30 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 h-72 w-72 rounded-full bg-primary/20 blur-3xl" />
        <div className="relative z-10">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white p-1.5"><LogoIcon className="h-full w-full" /></div>
            <span className="text-2xl font-bold">Procurex</span>
          </Link>
        </div>
        <div className="relative z-10 space-y-8">
          <div>
            <h1 className="text-4xl font-bold leading-tight">Panel Interno</h1>
            <p className="mt-3 text-lg text-white/70">
              Herramientas de sourcing, compliance y soporte human-in-the-loop.
            </p>
          </div>
          <div className="space-y-4">
            {[
              { icon: Users2, title: "Casos activos", desc: "Da soporte experto a cada cliente." },
              { icon: ShieldAlert, title: "Compliance", desc: "Homologación y auditoría con trazabilidad." },
              { icon: LineChart, title: "Benchmark de mercado", desc: "Data que alimenta cada decisión." },
            ].map((f) => (
              <div key={f.title} className="flex items-start gap-3 rounded-xl bg-white/5 p-4 backdrop-blur-sm border border-white/10">
                <f.icon className="h-6 w-6 shrink-0 text-warning" />
                <div>
                  <p className="font-semibold">{f.title}</p>
                  <p className="text-sm text-white/60">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <p className="relative z-10 text-sm text-white/40">© 2026 Procurex. Todos los derechos reservados.</p>
      </div>

      <div className="flex w-full flex-col justify-center px-6 py-12 lg:w-1/2 lg:px-20">
        <div className="mx-auto w-full max-w-sm mb-8">
          <h2 className="text-2xl font-bold">Panel Interno</h2>
          <p className="mt-1 text-sm text-muted-foreground">Acceso exclusivo para el equipo Procurex</p>
        </div>
        <PortalLoginForm
          portal="interno"
          demoHint="ana.consultora@procureos.com / demo123"
          footer={
            <p className="text-center text-sm text-muted-foreground">
              ¿No trabajas en Procurex?{" "}
              <Link to="/" className="font-medium text-primary hover:underline">Volver al inicio</Link>
            </p>
          }
        />
      </div>
    </div>
  );
}
