import { Link } from "react-router-dom";
import { Zap, ShieldCheck, TrendingUp } from "lucide-react";
import { PortalLoginForm } from "@/components/shared/PortalLoginForm";

export function LoginCliente() {
  return (
    <div className="flex min-h-screen">
      {/* Left hero */}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden gradient-hero p-12 text-white lg:flex">
        <div className="absolute -right-20 top-20 h-72 w-72 rounded-full bg-primary/30 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 h-72 w-72 rounded-full bg-info/20 blur-3xl" />
        <div className="relative z-10">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm font-bold">P</div>
            <span className="text-2xl font-bold">ProcureOS</span>
          </Link>
        </div>
        <div className="relative z-10 space-y-8">
          <div>
            <h1 className="text-4xl font-bold leading-tight">
              Procurement-as-a-Service
            </h1>
            <p className="mt-3 text-lg text-white/70">
              Más velocidad. Más ahorro. Con expertos humanos detrás de cada decisión.
            </p>
          </div>
          <div className="space-y-4">
            {[
              { icon: Zap, title: "Implementación en días", desc: "No meses. Onboarding guiado en vivo." },
              { icon: TrendingUp, title: "Ahorro certificado", desc: "Success fee — no pagas si no ahorramos." },
              { icon: ShieldCheck, title: "Red de proveedores validada", desc: "Base propietaria con scoring de desempeño real." },
            ].map((f) => (
              <div key={f.title} className="flex items-start gap-3 rounded-xl bg-white/5 p-4 backdrop-blur-sm border border-white/10">
                <f.icon className="h-6 w-6 shrink-0 text-primary" />
                <div>
                  <p className="font-semibold">{f.title}</p>
                  <p className="text-sm text-white/60">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <p className="relative z-10 text-sm text-white/40">© 2026 ProcureOS. Todos los derechos reservados.</p>
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
