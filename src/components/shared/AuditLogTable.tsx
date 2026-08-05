import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/EmptyState";
import { useAuditLog } from "@/lib/mock/auditLog";
import { History } from "lucide-react";

export function AuditLogTable({ limit }: { limit?: number }) {
  const entries = useAuditLog();
  const shown = limit ? entries.slice(0, limit) : entries;

  if (shown.length === 0) {
    return <EmptyState icon={History} title="Sin actividad registrada" description="Las acciones sensibles (aprobaciones, rechazos, cambios de score) aparecerán aquí." />;
  }

  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/50 text-left text-sm text-muted-foreground">
              <th className="p-3 font-medium">Fecha</th>
              <th className="p-3 font-medium">Usuario</th>
              <th className="p-3 font-medium">Acción</th>
              <th className="p-3 font-medium">Detalle</th>
            </tr>
          </thead>
          <tbody>
            {shown.map((e) => (
              <tr key={e.id} className="border-b border-border text-sm last:border-0">
                <td className="p-3 whitespace-nowrap text-muted-foreground">{e.fecha}</td>
                <td className="p-3 font-medium">{e.usuario}</td>
                <td className="p-3">{e.accion}</td>
                <td className="p-3 text-muted-foreground">
                  {e.detalle}
                  {e.motivo && <span className="block text-xs italic">Motivo: {e.motivo}</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
