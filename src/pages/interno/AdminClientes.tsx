import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { AuditLogTable } from "@/components/shared/AuditLogTable";
import { LogIn, Building2 } from "lucide-react";
import { clientesPlanes } from "@/lib/mock/clientesPlanes";
import { logAudit } from "@/lib/mock/auditLog";
import { useAuth } from "@/lib/auth/AuthContext";
import { useMockLoading } from "@/hooks/useMockLoading";
import { TableSkeleton } from "@/components/shared/TableSkeleton";
import { cn } from "@/lib/utils";

const facturacionColor: Record<string, string> = {
  "Al día": "text-success",
  Pendiente: "text-warning-foreground",
  Vencida: "text-destructive",
};

export function AdminClientes() {
  const { currentUser } = useAuth();
  const loading = useMockLoading();

  function impersonar(clienteNombre: string, motivo?: string) {
    logAudit({ usuario: currentUser?.nombre ?? "—", accion: "Impersonación de cliente", detalle: `Entró como ${clienteNombre} para dar soporte`, motivo });
    toast.success(`Sesión iniciada como ${clienteNombre}`, { description: "Esta acción quedó registrada en el log de auditoría." });
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">Administración de Clientes</h1>
        <p className="text-sm text-muted-foreground">Gestión comercial y de cuentas de la plataforma</p>
      </div>

      {loading ? <TableSkeleton /> :
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50 text-left text-sm text-muted-foreground">
                <th className="p-4 font-medium">Cliente</th>
                <th className="p-4 font-medium">Plan</th>
                <th className="p-4 font-medium">Facturación</th>
                <th className="p-4 font-medium">Procesos activos</th>
                <th className="p-4 font-medium">Adopción</th>
                <th className="p-4 font-medium">Contacto</th>
                <th className="p-4 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {clientesPlanes.map((c) => (
                <tr key={c.id} className="border-b border-border last:border-0">
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary"><Building2 className="h-4 w-4" /></div>
                      <span className="text-sm font-medium">{c.nombre}</span>
                    </div>
                  </td>
                  <td className="p-4"><Badge variant="secondary">{c.plan}</Badge></td>
                  <td className="p-4"><span className={cn("text-sm font-medium", facturacionColor[c.facturacion])}>{c.facturacion}</span></td>
                  <td className="p-4 text-sm">{c.procesosActivos}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
                        <div className="h-full gradient-brand rounded-full" style={{ width: `${c.adopcion}%` }} />
                      </div>
                      <span className="text-xs text-muted-foreground">{c.adopcion}%</span>
                    </div>
                  </td>
                  <td className="p-4 text-sm text-muted-foreground">{c.contactoPrincipal}</td>
                  <td className="p-4 text-right">
                    <ConfirmDialog
                      trigger={<Button size="sm" variant="outline" className="gap-1.5"><LogIn className="h-3.5 w-3.5" /> Entrar como</Button>}
                      title={`Entrar como ${c.nombre}`}
                      description="Esta acción de impersonación queda registrada con tu usuario, fecha y motivo en el log de auditoría."
                      requireReason
                      reasonLabel="Motivo del soporte"
                      confirmLabel="Entrar"
                      onConfirm={(motivo) => impersonar(c.nombre, motivo)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>}

      <div>
        <h2 className="mb-3 font-semibold">Log de impersonación y acciones sensibles</h2>
        <AuditLogTable />
      </div>
    </div>
  );
}
