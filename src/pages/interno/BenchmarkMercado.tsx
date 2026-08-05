import { useState } from "react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Database, Download, AlertTriangle, TrendingUp } from "lucide-react";
import { benchmarkMercado as seedBenchmark, type BenchmarkEntry } from "@/lib/mock/benchmarkMercado";
import { useMockLoading } from "@/hooks/useMockLoading";
import { TableSkeleton } from "@/components/shared/TableSkeleton";

export function BenchmarkMercado() {
  const loading = useMockLoading();
  const [datos, setDatos] = useState(seedBenchmark);

  function limpiarOutlier(entry: BenchmarkEntry) {
    setDatos((prev) => prev.map((d) => d.categoria === entry.categoria ? { ...d, outlier: false } : d));
    toast.success("Dato marcado como válido", { description: "Se incluirá en el índice oficial de benchmark." });
  }

  function exportar() {
    const rows = [["Categoría", "Región", "Precio promedio", "Muestras", "Outlier"], ...datos.map((d) => [d.categoria, d.region, d.precioPromedio, d.muestras, d.outlier ? "Sí" : "No"])];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "benchmark-mercado.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Índice exportado");
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Panel de Benchmark de Mercado</h1>
          <p className="text-sm text-muted-foreground">Índice de precios agregado y anonimizado por categoría/región</p>
        </div>
        <Button variant="outline" className="gap-2" onClick={exportar}><Download className="h-4 w-4" /> Exportar índice</Button>
      </div>

      {loading ? <TableSkeleton /> : <div className="space-y-3">
        {datos.map((d) => (
          <Card key={d.categoria} className="p-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Database className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{d.categoria}</p>
                <p className="text-xs text-muted-foreground">{d.region} · {d.muestras} transacciones muestreadas</p>
              </div>
              <div className="flex items-center gap-1.5 text-lg font-bold">
                <TrendingUp className="h-4 w-4 text-success" /> ${d.precioPromedio.toLocaleString()}
              </div>
              {d.outlier ? (
                <ConfirmDialog
                  trigger={<Badge className="cursor-pointer gap-1 bg-warning/15 text-warning-foreground"><AlertTriangle className="h-3 w-3" /> Dato atípico</Badge>}
                  title="Revisar dato atípico"
                  description={`${d.categoria} muestra un precio inusual respecto al histórico. ¿Confirmas que es válido para el índice oficial?`}
                  confirmLabel="Marcar como válido"
                  onConfirm={() => limpiarOutlier(d)}
                />
              ) : (
                <Badge variant="secondary">Limpio</Badge>
              )}
            </div>
          </Card>
        ))}
      </div>}

      <Card className="border-info/30 bg-info/10 p-4 text-sm text-info">
        Este índice alimenta las alertas de anomalías en el Cuadro Comparativo del portal cliente y es la base del futuro producto de datos "Precio Justo Index".
      </Card>
    </div>
  );
}
