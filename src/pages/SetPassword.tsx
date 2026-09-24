import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, Loader2, CheckCircle2 } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { apiMe } from "@/lib/api/auth";
import { apiErrorMessage } from "@/lib/api/http";
import { LogoFull } from "@/components/shared/Logo";
import { usePageMeta } from "@/hooks/usePageMeta";

type Status = "checking" | "ready" | "invalid" | "saving" | "done";

export function SetPassword() {
  usePageMeta({ title: "Crear contraseña", noindex: true });
  const [status, setStatus] = useState<Status>("checking");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setStatus(data.session ? "ready" : "invalid");
    });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    if (password !== confirm) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    setStatus("saving");
    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) {
      setError(apiErrorMessage(updateError, "No se pudo guardar la contraseña."));
      setStatus("ready");
      return;
    }
    setStatus("done");
    toast.success("Contraseña creada");

    // Full reload so AuthProvider resolves the session from scratch — cleaner
    // than trying to hand-sync its internal state from here.
    let target = "/";
    try {
      const me = await apiMe();
      const isInvite = window.location.hash.includes("type=invite");
      target = isInvite && me.user.portal === "CLIENTE" ? "/cliente/onboarding" : `/${me.user.portal.toLowerCase()}/dashboard`;
    } catch {
      // Fall back to "/" — the portal login screens can take it from there.
    }
    window.location.assign(target);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-6">
      <Card className="w-full max-w-sm p-8">
        <div className="mb-6">
          <LogoFull className="h-8" />
        </div>

        {status === "checking" && (
          <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Verificando enlace...
          </div>
        )}

        {status === "invalid" && (
          <div className="space-y-3">
            <h1 className="text-lg font-bold">Enlace inválido o expirado</h1>
            <p className="text-sm text-muted-foreground">
              Este enlace ya fue usado o venció. Pedí uno nuevo desde la pantalla de inicio de sesión con "¿Olvidaste tu contraseña?".
            </p>
            <Link to="/" className="text-sm font-medium text-primary hover:underline">Volver al inicio</Link>
          </div>
        )}

        {status === "done" && (
          <div className="flex items-center gap-2 py-8 text-sm text-success">
            <CheckCircle2 className="h-4 w-4" /> Listo, ingresando...
          </div>
        )}

        {(status === "ready" || status === "saving") && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <h1 className="text-lg font-bold">Elegí tu contraseña</h1>
              <p className="text-sm text-muted-foreground">Usala para ingresar a Procurex de ahora en adelante.</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Contraseña</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="password" type="password" className="pl-9" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirm">Confirmar contraseña</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="confirm" type="password" className="pl-9" placeholder="••••••••" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
              </div>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={status === "saving"}>
              {status === "saving" ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Guardando...</> : "Guardar y continuar"}
            </Button>
          </form>
        )}
      </Card>
    </div>
  );
}
