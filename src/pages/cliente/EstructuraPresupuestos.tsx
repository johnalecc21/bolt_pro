import { useState } from "react";
import { toast } from "sonner";
import { Building, Landmark, Pencil, Plus, Wallet } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { EmptyState } from "@/components/shared/EmptyState";
import { TableSkeleton } from "@/components/shared/TableSkeleton";
import { CentroCostoDialog } from "@/components/estructura/CentroCostoDialog";
import { UnidadDialog } from "@/components/estructura/UnidadDialog";
import { PresupuestoDialog } from "@/components/estructura/PresupuestoDialog";
import { useApiData } from "@/hooks/useApiData";
import { useAuth } from "@/lib/auth/AuthContext";
import { apiErrorMessage } from "@/lib/api/http";
import {
  fetchEjecucion,
  fetchEstructura,
  guardarConfigEstructura,
  type CentroCosto,
  type UnidadNegocio,
} from "@/lib/api/estructura";
import { formatMoney } from "@/lib/moneda";
import { cn } from "@/lib/utils";

const ANIO_ACTUAL = new Date().getFullYear();
const ANIOS = [ANIO_ACTUAL - 1, ANIO_ACTUAL, ANIO_ACTUAL + 1];

/** Sedes / unidades de negocio, centros de costo, annual budgets and their execution. */
export function EstructuraPresupuestos() {
  const { currentUser } = useAuth();
  const esAdmin = currentUser?.role === "admin_cliente";
  const [anio, setAnio] = useState(ANIO_ACTUAL);
  const { data: estructura, loading, reload } = useApiData(() => fetchEstructura(anio), [anio]);
  const { data: ejecucion, reload: reloadEjecucion } = useApiData(() => fetchEjecucion(anio), [anio]);
  const [centroEditando, setCentroEditando] = useState<CentroCosto | null | undefined>(undefined);
  const [unidadEditando, setUnidadEditando] = useState<UnidadNegocio | null | undefined>(undefined);
  const [presupuestoDe, setPresupuestoDe] = useState<CentroCosto | null>(null);

  function recargar() {
    reload();
    reloadEjecucion();
  }

  async function cambiarExige(v: boolean) {
    try {
      await guardarConfigEstructura(v);
      toast.success(v ? "El centro de costo ahora es obligatorio" : "El centro de costo ahora es opcional");
      reload();
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  }

  const filas = ejecucion?.centros ?? [];
  const conPresupuesto = filas.filter((f) => f.ejecucion);

  return (
    <div className="max-w-6xl space-y-6 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Estructura y presupuestos</h1>
          <p className="text-sm text-muted-foreground">Sedes, unidades de negocio y centros de costo con su presupuesto anual.</p>
        </div>
        <NativeSelect aria-label="Año" value={anio} onChange={(e) => setAnio(Number(e.target.value))}>
          {ANIOS.map((a) => <NativeSelectOption key={a} value={a}>{a}</NativeSelectOption>)}
        </NativeSelect>
      </div>

      {esAdmin && estructura && (
        <Card className="flex-row items-center justify-between gap-4 p-4">
          <div>
            <p className="font-medium">Exigir centro de costo en cada requerimiento</p>
            <p className="text-sm text-muted-foreground">Así todo gasto queda asignado a un presupuesto. Los que superen lo disponible se aprueban como excepción, con el CFO.</p>
          </div>
          <Switch checked={estructura.exigeCentroCosto} onCheckedChange={cambiarExige} aria-label="Exigir centro de costo" />
        </Card>
      )}

      <Tabs defaultValue="ejecucion">
        <TabsList>
          <TabsTrigger value="ejecucion"><Wallet className="mr-1.5 h-4 w-4" /> Ejecución</TabsTrigger>
          <TabsTrigger value="centros"><Landmark className="mr-1.5 h-4 w-4" /> Centros de costo</TabsTrigger>
          <TabsTrigger value="unidades"><Building className="mr-1.5 h-4 w-4" /> Sedes y unidades</TabsTrigger>
        </TabsList>

        <TabsContent value="ejecucion" className="mt-4">
          {!ejecucion ? <TableSkeleton /> : conPresupuesto.length === 0 ? (
            <EmptyState icon={Wallet} title={`Sin presupuestos para ${anio}`} description="Asigna un presupuesto anual a tus centros de costo en la pestaña Centros de costo." />
          ) : (
            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/50 text-left text-muted-foreground">
                      <th className="p-3 font-medium">Centro de costo</th>
                      <th className="p-3 text-right font-medium">Presupuesto</th>
                      <th className="p-3 text-right font-medium">Comprometido</th>
                      <th className="p-3 text-right font-medium">En proceso</th>
                      <th className="p-3 text-right font-medium">Disponible</th>
                      <th className="w-48 p-3 font-medium">Uso</th>
                    </tr>
                  </thead>
                  <tbody>
                    {conPresupuesto.map((f) => {
                      const e = f.ejecucion!;
                      const pctComprometido = e.presupuesto ? Math.min(100, (e.comprometido / e.presupuesto) * 100) : 0;
                      const pctProceso = e.presupuesto ? Math.min(100 - pctComprometido, (e.enProceso / e.presupuesto) * 100) : 0;
                      const excedido = e.disponible < 0;
                      return (
                        <tr key={f.centroCostoId} className="border-b border-border last:border-0">
                          <td className="p-3">
                            <p className="font-medium">{f.codigo} — {f.nombre}</p>
                            {f.unidad && <p className="text-xs text-muted-foreground">{f.unidad}</p>}
                          </td>
                          <td className="whitespace-nowrap p-3 text-right">{formatMoney(e.presupuesto, f.moneda!)}</td>
                          <td className="whitespace-nowrap p-3 text-right">{formatMoney(e.comprometido, f.moneda!)}</td>
                          <td className="whitespace-nowrap p-3 text-right text-muted-foreground">{formatMoney(e.enProceso, f.moneda!)}</td>
                          <td className={cn("whitespace-nowrap p-3 text-right font-semibold", excedido ? "text-destructive" : "text-success")}>{formatMoney(e.disponible, f.moneda!)}</td>
                          <td className="p-3">
                            <div className="flex h-2 overflow-hidden rounded-full bg-muted" role="img" aria-label={`${e.porcentajeUsado}% usado`}>
                              <div className={cn("h-full", excedido ? "bg-destructive" : "bg-primary")} style={{ width: `${pctComprometido}%` }} />
                              <div className="h-full bg-primary/35" style={{ width: `${pctProceso}%` }} />
                            </div>
                            <p className={cn("mt-1 text-xs", excedido ? "font-medium text-destructive" : "text-muted-foreground")}>
                              {e.porcentajeUsado}% {excedido && "· excedido"}
                            </p>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <p className="border-t border-border p-3 text-xs text-muted-foreground">
                Comprometido: contratos y POs firmados en {anio}. En proceso: requerimientos pendientes de aprobación, en licitación o en negociación. Solo cuentan montos en la moneda del presupuesto.
              </p>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="centros" className="mt-4 space-y-3">
          {esAdmin && (
            <div className="flex justify-end">
              <Button size="sm" className="gap-1.5" onClick={() => setCentroEditando(null)}><Plus className="h-4 w-4" /> Nuevo centro de costo</Button>
            </div>
          )}
          {loading && !estructura ? <TableSkeleton /> : (estructura?.centros ?? []).length === 0 ? (
            <EmptyState icon={Landmark} title="Aún no hay centros de costo" description="Crea centros de costo para asignar presupuesto y controlar el gasto por área." />
          ) : (
            <Card className="overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50 text-left text-muted-foreground">
                    <th className="p-3 font-medium">Código</th>
                    <th className="p-3 font-medium">Nombre</th>
                    <th className="p-3 font-medium">Sede / unidad</th>
                    <th className="p-3 font-medium">Presupuesto {anio}</th>
                    <th className="p-3" />
                  </tr>
                </thead>
                <tbody>
                  {estructura!.centros.map((c) => (
                    <tr key={c.id} className={cn("border-b border-border last:border-0", !c.activo && "text-muted-foreground")}>
                      <td className="p-3 font-mono text-xs">{c.codigo}</td>
                      <td className="p-3">
                        {c.nombre} {!c.activo && <Badge variant="secondary" className="ml-1 text-[10px]">Inactivo</Badge>}
                        {c.responsable && <p className="text-xs text-muted-foreground">{c.responsable}</p>}
                      </td>
                      <td className="p-3">{c.unidadNegocio?.nombre ?? "—"}</td>
                      <td className="p-3">{c.presupuesto ? formatMoney(c.presupuesto.monto, c.presupuesto.moneda) : <span className="text-muted-foreground">Sin presupuesto</span>}</td>
                      <td className="p-3 text-right">
                        <div className="flex justify-end gap-1">
                          <Button size="sm" variant="outline" onClick={() => setPresupuestoDe(c)}>Presupuesto</Button>
                          {esAdmin && <Button size="sm" variant="ghost" aria-label={`Editar ${c.nombre}`} onClick={() => setCentroEditando(c)}><Pencil className="h-4 w-4" /></Button>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="unidades" className="mt-4 space-y-3">
          {esAdmin && (
            <div className="flex justify-end">
              <Button size="sm" className="gap-1.5" onClick={() => setUnidadEditando(null)}><Plus className="h-4 w-4" /> Nueva sede o unidad</Button>
            </div>
          )}
          {(estructura?.unidades ?? []).length === 0 ? (
            <EmptyState icon={Building} title="Sin sedes ni unidades de negocio" description="Opcional: agrupa tus centros de costo por sede o línea de negocio." />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {estructura!.unidades.map((u) => {
                const centros = estructura!.centros.filter((c) => c.unidadNegocioId === u.id);
                return (
                  <Card key={u.id} className={cn("p-4", !u.activa && "opacity-60")}>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium">{u.nombre}</p>
                        <p className="text-xs text-muted-foreground">{u.codigo} · {u.tipo === "SEDE" ? "Sede" : "Unidad de negocio"}{u.ciudad ? ` · ${u.ciudad}` : ""}</p>
                      </div>
                      {esAdmin && <Button size="sm" variant="ghost" aria-label={`Editar ${u.nombre}`} onClick={() => setUnidadEditando(u)}><Pencil className="h-4 w-4" /></Button>}
                    </div>
                    <p className="mt-3 text-xs text-muted-foreground">{centros.length} centro(s) de costo</p>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <CentroCostoDialog
        open={centroEditando !== undefined}
        centro={centroEditando ?? null}
        unidades={estructura?.unidades ?? []}
        onClose={() => setCentroEditando(undefined)}
        onSaved={recargar}
      />
      <UnidadDialog open={unidadEditando !== undefined} unidad={unidadEditando ?? null} onClose={() => setUnidadEditando(undefined)} onSaved={recargar} />
      <PresupuestoDialog centro={presupuestoDe} anio={anio} onClose={() => setPresupuestoDe(null)} onSaved={recargar} />
    </div>
  );
}
