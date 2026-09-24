import { Link } from "react-router-dom";
import { Zap, ShieldCheck, TrendingUp } from "lucide-react";
import { PortalLoginForm } from "@/components/shared/PortalLoginForm";
import { LogoFull } from "@/components/shared/Logo";
import { usePageMeta } from "@/hooks/usePageMeta";

export function LoginCliente() {
  usePageMeta({ title: "Ingreso clientes", noindex: true });
  return (
    <div className="flex min-h-screen">
      {/* Left hero */}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden border-r border-border bg-muted/30 p-12 lg:flex">
        <div>
          <Link to="/" className="inline-flex items-center">
            <LogoFull className="h-8" />
          </Link>
        </div>
        <div className="space-y-8">
          <div>
            <h1 className="text-4xl font-bold leading-tight text-foreground">
              Procurement-as-a-Service
            </h1>
            <p className="mt-3 text-lg text-muted-foreground">
              Más velocidad. Más ahorro. Con expertos humanos detrás de cada decisión.
            </p>
          </div>
          <div className="space-y-4">
            {[
              { icon: Zap, title: "Implementación en días", desc: "No meses. Onboarding guiado en vivo." },
              { icon: TrendingUp, title: "Ahorro certificado", desc: "Success fee — no pagas si no ahorramos." },
              { icon: ShieldCheck, title: "Red de proveedores validada", desc: "Base propietaria con scoring de desempeño real." },
            ].map((f) => (
              <div key={f.title} className="flex items-start gap-3 rounded-xl border border-border bg-card p-4">
                <f.icon className="h-6 w-6 shrink-0 text-primary" />
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

      {/* Right form */}
      <div className="flex w-full flex-col justify-center px-6 py-12 lg:w-1/2 lg:px-20">
        <div className="mx-auto w-full max-w-sm mb-8">
          <h2 className="text-2xl font-bold">Bienvenido de nuevo</h2>
          <p className="mt-1 text-sm text-muted-foreground">Ingresa a tu portal de compras</p>
        </div>
        <PortalLoginForm
          portal="cliente"
          demoHint="carlos@acme.com / demo123 (admin@acme.com tiene 2 empresas)"
          footer={
            <p className="text-center text-sm text-muted-foreground">
              ¿Eres proveedor?{" "}
              <Link to="/proveedor/login" className="font-medium text-primary hover:underline">Ingresa al portal de proveedores</Link>
            </p>
          }
        />
      </div>
    </div>
  );
}
