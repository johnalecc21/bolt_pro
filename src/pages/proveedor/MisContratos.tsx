import { useState } from "react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/EmptyState";
import { CardGridSkeleton } from "@/components/shared/TableSkeleton";
import { useApiData } from "@/hooks/useApiData";
import { fetchMisContratos, obtenerUrlArchivoContrato, type ContratoConHitos } from "@/lib/api/contratos";
import { generateContratoPdf } from "@/lib/pdf/contrato";
import { apiErrorMessage } from "@/lib/api/http";
import { CheckCircle2, Circle, Clock, AlertTriangle, FileCheck2, Calendar, Download, Loader2, FileUp } from "lucide-react";
import { cn } from "@/lib/utils";

import { formatMoney } from "@/lib/moneda";
const semaforoConfig = {
  completado: { label: "Completado", color: "text-success", bg: "bg-success/15" },
  en_riesgo: { label: "En riesgo", color: "text-warning-foreground", bg: "bg-warning/15" },
  atrasado: { label: "Atrasado", color: "text-destructive", bg: "bg-destructive/15" },
  pendiente: { label: "Pendiente", color: "text-muted-foreground", bg: "bg-muted" },
};

export function MisContratos() {
  const { data: contratos, loading } = useApiData(fetchMisContratos);
  const [descargando, setDescargando] = useState<string | null>(null);

  async function descargar(c: ContratoConHitos) {
    setDescargando(c.id);
    const pendingTab = c.archivoNombre ? window.open("", "_blank") : null;
    try {
      if (c.archivoNombre) {
        const { url } = await obtenerUrlArchivoContrato(c.id);
        if (pendingTab) pendingTab.location.href = url;
        toast.success("Documento del cliente abierto", { description: c.archivoNombre });
      } else {
        generateContratoPdf(c);
        toast.success("PDF generado", { description: `${c.codigo}.pdf` });
      }
    } catch (err) {
      pendingTab?.close();
      toast.error(apiErrorMessage(err, "No se pudo descargar el documento."));
    } finally {
      setDescargando(null);
    }
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">Mis Contratos</h1>
        <p className="text-sm text-muted-foreground">Órdenes de compra adjudicadas y el avance de cada entrega</p>
      </div>

      {loading ? (
        <CardGridSkeleton count={2} />
      ) : (contratos ?? []).length === 0 ? (
        <EmptyState icon={FileCheck2} title="Aún no tienes contratos" description="Cuando ganes un proceso, la orden de compra y sus hitos de entrega aparecerán aquí." />
      ) : (
        <div className="space-y-6">
          {contratos!.map((c) => (
            <Card key={c.id} className="p-5">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-semibold">{c.codigo}</h2>
                    <Badge variant="secondary" className="text-xs">{c.categoria}</Badge>
                    {c.archivoNombre && (
                      <span className="flex items-center gap-0.5 text-xs text-info" title={c.archivoNombre}>
                        <FileUp className="h-3 w-3" /> Documento propio del cliente
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{c.cliente}</p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium">{formatMoney(c.monto, c.moneda)}</span>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5" /> {c.vigenciaInicio} — {c.vigenciaFin}
                  </div>
                  <Button variant="ghost" size="icon" disabled={descargando === c.id} onClick={() => descargar(c)} title="Descargar">
                    {descargando === c.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              {c.hitos.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aún no hay hitos de entrega definidos para esta orden.</p>
              ) : (
                <div className="space-y-4">
                  {c.hitos.map((h) => (
                    <div key={h.id} className="flex items-start gap-3">
                      <div className={cn("mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full", semaforoConfig[h.estado].bg, semaforoConfig[h.estado].color)}>
                        {h.estado === "completado" ? <CheckCircle2 className="h-4 w-4" /> : h.estado === "atrasado" ? <AlertTriangle className="h-4 w-4" /> : h.estado === "en_riesgo" ? <Clock className="h-4 w-4" /> : <Circle className="h-3 w-3" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-sm font-medium">{h.label}</p>
                          <span className="text-xs text-muted-foreground">Comprometido {h.comprometido}{h.real && ` · Real ${h.real}`}</span>
                        </div>
                        {h.estado === "atrasado" && (
                          <p className="mt-1 text-xs text-destructive">Este hito está marcado como atrasado por tu cliente.</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
