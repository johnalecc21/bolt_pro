import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, XCircle, TrendingUp, Target } from "lucide-react";
import { cn } from "@/lib/utils";
import { TableSkeleton, KpiRowSkeleton } from "@/components/shared/TableSkeleton";
import { useApiData } from "@/hooks/useApiData";
import { fetchMiHistorial } from "@/lib/api/ofertas";

export function HistorialProveedor() {
  const { data, loading } = useApiData(fetchMiHistorial);
  const historialProcesos = data?.procesos ?? [];
  const competitividad = data?.competitividad ?? { tuOfertaPromedioVsMercado: 0 };
  const ganados = historialProcesos.filter((p) => p.resultado === "ganado").length;
  const perdidos = historialProcesos.filter((p) => p.resultado === "perdido").length;
  const tasaExito = historialProcesos.length ? Math.round((ganados / historialProcesos.length) * 100) : 0;

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">Historial de Procesos y Resultados</h1>
        <p className="text-sm text-muted-foreground">Tu desempeño histórico en la red Procurex</p>
      </div>

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

      {loading ? <TableSkeleton /> : <div className="space-y-3">
        {historialProcesos.map((p) => (
          <Card key={p.id} className="p-4">
            <div className="flex items-start gap-3">
              <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg", p.resultado === "ganado" ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive")}>
                {p.resultado === "ganado" ? <Trophy className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium">{p.titulo}</p>
                  <Badge variant={p.resultado === "ganado" ? "default" : "secondary"} className="text-[10px]">{p.resultado === "ganado" ? "Ganado" : "Perdido"}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">{p.id} · {p.cliente} · {p.fecha} · ${p.monto.toLocaleString()}</p>
                {p.feedback && (
                  <p className="mt-2 flex items-start gap-1.5 rounded-lg bg-muted/50 p-2 text-xs text-muted-foreground">
                    <TrendingUp className="mt-0.5 h-3 w-3 shrink-0" /> {p.feedback}
                  </p>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>}
    </div>
  );
}
