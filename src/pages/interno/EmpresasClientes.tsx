import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { EmptyState } from "@/components/shared/EmptyState";
import { TableSkeleton } from "@/components/shared/TableSkeleton";
import { Building2, ChevronRight, Loader2, Plus, Search } from "lucide-react";
import { useAuth } from "@/lib/auth/AuthContext";
import { useApiData } from "@/hooks/useApiData";
import { apiErrorMessage } from "@/lib/api/http";
import { fechaLocal } from "@/lib/fecha";
import { cn } from "@/lib/utils";
import { crearCliente, fetchEmpresas, FACTURACION_LABEL, PLAN_LABEL, type Facturacion } from "@/lib/api/interno";

const FACTURACION_COLOR: Record<Facturacion, string> = {
  AL_DIA: "text-success",
  PENDIENTE: "text-warning-foreground",
  VENCIDA: "text-destructive",
};

/** "hace 3 d" style, for last access. */
export function haceCuanto(iso: string | null) {
  if (!iso) return "Nunca";
  const dias = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (dias <= 0) return "Hoy";
  if (dias === 1) return "Ayer";
  if (dias < 30) return `Hace ${dias} d`;
  const meses = Math.floor(dias / 30);
  return `Hace ${meses} mes${meses > 1 ? "es" : ""}`;
}

/**
 * Procurex's client companies as accounts: setup progress, adoption and
 * activity. The internal team follows how each one is doing and adds new
 * ones; it never enters their purchase processes.
 */
export function EmpresasClientes() {
  const { currentUser } = useAuth();
  const puedeCrear = currentUser?.role === "compliance_ops";
  const { data, loading, reload } = useApiData(fetchEmpresas);
  const [q, setQ] = useState("");
  const [nuevoOpen, setNuevoOpen] = useState(false);
  const [creando, setCreando] = useState(false);
  const [nuevo, setNuevo] = useState({ nombreEmpresa: "", adminNombre: "", adminEmail: "" });

  const empresas = useMemo(() => {
    const t = q.trim().toLowerCase();
    return (data ?? []).filter((e) => !t || e.nombre.toLowerCase().includes(t) || e.contactoPrincipal.toLowerCase().includes(t));
  }, [data, q]);

  const totales = useMemo(() => {
    const d = data ?? [];
    return {
      empresas: d.length,
      activas: d.filter((e) => e.ultimoAcceso && Date.now() - new Date(e.ultimoAcceso).getTime() < 30 * 86_400_000).length,
      sinConfigurar: d.filter((e) => e.configuracion.hechos < e.configuracion.total).length,
      procesos: d.reduce((s, e) => s + e.procesosEnCurso, 0),
    };
  }, [data]);

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
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Empresas</h1>
          <p className="text-sm text-muted-foreground">Cómo va cada empresa cliente: configuración, uso de la plataforma y actividad. Los procesos de compra son de cada empresa y no se ven aquí.</p>
        </div>
        {puedeCrear && (
          <Button onClick={() => setNuevoOpen(true)} className="gap-1.5"><Plus className="h-4 w-4" aria-hidden="true" /> Nueva empresa</Button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {([
          ["Empresas", totales.empresas],
          ["Activas en 30 días", totales.activas],
          ["Con configuración pendiente", totales.sinConfigurar],
          ["Procesos en curso", totales.procesos],
        ] as const).map(([label, n]) => (
          <Card key={label} className="p-4">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="mt-1 text-2xl font-bold tabular-nums">{loading ? "—" : n}</p>
          </Card>
        ))}
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar empresa o contacto" className="pl-9" aria-label="Buscar empresa" />
      </div>

      {loading ? (
        <TableSkeleton />
      ) : empresas.length === 0 ? (
        <EmptyState icon={Building2} title={q ? "Sin resultados" : "Aún no hay empresas"} description={q ? "Prueba con otro nombre." : puedeCrear ? "Crea la primera con «Nueva empresa»." : undefined} />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50 text-left text-xs text-muted-foreground">
                  <th className="p-3 font-medium">Empresa</th>
                  <th className="p-3 font-medium">Plan</th>
                  <th className="p-3 font-medium">Facturación</th>
                  <th className="p-3 font-medium">Configuración</th>
                  <th className="p-3 text-right font-medium">Usuarios</th>
                  <th className="p-3 text-right font-medium">Procesos en curso</th>
                  <th className="p-3 text-right font-medium">Contratos vigentes</th>
                  <th className="p-3 font-medium">Último acceso</th>
                  <th className="p-3" />
                </tr>
              </thead>
              <tbody>
                {empresas.map((e) => {
                  const completa = e.configuracion.hechos === e.configuracion.total;
                  return (
                    <tr key={e.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                      <td className="p-3">
                        <Link to={`/interno/empresas/${e.id}`} className="font-medium hover:text-primary hover:underline">{e.nombre}</Link>
                        <p className="text-xs text-muted-foreground">{e.contactoPrincipal}{e.correoContacto ? ` · ${e.correoContacto}` : ""} · desde {fechaLocal(e.creada)}</p>
                      </td>
                      <td className="p-3"><Badge variant="secondary">{PLAN_LABEL[e.plan]}</Badge></td>
                      <td className={cn("p-3 font-medium", FACTURACION_COLOR[e.facturacion])}>{FACTURACION_LABEL[e.facturacion]}</td>
                      <td className="p-3">
                        <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", completa ? "bg-success/15 text-success" : "bg-warning/15 text-warning-foreground")}>
                          {completa ? "Completa" : `${e.configuracion.hechos} de ${e.configuracion.total}`}
                        </span>
                      </td>
                      <td className="p-3 text-right tabular-nums">{e.usuariosActivos}</td>
                      <td className="p-3 text-right tabular-nums">{e.procesosEnCurso}</td>
                      <td className="p-3 text-right tabular-nums">{e.contratosVigentes}</td>
                      <td className="p-3 text-muted-foreground">{haceCuanto(e.ultimoAcceso)}</td>
                      <td className="p-3 text-right">
                        <Button asChild size="sm" variant="ghost" aria-label={`Ver ${e.nombre}`}>
                          <Link to={`/interno/empresas/${e.id}`}><ChevronRight className="h-4 w-4" /></Link>
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Dialog open={nuevoOpen} onOpenChange={setNuevoOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nueva empresa cliente</DialogTitle>
            <DialogDescription>
              Se crea la empresa y se invita por correo a su primer administrador. Con el enlace elige su contraseña y configura su empresa.
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
            <Button disabled={creando || !nuevo.nombreEmpresa.trim() || !nuevo.adminNombre.trim() || !nuevo.adminEmail.trim()} onClick={confirmarNuevo}>
              {creando ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creando…</> : "Crear e invitar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
