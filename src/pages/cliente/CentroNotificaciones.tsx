import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { EmptyState } from "@/components/shared/EmptyState";
import { Bell, CheckCheck, FileText, Handshake, FileCheck, ShieldCheck, Building2, Scale, Mail, MessageCircle } from "lucide-react";
import { useNotifications, type Notificacion } from "@/lib/api/notificaciones";
import { notificationTypes } from "@/lib/mock/notificationPrefs";
import { cn } from "@/lib/utils";

const iconByType: Record<Notificacion["tipo"], typeof Bell> = {
  aprobacion: ShieldCheck,
  oferta: FileText,
  contrato: FileCheck,
  negociacion: Handshake,
  proveedor: Building2,
  disputa: Scale,
};

export function CentroNotificaciones() {
  const navigate = useNavigate();
  const { notifications: notificaciones, markAsRead, markAllAsRead } = useNotifications();
  const unread = notificaciones.filter((n) => !n.leida).length;

  function handleClick(n: Notificacion) {
    markAsRead(n.id);
    if (n.link) navigate(n.link);
  }
  const [prefs, setPrefs] = useState<Record<string, { email: boolean; whatsapp: boolean }>>(
    Object.fromEntries(notificationTypes.map((t) => [t.key, { email: true, whatsapp: t.key === "aprobacion" }]))
  );

  function toggleCanal(tipoLabel: string, canal: "email" | "whatsapp", key: string, value: boolean) {
    setPrefs((p) => ({ ...p, [key]: { ...p[key], [canal]: value } }));
    toast.success(value ? "Canal activado" : "Canal desactivado", {
      description: `${tipoLabel} · ${canal === "email" ? "Email" : "WhatsApp"}`,
    });
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Centro de Notificaciones</h1>
          <p className="text-sm text-muted-foreground">{unread} sin leer</p>
        </div>
        {unread > 0 && (
          <Button variant="outline" onClick={() => markAllAsRead()} className="gap-2">
            <CheckCheck className="h-4 w-4" /> Marcar todas como leídas
          </Button>
        )}
      </div>

      <Card className="overflow-hidden">
        {notificaciones.length === 0 ? (
          <EmptyState icon={Bell} title="No tienes notificaciones" />
        ) : (
          <div className="divide-y divide-border">
            {notificaciones.map((n) => {
              const Icon = iconByType[n.tipo];
              return (
                <button
                  key={n.id}
                  onClick={() => handleClick(n)}
                  className={cn("flex w-full items-start gap-3 p-4 text-left hover:bg-muted/30", !n.leida && "bg-primary/5", n.link && "cursor-pointer")}
                >
                  <div className={cn("mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full", n.leida ? "bg-muted text-muted-foreground" : "bg-primary/15 text-primary")}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={cn("text-sm", !n.leida && "font-medium")}>{n.titulo}</p>
                    <p className="text-sm text-muted-foreground">{n.desc}</p>
                    <p className="mt-1 text-xs text-muted-foreground/70">{n.tiempo}</p>
                  </div>
                  {!n.leida && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />}
                </button>
              );
            })}
          </div>
        )}
      </Card>

      <Card className="p-5">
        <h2 className="mb-1 font-semibold">Preferencias de notificación</h2>
        <p className="mb-4 text-sm text-muted-foreground">Elige por cuál canal quieres recibir cada tipo de alerta, además de la plataforma.</p>
        <div className="space-y-3">
          {notificationTypes.map((t) => (
            <div key={t.key} className="flex items-center justify-between rounded-lg border border-border p-3">
              <span className="text-sm font-medium">{t.label}</span>
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Mail className="h-3.5 w-3.5" /> Email
                  <Switch checked={prefs[t.key]?.email} onCheckedChange={(v) => toggleCanal(t.label, "email", t.key, v)} />
                </label>
                <label className="flex items-center gap-2 text-xs text-muted-foreground">
                  <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
                  <Switch checked={prefs[t.key]?.whatsapp} onCheckedChange={(v) => toggleCanal(t.label, "whatsapp", t.key, v)} />
                </label>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
