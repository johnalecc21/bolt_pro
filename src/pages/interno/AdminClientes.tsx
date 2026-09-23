import { useState } from "react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { AuditLogTable } from "@/components/shared/AuditLogTable";
import { LogIn, Building2, Plus, Loader2, Download } from "lucide-react";
import { fetchClientes, impersonarCliente, crearCliente, type ClienteAdmin } from "@/lib/api/interno";
import { apiErrorMessage } from "@/lib/api/http";
import { TableSkeleton } from "@/components/shared/TableSkeleton";
import { useApiData } from "@/hooks/useApiData";
import { cn } from "@/lib/utils";

import { exportarAuditoriaCsv } from "@/lib/api/auditLog";
const facturacionColor: Record<string, string> = {
  "Al día": "text-success",
  Pendiente: "text-warning-foreground",
  Vencida: "text-destructive",
};

export function AdminClientes() {
  const { data, loading, reload } = useApiData(fetchClientes);
  const clientesPlanes = data ?? [];
  const [nuevoOpen, setNuevoOpen] = useState(false);
  const [creando, setCreando] = useState(false);
  const [nuevo, setNuevo] = useState({ nombreEmpresa: "", adminNombre: "", adminEmail: "" });

  async function impersonar(c: ClienteAdmin, motivo?: string) {
    try {
      await impersonarCliente(c.id, motivo ?? "");
      toast.success(`Sesión iniciada como ${c.nombre}`, { description: "Esta acción quedó registrada en el log de auditoría." });
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  }

  async function confirmarNuevo() {
    if (!nuevo.nombreEmpresa.trim() || !nuevo.adminNombre.trim() || !nuevo.adminEmail.trim()) return;
    setCreando(true);
    try {
      const creado = await crearCliente(nuevo);
      toast.success(`Empresa "${creado.nombre}" creada`, { description: `Invitación enviada a ${nuevo.adminEmail}` });
      setNuevoOpen(false);
      setNuevo({ nombreEmpresa: "", adminNombre: "", adminEmail: "" });
      reload();
    } catch (err) {
      toast.error(apiErrorMessage(err, "No se pudo crear la empresa."));
    } finally {
      setCreando(false);
    }
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Administración de Clientes</h1>
          <p className="text-sm text-muted-foreground">Gestión comercial y de cuentas de la plataforma</p>
        </div>
        <Button onClick={() => setNuevoOpen(true)}><Plus className="mr-2 h-4 w-4" /> Nueva empresa</Button>
      </div>

      <Dialog open={nuevoOpen} onOpenChange={setNuevoOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nueva empresa cliente</DialogTitle>
            <DialogDescription>
              Se crea la empresa y se invita por correo a su primer administrador — el enlace de invitación le permite elegir su contraseña.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="nombreEmpresa">Nombre de la empresa</Label>
              <Input id="nombreEmpresa" value={nuevo.nombreEmpresa} onChange={(e) => setNuevo((p) => ({ ...p, nombreEmpresa: e.target.value }))} placeholder="Acme S.A." />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="adminNombre">Nombre del administrador</Label>
              <Input id="adminNombre" value={nuevo.adminNombre} onChange={(e) => setNuevo((p) => ({ ...p, adminNombre: e.target.value }))} placeholder="Carlos Méndez" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="adminEmail">Correo del administrador</Label>
              <Input id="adminEmail" type="email" value={nuevo.adminEmail} onChange={(e) => setNuevo((p) => ({ ...p, adminEmail: e.target.value }))} placeholder="carlos@acme.com" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setNuevoOpen(false)} disabled={creando}>Cancelar</Button>
            <Button
              disabled={creando || !nuevo.nombreEmpresa.trim() || !nuevo.adminNombre.trim() || !nuevo.adminEmail.trim()}
              onClick={confirmarNuevo}
            >
              {creando ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creando...</> : "Crear e invitar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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

      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-semibold">Log de impersonación y acciones sensibles</h2>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => exportarAuditoriaCsv().catch((err) => toast.error(apiErrorMessage(err, "No se pudo exportar la auditoría.")))}
          >
            <Download className="h-4 w-4" /> Exportar CSV (todas las empresas)
          </Button>
        </div>
        <AuditLogTable />
      </div>
    </div>
  );
}
