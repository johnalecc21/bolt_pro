import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, CheckCircle2, Building2 } from "lucide-react";
import { simulateProcess } from "@/lib/mock/simulate";
import { apiRegisterProveedor } from "@/lib/api/auth";
import { apiErrorMessage } from "@/lib/api/http";
import { usePageMeta } from "@/hooks/usePageMeta";

export function RegistroProveedor() {
  usePageMeta({ title: "Registro de proveedores", description: "Registra tu empresa como proveedor en Procurex, homológate y recibe invitaciones a licitaciones de empresas compradoras." });
  const navigate = useNavigate();
  const [step, setStep] = useState<"form" | "verifying" | "done">("form");
  const [razonSocial, setRazonSocial] = useState("");
  const [pais, setPais] = useState("Colombia");
  const [categoria, setCategoria] = useState("Tecnología");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [aceptaTerminos, setAceptaTerminos] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await apiRegisterProveedor({ razonSocial, email, password, categoria, pais });
    } catch (err) {
      setError(apiErrorMessage(err, "No se pudo crear la cuenta."));
      return;
    }
    setStep("verifying");
    await simulateProcess([{ label: "Enviando verificación...", duration: 700 }]);
    setStep("done");
    toast.success("Cuenta creada", { description: email });
  }

  return (
    <div className="flex min-h-screen items-center justify-center gradient-hero p-6">
      <div className="w-full max-w-md rounded-2xl bg-background p-8 shadow-xl">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl gradient-brand text-white">
            <Building2 className="h-6 w-6" />
          </div>
          <h1 className="text-xl font-bold">Únete a la red de proveedores</h1>
          <p className="mt-1 text-sm text-muted-foreground">Registro autoservicio — luego completarás tu homologación</p>
        </div>

        {step === "form" && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Razón social</Label>
              <Input value={razonSocial} onChange={(e) => setRazonSocial(e.target.value)} required placeholder="Mi Empresa S.A.S." />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>País</Label>
                <Input value={pais} onChange={(e) => setPais(e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label>Categoría principal</Label>
                <select className="w-full rounded-md border border-input bg-white px-3 py-2 text-sm" value={categoria} onChange={(e) => setCategoria(e.target.value)}>
                  <option>Tecnología</option>
                  <option>Servicios Generales</option>
                  <option>Materia Prima</option>
                  <option>Logística</option>
                  <option>Marketing</option>
                </select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Correo de contacto</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="contacto@miempresa.com" />
            </div>
            <div className="space-y-1.5">
              <Label>Contraseña</Label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} placeholder="••••••••" />
            </div>
            <div className="flex items-start gap-2">
              <Checkbox
                id="acepta-terminos"
                checked={aceptaTerminos}
                onCheckedChange={(v) => setAceptaTerminos(v === true)}
                className="mt-0.5"
              />
              <Label htmlFor="acepta-terminos" className="text-xs font-normal leading-relaxed text-muted-foreground">
                Acepto los{" "}
                <Link to="/terminos" target="_blank" rel="noopener noreferrer" className="font-medium text-primary hover:underline">
                  Términos y Condiciones
                </Link>{" "}
                y el{" "}
                <Link to="/privacidad" target="_blank" rel="noopener noreferrer" className="font-medium text-primary hover:underline">
                  Aviso de Privacidad
                </Link>{" "}
                de Procurex.
              </Label>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={!aceptaTerminos}>Crear cuenta</Button>
            <p className="text-center text-sm text-muted-foreground">
              ¿Ya tienes cuenta? <Link to="/proveedor/login" className="font-medium text-primary hover:underline">Inicia sesión</Link>
            </p>
          </form>
        )}

        {step === "verifying" && (
          <div className="flex flex-col items-center gap-3 py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Enviando verificación...</p>
          </div>
        )}

        {step === "done" && (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <CheckCircle2 className="h-10 w-10 text-success" />
            <p className="font-medium">Cuenta creada</p>
            <p className="text-sm text-muted-foreground">Te enviamos un enlace de verificación a {email}. Ya puedes iniciar sesión con este correo y tu contraseña para completar tu homologación.</p>
            <Button className="mt-2 w-full" onClick={() => navigate("/proveedor/login")}>Ir a iniciar sesión</Button>
          </div>
        )}
      </div>
    </div>
  );
}
