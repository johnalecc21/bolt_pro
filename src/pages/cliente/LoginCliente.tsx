import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Zap, ShieldCheck, TrendingUp, Mail, Lock } from "lucide-react";

export function LoginCliente() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate("/cliente/dashboard");
  };

  return (
    <div className="flex min-h-screen">
      {/* Left hero */}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden gradient-hero p-12 text-white lg:flex">
        <div className="absolute -right-20 top-20 h-72 w-72 rounded-full bg-primary/30 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 h-72 w-72 rounded-full bg-info/20 blur-3xl" />
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm font-bold">P</div>
            <span className="text-2xl font-bold">ProcureOS</span>
          </div>
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
        <p className="relative z-10 text-sm text-white/40">© 2024 ProcureOS. Todos los derechos reservados.</p>
      </div>

      {/* Right form */}
      <div className="flex w-full flex-col justify-center px-6 py-12 lg:w-1/2 lg:px-20">
        <div className="mx-auto w-full max-w-sm">
          <div className="mb-8">
            <h2 className="text-2xl font-bold">Bienvenido de nuevo</h2>
            <p className="mt-1 text-sm text-muted-foreground">Ingresa a tu portal de compras</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Correo electrónico</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="email" type="email" placeholder="admin@acme.com" className="pl-9" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Contraseña</Label>
                <Link to="#" className="text-xs text-primary hover:underline">¿Olvidaste tu contraseña?</Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="password" type="password" placeholder="••••••••" className="pl-9" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Checkbox id="remember" />
                <Label htmlFor="remember" className="text-sm font-normal cursor-pointer">Recordarme</Label>
              </div>
            </div>
            <Button type="submit" className="w-full gradient-brand text-white hover:opacity-90">Iniciar sesión</Button>
          </form>
          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted-foreground">o continúa con</span>
            <div className="h-px flex-1 bg-border" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline">Google</Button>
            <Button variant="outline">Microsoft</Button>
          </div>
          <div className="mt-6 rounded-lg bg-muted p-3 text-center text-xs text-muted-foreground">
            <span className="font-medium text-foreground">Demo:</span> admin@acme.com / demo123
          </div>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            ¿Eres proveedor?{" "}
            <Link to="/proveedor/login" className="font-medium text-primary hover:underline">Ingresa al portal de proveedores</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
