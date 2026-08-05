import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { casosConsultor } from "@/lib/mockData";
import { Clock, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMockLoading } from "@/hooks/useMockLoading";
import { TableSkeleton, KpiRowSkeleton } from "@/components/shared/TableSkeleton";

const estados = ["Todos", "Pendiente", "En progreso", "Escalado"];

const prioridadColor: Record<string, string> = {
  Alta: "bg-destructive/15 text-destructive",
  Media: "bg-warning/15 text-warning-foreground",
  Baja: "bg-info/15 text-info",
};

export function DashboardConsultor() {
  const loading = useMockLoading();
  const [filtro, setFiltro] = useState("Todos");
  const casos = casosConsultor.filter((c) => filtro === "Todos" || c.estado === filtro);

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">Casos Activos</h1>
        <p className="text-sm text-muted-foreground">Tu carga de trabajo del día</p>
      </div>

      {loading ? <KpiRowSkeleton count={3} /> : <div className="grid grid-cols-3 gap-4">
        <Card className="p-4"><p className="text-sm text-muted-foreground">Total asignados</p><p className="mt-1 text-2xl font-bold">{casosConsultor.length}</p></Card>
        <Card className="p-4"><p className="text-sm text-muted-foreground">Prioridad alta</p><p className="mt-1 text-2xl font-bold text-destructive">{casosConsultor.filter((c) => c.prioridad === "Alta").length}</p></Card>
        <Card className="p-4"><p className="text-sm text-muted-foreground">SLA vencido</p><p className="mt-1 text-2xl font-bold text-warning-foreground">{casosConsultor.filter((c) => c.sla === "Vencido").length}</p></Card>
      </div>}

      <div className="flex gap-2 border-b border-border">
        {estados.map((e) => (
          <button
            key={e}
            onClick={() => setFiltro(e)}
            className={cn("border-b-2 px-4 py-2 text-sm font-medium transition-colors", filtro === e ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground")}
          >
            {e}
          </button>
        ))}
      </div>

      {loading ? <TableSkeleton /> : <div className="space-y-3">
        {casos.map((c) => (
          <Card key={c.id} className="p-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-muted-foreground">{c.id}</span>
                  <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium", prioridadColor[c.prioridad])}>{c.prioridad}</span>
                </div>
                <p className="mt-1 text-sm font-medium">{c.cliente} — {c.tipo}</p>
              </div>
              <span className={cn("flex items-center gap-1 text-xs", c.sla === "Vencido" ? "text-destructive font-medium" : "text-muted-foreground")}>
                {c.sla === "Vencido" ? <AlertCircle className="h-3.5 w-3.5" /> : <Clock className="h-3.5 w-3.5" />} {c.sla}
              </span>
              <Badge variant="secondary">{c.estado}</Badge>
            </div>
          </Card>
        ))}
      </div>}
    </div>
  );
}
