import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { AuditLogTable } from "@/components/shared/AuditLogTable";
import { LogIn, Building2 } from "lucide-react";
import { fetchClientes, impersonarCliente, type ClienteAdmin } from "@/lib/api/interno";
import { apiErrorMessage } from "@/lib/api/http";
import { TableSkeleton } from "@/components/shared/TableSkeleton";
import { useApiData } from "@/hooks/useApiData";
import { cn } from "@/lib/utils";

const facturacionColor: Record<string, string> = {
  "Al día": "text-success",
  Pendiente: "text-warning-foreground",
  Vencida: "text-destructive",
};

export function AdminClientes() {
  const { data, loading } = useApiData(fetchClientes);
  const clientesPlanes = data ?? [];

  async function impersonar(c: ClienteAdmin, motivo?: string) {
    try {
      await impersonarCliente(c.id, motivo ?? "");
      toast.success(`Sesión iniciada como ${c.nombre}`, { description: "Esta acción quedó registrada en el log de auditoría." });
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
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
                  <td className="p-4 text-sm text-muted-foreground">{c.contactoPrincipal}</td>
                  <td className="p-4 text-right">
                    <ConfirmDialog
                      trigger={<Button size="sm" variant="outline" className="gap-1.5"><LogIn className="h-3.5 w-3.5" /> Entrar como</Button>}
                      title={`Entrar como ${c.nombre}`}
                      description="Esta acción de impersonación queda registrada con tu usuario, fecha y motivo en el log de auditoría."
                      requireReason
                      reasonLabel="Motivo del soporte"
                      confirmLabel="Entrar"
                      onConfirm={(motivo) => impersonar(c, motivo)}
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
