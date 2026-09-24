import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Bell, KeyRound, ArrowRight } from "lucide-react";
import { useAuth } from "@/lib/auth/AuthContext";
import { roleLabels } from "@/lib/mock/users";
import { TwoFactorSettingsCard } from "@/components/shared/TwoFactorSettingsCard";
import { CorreosCard } from "@/components/cuenta/CorreosCard";
import { PlanUsoCard } from "@/components/cuenta/PlanUsoCard";
import { AuditoriaCard } from "@/components/cuenta/AuditoriaCard";
import { supabase } from "@/lib/supabase/client";
import { apiErrorMessage } from "@/lib/api/http";

export function ConfiguracionCuenta({ portal = "cliente" }: { portal?: "cliente" | "proveedor" | "interno" }) {
  const { currentUser, activeCompany, updateProfile } = useAuth();
  const [nombre, setNombre] = useState(currentUser?.nombre ?? "");
  const [cargo, setCargo] = useState(currentUser?.cargo ?? "");
  const [guardando, setGuardando] = useState(false);
  const [actual, setActual] = useState("");
  const [nueva, setNueva] = useState("");
  const [cambiando, setCambiando] = useState(false);

  async function guardarPerfil() {
    if (nombre.trim().length < 2) {
      toast.error("Escribe tu nombre completo.");
      return;
    }
    setGuardando(true);
    try {
      await updateProfile({ nombre: nombre.trim(), cargo: cargo.trim() });
      toast.success("Perfil actualizado");
    } catch (err) {
      toast.error(apiErrorMessage(err, "No se pudo guardar el perfil."));
    } finally {
      setGuardando(false);
    }
  }

  async function cambiarPassword() {
    if (!actual || !nueva) return;
    setCambiando(true);
    try {
      // Supabase's updateUser doesn't take a "current password" — re-authenticate
      // with it first so a stolen session token alone can't change the password.
      if (currentUser?.email) {
        const { error: reauthError } = await supabase.auth.signInWithPassword({ email: currentUser.email, password: actual });
        if (reauthError) throw new Error("La contraseña actual no es correcta.");
      }
      const { error } = await supabase.auth.updateUser({ password: nueva });
      if (error) throw error;
      toast.success("Contraseña actualizada");
      setActual("");
      setNueva("");
    } catch (err) {
      toast.error(apiErrorMessage(err, "No se pudo actualizar la contraseña."));
    } finally {
      setCambiando(false);
    }
  }

  return (
    <div className="max-w-2xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">Configuración de Cuenta</h1>
        <p className="text-sm text-muted-foreground">Gestiona tus datos personales y preferencias</p>
      </div>

      <Card className="p-5">
        <div className="mb-4 flex items-center gap-4">
          <Avatar className="h-14 w-14">
            <AvatarFallback className="bg-primary/10 text-lg font-semibold text-primary">{currentUser?.iniciales}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">{currentUser?.nombre}</p>
            <p className="text-sm text-muted-foreground">
              {roleLabels[currentUser?.role ?? "comprador"]}{activeCompany ? ` · ${activeCompany.nombre}` : ""}
            </p>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Nombre completo</Label>
            <Input value={nombre} onChange={(e) => setNombre(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Correo electrónico</Label>
            <Input value={currentUser?.email ?? ""} disabled />
          </div>
          <div className="space-y-1.5">
            <Label>Cargo</Label>
            <Input value={cargo} onChange={(e) => setCargo(e.target.value)} placeholder="Ej: Jefe de compras" />
          </div>
        </div>
        <Button className="mt-4" onClick={guardarPerfil} disabled={guardando}>{guardando ? "Guardando..." : "Guardar cambios"}</Button>
      </Card>

      <Card className="p-5">
        <h2 className="mb-3 flex items-center gap-2 font-semibold"><KeyRound className="h-4 w-4" /> Cambiar contraseña</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Contraseña actual</Label>
            <Input type="password" value={actual} onChange={(e) => setActual(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Nueva contraseña</Label>
            <Input type="password" value={nueva} onChange={(e) => setNueva(e.target.value)} />
          </div>
        </div>
        <Button className="mt-4" variant="outline" onClick={cambiarPassword} disabled={!actual || !nueva || cambiando}>Actualizar contraseña</Button>
      </Card>

      <TwoFactorSettingsCard />

      <CorreosCard />

      {portal === "cliente" && (currentUser?.role === "admin_cliente" || currentUser?.role === "aprobador_cfo") && (
        <>
          <PlanUsoCard />
          <AuditoriaCard puedeConfigurar={currentUser.role === "admin_cliente"} />
        </>
      )}

      <Card className="flex items-center justify-between p-5">
        <div>
          <h2 className="flex items-center gap-2 font-semibold"><Bell className="h-4 w-4" /> Preferencias de notificación</h2>
          <p className="text-sm text-muted-foreground">Elige qué alertas quieres recibir y por qué canal</p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link to={`/${portal}/notificaciones`}>Configurar <ArrowRight className="ml-1.5 h-3.5 w-3.5" /></Link>
        </Button>
      </Card>
    </div>
  );
}
