import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trophy, XCircle, Clock, TrendingUp, Target, FileDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { TableSkeleton, KpiRowSkeleton } from "@/components/shared/TableSkeleton";
import { useApiData } from "@/hooks/useApiData";
import { fetchMiHistorial, type ProcesoHistorial } from "@/lib/api/ofertas";
import { fetchMiPerfil } from "@/lib/api/proveedores";
import { generateCartaAdjudicacionPdf } from "@/lib/pdf/carta-adjudicacion";

import { formatMoney } from "@/lib/moneda";
import { MisEvaluacionesCard } from "@/components/proveedor/MisEvaluacionesCard";
import { useIncrustado } from "@/components/layout/Incrustado";
const resultadoConfig: Record<ProcesoHistorial["resultado"], { label: string; icon: typeof Trophy; className: string; badgeVariant: "default" | "secondary" }> = {
  ganado: { label: "Ganado", icon: Trophy, className: "bg-success/10 text-success", badgeVariant: "default" },
  seleccionado: { label: "Seleccionado — pendiente de firma", icon: Trophy, className: "bg-info/10 text-info", badgeVariant: "default" },
  perdido: { label: "Perdido", icon: XCircle, className: "bg-destructive/10 text-destructive", badgeVariant: "secondary" },
  pendiente: { label: "Pendiente", icon: Clock, className: "bg-muted text-muted-foreground", badgeVariant: "secondary" },
};

export function HistorialProveedor() {
  const incrustado = useIncrustado();
  const { data, loading } = useApiData(fetchMiHistorial);
  const { data: miPerfil } = useApiData(fetchMiPerfil);
  const historialProcesos = data?.procesos ?? [];

  function descargarCarta(p: ProcesoHistorial) {
    if (!p.poId || !p.precioFinal || !miPerfil) return;
    generateCartaAdjudicacionPdf({
      poId: p.poId,
      cliente: p.cliente,
      proveedor: miPerfil.nombre,
      tituloProceso: p.titulo,
      precioFinal: p.precioFinal,
      moneda: p.moneda,
      plazoDias: p.plazoDias ?? 0,
      condicionesPagoDias: p.condicionesPagoDias ?? 0,
      garantiaMeses: p.garantiaMeses ?? 0,
    });
  }
  const competitividad = data?.competitividad ?? { tuOfertaPromedioVsMercado: 0 };
  const ganados = historialProcesos.filter((p) => p.resultado === "ganado").length;
  const perdidos = historialProcesos.filter((p) => p.resultado === "perdido").length;
  const tasaExito = historialProcesos.length ? Math.round((ganados / historialProcesos.length) * 100) : 0;

  return (
    <div className={incrustado ? "space-y-6" : "space-y-6 p-6"}>
      {!incrustado && (
        <div>
          <h1 className="text-2xl font-bold">Historial de Procesos y Resultados</h1>
          <p className="text-sm text-muted-foreground">Tu desempeño histórico en la red Procurex</p>
        </div>
      )}

      {loading ? <KpiRowSkeleton count={3} /> : <div className="grid grid-cols-3 gap-4">
        <Card className="p-4"><p className="text-sm text-muted-foreground">Ganados</p><p className="mt-1 text-2xl font-bold text-success">{ganados}</p></Card>
        <Card className="p-4"><p className="text-sm text-muted-foreground">Perdidos</p><p className="mt-1 text-2xl font-bold text-destructive">{perdidos}</p></Card>
        <Card className="p-4"><p className="text-sm text-muted-foreground">Tasa de éxito</p><p className="mt-1 text-2xl font-bold">{tasaExito}%</p></Card>
      </div>}

      <Card className="border-info/30 bg-info/10 p-5">
        <h2 className="mb-2 flex items-center gap-2 font-semibold text-info"><Target className="h-4 w-4" /> Modo Copiloto Proveedor</h2>
        <p className="text-sm text-info">
          Tu oferta promedio está <strong>{Math.abs(competitividad.tuOfertaPromedioVsMercado)}% {competitividad.tuOfertaPromedioVsMercado < 0 ? "por debajo" : "por encima"}</strong> del promedio de mercado en tu categoría, comparado anónimamente con otros proveedores.
        </p>
      </Card>

      <MisEvaluacionesCard />

      {loading ? <TableSkeleton /> : <div className="space-y-3">
        {historialProcesos.map((p) => {
          const cfg = resultadoConfig[p.resultado];
          const Icon = cfg.icon;
          return (
            <Card key={p.id} className="p-4">
              <div className="flex items-start gap-3">
                <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg", cfg.className)}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{p.titulo}</p>
                    <Badge variant={cfg.badgeVariant} className="text-[10px]">{cfg.label}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{p.id} · {p.cliente} · {p.fecha} · {formatMoney(p.monto, p.moneda)}</p>
                  {p.feedback && (
                    <p className="mt-2 flex items-start gap-1.5 rounded-lg bg-muted/50 p-2 text-xs text-muted-foreground">
                      <TrendingUp className="mt-0.5 h-3 w-3 shrink-0" /> {p.feedback}
                    </p>
                  )}
                  {(p.resultado === "seleccionado" || p.resultado === "ganado") && p.poId && (
                    <Button size="sm" variant="outline" className="mt-2 gap-1.5" onClick={() => descargarCarta(p)}>
                      <FileDown className="h-3.5 w-3.5" /> Descargar carta de adjudicación
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>}
    </div>
  );
}
