import { useState } from "react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EmptyState } from "@/components/shared/EmptyState";
import { TableSkeleton } from "@/components/shared/TableSkeleton";
import { CalendarClock, FileWarning, Loader2, Play, ShieldAlert, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { useApiData } from "@/hooks/useApiData";
import { apiErrorMessage } from "@/lib/api/http";
import { fechaLocal } from "@/lib/fecha";
import { ejecutarMonitoreo, fetchAlertasRiesgo, resolverAlerta, TIPO_ALERTA_LABEL, type AlertaRiesgo, type TipoAlertaRiesgo } from "@/lib/api/riesgo";

const ICONO: Record<TipoAlertaRiesgo, typeof ShieldAlert> = {
  LISTA_RESTRICTIVA: ShieldAlert,
  DOCUMENTO_VENCIDO: FileWarning,
  REVALIDACION: CalendarClock,
};

const CLASE: Record<TipoAlertaRiesgo, string> = {
  LISTA_RESTRICTIVA: "bg-destructive/10 text-destructive",
  DOCUMENTO_VENCIDO: "bg-warning/15 text-warning-foreground",
  REVALIDACION: "bg-info/15 text-info",
};

/**
 * Continuous monitoring of homologated suppliers: restrictive-list hits,
 * expired documents and overdue re-evaluations, found by the nightly job.
 */
export function RiesgoContinuo() {
  const [estado, setEstado] = useState<"ABIERTA" | "RESUELTA">("ABIERTA");
  const { data: alertas, loading, reload } = useApiData(() => fetchAlertasRiesgo(estado), [estado]);
  const [ejecutando, setEjecutando] = useState(false);
  const [resolviendo, setResolviendo] = useState<AlertaRiesgo | null>(null);
  const [nota, setNota] = useState("");
  const [guardando, setGuardando] = useState(false);

  async function ejecutar() {
    setEjecutando(true);
    try {
      const r = await ejecutarMonitoreo();
      toast.success("Monitoreo ejecutado", {
        description: `${r.proveedoresMonitoreados ?? 0} proveedor(es) consultados en listas, ${r.nuevasCoincidencias ?? 0} coincidencia(s) nueva(s), ${r.documentosVencidos ?? 0} documento(s) vencido(s), ${r.avisosVencimiento ?? 0} aviso(s) de vencimiento, ${r.revalidaciones ?? 0} revalidación(es).`,
      });
      reload();
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setEjecutando(false);
    }
  }

  async function resolver() {
    if (!resolviendo) return;
    setGuardando(true);
    try {
      await resolverAlerta(resolviendo.id, nota.trim());
      toast.success("Alerta resuelta");
      setResolviendo(null);
      setNota("");
      reload();
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setGuardando(false);
    }
  }

  const lista = alertas ?? [];

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Riesgo continuo</h1>
          <p className="text-sm text-muted-foreground">
            Cada noche se vuelven a consultar las listas restrictivas (OFAC y ONU) de los proveedores homologados, se revisan los documentos por vencer y las revalidaciones pendientes.
          </p>
        </div>
        <Button onClick={ejecutar} disabled={ejecutando} className="gap-1.5">
          {ejecutando ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Play className="h-4 w-4" aria-hidden="true" />} Ejecutar monitoreo ahora
        </Button>
      </div>

      <div className="inline-flex rounded-lg border border-border p-0.5" role="tablist" aria-label="Estado de las alertas">
        {(["ABIERTA", "RESUELTA"] as const).map((e) => (
          <button
            key={e}
            type="button"
            role="tab"
            aria-selected={estado === e}
            onClick={() => setEstado(e)}
            className={cn("rounded-md px-3 py-1.5 text-sm font-medium transition-colors", estado === e ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}
          >
            {e === "ABIERTA" ? "Abiertas" : "Resueltas"}
          </button>
        ))}
      </div>

      {loading ? (
        <TableSkeleton />
      ) : lista.length === 0 ? (
        <EmptyState icon={ShieldCheck} title={estado === "ABIERTA" ? "Sin alertas abiertas" : "Sin alertas resueltas"} description={estado === "ABIERTA" ? "Ningún proveedor homologado tiene hallazgos pendientes." : undefined} />
      ) : (
        <div className="space-y-3">
          {lista.map((a) => {
            const Icono = ICONO[a.tipo];
            return (
              <Card key={a.id} className="p-4">
                <div className="flex flex-wrap items-start gap-4">
                  <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg", CLASE[a.tipo])}>
                    <Icono className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">{a.proveedor.nombre}</p>
                      <Badge variant="secondary" className={CLASE[a.tipo]}>{TIPO_ALERTA_LABEL[a.tipo]}</Badge>
                      {a.proveedor.homologacion && <Badge variant="outline">Homologación: {a.proveedor.homologacion.estado.replace(/_/g, " ").toLowerCase()}</Badge>}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{a.detalle}</p>
                    <p className="mt-1 text-xs text-muted-foreground">Detectada {fechaLocal(a.createdAt)}</p>
                    {a.estado === "RESUELTA" && (
                      <p className="mt-2 rounded-md bg-muted p-2 text-xs">
                        <strong>Resuelta</strong>{a.resueltaPor ? ` por ${a.resueltaPor}` : ""}{a.resueltaAt ? ` el ${fechaLocal(a.resueltaAt)}` : ""}{a.resolucion ? `: ${a.resolucion}` : ""}
                      </p>
                    )}
                  </div>
                  {a.estado === "ABIERTA" && (
                    <Button size="sm" variant="outline" onClick={() => { setResolviendo(a); setNota(""); }}>
                      Resolver
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={!!resolviendo} onOpenChange={(o) => !o && setResolviendo(null)}>
        {resolviendo && (
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Resolver alerta</DialogTitle>
              <DialogDescription>
                {resolviendo.proveedor.nombre} · {TIPO_ALERTA_LABEL[resolviendo.tipo]}. Deja constancia de lo que revisaste; queda en la auditoría.
                {resolviendo.tipo === "LISTA_RESTRICTIVA" && " Si confirmas la coincidencia, rechaza o suspende la homologación desde la cola de homologación."}
              </DialogDescription>
            </DialogHeader>
            <Textarea value={nota} onChange={(e) => setNota(e.target.value)} placeholder="Ej.: Homónimo descartado por número de documento." rows={4} aria-label="Resolución" />
            <DialogFooter>
              <Button variant="outline" onClick={() => setResolviendo(null)}>Cancelar</Button>
              <Button onClick={resolver} disabled={guardando || nota.trim().length < 3}>
                {guardando && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />} Marcar como resuelta
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
