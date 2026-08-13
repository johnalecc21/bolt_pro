import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { CheckCircle2, Circle, Clock, AlertTriangle, Truck, MessageSquareWarning, Plus, X, DollarSign } from "lucide-react";
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
} from "@/lib/api/seguimiento";
import { apiErrorMessage } from "@/lib/api/http";

const semaforoConfig: Record<EstadoHito, { label: string; color: string; bg: string }> = {
  completado: { label: "A tiempo", color: "text-success", bg: "bg-success/15" },
  en_riesgo: { label: "En riesgo", color: "text-warning-foreground", bg: "bg-warning/15" },
  atrasado: { label: "Atrasado", color: "text-destructive", bg: "bg-destructive/15" },
  pendiente: { label: "Pendiente", color: "text-muted-foreground", bg: "bg-muted" },
};

export function Seguimiento() {
  const navigate = useNavigate();
  const { data: seguimiento, loading, reload } = useApiData(fetchSeguimiento);
  const [addingTo, setAddingTo] = useState<string | null>(null);
  const [nuevoLabel, setNuevoLabel] = useState("");
  const [nuevaFecha, setNuevaFecha] = useState("");
  const [nuevoPorcentaje, setNuevoPorcentaje] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function cambiarEstado(hitoId: string, estado: EstadoHito) {
    try {
      await actualizarEstadoHito(hitoId, estado);
      if (estado === "completado") {
        toast.success("Hito marcado como completado", { description: "Esto alimenta el score de desempeño del proveedor." });
      }
      reload();
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  }

  async function guardarPorcentaje(hitoId: string, porcentaje: number) {
    try {
      await actualizarPorcentajeHito(hitoId, porcentaje);
      reload();
    } catch (err) {
      toast.error(apiErrorMessage(err, "No se pudo actualizar el porcentaje."));
    }
  }

  async function eliminarHito(hitoId: string) {
    try {
      await apiEliminarHito(hitoId);
      reload();
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  }

  async function agregarHito(contratoId: string) {
    if (!nuevoLabel.trim() || !nuevaFecha) return;
    setSubmitting(true);
    try {
      const porcentaje = nuevoPorcentaje.trim() ? Number(nuevoPorcentaje) : undefined;
      await apiCrearHito(contratoId, nuevoLabel.trim(), nuevaFecha, porcentaje);
      toast.success("Hito agregado");
      setAddingTo(null);
      setNuevoLabel("");
      setNuevaFecha("");
      setNuevoPorcentaje("");
      reload();
    } catch (err) {
      toast.error(apiErrorMessage(err, "No se pudo agregar el hito."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">Seguimiento de Pedidos</h1>
        <p className="text-sm text-muted-foreground">Monitorea el cumplimiento post-PO de tus proveedores</p>
      </div>

      {loading ? <CardGridSkeleton count={2} /> : <div className="space-y-6">
        {(seguimiento ?? []).map((s) => {
          const peorEstado: EstadoHito = s.hitos.length === 0
            ? "pendiente"
            : s.hitos.some((h) => h.estado === "atrasado") ? "atrasado" : s.hitos.some((h) => h.estado === "en_riesgo") ? "en_riesgo" : "completado";
          return (
            <Card key={s.poId} className="p-5">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-semibold">{s.poId}</h2>
                    <Badge variant="secondary" className="text-xs">{s.categoria}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{s.proveedor}</p>
                </div>
                <span className={cn("flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium", semaforoConfig[peorEstado].bg, semaforoConfig[peorEstado].color)}>
                  <Truck className="h-3.5 w-3.5" /> {s.hitos.length === 0 ? "Sin hitos aún" : semaforoConfig[peorEstado].label}
                </span>
              </div>

              {s.hitos.length === 0 ? (
                <p className="text-sm text-muted-foreground">Este pedido todavía no tiene hitos de entrega definidos.</p>
              ) : (
                <div className="space-y-4">
                  {s.hitos.map((h) => (
                    <div key={h.id} className="flex items-start gap-3">
                      <div className={cn("mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full", semaforoConfig[h.estado].bg, semaforoConfig[h.estado].color)}>
                        {h.estado === "completado" ? <CheckCircle2 className="h-4 w-4" /> : h.estado === "atrasado" ? <AlertTriangle className="h-4 w-4" /> : h.estado === "en_riesgo" ? <Clock className="h-4 w-4" /> : <Circle className="h-3 w-3" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium">{h.label}</p>
                            {h.pagoGeneradoId ? (
                              <Badge variant="secondary" className="gap-1 bg-success/15 text-xs text-success">
                                <DollarSign className="h-3 w-3" /> {h.porcentaje}% · Pago generado
                              </Badge>
                            ) : (
                              <div className="flex items-center gap-1">
                                <Input
                                  type="number"
                                  min={0}
                                  max={100}
                                  defaultValue={h.porcentaje}
                                  onBlur={(e) => {
                                    const v = Number(e.target.value);
                                    if (!Number.isNaN(v) && v !== h.porcentaje) guardarPorcentaje(h.id, v);
                                  }}
                                  className="h-6 w-14 px-1.5 text-xs"
                                  title="% de pago de este hito"
                                />
                                <span className="text-xs text-muted-foreground">%</span>
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">Comprometido {h.comprometido}{h.real && ` · Real ${h.real}`}</span>
                            <select
                              className="h-7 rounded-md border border-input bg-white px-2 text-xs"
                              value={h.estado}
                              onChange={(e) => cambiarEstado(h.id, e.target.value as EstadoHito)}
                            >
                              <option value="pendiente">Pendiente</option>
                              <option value="en_riesgo">En riesgo</option>
                              <option value="atrasado">Atrasado</option>
                              <option value="completado">Completado</option>
                            </select>
                            <button onClick={() => eliminarHito(h.id)} className="text-muted-foreground hover:text-destructive" title="Eliminar hito">
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                        {h.estado === "atrasado" && (
                          <p className="mt-1 text-xs text-destructive">Hito atrasado — considera aplicar penalidad contractual o escalar el caso.</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {addingTo === s.poId ? (
                <div className="mt-4 flex flex-wrap items-end gap-2 rounded-lg border border-border p-3">
                  <div className="min-w-[180px] flex-1 space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">Nombre del hito</label>
                    <Input value={nuevoLabel} onChange={(e) => setNuevoLabel(e.target.value)} placeholder="Ej. Entrega parcial" className="h-8 text-sm" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">Fecha comprometida</label>
                    <Input type="date" value={nuevaFecha} onChange={(e) => setNuevaFecha(e.target.value)} className="h-8 text-sm" />
                  </div>
                  <div className="w-20 space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">% de pago</label>
                    <Input type="number" min={0} max={100} value={nuevoPorcentaje} onChange={(e) => setNuevoPorcentaje(e.target.value)} placeholder="0" className="h-8 text-sm" />
                  </div>
                  <Button size="sm" className="h-8" disabled={!nuevoLabel.trim() || !nuevaFecha || submitting} onClick={() => agregarHito(s.poId)}>
                    Agregar
                  </Button>
                  <Button size="sm" variant="ghost" className="h-8" onClick={() => { setAddingTo(null); setNuevoPorcentaje(""); }}>Cancelar</Button>
                </div>
              ) : (
                <Button variant="ghost" size="sm" className="mt-3 gap-1.5 text-xs" onClick={() => setAddingTo(s.poId)}>
                  <Plus className="h-3.5 w-3.5" /> Agregar hito
                </Button>
              )}

              <div className="mt-4 border-t pt-4">
                <ConfirmDialog
                  trigger={
                    <Button variant="outline" size="sm" className="gap-2 border-destructive/30 text-destructive hover:bg-destructive/10">
                      <MessageSquareWarning className="h-4 w-4" /> Reportar incidencia
                    </Button>
                  }
                  title="Reportar incidencia"
                  description={`Se abrirá un caso de disputa referenciando ${s.poId} con ${s.proveedor}.`}
                  confirmLabel="Abrir caso"
                  onConfirm={() => navigate(`/cliente/disputas?po=${s.poId}`)}
                />
              </div>
            </Card>
          );
        })}
      </div>}
    </div>
  );
}
