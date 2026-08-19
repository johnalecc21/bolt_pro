import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Check, ShieldCheck, X } from "lucide-react";
import { ROLE_LABELS, type RoleCode } from "@/lib/api/matrizAprobacion";
import type { AprobacionRequerimiento, RequerimientoDetalle } from "@/lib/api/requerimientos";

function etiquetaRoles(roles: string[]) {
  return roles.map((r) => ROLE_LABELS[r as RoleCode] ?? r).join(" o ");
}

interface AprobacionCardProps {
  req: RequerimientoDetalle;
  aprobacionPendiente: AprobacionRequerimiento | undefined;
  puedeResolver: boolean;
  resolviendo: boolean;
  todosLosPasos: (AprobacionRequerimiento["pasos"][number] & { aprobacionId: string })[];
  onAprobar: (aprobacionId: string) => void;
  onRechazar: (aprobacionId: string, motivo?: string) => void;
}

export function AprobacionCard({ req, aprobacionPendiente, puedeResolver, resolviendo, todosLosPasos, onAprobar, onRechazar }: AprobacionCardProps) {
  const rechazadas = req.aprobaciones.filter((a) => a.estado === "RECHAZADA");
  if (!aprobacionPendiente && todosLosPasos.length === 0 && rechazadas.length === 0) return null;

  return (
    <Card className="p-5">
      <h3 className="mb-3 flex items-center gap-2 font-semibold text-sm"><ShieldCheck className="h-4 w-4" /> Aprobación</h3>

      {aprobacionPendiente && (
        <div className="mb-3 space-y-2">
          <p className="text-sm text-muted-foreground">
            {aprobacionPendiente.tipoRegla === "SECUENCIAL" && aprobacionPendiente.rolesRequeridos.length > 1
              ? `Paso ${aprobacionPendiente.pasoActual + 1} de ${aprobacionPendiente.rolesRequeridos.length} — requiere `
              : "Requiere aprobación de "}
            <strong>{ROLE_LABELS[aprobacionPendiente.rolesRequeridos[aprobacionPendiente.pasoActual] as RoleCode] ?? etiquetaRoles(aprobacionPendiente.rolesRequeridos)}</strong>.
          </p>
          {puedeResolver ? (
            <div className="flex gap-2">
              <ConfirmDialog
                trigger={<Button size="sm" className="gradient-success text-white"><Check className="h-4 w-4" /> Aprobar</Button>}
                title="Aprobar solicitud"
                description={`Vas a aprobar: "${req.titulo}". Esta acción queda registrada en el log de auditoría.`}
                confirmLabel="Aprobar"
                onConfirm={() => onAprobar(aprobacionPendiente.id)}
              />
              <ConfirmDialog
                trigger={<Button size="sm" variant="outline" className="border-destructive/30 text-destructive hover:bg-destructive/10"><X className="h-4 w-4" /> Rechazar</Button>}
                title="Rechazar solicitud"
                description="La justificación es obligatoria y será visible para el solicitante."
                confirmLabel="Confirmar rechazo"
                destructive
                requireReason
                onConfirm={(motivo) => onRechazar(aprobacionPendiente.id, motivo)}
              />
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">Tu rol actual no puede resolver este paso.</p>
          )}
          {resolviendo && <p className="text-xs text-muted-foreground">Procesando...</p>}
        </div>
      )}

      {rechazadas.map((a) => (
        <div key={a.id} className="mb-3 rounded-lg bg-destructive/10 p-2 text-xs text-destructive">
          Rechazado por {a.resueltoPor?.nombre ?? "—"}: {a.motivoRechazo}
        </div>
      ))}

      {todosLosPasos.length > 0 && (
        <div className="space-y-1.5 border-t border-border pt-3 text-xs">
          {todosLosPasos.map((p, i) => (
            <div key={i} className="flex items-center justify-between text-muted-foreground">
              <span>{ROLE_LABELS[p.rol as RoleCode] ?? p.rol}: <span className="font-medium text-foreground">{p.aprobadoPor.nombre}</span></span>
              <span>{new Date(p.aprobadoAt).toLocaleDateString()}</span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
