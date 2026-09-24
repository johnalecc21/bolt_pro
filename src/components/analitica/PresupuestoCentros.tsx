import { AlertTriangle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { formatMoneyCompact } from "@/lib/moneda";
import type { EjecucionCentro } from "@/lib/analitica/tipos";

/**
 * Budget use per cost center: committed and in-process share one hue (solid
 * vs. lighter) over a same-ramp track; over-budget carries an icon + words.
 */
export function PresupuestoCentros({ centros, anio }: { centros: EjecucionCentro[]; anio: number }) {
  const conPresupuesto = centros.filter((c) => c.ejecucion);
  return (
    <Card className="gap-3 p-5">
      <div>
        <h3 className="font-semibold">Ejecución del presupuesto {anio}</h3>
        <p className="text-sm text-muted-foreground">Comprometido en contratos y en proceso (requerimientos aún sin contrato), a hoy.</p>
      </div>
      {conPresupuesto.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">No hay centros de costo con presupuesto para {anio}.</p>
      ) : (
        <>
          <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm" style={{ background: "var(--viz-1)" }} /> Comprometido</span>
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm" style={{ background: "var(--viz-ord-1)" }} /> En proceso</span>
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm" style={{ background: "var(--viz-track)" }} /> Disponible</span>
          </div>
          <ul className="space-y-3">
            {conPresupuesto.map((c) => {
              const e = c.ejecucion!;
              const moneda = c.moneda ?? "USD";
              const comp = e.presupuesto ? Math.min(100, (e.comprometido / e.presupuesto) * 100) : 0;
              const proc = e.presupuesto ? Math.min(100 - comp, (e.enProceso / e.presupuesto) * 100) : 0;
              const excedido = e.porcentajeUsado > 100;
              return (
                <li key={c.centroCostoId} className="space-y-1">
                  <div className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
                    <span className="font-medium">
                      {c.codigo} — {c.nombre}
                      {c.unidad && <span className="font-normal text-muted-foreground"> · {c.unidad}</span>}
                    </span>
                    <span className="tabular-nums text-muted-foreground">
                      {formatMoneyCompact(e.comprometido + e.enProceso, moneda)} de {formatMoneyCompact(e.presupuesto, moneda)} ·{" "}
                      <span className={excedido ? "font-semibold text-destructive" : "font-medium text-foreground"}>{e.porcentajeUsado}%</span>
                    </span>
                  </div>
                  <div className="flex h-3 overflow-hidden rounded-sm" style={{ background: "var(--viz-track)" }} role="img" aria-label={`${c.codigo}: ${e.porcentajeUsado}% del presupuesto usado`}>
                    <div style={{ width: `${comp}%`, background: "var(--viz-1)" }} />
                    {proc > 0 && <div style={{ width: `${proc}%`, background: "var(--viz-ord-1)", marginLeft: comp > 0 ? 2 : 0 }} />}
                  </div>
                  {excedido && (
                    <p className="flex items-center gap-1 text-xs text-destructive">
                      <AlertTriangle className="h-3 w-3" aria-hidden /> Sobre el presupuesto por {formatMoneyCompact(-e.disponible, moneda)}
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        </>
      )}
    </Card>
  );
}
