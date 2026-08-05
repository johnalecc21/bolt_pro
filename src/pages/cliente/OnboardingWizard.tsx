import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";
import { Building2, Package, UploadCloud, Users, ShieldCheck, Check, ArrowRight, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

const steps = [
  { id: 1, label: "Empresa", icon: Building2 },
  { id: 2, label: "Categorías", icon: Package },
  { id: 3, label: "Historial", icon: UploadCloud },
  { id: 4, label: "Usuarios", icon: Users },
  { id: 5, label: "Aprobación", icon: ShieldCheck },
];

const categorias = [
  { id: "ti", label: "Tecnología", icon: "💻" },
  { id: "serv", label: "Servicios Generales", icon: "🧹" },
  { id: "mat", label: "Materia Prima", icon: "📦" },
  { id: "log", label: "Logística", icon: "🚛" },
  { id: "mkt", label: "Marketing", icon: "📢" },
  { id: "rh", label: "RR.HH.", icon: "👥" },
];

export function OnboardingWizard() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [selectedCats, setSelectedCats] = useState<string[]>(["ti", "log"]);

  const next = () => setStep((s) => Math.min(5, s + 1));
  const prev = () => setStep((s) => Math.max(1, s - 1));

  return (
    <div className="min-h-screen bg-gradient-to-b from-muted/30 to-background">
      <div className="mx-auto max-w-3xl px-6 py-10">
        <div className="mb-8 text-center">
          <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-xl gradient-brand text-white font-bold text-lg">P</div>
          <h1 className="text-2xl font-bold">Configura tu cuenta en minutos</h1>
          <p className="mt-1 text-sm text-muted-foreground">Te acompañaremos en cada paso</p>
        </div>

        {/* Stepper */}
        <div className="mb-10 flex items-center justify-between">
          {steps.map((s, i) => (
            <div key={s.id} className="flex flex-1 items-center last:flex-none">
              <div className="flex flex-col items-center gap-2">
                <div className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all",
                  step > s.id ? "border-success bg-success text-success-foreground" :
                  step === s.id ? "border-primary bg-primary text-primary-foreground scale-110 shadow-lg" :
                  "border-border bg-muted text-muted-foreground"
                )}>
                  {step > s.id ? <Check className="h-5 w-5" /> : <s.icon className="h-5 w-5" />}
                </div>
                <span className={cn("text-xs font-medium", step >= s.id ? "text-foreground" : "text-muted-foreground")}>{s.label}</span>
              </div>
              {i < steps.length - 1 && (
                <div className={cn("mx-2 h-0.5 flex-1 rounded-full transition-colors", step > s.id ? "bg-success" : "bg-border")} />
              )}
            </div>
          ))}
        </div>

        <Card className="p-8">
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Datos de tu empresa</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Razón social</Label>
                  <Input placeholder="Acme S.A." defaultValue="Acme S.A." />
                </div>
                <div className="space-y-2">
                  <Label>RUC / NIT</Label>
                  <Input placeholder="900.123.456-7" defaultValue="900.123.456-7" />
                </div>
                <div className="space-y-2">
                  <Label>País</Label>
                  <Input placeholder="Colombia" defaultValue="Colombia" />
                </div>
                <div className="space-y-2">
                  <Label>Industria</Label>
                  <Input placeholder="Retail" defaultValue="Retail" />
                </div>
                <div className="space-y-2">
                  <Label>Tamaño</Label>
                  <Input placeholder="200-500 empleados" defaultValue="200-500 empleados" />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">¿Qué categorías gestionarás primero?</h2>
              <p className="text-sm text-muted-foreground">Selecciona las áreas de gasto que quieres optimizar</p>
              <div className="grid grid-cols-3 gap-3">
                {categorias.map((cat) => {
                  const selected = selectedCats.includes(cat.id);
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCats((prev) => selected ? prev.filter((c) => c !== cat.id) : [...prev, cat.id])}
                      className={cn(
                        "flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all",
                        selected ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"
                      )}
                    >
                      <span className="text-2xl">{cat.icon}</span>
                      <span className="text-sm font-medium">{cat.label}</span>
                      {selected && <Check className="h-4 w-4 text-primary" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Carga tu historial de compras</h2>
              <p className="text-sm text-muted-foreground">Nos ayuda a identificar quick wins de ahorro</p>
              <div className="rounded-xl border-2 border-dashed border-border p-10 text-center hover:border-primary/50 transition-colors">
                <UploadCloud className="mx-auto h-10 w-10 text-muted-foreground" />
                <p className="mt-3 text-sm font-medium">Arrastra tu CSV o Excel aquí</p>
                <p className="text-xs text-muted-foreground">o haz clic para seleccionar</p>
              </div>
              <div className="space-y-2">
                <Label className="text-sm">O conecta tu ERP</Label>
                <div className="grid grid-cols-4 gap-3">
                  {["SAP", "Oracle", "Odoo", "QuickBooks"].map((erp) => (
                    <button key={erp} className="rounded-lg border border-border p-3 text-sm font-medium hover:border-primary hover:bg-primary/5 transition-colors">
                      {erp}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Invita a tu equipo</h2>
              <div className="flex gap-2">
                <Input placeholder="email@empresa.com" />
                <select className="rounded-md border border-input bg-background px-3 text-sm">
                  <option>Comprador</option>
                  <option>Aprobador</option>
                  <option>Admin</option>
                  <option>Viewer</option>
                </select>
                <Button>Invitar</Button>
              </div>
              <div className="space-y-2">
                {[
                  { name: "Carlos Méndez", email: "carlos@acme.com", role: "Comprador" },
                  { name: "Laura Torres", email: "laura@acme.com", role: "Aprobador" },
                  { name: "Ana Ruiz", email: "ana@acme.com", role: "Admin" },
                ].map((u) => (
                  <div key={u.email} className="flex items-center justify-between rounded-lg border border-border p-3">
                    <div>
                      <p className="text-sm font-medium">{u.name}</p>
                      <p className="text-xs text-muted-foreground">{u.email}</p>
                    </div>
                    <span className="rounded-md bg-muted px-2 py-1 text-xs">{u.role}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Matriz de aprobación</h2>
              <p className="text-sm text-muted-foreground">¿Quién aprueba qué monto?</p>
              <div className="overflow-hidden rounded-lg border border-border">
                <table className="w-full text-sm">
                  <thead className="bg-muted">
                    <tr>
                      <th className="p-3 text-left font-medium">Monto mín.</th>
                      <th className="p-3 text-left font-medium">Monto máx.</th>
                      <th className="p-3 text-left font-medium">Aprobador</th>
                      <th className="p-3 text-left font-medium">Tipo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { min: "$0", max: "$10,000", apr: "Comprador", tipo: "Única" },
                      { min: "$10,001", max: "$50,000", apr: "Gerente Compras", tipo: "Única" },
                      { min: "$50,001", max: "$200,000", apr: "CFO", tipo: "Secuencial" },
                      { min: "$200,001", max: "Ilimitado", apr: "CEO + CFO", tipo: "Secuencial" },
                    ].map((r, i) => (
                      <tr key={i} className="border-t border-border">
                        <td className="p-3">{r.min}</td>
                        <td className="p-3">{r.max}</td>
                        <td className="p-3">{r.apr}</td>
                        <td className="p-3"><span className="rounded-md bg-primary/10 px-2 py-0.5 text-xs text-primary">{r.tipo}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="rounded-lg bg-info/10 p-3 text-sm text-info">
                <strong>Ejemplo:</strong> Una compra de $75,000 requeriría aprobación de: Gerente Compras → CFO (secuencial).
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="mt-8 flex items-center justify-between border-t pt-6">
            <Button variant="ghost" onClick={() => navigate("/cliente/dashboard")} className="text-muted-foreground">
              Continuar después
            </Button>
            <div className="flex gap-2">
              {step > 1 && (
                <Button variant="outline" onClick={prev}>
                  <ArrowLeft className="mr-2 h-4 w-4" /> Anterior
                </Button>
              )}
              {step < 5 ? (
                <Button onClick={next} className="gradient-brand text-white">
                  Siguiente <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button onClick={() => navigate("/cliente/dashboard")} className="gradient-success text-white">
                  <Check className="mr-2 h-4 w-4" /> Finalizar
                </Button>
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
