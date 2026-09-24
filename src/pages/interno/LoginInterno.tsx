import { Link } from "react-router-dom";
import { Users2, ShieldAlert, LineChart } from "lucide-react";
import { PortalLoginForm } from "@/components/shared/PortalLoginForm";
import { LogoFull } from "@/components/shared/Logo";
import { usePageMeta } from "@/hooks/usePageMeta";

export function LoginInterno() {
  usePageMeta({ title: "Ingreso equipo interno", noindex: true });
  return (
    <div className="flex min-h-screen">
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden border-r border-border bg-muted/30 p-12 lg:flex">
        <div>
          <Link to="/" className="inline-flex items-center">
            <LogoFull className="h-8" />
          </Link>
        </div>
        <div className="space-y-8">
          <div>
            <h1 className="text-4xl font-bold leading-tight text-foreground">Panel Interno</h1>
            <p className="mt-3 text-lg text-muted-foreground">
              Herramientas de sourcing, compliance y soporte human-in-the-loop.
            </p>
          </div>
          <div className="space-y-4">
            {[
              { icon: Users2, title: "Casos activos", desc: "Da soporte experto a cada cliente." },
              { icon: ShieldAlert, title: "Compliance", desc: "Homologación y auditoría con trazabilidad." },
              { icon: LineChart, title: "Benchmark de mercado", desc: "Data que alimenta cada decisión." },
            ].map((f) => (
              <div key={f.title} className="flex items-start gap-3 rounded-xl border border-border bg-card p-4">
                <f.icon className="h-6 w-6 shrink-0 text-warning-foreground" />
                <div>
                  <p className="font-semibold text-foreground">{f.title}</p>
                  <p className="text-sm text-muted-foreground">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <p className="text-sm text-muted-foreground">© 2026 Procurex. Todos los derechos reservados.</p>
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
