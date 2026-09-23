import { AlertTriangle, ClipboardCheck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useApiData } from "@/hooks/useApiData";
import { fetchMisEvaluaciones } from "@/lib/api/evaluaciones";
import { CRITERIOS_EVALUACION } from "@/lib/evaluacion";
import { cn } from "@/lib/utils";

/** The proveedor's performance evaluations from its clients (client name shown, never the individual evaluator). */
export function MisEvaluacionesCard() {
  const { data } = useApiData(fetchMisEvaluaciones);
  if (!data || data.length === 0) return null;
  const promedio = Math.round(data.reduce((sum, e) => sum + e.puntaje, 0) / data.length);
  const conPlan = data.filter((e) => e.requierePlanMejora);

  return (
    <Card className="p-5">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="flex items-center gap-2 font-semibold">
          <ClipboardCheck className="h-4 w-4" /> Evaluaciones de desempeño
        </h2>
        <p className="text-sm text-muted-foreground">
          Promedio <strong className="text-foreground">{promedio}/100</strong> · {data.length} evaluación(es)
        </p>
      </div>
      {conPlan.length > 0 && (
        <div className="mb-3 flex items-start gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            {conPlan.length} evaluación(es) por debajo de 60/100. Coordina un plan de mejora con{" "}
            {[...new Set(conPlan.map((e) => e.cliente))].join(", ")}.
          </p>
        </div>
      )}
      <div className="space-y-2">
        {data.slice(0, 5).map((e) => (
          <div key={e.id} className="rounded-lg border border-border p-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="font-medium">
                {e.cliente} · {e.contratoCodigo}
              </span>
              <span className={cn("font-semibold", e.requierePlanMejora ? "text-destructive" : "text-success")}>{e.puntaje}/100</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {e.createdAt.slice(0, 10)} · {CRITERIOS_EVALUACION.map(({ key, label }) => `${label} ${e[key]}/5`).join(" · ")}
            </p>
            {e.comentario && <p className="mt-1 text-xs">{e.comentario}</p>}
          </div>
        ))}
      </div>
    </Card>
  );
}
