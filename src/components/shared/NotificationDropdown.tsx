import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Bell, CheckCheck, FileText, Handshake, FileCheck, ShieldCheck, Building2, Scale } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { useNotifications, type Notificacion } from "@/lib/api/notificaciones";
import { cn } from "@/lib/utils";

const iconByType: Record<Notificacion["tipo"], typeof Bell> = {
  aprobacion: ShieldCheck,
  oferta: FileText,
  contrato: FileCheck,
  negociacion: Handshake,
  proveedor: Building2,
  disputa: Scale,
};

export function NotificationDropdown({ portal }: { portal: "cliente" | "proveedor" | "interno" }) {
  const navigate = useNavigate();
  const { notifications, markAsRead, markAllAsRead } = useNotifications();
  const unread = notifications.filter((n) => !n.leida).length;
  const [open, setOpen] = useState(false);

  function handleClick(n: Notificacion) {
    markAsRead(n.id);
    setOpen(false);
    if (n.link) navigate(n.link);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative text-muted-foreground">
          <Bell className="h-4 w-4" />
          {unread > 0 && (
            <Badge className="absolute -right-0.5 -top-0.5 h-4 min-w-4 justify-center bg-destructive px-1 text-[10px]">{unread}</Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <p className="text-sm font-semibold">Notificaciones</p>
          {unread > 0 && (
            <button onClick={() => markAllAsRead()} className="flex items-center gap-1 text-xs text-primary hover:underline">
              <CheckCheck className="h-3 w-3" /> Marcar todas
            </button>
          )}
        </div>
        <div className="max-h-80 overflow-y-auto">
          {notifications.slice(0, 6).map((n) => {
            const Icon = iconByType[n.tipo];
            return (
              <button
                key={n.id}
                onClick={() => handleClick(n)}
                className={cn("flex w-full items-start gap-3 border-b px-4 py-3 text-left last:border-b-0 hover:bg-muted/50", !n.leida && "bg-primary/5", n.link && "cursor-pointer")}
              >
                <div className={cn("mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full", n.leida ? "bg-muted text-muted-foreground" : "bg-primary/15 text-primary")}>
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className={cn("truncate text-sm", !n.leida && "font-medium")}>{n.titulo}</p>
                  <p className="truncate text-xs text-muted-foreground">{n.desc}</p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground/70">{n.tiempo}</p>
                </div>
                {!n.leida && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />}
              </button>
            );
          })}
        </div>
        <div className="border-t p-2">
          <Button asChild variant="ghost" size="sm" className="w-full">
            <Link to={`/${portal}/notificaciones`} onClick={() => setOpen(false)}>Ver todas</Link>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
