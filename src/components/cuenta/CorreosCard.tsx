import { toast } from "sonner";
import { Mail } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useApiData } from "@/hooks/useApiData";
import { apiErrorMessage } from "@/lib/api/http";
import { fetchPreferenciasCorreo, guardarPreferenciasCorreo } from "@/lib/api/notificaciones";

/** Opt in/out of receiving every in-app notification by email too. */
export function CorreosCard() {
  const { data, reload } = useApiData(fetchPreferenciasCorreo);

  async function cambiar(v: boolean) {
    try {
      await guardarPreferenciasCorreo(v);
      toast.success(v ? "Recibirás las notificaciones por correo" : "Ya no recibirás notificaciones por correo");
      reload();
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  }

  return (
    <Card className="flex-row items-center justify-between gap-4 p-5">
      <div>
        <h2 className="flex items-center gap-2 font-semibold"><Mail className="h-4 w-4" /> Notificaciones por correo</h2>
        <p className="text-sm text-muted-foreground">
          Invitaciones, aprobaciones, adjudicaciones y pagos también llegan a tu correo, con el enlace directo para actuar.
        </p>
        {data && !data.correoHabilitado && (
          <p className="mt-1 text-xs text-warning-foreground">El envío de correos aún no está activado en esta plataforma.</p>
        )}
      </div>
      <Switch checked={data?.recibirCorreos ?? true} onCheckedChange={cambiar} disabled={!data} aria-label="Recibir notificaciones por correo" />
    </Card>
  );
}
