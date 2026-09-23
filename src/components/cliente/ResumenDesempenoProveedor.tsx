import { useApiData } from "@/hooks/useApiData";
import { fetchResumenDesempeno } from "@/lib/api/evaluaciones";
import { CRITERIOS_EVALUACION } from "@/lib/evaluacion";
import { cn } from "@/lib/utils";

/** Network-wide criteria averages plus this company's own evaluation comments. */
export function ResumenDesempenoProveedor({ proveedorId }: { proveedorId: string }) {
  const { data, loading } = useApiData(() => fetchResumenDesempeno(proveedorId), [proveedorId]);
  if (loading) return <p className="text-xs text-muted-foreground">Cargando desempeño...</p>;
  if (!data || data.total === 0) {
    return <p className="text-xs text-muted-foreground">Aún no tiene evaluaciones de desempeño en la red.</p>;
  }
  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between">
        <p className="text-sm font-medium">Desempeño en la red</p>
        <p className="text-xs text-muted-foreground">
          <strong className="text-base text-foreground">{Math.round(data.promedio ?? 0)}</strong>/100 · {data.total} evaluación(es)
        </p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {CRITERIOS_EVALUACION.map(({ key, label }) => {
          const valor = data.porCriterio[key];
          return (
            <div key={key} className="rounded-lg bg-muted/50 p-2 text-xs">
              <p className="text-muted-foreground">{label}</p>
              <div className="mt-1 flex items-center gap-2">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${((valor ?? 0) / 5) * 100}%` }} />
                </div>
                <span className="font-medium">{valor != null ? valor.toFixed(1) : "—"}</span>
              </div>
            </div>
          );
        })}
      </div>
      {data.propias.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground">Evaluaciones de tu empresa</p>
          {data.propias.slice(0, 3).map((e) => (
            <div key={e.id} className="rounded-lg border border-border p-2 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  {e.contratoCodigo} · {e.createdAt.slice(0, 10)} · {e.evaluador.nombre}
                </span>
                <span className={cn("font-semibold", e.requierePlanMejora ? "text-destructive" : "text-success")}>{e.puntaje}</span>
              </div>
              {e.comentario && <p className="mt-1">{e.comentario}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
