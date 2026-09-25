import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { EmptyState } from "@/components/shared/EmptyState";
import { CheckCircle2, Circle, Clock, AlertTriangle, Truck, MessageSquareText, Plus, X, DollarSign, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { CardGridSkeleton } from "@/components/shared/TableSkeleton";
import { useApiData } from "@/hooks/useApiData";
import {
  fetchSeguimiento,
  crearHito as apiCrearHito,
  actualizarEstadoHito,
  actualizarPorcentajeHito,
  eliminarHito as apiEliminarHito,
  type EstadoHito,
  type Hito,
  type SeguimientoContrato,
} from "@/lib/api/seguimiento";
import { apiErrorMessage } from "@/lib/api/http";
import { formatMoney } from "@/lib/moneda";
import { fechaLocal } from "@/lib/fecha";
import { EvaluarDesempenoDialog } from "@/components/cliente/EvaluarDesempenoDialog";
import { diasDeAtraso, ESTADO_GENERAL, estadoGeneral, type EstadoGeneral } from "@/lib/contratos/hitos";
import { useIncrustado } from "@/components/layout/Incrustado";

const HITO: Record<EstadoHito, { label: string; icon: typeof Circle; clase: string }> = {
  completado: { label: "Recibido", icon: CheckCircle2, clase: "bg-success/15 text-success" },
  en_riesgo: { label: "En riesgo", icon: Clock, clase: "bg-warning/15 text-warning-foreground" },
  atrasado: { label: "Atrasado", icon: AlertTriangle, clase: "bg-destructive/15 text-destructive" },
  pendiente: { label: "Pendiente", icon: Circle, clase: "bg-muted text-muted-foreground" },
};

const GENERAL: Record<EstadoGeneral, string> = {
  sin_hitos: "bg-muted text-muted-foreground",
  en_curso: "bg-info/15 text-info",
  en_riesgo: "bg-warning/15 text-warning-foreground",
  atrasado: "bg-destructive/15 text-destructive",
  completado: "bg-success/15 text-success",
};

type Filtro = "ejecucion" | "atrasos" | "todos";

/** Contracts with deliveries still to receive (terminated ones are closed). */
const enEjecucion = (c: SeguimientoContrato) =>
  c.estado !== "TERMINADO" && !c.esMarco && (c.hitos.length === 0 || c.hitos.some((h) => h.estado !== "completado"));

export function Seguimiento() {
  const [params, setParams] = useSearchParams();
  const soloContrato = params.get("contrato");
  const { data: seguimiento, loading, reload } = useApiData(fetchSeguimiento);
  const [filtro, setFiltro] = useState<Filtro>("ejecucion");
  const incrustado = useIncrustado();

  const todos = seguimiento ?? [];
  const visibles = soloContrato
    ? todos.filter((c) => c.id === soloContrato)
    : todos.filter((c) =>
        filtro === "todos" ? true : filtro === "atrasos" ? c.hitos.some((h) => h.estado === "atrasado") : enEjecucion(c),
      );

  return (
    <div className={incrustado ? "space-y-6" : "space-y-6 p-6"}>
      {!incrustado && (
        <div>
          <h1 className="text-2xl font-bold">Seguimiento de entregas</h1>
          <p className="text-sm text-muted-foreground">
            Los hitos se marcan solos como <em>en riesgo</em> 3 días antes y <em>atrasados</em> al pasar su fecha. Recibir un hito con % libera su pago.
          </p>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        {soloContrato ? (
          <Button variant="outline" size="sm" onClick={() => setParams((p) => { const n = new URLSearchParams(p); n.delete("contrato"); return n; }, { replace: true })}>Ver todos los contratos</Button>
        ) : (
          <ToggleGroup type="single" variant="outline" value={filtro} onValueChange={(v) => v && setFiltro(v as Filtro)}>
            <ToggleGroupItem value="ejecucion" className="px-3 text-sm">En ejecución</ToggleGroupItem>
            <ToggleGroupItem value="atrasos" className="px-3 text-sm">Con atrasos</ToggleGroupItem>
            <ToggleGroupItem value="todos" className="px-3 text-sm">Todos</ToggleGroupItem>
          </ToggleGroup>
        )}
        <p className="text-xs text-muted-foreground">Los Contratos Marco se siguen por sus órdenes de compra.</p>
      </div>

      {loading ? (
        <CardGridSkeleton count={2} />
      ) : visibles.length === 0 ? (
        <EmptyState icon={Truck} title="Nada que seguir en esta vista" description={filtro === "atrasos" ? "No hay hitos atrasados." : "Cuando firmes un contrato o emitas una PO, sus entregas aparecen aquí."} />
      ) : (
        <div className="space-y-6">
          {visibles.map((s) => (
            <ContratoCard key={s.id} s={s} onCambio={reload} />
          ))}
        </div>
      )}
    </div>
  );
}

function ContratoCard({ s, onCambio }: { s: SeguimientoContrato; onCambio: () => void }) {
  const general = estadoGeneral(s.hitos);
  const terminado = s.estado === "TERMINADO";
  const [agregando, setAgregando] = useState(false);
  const [label, setLabel] = useState("");
  const [fecha, setFecha] = useState("");
  const [porcentaje, setPorcentaje] = useState("");
  const disponible = 100 - s.porcentajeAsignado;
  const pctNuevo = porcentaje.trim() ? Number(porcentaje) : 0;

  async function agregar() {
    try {
      await apiCrearHito(s.id, label.trim(), fecha, s.esMarco ? 0 : pctNuevo || undefined);
      toast.success("Hito agregado");
      setAgregando(false);
      setLabel("");
      setFecha("");
      setPorcentaje("");
      onCambio();
    } catch (err) {
      toast.error(apiErrorMessage(err, "No se pudo agregar el hito."));
    }
  }

  return (
    <Card className="p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Link to={`/cliente/contratos/${s.id}`} className="font-semibold text-primary hover:underline">{s.codigo}</Link>
            <Badge variant="secondary" className="text-xs">{s.categoria}</Badge>
            {terminado && <Badge variant="secondary" className="text-xs">Terminado</Badge>}
          </div>
          <p className="text-sm text-muted-foreground">{s.proveedor} · {formatMoney(s.monto, s.moneda)} · vence {s.vigenciaFin}</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className={cn("flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium", GENERAL[general])}>
            <Truck className="h-3.5 w-3.5" aria-hidden="true" /> {ESTADO_GENERAL[general]}
          </span>
          {!s.esMarco && s.hitos.length > 0 && (
            <span className={cn("text-xs", s.porcentajeAsignado === 100 ? "text-muted-foreground" : "font-medium text-warning-foreground")}>
              {s.porcentajeAsignado}% del valor en hitos{s.porcentajeAsignado < 100 && ` · faltan ${disponible}% por asignar`}
            </span>
          )}
        </div>
      </div>

      {s.hitos.length === 0 ? (
        <p className="text-sm text-muted-foreground">Sin hitos definidos. Agrega las entregas y qué % del valor paga cada una (deben sumar 100%).</p>
      ) : (
        <ol className="space-y-4">
          {s.hitos.map((h) => (
            <HitoItem key={h.id} h={h} s={s} bloqueado={terminado} onCambio={onCambio} />
          ))}
        </ol>
      )}

      {!terminado && (agregando ? (
        <div className="mt-4 flex flex-wrap items-end gap-2 rounded-lg border border-border p-3">
          <div className="min-w-[180px] flex-1 space-y-1">
            <label htmlFor={`lbl-${s.id}`} className="text-xs font-medium text-muted-foreground">Nombre del hito</label>
            <Input id={`lbl-${s.id}`} value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Ej. Entrega parcial" className="h-8 text-sm" />
          </div>
          <div className="space-y-1">
            <label htmlFor={`fec-${s.id}`} className="text-xs font-medium text-muted-foreground">Fecha comprometida</label>
            <Input id={`fec-${s.id}`} type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} className="h-8 text-sm" />
          </div>
          {!s.esMarco && (
            <div className="w-28 space-y-1">
              <label htmlFor={`pct-${s.id}`} className="text-xs font-medium text-muted-foreground">% de pago (máx. {disponible})</label>
              <Input id={`pct-${s.id}`} type="number" min={0} max={disponible} value={porcentaje} onChange={(e) => setPorcentaje(e.target.value)} placeholder="0" className="h-8 text-sm" aria-invalid={pctNuevo > disponible} />
            </div>
          )}
          <Button size="sm" className="h-8" disabled={!label.trim() || !fecha || pctNuevo > disponible || pctNuevo < 0} onClick={agregar}>Agregar</Button>
          <Button size="sm" variant="ghost" className="h-8" onClick={() => setAgregando(false)}>Cancelar</Button>
        </div>
      ) : (
        <Button variant="ghost" size="sm" className="mt-3 gap-1.5 text-xs" onClick={() => setAgregando(true)}>
          <Plus className="h-3.5 w-3.5" /> Agregar hito
        </Button>
      ))}

      <div className="mt-4 flex flex-wrap gap-2 border-t pt-4">
        <Button asChild variant="outline" size="sm"><Link to={`/cliente/contratos/${s.id}`}>Ver ficha del contrato</Link></Button>
        <EvaluarDesempenoDialog contratoId={s.id} codigo={s.codigo} proveedor={s.proveedor} />
      </div>
    </Card>
  );
}

function HitoItem({ h, s, bloqueado, onCambio }: { h: Hito; s: SeguimientoContrato; bloqueado: boolean; onCambio: () => void }) {
  const e = HITO[h.estado];
  const pagado = !!h.pagoGeneradoId;
  const monto = Math.round((s.monto * h.porcentaje) / 100);
  const atraso = diasDeAtraso(h);
  const maxPct = 100 - s.porcentajeAsignado + h.porcentaje;

  async function accion(fn: () => Promise<unknown>, ok?: string) {
    try {
      await fn();
      if (ok) toast.success(ok);
      onCambio();
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  }

  return (
    <li className="flex items-start gap-3">
      <span className={cn("mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full", e.clase)} aria-hidden="true">
        <e.icon className="h-3.5 w-3.5" />
      </span>
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-medium">{h.label}</p>
            <span className="text-xs text-muted-foreground">{e.label}{h.estado === "completado" && atraso > 0 ? ` con ${atraso} día(s) de atraso` : h.estado === "atrasado" ? ` hace ${atraso} día(s)` : ""}</span>
            {pagado ? (
              <Badge variant="secondary" className="gap-1 bg-success/15 text-xs text-success">
                <Lock className="h-3 w-3" aria-hidden="true" /> {h.porcentaje}% · pago liberado
              </Badge>
            ) : !s.esMarco && !bloqueado && h.estado !== "completado" ? (
              <span className="flex items-center gap-1">
                <Input
                  type="number"
                  min={0}
                  max={maxPct}
                  defaultValue={h.porcentaje}
                  onBlur={(ev) => {
                    const v = Number(ev.target.value);
                    if (!Number.isNaN(v) && v !== h.porcentaje) accion(() => actualizarPorcentajeHito(h.id, v));
                  }}
                  className="h-6 w-14 px-1.5 text-xs"
                  aria-label={`% de pago de ${h.label} (máx. ${maxPct})`}
                />
                <span className="text-xs text-muted-foreground">% {h.porcentaje > 0 && `· ${formatMoney(monto, s.moneda)}`}</span>
              </span>
            ) : h.porcentaje > 0 ? (
              <Badge variant="secondary" className="gap-1 text-xs"><DollarSign className="h-3 w-3" aria-hidden="true" /> {h.porcentaje}%</Badge>
            ) : null}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Comprometido {h.comprometido}{h.real && ` · recibido ${h.real}`}</span>
            {!bloqueado && h.estado !== "completado" && (
              <>
                <select
                  aria-label={`Estado de ${h.label}`}
                  className="h-7 rounded-md border border-input bg-white px-2 text-xs"
                  value={h.estado}
                  onChange={(ev) => accion(() => actualizarEstadoHito(h.id, ev.target.value as EstadoHito))}
                >
                  <option value="pendiente">Pendiente</option>
                  <option value="en_riesgo">En riesgo</option>
                  <option value="atrasado">Atrasado</option>
                </select>
                <ConfirmDialog
                  trigger={<Button size="sm" variant="outline" className="h-7 text-xs">Recibido</Button>}
                  title={`Recibir "${h.label}"`}
                  description={
                    h.porcentaje > 0
                      ? `Confirmas que recibiste esta entrega. Se libera un pago de ${formatMoney(monto, s.moneda)} (${h.porcentaje}%) a ${s.proveedor} y ya no se podrá reabrir, cambiar su % ni eliminar.`
                      : "Confirmas que recibiste esta entrega."
                  }
                  confirmLabel="Confirmar recepción"
                  onConfirm={() => accion(() => actualizarEstadoHito(h.id, "completado"), h.porcentaje > 0 ? "Entrega recibida y pago liberado" : "Entrega recibida")}
                />
              </>
            )}
            {!bloqueado && !pagado && (
              <ConfirmDialog
                trigger={
                  <button className="text-muted-foreground hover:text-destructive" aria-label={`Eliminar ${h.label}`}>
                    <X className="h-3.5 w-3.5" />
                  </button>
                }
                title="Eliminar hito"
                description={`Se elimina "${h.label}"${h.porcentaje > 0 ? ` y su ${h.porcentaje}% queda sin asignar` : ""}.`}
                confirmLabel="Eliminar"
                onConfirm={() => accion(() => apiEliminarHito(h.id), "Hito eliminado")}
              />
            )}
          </div>
        </div>
        {h.avanceProveedor && h.estado !== "completado" && (
          <p className="flex items-start gap-1.5 rounded bg-info/10 px-2 py-1 text-xs text-info">
            <MessageSquareText className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>El proveedor reporta: “{h.avanceProveedor}”{h.avanceReportadoAt && ` — ${fechaLocal(h.avanceReportadoAt)}`}</span>
          </p>
        )}
        {h.estado === "atrasado" && (
          <p className="text-xs text-destructive">Hito atrasado: puedes aplicar la penalidad contractual (ver estimado en la ficha) o reportar una incidencia.</p>
        )}
      </div>
    </li>
  );
}
